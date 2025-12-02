    import React, { useEffect, useState } from 'react';
    import {
      View,
      Text,
      TextInput,
      Button,
      StyleSheet,
      FlatList,
      Pressable,
      Modal,
      ScrollView,
      Image,
    } from 'react-native';
    import { Video, ResizeMode } from 'expo-av';
    import * as ImagePicker from 'expo-image-picker';
    import { supabase } from '../../supabaseClient';

    // Decide which bucket to use based on MIME type
    function getBucketForFile(mimeType: string | undefined) {
      if (!mimeType) return 'Media_files'; // fallback
      if (mimeType.startsWith('image/')) return 'Pictures';
      if (mimeType.startsWith('video/')) return 'Media_files';

      // default: treat anything else as generic media
      return 'Media_files';
    }

    // Upload a single picked file to the correct bucket and return its public URL
async function uploadMediaFile(asset: any, userId: string): Promise<string> {
  // Try to get a MIME type
  const mimeType: string =
    asset.mimeType || asset.type || 'image/jpeg';

  const bucket = getBucketForFile(mimeType);

  const extFromName =
    asset.fileName?.split('.').pop() ||
    mimeType.split('/')[1] ||
    'jpg';

  const fileName = `${userId}-${Date.now()}.${extFromName}`;
  const filePath = `${userId}/${fileName}`;

  // ✅ IMPORTANT: use a "file-like" object for React Native / Expo
  const file = {
    uri: asset.uri,     // local file URI from ImagePicker
    name: fileName,
    type: mimeType,
  } as any;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true });

  if (error) {
    console.log('Upload error:', error);
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  console.log('Uploaded media URL:', data.publicUrl);
  return data.publicUrl;
}


    // --- TYPES ---

    type Entry = {
      id: string;
      title: string | null;      // description
      content: string | null;    // full journal text
      mood: string | null;
      created_at: string;
      media_urls: string[];      // normalized to an array in code
    };

    const MOODS = ['😊', '😢', '😡', '😴', '😌'];

    const MOOD_LABELS: Record<string, string> = {
      '😊': 'Happy',
      '😢': 'Sad',
      '😡': 'Angry',
      '😴': 'Tired',
      '😌': 'Calm',
    };

    export default function HomeScreen() {
      // welcome vs main
      const [showWelcome, setShowWelcome] = useState(true);

      // create flow
      const [isWriting, setIsWriting] = useState(false); // big writer for NEW entry
      const [showMoodStage, setShowMoodStage] = useState(false);

      const [description, setDescription] = useState('');
      const [text, setText] = useState('');
      const [selectedMood, setSelectedMood] = useState<string>('😊');
      const [message, setMessage] = useState<string | null>(null);
      const [saving, setSaving] = useState(false);

      // media for NEW entry
      const [mediaUrls, setMediaUrls] = useState<string[]>([]);
      const [uploadingMedia, setUploadingMedia] = useState(false);

      // entries
      const [entries, setEntries] = useState<Entry[]>([]);
      const [loadingEntries, setLoadingEntries] = useState(false);

      // view-only zoom card
      const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
      const [showEntryCard, setShowEntryCard] = useState(false);

      // EDIT flow
      const [isEditModalOpen, setIsEditModalOpen] = useState(false);
      const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
      const [editText, setEditText] = useState('');
      const [editDescription, setEditDescription] = useState('');
      const [editMood, setEditMood] = useState<string>('😊');
      const [editingSaving, setEditingSaving] = useState(false);

      // ---------- LOAD ENTRIES + NORMALIZE media_urls ----------

      const fetchEntries = async () => {
        setLoadingEntries(true);
        setMessage(null);

        const { data: userData } = await supabase.auth.getUser();
        const user_id = userData.user?.id;

        if (!user_id) {
          setLoadingEntries(false);
          return;
        }

        const { data, error } = await supabase
          .from('entries')
          .select('id,user_id,title,content,mood,created_at,media_urls')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.log('Error loading entries:', error);
          setMessage('Error loading entries: ' + error.message);
          setLoadingEntries(false);
          return;
        }

        const normalized: Entry[] = (data as any[]).map((row) => {
          let urls: string[] = [];

          if (Array.isArray(row.media_urls)) {
            urls = row.media_urls;
          } else if (
            typeof row.media_urls === 'string' &&
            row.media_urls.trim().length > 0
          ) {
            const raw = row.media_urls.trim();

            // handle '["url"]'
            if (raw.startsWith('[')) {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  urls = parsed;
                }
              } catch {
                urls = [raw];
              }
            } else {
              // handle 'url1,url2' or single string
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
        setLoadingEntries(false);
      };

      useEffect(() => {
        fetchEntries();
      }, []);

      // ---------- MEDIA UPLOAD FOR NEW ENTRY ----------

      const handleAddMedia = async () => {
        setMessage(null);

        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setMessage('Permission to access photos/videos is required.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          quality: 0.8,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        const asset = result.assets[0];
        if (!asset.uri) return;

        setUploadingMedia(true);

        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData.user) {
            setMessage('Not logged in.');
            setUploadingMedia(false);
            return;
          }

          const userId = userData.user.id;

          // upload to correct bucket and get public URL
          const publicUrl = await uploadMediaFile(asset, userId);

          // store this URL in state so we can save it with the entry
          setMediaUrls((prev) => [...prev, publicUrl]);
          setMessage('Media attached ✅');
        } catch (e) {
          console.log('Media upload exception:', e);
          setMessage('Unexpected error while uploading media.');
        }

        setUploadingMedia(false);
      };

      // ---------- CREATE NEW ENTRY ----------

      const handleSave = async () => {
        if (!text.trim()) {
          setMessage('Entry cannot be empty.');
          return;
        }

        setSaving(true);
        setMessage(null);

        const { data: userData } = await supabase.auth.getUser();
        const user_id = userData.user?.id;

        const finalDescription =
          description.trim() ||
          MOOD_LABELS[selectedMood] ||
          "Today's Journal";

        const { error } = await supabase.from('entries').insert({
          user_id,
          title: finalDescription,
          content: text,
          mood: selectedMood,
          media_urls: mediaUrls, // string[]
        });

        if (error) {
          setMessage('Error saving entry: ' + error.message);
        } else {
          setMessage('Saved! Your journal entry has been recorded.');
          setText('');
          setDescription('');
          setSelectedMood('😊');
          setShowMoodStage(false);
          setMediaUrls([]); // clear attachments
          fetchEntries();
        }

        setSaving(false);
      };

      const handleDoneWriting = () => {
        setIsWriting(false);
        if (text.trim().length > 0) {
          setShowMoodStage(true);
        }
      };

      // ---------- VIEW + EDIT + DELETE EXISTING ENTRY ----------

      const handleRowPress = (item: Entry) => {
        setSelectedEntry(item);
        setShowEntryCard(true);
      };

      const handleCloseCard = () => {
        setShowEntryCard(false);
        setSelectedEntry(null);
      };

      const handleEditPress = () => {
        if (!selectedEntry) return;

        setEditingEntryId(selectedEntry.id);
        setEditText(selectedEntry.content || '');
        setEditDescription(selectedEntry.title || '');
        setEditMood(selectedEntry.mood || '😊');

        setShowEntryCard(false);
        setIsEditModalOpen(true);
      };

      const handleDeletePress = async () => {
        if (!selectedEntry) return;

        try {
          const { data: userData } = await supabase.auth.getUser();
          const user_id = userData.user?.id;

          if (!user_id) {
            setMessage('You are not logged in.');
            return;
          }

          const { error } = await supabase
            .from('entries')
            .delete()
            .eq('id', selectedEntry.id)
            .eq('user_id', user_id);

          if (error) {
            console.log('Error deleting entry:', error);
            setMessage('Error deleting entry: ' + error.message);
          } else {
            setMessage('Entry deleted.');
            setShowEntryCard(false);
            setSelectedEntry(null);
            fetchEntries();
          }
        } catch (e) {
          console.log('Delete exception:', e);
          setMessage('Unexpected error while deleting entry.');
        }
      };

      const handleSaveEdit = async () => {
        if (!editingEntryId) return;
        if (!editText.trim()) {
          setMessage('Entry cannot be empty.');
          return;
        }

        setEditingSaving(true);
        setMessage(null);

        const { data: userData } = await supabase.auth.getUser();
        const user_id = userData.user?.id;

        const finalDescription =
          editDescription.trim() ||
          MOOD_LABELS[editMood] ||
          "Today's Journal";

        const { error } = await supabase
          .from('entries')
          .update({
            content: editText,
            title: finalDescription,
            mood: editMood,
          })
          .eq('id', editingEntryId)
          .eq('user_id', user_id);

        if (error) {
          setMessage('Error updating entry: ' + error.message);
        } else {
          setMessage('Entry updated.');
          setIsEditModalOpen(false);
          setEditingEntryId(null);
          setSelectedEntry(null);
          fetchEntries();
        }

        setEditingSaving(false);
      };

      // ---------- RENDER HELPERS ----------

      const renderEntry = ({ item }: { item: Entry }) => {
        const date = new Date(item.created_at);
        const formatted = date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        const moodEmoji = item.mood || '–';
        const moodDescription =
          item.title ||
          MOOD_LABELS[moodEmoji] ||
          '(No description)';

        return (
          <Pressable onPress={() => handleRowPress(item)}>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.dateCell]}>{formatted}</Text>
              <Text style={[styles.cell, styles.moodCell]}>{moodEmoji}</Text>
              <Text style={[styles.cell, styles.textCell]} numberOfLines={1}>
                {moodDescription}
              </Text>
            </View>
          </Pressable>
        );
      };

      const previewText =
        text.trim().length === 0
          ? 'Tap here to type your thoughts...'
          : text.length > 80
          ? text.slice(0, 80) + '…'
          : text;

      // ---------- UI ----------

      return (
        <View style={styles.container}>
          {/* WELCOME VS MAIN */}
          {showWelcome ? (
            <View style={styles.welcomeBox}>
              <Text style={styles.welcomeTitle}>Welcome To LaypPad</Text>
              <Text style={styles.welcomeText}>
                Ready to unload your thoughts for today?
              </Text>
              <Pressable
                style={styles.welcomeButton}
                onPress={() => setShowWelcome(false)}
              >
                <Text style={styles.welcomeButtonText}>Start your day</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.title}>How was your day?</Text>
              <Text style={styles.subtitle}>
                Write your Thoughts.
              </Text>

              {/* Tappable box → big writer */}
              <Pressable
                style={styles.entryPreviewBox}
                onPress={() => setIsWriting(true)}
              >
                <Text
                  style={[
                    styles.entryPreviewText,
                    text.trim().length === 0 && { color: '#9ca3af' },
                  ]}
                >
                  {previewText}
                </Text>
              </Pressable>

              {/* Mood + save AFTER Done */}
              {showMoodStage && text.trim().length > 0 && (
                <>
                  <Text style={styles.moodLabel}>Select your mood:</Text>
                  <View style={styles.moodRow}>
                    {MOODS.map((mood) => (
                      <Pressable
                        key={mood}
                        onPress={() => setSelectedMood(mood)}
                        style={[
                          styles.moodButton,
                          selectedMood === mood && styles.moodButtonSelected,
                        ]}
                      >
                        <Text style={styles.moodEmoji}>{mood}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Short description (e.g. 'Burnout vibes', 'Cozy rainy day')"
                    placeholderTextColor="#9ca3af"
                    value={description}
                    onChangeText={setDescription}
                  />

                  <Button
                    title={saving ? 'Saving...' : 'Save entry'}
                    onPress={handleSave}
                  />
                </>
              )}

              {message && <Text style={styles.message}>{message}</Text>}
            </>
          )}

          {/* ENTRIES TABLE */}
          <Text style={styles.sectionTitle}>
            {loadingEntries ? 'Loading your entries…' : 'Past entries'}
          </Text>

          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
            <Text style={[styles.headerCell, styles.moodCell]}>Mood</Text>
            <Text style={[styles.headerCell, styles.textCell]}>Description</Text>
          </View>

          {entries.length === 0 && !loadingEntries && (
            <Text style={styles.emptyText}>
              No entries yet. Your saved journals will appear here.
            </Text>
          )}

          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            contentContainerStyle={{ paddingBottom: 32 }}
          />

          {/* BIG WRITER FOR NEW ENTRY */}
          <Modal
            visible={isWriting}
            transparent
            animationType="fade"
            onRequestClose={() => setIsWriting(false)}
          >
            <View style={styles.writeOverlay}>
              <View style={styles.writeCard}>
                <View style={styles.writeHeader}>
                  <Text style={styles.writeTitle}>how was your Day?</Text>
                  <Pressable onPress={handleDoneWriting}>
                    <Text style={styles.writeDoneText}>Done</Text>
                  </Pressable>
                </View>

                <TextInput
                  style={styles.writeInput}
                  placeholder="Type everything you want to say..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={text}
                  onChangeText={setText}
                  autoFocus
                />

                {/* Add photo / video row */}
                <View style={styles.mediaRow}>
                  <Pressable
                    style={styles.mediaButton}
                    onPress={handleAddMedia}
                    disabled={uploadingMedia}
                  >
                    <Text style={styles.mediaButtonText}>
                      {uploadingMedia ? 'Uploading…' : 'Add photo or video'}
                    </Text>
                  </Pressable>

                  {mediaUrls.length > 0 && (
                    <Text style={styles.mediaInfo}>
                      {mediaUrls.length} attachment
                      {mediaUrls.length > 1 ? 's' : ''} added
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Modal>

          {/* VIEW ENTRY CARD */}
          <Modal
            visible={showEntryCard && !!selectedEntry}
            transparent
            animationType="fade"
            onRequestClose={handleCloseCard}
          >
            <View style={styles.modalOverlay}>
              {selectedEntry && (
                <View style={styles.modalInner}>
                  {/* Big emoji + description on top */}
                  <Text style={styles.bigMood}>{selectedEntry.mood || '–'}</Text>

                  <Text style={styles.bigDescription}>
                    {selectedEntry.title ||
                      MOOD_LABELS[selectedEntry.mood || ''] ||
                      'Journal Entry'}
                  </Text>

                  <View style={styles.modalCard}>
                    {/* Delete / Edit row */}
                    <View style={styles.modalHeaderRow}>
                      <Pressable onPress={handleDeletePress}>
                        <Text style={styles.modalDeleteText}>Delete</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleEditPress}
                        style={{ marginLeft: 16 }}
                      >
                        <Text style={styles.modalEditText}>Edit</Text>
                      </Pressable>
                    </View>

                    {/* Date */}
                    <Text style={styles.modalDate}>
                      {new Date(selectedEntry.created_at).toLocaleString()}
                    </Text>

                    {/* NOTE TEXT (scrollable if long) */}
                    <ScrollView style={styles.modalContentWrapper}>
                      <Text style={styles.modalContent}>
                        {selectedEntry.content && selectedEntry.content.trim().length > 0
                          ? selectedEntry.content
                          : '(No content)'}
                      </Text>

                      {/* MEDIA PREVIEW – only photos/videos, no label */}
                      {selectedEntry.media_urls &&
                      selectedEntry.media_urls.length > 0 && (
                        <View style={{ marginTop: 12 }}>
                          {selectedEntry.media_urls.map((url, idx) => {
            
                            const baseUrl = url.split('?')[0];

                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(baseUrl);
                            const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(baseUrl);

                            if (!isImage && !isVideo) {
                              return null; // ignore unsupported files
                            }

                            return (
                              <View key={idx} style={{ marginBottom: 12 }}>
                                {isImage && (
                                  <Image
                                    source={{ uri: url }}
                                    style={{
                                      width: '100%',
                                      height: 230,
                                      borderRadius: 14,
                                      marginTop: 8,
                                    }}
                                    resizeMode="cover"
                                  />
                                )}

                                {isVideo && (
                                  <Video
                                    source={{ uri: url }}
                                    style={{
                                      width: '100%',
                                      height: 260,
                                      borderRadius: 14,
                                      backgroundColor: '#000',
                                      marginTop: 8,
                                    }}
                                    useNativeControls
                                    resizeMode={ResizeMode.CONTAIN}
                                    shouldPlay={false}
                                    isMuted={false}
                                  />
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}

                    </ScrollView>

                    {/* Close button */}
                    <Pressable
                      onPress={handleCloseCard}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseText}>Close</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </Modal>

          {/* EDIT ENTRY MODAL */}
          <Modal
            visible={isEditModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsEditModalOpen(false)}
          >
            <View style={styles.writeOverlay}>
              <View style={styles.writeCard}>
                <View style={styles.writeHeader}>
                  <Text style={styles.writeTitle}>Edit entry</Text>
                  <Pressable onPress={() => setIsEditModalOpen(false)}>
                    <Text style={styles.writeDoneText}>Cancel</Text>
                  </Pressable>
                </View>

                <Text style={styles.moodLabel}>Mood:</Text>
                <View style={styles.moodRow}>
                  {MOODS.map((mood) => (
                    <Pressable
                      key={mood}
                      onPress={() => setEditMood(mood)}
                      style={[
                        styles.moodButton,
                        editMood === mood && styles.moodButtonSelected,
                      ]}
                    >
                      <Text style={styles.moodEmoji}>{mood}</Text>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Short description"
                  placeholderTextColor="#9ca3af"
                  value={editDescription}
                  onChangeText={setEditDescription}
                />

                <TextInput
                  style={[styles.writeInput, { height: 180 }]}
                  placeholder="Edit your entry..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={editText}
                  onChangeText={setEditText}
                />

                <Button
                  title={editingSaving ? 'Saving changes...' : 'Save changes'}
                  onPress={handleSaveEdit}
                />
              </View>
            </View>
          </Modal>
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
        backgroundColor: '#f3f4f6',
      },

      // welcome
      welcomeBox: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
      },
      welcomeTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
      },
      welcomeText: {
        fontSize: 15,
        color: '#1e293b',
        marginBottom: 12,
      },
      welcomeButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#2563eb',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
      },
      welcomeButtonText: {
        color: '#ffffff',
        fontWeight: '600',
      },

      // main
      title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
      },
      subtitle: {
        fontSize: 15,
        color: '#4b5563',
        marginBottom: 12,
      },
      entryPreviewBox: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#ffffff',
        marginBottom: 10,
      },
      entryPreviewText: {
        fontSize: 14,
        color: '#111827',
      },
      moodLabel: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 6,
      },
      moodRow: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
      },
      moodButton: {
        width: 40,
        height: 40,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
      },
      moodButtonSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#dbeafe',
      },
      moodEmoji: {
        fontSize: 22,
      },
      descriptionInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        color: '#111827',
        marginBottom: 12,
      },
      message: {
        marginTop: 8,
        textAlign: 'center',
        color: 'green',
      },

      // table
      sectionTitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
      },
      emptyText: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
      },
      headerRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
      },
      headerCell: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
      },
      row: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
      },
      cell: {
        fontSize: 13,
        color: '#111827',
      },
      dateCell: {
        width: 70,
      },
      moodCell: {
        width: 50,
        textAlign: 'center',
      },
      textCell: {
        flex: 1,
        paddingLeft: 8,
      },

      // writer / edit modal base
      writeOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
      },
      writeCard: {
        width: '95%',
        maxHeight: '80%',
        backgroundColor: '#f9fafb',
        borderRadius: 18,
        padding: 16,
      },
      writeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      },
      writeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
      },
      writeDoneText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563eb',
      },
      writeInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 12,
        height: 260,
        backgroundColor: '#ffffff',
        color: '#111827',
        textAlignVertical: 'top',
      },

      // media row inside writer
      mediaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
      },
      mediaButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#2563eb',
      },
      mediaButtonText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
      },
      mediaInfo: {
        fontSize: 13,
        color: '#4b5563',
      },

      // view card
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
      },
      modalInner: {
        alignItems: 'center',
        width: '100%',
      },
      bigMood: {
        fontSize: 40,
        marginBottom: 4,
      },
      bigDescription: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
      },
      modalCard: {
        width: '90%',
        maxHeight: '70%',
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      },
      modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 4,
      },
      modalEditText: {
        fontSize: 14,
        color: '#2563eb',
        fontWeight: '600',
      },
      modalDeleteText: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '600',
      },
      modalDate: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 8,
      },
      modalContentWrapper: {
        maxHeight: 260,
        marginBottom: 12,
      },
      modalContent: {
        fontSize: 15,
        color: '#111827',
        lineHeight: 22,
      },
      modalCloseButton: {
        alignSelf: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: '#111827',
      },
      modalCloseText: {
        color: '#ffffff',
        fontSize: 13,
      },
    });
    