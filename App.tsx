src/App.tsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { Menu, X, ArrowLeft, Plus, ChevronLeft, ChevronRight, Edit3, Save, Upload, Trash2, Heart, GripVertical, LayoutGrid } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useDropzone } from "react-dropzone";
import type { AppContent, Bio, Note, Photo } from "./types";
import ImageCropper from "./components/ImageCropper";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type View = "home" | "tentang-kami" | "catatan" | "foto-kenangan";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [content, setContent] = useState<AppContent>({
    bio: [],
    notes: [],
    photos: [],
    background: "",
    title1: "I Made Agus Arya Satya",
    title2: "Ni Luh Some Srinadi Ningsih"
  });

  // Cropper State
  const [cropperData, setCropperData] = useState<{
    image: string;
    type: string;
    aspect: number;
    onComplete: (url: string) => void;
  } | null>(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/content");
      const data = await res.json();
      setContent(data);
    } catch (e) {
      console.error("Failed to fetch content", e);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value })
    });
    fetchContent();
  };

  const handleUpload = async (file: File | Blob, type: string) => {
    const formData = new FormData();
    formData.append("file", file, "upload.jpg");
    formData.append("type", type);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    return await res.json();
  };

  const initiateCrop = (file: File, type: string, aspect: number, onComplete: (url: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropperData({
        image: reader.result as string,
        type,
        aspect,
        onComplete
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden font-sans">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: content.background ? `url(${content.background})` : 'none',
          backgroundColor: content.background ? 'transparent' : '#FF69B4'
        }}
      />

      {/* Cropper Modal */}
      {cropperData && (
        <ImageCropper 
          image={cropperData.image}
          aspect={cropperData.aspect}
          onCancel={() => setCropperData(null)}
          onCropComplete={async (blob) => {
            const res = await handleUpload(blob, cropperData.type);
            cropperData.onComplete(res.url);
            setCropperData(null);
          }}
        />
      )}

      {/* Edit Mode Toggle */}
      <button 
        onClick={() => setIsEditMode(!isEditMode)}
        className="absolute bottom-6 right-6 z-50 p-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all shadow-xl"
      >
        {isEditMode ? <Save className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
      </button>

      {/* Navigation */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-4">
        {view === "home" ? (
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        ) : (
          <button onClick={() => setView("home")} className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-2 shadow-lg">
            <ArrowLeft />
            <span className="capitalize hidden sm:inline">{view.replace("-", " ")}</span>
          </button>
        )}
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && view === "home" && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="absolute top-24 left-6 z-30 w-64 p-6 glass-card flex flex-col gap-4 shadow-2xl"
          >
            <button onClick={() => { setView("tentang-kami"); setIsSidebarOpen(false); }} className="btn-primary text-sm sm:text-base">Tentang Kami</button>
            <button onClick={() => { setView("catatan"); setIsSidebarOpen(false); }} className="btn-primary text-sm sm:text-base">Catatan</button>
            <button onClick={() => { setView("foto-kenangan"); setIsSidebarOpen(false); }} className="btn-primary text-sm sm:text-base">Foto Kenangan</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <main className="h-full w-full">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="h-full w-full flex flex-col items-center justify-center p-6 sm:p-12 text-center"
            >
              <div className="relative group max-w-full">
                {isEditMode ? (
                  <div className="flex flex-col gap-4 w-full max-w-lg mx-auto">
                    <input 
                      className="bg-transparent text-4xl sm:text-6xl md:text-8xl cursive-text border-b border-white/30 focus:outline-none text-center w-full"
                      value={content.title1}
                      onChange={(e) => setContent({...content, title1: e.target.value})}
                      onBlur={() => saveSetting("title1", content.title1)}
                    />
                    <div className="flex justify-center my-4">
                      <Heart className="w-12 h-12 sm:w-16 sm:h-16 fill-white text-white animate-pulse" />
                    </div>
                    <input 
                      className="bg-transparent text-4xl sm:text-6xl md:text-8xl cursive-text border-b border-white/30 focus:outline-none text-center w-full"
                      value={content.title2}
                      onChange={(e) => setContent({...content, title2: e.target.value})}
                      onBlur={() => saveSetting("title2", content.title2)}
                    />
                    <div className="mt-8">
                       <label className="cursor-pointer bg-white/20 px-6 py-3 rounded-xl hover:bg-white/30 transition-all inline-block text-sm sm:text-base">
                         Ganti Background
                         <input type="file" className="hidden" onChange={(e) => {
                           if (e.target.files?.[0]) {
                             initiateCrop(e.target.files[0], "background", 16/9, (url) => saveSetting("background", url));
                           }
                         }} />
                       </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <h1 className="text-4xl sm:text-6xl md:text-8xl cursive-text mb-4 drop-shadow-2xl px-4">{content.title1}</h1>
                    <Heart className="w-12 h-12 sm:w-16 sm:h-16 fill-white text-white mx-auto my-6 sm:my-8 animate-pulse drop-shadow-lg" />
                    <h1 className="text-4xl sm:text-6xl md:text-8xl cursive-text drop-shadow-2xl px-4">{content.title2}</h1>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === "tentang-kami" && <AboutView content={content} isEditMode={isEditMode} onUpdate={fetchContent} onInitiateCrop={initiateCrop} />}
          {view === "catatan" && <NotesView content={content} isEditMode={isEditMode} onUpdate={fetchContent} />}
          {view === "foto-kenangan" && <PhotosView content={content} isEditMode={isEditMode} onUpdate={fetchContent} onInitiateCrop={initiateCrop} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function AboutView({ content, isEditMode, onUpdate, onInitiateCrop }: { content: AppContent, isEditMode: boolean, onUpdate: () => void, onInitiateCrop: (f: File, t: string, a: number, c: (u: string) => void) => void }) {
  const saveBio = async (bio: Bio) => {
    await fetch("/api/bio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bio)
    });
    onUpdate();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 md:p-24 overflow-y-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 items-center max-w-6xl w-full py-20">
        {/* Person 1 */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className="relative w-48 h-64 sm:w-64 sm:h-80 glass-card overflow-hidden group shadow-xl">
            {content.bio[0]?.image_url ? (
              <img src={content.bio[0].image_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10">
                <Plus className="w-10 h-10 sm:w-12 sm:h-12 opacity-50" />
              </div>
            )}
            {isEditMode && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-8 h-8" />
                <input type="file" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onInitiateCrop(e.target.files[0], "bio", 4/5, (url) => {
                      saveBio({ ...content.bio[0], image_url: url, name: content.bio[0]?.name || "Nama", description: content.bio[0]?.description || "" });
                    });
                  }
                }} />
              </label>
            )}
          </div>
          {isEditMode ? (
            <input 
              className="bg-transparent text-2xl sm:text-3xl cursive-text border-b border-white/30 focus:outline-none text-center w-full"
              value={content.bio[0]?.name || ""}
              placeholder="Masukkan Nama"
              onChange={(e) => saveBio({ ...content.bio[0], name: e.target.value })}
            />
          ) : (
            <h2 className="text-2xl sm:text-3xl cursive-text drop-shadow-md">{content.bio[0]?.name || "Nama"}</h2>
          )}
        </div>

        {/* Description */}
        <div className="text-center order-last md:order-none">
          {isEditMode ? (
            <textarea 
              className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 rounded-2xl w-full h-40 sm:h-48 focus:outline-none border border-white/20 text-sm sm:text-base"
              value={content.bio[0]?.description || ""}
              placeholder="Tulis biodata atau pesan di sini..."
              onChange={(e) => saveBio({ ...content.bio[0], description: e.target.value })}
            />
          ) : (
            <p className="text-sm sm:text-base md:text-lg leading-relaxed bg-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-sm border border-white/10 shadow-lg">
              {content.bio[0]?.description || "Teks paragraf Anda akan muncul di sini. Klik edit untuk mengubah biodata."}
            </p>
          )}
        </div>

        {/* Person 2 */}
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <div className="relative w-48 h-64 sm:w-64 sm:h-80 glass-card overflow-hidden group shadow-xl">
            {content.bio[1]?.image_url ? (
              <img src={content.bio[1].image_url} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/10">
                <Plus className="w-10 h-10 sm:w-12 sm:h-12 opacity-50" />
              </div>
            )}
            {isEditMode && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Upload className="w-8 h-8" />
                <input type="file" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onInitiateCrop(e.target.files[0], "bio", 4/5, (url) => {
                      saveBio({ ...content.bio[1], image_url: url, name: content.bio[1]?.name || "Nama", description: content.bio[1]?.description || "" });
                    });
                  }
                }} />
              </label>
            )}
          </div>
          {isEditMode ? (
            <input 
              className="bg-transparent text-2xl sm:text-3xl cursive-text border-b border-white/30 focus:outline-none text-center w-full"
              value={content.bio[1]?.name || ""}
              placeholder="Masukkan Nama"
              onChange={(e) => saveBio({ ...content.bio[1], name: e.target.value })}
            />
          ) : (
            <h2 className="text-2xl sm:text-3xl cursive-text drop-shadow-md">{content.bio[1]?.name || "Nama"}</h2>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NotesView({ content, isEditMode, onUpdate }: { content: AppContent, isEditMode: boolean, onUpdate: () => void }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [localNotes, setLocalNotes] = useState<Note[]>([]);

  useEffect(() => {
    setLocalNotes(content.notes);
  }, [content.notes]);

  const saveNote = async (note: Note) => {
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note)
    });
    onUpdate();
  };

  const handleReorder = async (newOrder: Note[]) => {
    setLocalNotes(newOrder);
    const orders = newOrder.map((note, index) => ({ id: note.id, page_order: index }));
    await fetch("/api/notes/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orders })
    });
    onUpdate();
  };

  const addPage = () => {
    saveNote({ content: "", page_order: content.notes.length });
    setCurrentPage(content.notes.length);
  };

  const deletePage = async (id?: number) => {
    if (!id) return;
    if (!confirm("Hapus halaman ini?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    onUpdate();
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const currentNote = content.notes[currentPage] || { content: "", page_order: 0 };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center">
        {isEditMode && (
          <div className="absolute top-20 sm:top-0 right-0 flex gap-2 z-20">
            <button 
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={cn(
                "p-2 rounded-lg backdrop-blur-md border transition-all",
                isReorderMode ? "bg-pink-500 text-white border-pink-400" : "bg-white/10 text-white border-white/20"
              )}
              title="Atur Urutan"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isReorderMode ? (
            <motion.div 
              key="reorder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full h-[70%] sm:h-[80%] glass-card p-4 sm:p-8 overflow-y-auto mt-20 sm:mt-0 shadow-2xl"
            >
              <h3 className="text-lg sm:text-xl font-medium mb-4 sm:mb-6 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Atur Urutan Halaman
              </h3>
              <Reorder.Group axis="y" values={localNotes} onReorder={handleReorder} className="flex flex-col gap-3">
                {localNotes.map((note) => (
                  <Reorder.Item 
                    key={note.id} 
                    value={note}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 cursor-grab active:cursor-grabbing transition-colors"
                  >
                    <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 opacity-50" />
                    <div className="flex-1 truncate text-xs sm:text-sm opacity-80">
                      {note.content.substring(0, 100) || "(Halaman Kosong)"}
                    </div>
                    <div className="text-[10px] sm:text-xs opacity-40 font-mono">
                      Hal {note.page_order + 1}
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </motion.div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Navigation Arrows */}
              <button 
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
                className="absolute left-0 z-10 p-2 sm:p-4 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-20 transition-all shadow-lg"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 h-8" />
              </button>

              {/* Paper Card */}
              <motion.div 
                key={currentPage}
                initial={{ rotate: -2, x: 50, opacity: 0 }}
                animate={{ rotate: -1, x: 0, opacity: 1 }}
                className="relative w-[85%] sm:w-[80%] h-[70%] sm:h-[80%] bg-[#FFF9E5] shadow-2xl p-6 sm:p-12 flex flex-col"
                style={{ 
                  backgroundImage: 'linear-gradient(#e5e5e5 1px, transparent 1px)',
                  backgroundSize: '100% 2rem sm:2.5rem',
                  lineHeight: '2rem sm:2.5rem'
                }}
              >
                {/* Paper Clips */}
                <div className="absolute -top-3 sm:-top-4 left-6 sm:left-10 w-3 sm:w-4 h-10 sm:h-12 bg-pink-400/50 rounded-full border border-pink-500/30" />
                <div className="absolute -top-3 sm:-top-4 right-6 sm:right-10 w-3 sm:w-4 h-10 sm:h-12 bg-green-400/50 rounded-full border border-green-500/30" />

                {isEditMode ? (
                  <textarea 
                    className="w-full h-full bg-transparent resize-none focus:outline-none text-gray-800 text-base sm:text-xl font-medium"
                    value={currentNote.content}
                    placeholder="Tulis catatan di sini..."
                    onChange={(e) => saveNote({ ...currentNote, content: e.target.value })}
                  />
                ) : (
                  <div className="w-full h-full text-gray-800 text-base sm:text-xl font-medium whitespace-pre-wrap overflow-y-auto">
                    {currentNote.content || "Halaman kosong. Klik edit untuk menulis."}
                  </div>
                )}

                {isEditMode && (
                  <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 flex gap-2">
                    <button onClick={() => deletePage(currentNote.id)} className="p-2 bg-red-500 rounded-full text-white shadow-lg hover:bg-red-600 transition-colors">
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button onClick={addPage} className="p-2 bg-pink-500 rounded-full text-white shadow-lg hover:bg-pink-600 transition-colors">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}
                
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 text-gray-400 text-[10px] sm:text-sm">
                  Halaman {currentPage + 1} dari {Math.max(1, content.notes.length)}
                </div>
              </motion.div>

              <button 
                disabled={currentPage >= content.notes.length - 1}
                onClick={() => setCurrentPage(p => p + 1)}
                className="absolute right-0 z-10 p-2 sm:p-4 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-20 transition-all shadow-lg"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 h-8" />
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PhotosView({ content, isEditMode, onUpdate, onInitiateCrop }: { content: AppContent, isEditMode: boolean, onUpdate: () => void, onInitiateCrop: (f: File, t: string, a: number, c: (u: string) => void) => void }) {
  const [currentPage, setCurrentPage] = useState(0);

  const savePhoto = async (photo: Photo) => {
    await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(photo)
    });
    onUpdate();
  };

  const addPhoto = (file: File) => {
    onInitiateCrop(file, "photos", 1, (url) => {
      savePhoto({ url, caption: "", page_order: content.photos.length });
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (files: File[]) => files.forEach(addPhoto),
    noClick: !isEditMode,
    noDrag: !isEditMode
  } as any);

  const currentPhoto = content.photos[currentPage];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-5xl aspect-[16/9] flex items-center justify-center">
        <button 
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(p => p - 1)}
          className="absolute left-0 z-10 p-2 sm:p-4 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-20 transition-all shadow-lg"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 h-8" />
        </button>

        {/* Album Book */}
        <div className="relative w-[90%] h-full bg-[#D2B48C] rounded-r-lg shadow-2xl flex overflow-hidden border-l-[10px] sm:border-l-[20px] border-[#8B4513]">
          <div className="w-1/2 h-full bg-[#E8E4D9] border-r border-black/10 p-4 sm:p-8 flex flex-col items-center justify-center">
             {currentPhoto ? (
               <div className="w-full h-full flex flex-col gap-2 sm:gap-4">
                 <div className="flex-1 rounded-lg overflow-hidden shadow-inner bg-black/5">
                   <img src={currentPhoto.url} className="w-full h-full object-contain" />
                 </div>
                 {isEditMode ? (
                   <input 
                     className="bg-transparent border-b border-black/20 text-center text-gray-700 focus:outline-none text-[10px] sm:text-sm"
                     value={currentPhoto.caption}
                     placeholder="Tulis caption..."
                     onChange={(e) => savePhoto({ ...currentPhoto, caption: e.target.value })}
                   />
                 ) : (
                   <p className="text-center text-gray-600 italic text-[10px] sm:text-sm">{currentPhoto.caption}</p>
                 )}
               </div>
             ) : (
               <div {...getRootProps()} className="w-full h-full border-2 border-dashed border-black/20 rounded-xl flex flex-col items-center justify-center gap-2 sm:gap-4 cursor-pointer hover:bg-black/5 transition-all">
                 <input {...getInputProps()} />
                 <Plus className="w-8 h-8 sm:w-12 sm:h-12 text-black/20" />
                 <p className="text-black/40 text-[10px] sm:text-sm text-center px-2">Tambah Foto Kenangan</p>
               </div>
             )}
          </div>
          <div className="w-1/2 h-full bg-[#E8E4D9] p-4 sm:p-8 flex items-center justify-center relative">
             {/* Page Curl Effect */}
             <div className="absolute bottom-0 right-0 w-16 h-16 sm:w-32 sm:h-32 bg-gradient-to-tl from-white/50 to-transparent pointer-events-none" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
             
             {content.photos[currentPage + 1] ? (
               <div className="w-full h-full flex flex-col gap-2 sm:gap-4">
                 <div className="flex-1 rounded-lg overflow-hidden shadow-inner bg-black/5">
                   <img src={content.photos[currentPage + 1].url} className="w-full h-full object-contain" />
                 </div>
                 <p className="text-center text-gray-600 italic text-[10px] sm:text-sm">{content.photos[currentPage + 1].caption}</p>
               </div>
             ) : (
               <div className="text-black/20 text-center text-[10px] sm:text-sm">
                 <p>Halaman Berikutnya</p>
                 {isEditMode && <p className="text-[8px] sm:text-xs mt-2">Klik edit untuk menambah lebih banyak foto</p>}
               </div>
             )}
          </div>
        </div>

        <button 
          disabled={currentPage >= content.photos.length - 1}
          onClick={() => setCurrentPage(p => p + 2)}
          className="absolute right-0 z-10 p-2 sm:p-4 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-20 transition-all shadow-lg"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 h-8" />
        </button>
      </div>
    </motion.div>
  );
}
