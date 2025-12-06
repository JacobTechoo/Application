import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MOODS, DEFAULT_MOOD } from '../constants/moods';
import { uploadMediaFile } from '../utils/media';
import { supabase } from '../supabaseClient';

interface EntryWriterProps {
  visible: boolean;
  onClose: () => void;
  onSave: (formData: {
    text: string;
    description: string;
    selectedMood: string;
    mediaUrls: string[];
  }) => Promise<boolean>;
  saving?: boolean;
}

export function EntryWriter({ visible, onClose, onSave, saving = false }: EntryWriterProps) {
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMood, setSelectedMood] = useState(DEFAULT_MOOD);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [showMoodStage, setShowMoodStage] = useState(false);

  const handleAddMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('Permission to access photos/videos is required.');
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
        alert('Not logged in.');
        return;
      }

      const userId = userData.user.id;
      const publicUrl = await uploadMediaFile(asset, userId);
      setMediaUrls(prev => [...prev, publicUrl]);
    } catch (error) {
      console.error('Media upload error:', error);
      alert('Failed to upload media');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim()) {
      alert('Entry cannot be empty.');
      return;
    }

    const success = await onSave({
      text,
      description,
      selectedMood,
      mediaUrls,
    });

    if (success) {
      // Reset form
      setText('');
      setDescription('');
      setSelectedMood(DEFAULT_MOOD);
      setMediaUrls([]);
      setShowMoodStage(false);
      onClose();
    }
  };

  const handleDoneWriting = () => {
    if (text.trim().length > 0) {
      setShowMoodStage(true);
    }
  };

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
          width: '95%',
          maxHeight: '80%',
          backgroundColor: '#f9fafb',
          borderRadius: 18,
          padding: 16,
        }}>
          {/* Writing Stage */}
          {!showMoodStage && (
            <>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#111827',
                }}>
                  How was your day?
                </Text>
                <Pressable onPress={handleDoneWriting}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#2563eb',
                  }}>
                    Done
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 12,
                  padding: 12,
                  height: 260,
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  textAlignVertical: 'top',
                }}
                placeholder="Type everything you want to say..."
                placeholderTextColor="#9ca3af"
                multiline
                value={text}
                onChangeText={setText}
                autoFocus
              />

              {/* Add photo/video row */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                gap: 8,
              }}>
                <Pressable
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: '#2563eb',
                  }}
                  onPress={handleAddMedia}
                  disabled={uploadingMedia}
                >
                  <Text style={{
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                    {uploadingMedia ? 'Uploading…' : 'Add photo or video'}
                  </Text>
                </Pressable>

                {mediaUrls.length > 0 && (
                  <Text style={{
                    fontSize: 13,
                    color: '#4b5563',
                  }}>
                    {mediaUrls.length} attachment{mediaUrls.length > 1 ? 's' : ''} added
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Mood Selection Stage */}
          {showMoodStage && (
            <>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#111827',
                }}>
                  Finalize your entry
                </Text>
                <Pressable onPress={() => setShowMoodStage(false)}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#6b7280',
                  }}>
                    Back
                  </Text>
                </Pressable>
              </View>

              {/* Mood Selection */}
              <Text style={{
                fontSize: 14,
                color: '#4b5563',
                marginBottom: 6,
              }}>
                Select your mood:
              </Text>
              <View style={{
                flexDirection: 'row',
                marginBottom: 12,
                gap: 8,
              }}>
                {MOODS.map((mood) => (
                  <Pressable
                    key={mood}
                    onPress={() => setSelectedMood(mood)}
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
                      selectedMood === mood && {
                        borderColor: '#2563eb',
                        backgroundColor: '#dbeafe',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{mood}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Description Input */}
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
                placeholder="Short description (e.g. 'Burnout vibes', 'Cozy rainy day')"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
              />

              {/* Save Button */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
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
                    {saving ? 'Saving...' : 'Save entry'}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Separate component for the mood selection and save stage
export function MoodSelector({
  visible,
  description,
  selectedMood,
  onDescriptionChange,
  onMoodChange,
  onSave,
  saving = false,
}: {
  visible: boolean;
  description: string;
  selectedMood: string;
  onDescriptionChange: (text: string) => void;
  onMoodChange: (mood: string) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  if (!visible) return null;

  return (
    <View>
      <Text style={{
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 6,
      }}>
        Select your mood:
      </Text>
      <View style={{
        flexDirection: 'row',
        marginBottom: 12,
        gap: 8,
      }}>
        {MOODS.map((mood) => (
          <Pressable
            key={mood}
            onPress={() => onMoodChange(mood)}
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
              selectedMood === mood && {
                borderColor: '#2563eb',
                backgroundColor: '#dbeafe',
              },
            ]}
          >
            <Text style={{ fontSize: 22 }}>{mood}</Text>
          </Pressable>
        ))}
      </View>

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
        placeholder="Short description (e.g. 'Burnout vibes', 'Cozy rainy day')"
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={onDescriptionChange}
      />

      <Pressable
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#2563eb',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 999,
        }}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={{
          color: '#ffffff',
          fontWeight: '600',
        }}>
          {saving ? 'Saving...' : 'Save entry'}
        </Text>
      </Pressable>
    </View>
  );
}
