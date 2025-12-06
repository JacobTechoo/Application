export interface Entry {
  id: string;
  title: string | null;
  content: string | null;
  mood: string | null;
  created_at: string;
  media_urls: string[];
}

export interface EntryFormData {
  text: string;
  description: string;
  selectedMood: string;
  mediaUrls: string[];
}

export interface EditEntryData {
  id: string;
  text: string;
  description: string;
  mood: string;
}
