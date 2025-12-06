import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Entry } from '../types/Entry';

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all entries for the current user
  const fetchEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('entries')
        .select('id,user_id,title,content,mood,created_at,media_urls')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Error loading entries: ' + error.message);
        return;
      }

      // Normalize media_urls array
      const normalized: Entry[] = (data as any[]).map((row) => {
        let urls: string[] = [];

        if (Array.isArray(row.media_urls)) {
          urls = row.media_urls.filter((url: any) => url && typeof url === 'string').map((url: string) => url.trim());
        } else if (typeof row.media_urls === 'string' && row.media_urls.trim()) {
          const raw = row.media_urls.trim();
          try {
            // Try to parse as JSON array first
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              urls = parsed.filter((url: any) => url && typeof url === 'string').map((url: string) => url.trim());
            } else if (typeof parsed === 'string') {
              urls = [parsed];
            }
          } catch {
            // Fall back to comma-separated string
            urls = raw.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          }
        }

        return {
          id: row.id,
          title: row.title,
          content: row.content,
          mood: row.mood,
          created_at: row.created_at,
          media_urls: urls,
        };
      });

      setEntries(normalized);
    } catch (err) {
      console.error('Unexpected error fetching entries:', err);
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Create a new entry
  const createEntry = async (
    title: string,
    content: string,
    mood: string,
    mediaUrls: string[]
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        setError('Not logged in');
        return false;
      }

      const { error } = await supabase.from('entries').insert({
        user_id: userId,
        title,
        content,
        mood,
        media_urls: mediaUrls,
      });

      if (error) {
        console.error('Error saving entry:', error);
        setError('Error saving entry: ' + error.message);
        return false;
      }

      // Refresh entries
      await fetchEntries();
      return true;
    } catch (err) {
      console.error('Unexpected error creating entry:', err);
      setError('Unexpected error occurred');
      return false;
    }
  };

  // Update an existing entry
  const updateEntry = async (
    entryId: string,
    title: string,
    content: string,
    mood: string
  ): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        setError('Not logged in');
        return false;
      }

      const { error } = await supabase
        .from('entries')
        .update({
          content,
          title,
          mood,
        })
        .eq('id', entryId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating entry:', error);
        setError('Error updating entry: ' + error.message);
        return false;
      }

      // Refresh entries
      await fetchEntries();
      return true;
    } catch (err) {
      console.error('Unexpected error updating entry:', err);
      setError('Unexpected error occurred');
      return false;
    }
  };

  // Delete an entry
  const deleteEntry = async (entryId: string): Promise<boolean> => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) {
        setError('Not logged in');
        return false;
      }

      // Get the entry to find its media files
      const { data: entryData, error: fetchError } = await supabase
        .from('entries')
        .select('media_urls')
        .eq('id', entryId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching entry to delete:', fetchError);
        setError('Error deleting entry: ' + fetchError.message);
        return false;
      }

      // If there are media files, delete them from storage
      if (entryData?.media_urls && entryData.media_urls.length > 0) {
        const urlsToDelete = entryData.media_urls as string[];
        
        // Assume all files for one entry are in the same bucket.
        const firstUrl = urlsToDelete[0];
        let bucket = '';
        if (firstUrl.includes('/Pictures/')) {
            bucket = 'Pictures';
        } else if (firstUrl.includes('/Media_files/')) {
            bucket = 'Media_files';
        }

        if (bucket) {
            const filePaths = urlsToDelete.map(url => {
                const searchString = `/storage/v1/object/public/${bucket}/`;
                const startIndex = url.indexOf(searchString);
                return startIndex !== -1 ? url.substring(startIndex + searchString.length) : '';
            }).filter(Boolean);

            if (filePaths.length > 0) {
                console.log(`Deleting files from bucket "${bucket}":`, filePaths);
                const { error: storageError } = await supabase.storage
                    .from(bucket)
                    .remove(filePaths);

                if (storageError) {
                    console.error('Storage deletion error:', storageError);
                    // Don't stop the whole process, but notify.
                    setError('Could not delete all media files.');
                }
            }
        }
      }

      // Delete the database record
      const { error: dbError } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId);

      if (dbError) {
        console.error('DB deletion error:', dbError);
        setError('Error deleting entry: ' + dbError.message);
        return false;
      }

      // Refresh UI
      await fetchEntries();
      return true;
    } catch (err) {
      console.error('Unexpected error deleting entry:', err);
      setError('An unexpected error occurred during deletion.');
      return false;
    }
  };

  // Load entries on mount
  useEffect(() => {
    fetchEntries();
  }, []);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    clearError: () => setError(null),
  };
}
