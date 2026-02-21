export interface Bio {
  id?: number;
  name: string;
  description: string;
  image_url: string;
}

export interface Note {
  id?: number;
  content: string;
  page_order: number;
}

export interface Photo {
  id?: number;
  url: string;
  caption: string;
  page_order: number;
}

export interface AppContent {
  bio: Bio[];
  notes: Note[];
  photos: Photo[];
  background: string;
  title1: string;
  title2: string;
}
