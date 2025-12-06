import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal } from 'react-native';
import { Entry } from '../types/Entry';
import { MOODS, MOOD_LABELS, DEFAULT_MOOD } from '../constants/moods';
import { MediaPreview } from './MediaPreview';
import { MediaViewer } from './MediaViewer';

interface EntryModalProps {
  entry: Entry | null;
  visible: boolean;
  isEditMode: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSaveEdit: (title: string, content: string, mood: string) => Promise<boolean>;
  saving?: boolean;
}

export function EntryModal({
  entry,
  visible,
  isEditMode,
  onClose,
  onEdit,
  onDelete,
  onSaveEdit,
  saving = false,
}: EntryModalProps) {
  const [editText, setEditText] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMood, setEditMood] = useState<string>(DEFAULT_MOOD);
  const [viewingMediaUrl, setViewingMediaUrl] = useState<string | null>(null);

  // Update edit state when entry changes
  React.useEffect(() => {
    if (entry && isEditMode) {
      setEditText(entry.content || '');
      setEditDescription(entry.title || '');
      setEditMood(entry.mood || DEFAULT_MOOD);
    }
  }, [entry, isEditMode]);

  const handleSave = async () => {
    if (!entry) return;
    const success = await onSaveEdit(editDescription, editText, editMood);
    if (success) {
      onClose();
    }
  };

  if (!entry) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
      }}>
        <View style={{
          alignItems: 'center',
          width: '100%',
        }}>
          {/* Big emoji + description on top */}
          <Text style={{
            fontSize: 40,
            marginBottom: 4,
          }}>
            {entry.mood || '–'}
          </Text>

          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#111827',
            marginBottom: 12,
          }}>
            {entry.title ||
              MOOD_LABELS[entry.mood as keyof typeof MOOD_LABELS] ||
              'Journal Entry'}
          </Text>

          <View style={{
            width: '90%',
            maxHeight: '70%',
            backgroundColor: '#f9fafb',
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}>
            {/* Delete / Edit row */}
            {!isEditMode && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                marginBottom: 4,
                zIndex: 10,
              }}>
                <Pressable onPress={onDelete} hitSlop={10} style={{ padding: 8 }}>
                  <Text style={{
                    fontSize: 14,
                    color: '#ef4444',
                    fontWeight: '600',
                  }}>
                    Delete
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onEdit}
                  style={{ marginLeft: 8, padding: 8 }}
                  hitSlop={10}
                >
                  <Text style={{
                    fontSize: 14,
                    color: '#2563eb',
                    fontWeight: '600',
                  }}>
                    Edit
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Date */}
            <Text style={{
              fontSize: 12,
              color: '#6b7280',
              marginBottom: 8,
            }}>
              {new Date(entry.created_at).toLocaleString()}
            </Text>

            {/* Content */}
            {isEditMode ? (
              <View>
                {/* Mood selector */}
                <Text style={{
                  fontSize: 14,
                  color: '#4b5563',
                  marginBottom: 6,
                }}>
                  Mood:
                </Text>
                <View style={{
                  flexDirection: 'row',
                  marginBottom: 12,
                  gap: 8,
                }}>
                  {MOODS.map((mood) => (
                    <Pressable
                      key={mood}
                      onPress={() => setEditMood(mood)}
                      style={[
                        {
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: '#d1d5db',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#ffffff',
                        },
                        editMood === mood && {
                          borderColor: '#2563eb',
                          backgroundColor: '#dbeafe',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>{mood}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Description input */}
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    marginBottom: 12,
                  }}
                  placeholder="Short description"
                  placeholderTextColor="#9ca3af"
                  value={editDescription}
                  onChangeText={setEditDescription}
                />

                {/* Content input */}
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#d1d5db',
                    borderRadius: 12,
                    padding: 12,
                    height: 180,
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    textAlignVertical: 'top',
                  }}
                  placeholder="Edit your entry..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={editText}
                  onChangeText={setEditText}
                />

                {/* Save/Cancel buttons */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 16,
                }}>
                  <Pressable
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: '#6b7280',
                    }}
                    onPress={onClose}
                  >
                    <Text style={{
                      color: '#ffffff',
                      fontWeight: '600',
                    }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: '#2563eb',
                    }}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    <Text style={{
                      color: '#ffffff',
                      fontWeight: '600',
                    }}>
                      {saving ? 'Saving...' : 'Save'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 260, marginBottom: 12 }}>
                <Text style={{
                  fontSize: 15,
                  color: '#111827',
                  lineHeight: 22,
                }}>
                  {entry.content && entry.content.trim().length > 0
                    ? entry.content
                    : '(No content)'}
                </Text>

                {/* Media preview */}
                <MediaPreview
                  mediaUrls={entry.media_urls}
                  onMediaPress={setViewingMediaUrl}
                />
              </ScrollView>
            )}

            {/* Close button (only in view mode) */}
            {!isEditMode && (
              <Pressable
                onPress={onClose}
                style={{
                  alignSelf: 'flex-end',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: '#111827',
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontSize: 13,
                }}>
                  Close
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <MediaViewer
          mediaUrl={viewingMediaUrl}
          onClose={() => setViewingMediaUrl(null)}
        />
      </View>
    </Modal>
  );
}
