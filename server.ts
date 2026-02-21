import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import multer from "multer";
import { google } from "googleapis";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

const app = express();
const PORT = 3000;
const db = new Database("data.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE TABLE IF NOT EXISTS bio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    image_url TEXT
  );
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    page_order INTEGER
  );
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT,
    caption TEXT,
    page_order INTEGER
  );
`);

// Multer for file uploads
const upload = multer({ dest: "uploads/" });

app.use(express.json());

// Google Drive Setup
const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || "1BdN-KOcLy2Wk6rAIRyA3f8bE8IBrrV4o";

async function getDriveClient() {
  const keyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyStr) return null;
  try {
    const credentials = JSON.parse(keyStr);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    return google.drive({ version: "v3", auth });
  } catch (e) {
    console.error("Failed to parse Google Service Account Key", e);
    return null;
  }
}

async function uploadToDrive(filePath: string, fileName: string, mimeType: string, subFolder: string) {
  const drive = await getDriveClient();
  if (!drive) {
    console.warn("Drive client not configured. Skipping upload.");
    return null;
  }

  try {
    // 1. Find or create subfolder
    let folderId = DRIVE_FOLDER_ID;
    const res = await drive.files.list({
      q: `name='${subFolder}' and '${DRIVE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id)",
    });

    if (res.data.files && res.data.files.length > 0) {
      folderId = res.data.files[0].id!;
    } else {
      const folderMetadata = {
        name: subFolder,
        mimeType: "application/vnd.google-apps.folder",
        parents: [DRIVE_FOLDER_ID],
      };
      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });
      folderId = folder.data.id!;
    }

    // 2. Upload file
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };
    const media = {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    };
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });
    return file.data;
  } catch (error) {
    console.error("Error uploading to Drive:", error);
    return null;
  }
}

// API Routes
app.get("/api/content", (req, res) => {
  const bio = db.prepare("SELECT * FROM bio").all();
  const notes = db.prepare("SELECT * FROM notes ORDER BY page_order").all();
  const photos = db.prepare("SELECT * FROM photos ORDER BY page_order").all();
  const bg = db.prepare("SELECT value FROM settings WHERE key = 'background'").get();
  const title1 = db.prepare("SELECT value FROM settings WHERE key = 'title1'").get();
  const title2 = db.prepare("SELECT value FROM settings WHERE key = 'title2'").get();

  res.json({ 
    bio, 
    notes, 
    photos, 
    background: bg?.value || "",
    title1: title1?.value || "I Made Agus Arya Satya",
    title2: title2?.value || "Ni Luh Some Srinadi Ningsih"
  });
});

app.post("/api/settings", (req, res) => {
  const { key, value } = req.body;
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
  res.json({ success: true });
});

app.post("/api/bio", (req, res) => {
  const { id, name, description, image_url } = req.body;
  if (id) {
    db.prepare("UPDATE bio SET name = ?, description = ?, image_url = ? WHERE id = ?").run(name, description, image_url, id);
  } else {
    db.prepare("INSERT INTO bio (name, description, image_url) VALUES (?, ?, ?)").run(name, description, image_url);
  }
  res.json({ success: true });
});

app.post("/api/notes", (req, res) => {
  const { id, content, page_order } = req.body;
  if (id) {
    db.prepare("UPDATE notes SET content = ?, page_order = ? WHERE id = ?").run(content, page_order, id);
  } else {
    db.prepare("INSERT INTO notes (content, page_order) VALUES (?, ?)").run(content, page_order);
  }
  res.json({ success: true });
});

app.post("/api/photos", (req, res) => {
  const { id, url, caption, page_order } = req.body;
  if (id) {
    db.prepare("UPDATE photos SET url = ?, caption = ?, page_order = ? WHERE id = ?").run(url, caption, page_order, id);
  } else {
    db.prepare("INSERT INTO photos (url, caption, page_order) VALUES (?, ?, ?)").run(url, caption, page_order);
  }
  res.json({ success: true });
});

app.post("/api/notes/reorder", (req, res) => {
  const { orders } = req.body; // Array of { id, page_order }
  const update = db.prepare("UPDATE notes SET page_order = ? WHERE id = ?");
  const transaction = db.transaction((items) => {
    for (const item of items) {
      update.run(item.page_order, item.id);
    }
  });
  transaction(orders);
  res.json({ success: true });
});

app.delete("/api/notes/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  res.json({ success: true });
});

app.post("/api/upload", upload.single("file"), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { type } = req.body; // 'bio', 'notes', 'photos', 'background'
  const subFolder = type === 'bio' ? 'Bio' : type === 'notes' ? 'Notes' : type === 'photos' ? 'Photos' : 'Background';
  
  const driveFile = await uploadToDrive(req.file.path, req.file.originalname, req.file.mimetype, subFolder);
  
  // We'll return a local URL for immediate use, but in a real app we might use the Drive link
  // For this demo, we'll just use a base64 or move the file to a public dir
  const publicPath = path.join("public", "uploads", req.file.filename + path.extname(req.file.originalname));
  if (!fs.existsSync(path.join("public", "uploads"))) {
    fs.mkdirSync(path.join("public", "uploads"), { recursive: true });
  }
  fs.renameSync(req.file.path, publicPath);
  
  const url = `/uploads/${path.basename(publicPath)}`;
  res.json({ url, driveId: driveFile?.id });
});

// Serve static uploads
app.use("/uploads", express.static(path.join("public", "uploads")));

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
