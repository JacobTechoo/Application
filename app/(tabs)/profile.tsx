import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../supabaseClient';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setMessage(null);

      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.log('Error loading user:', error);
        setMessage('Error loading profile.');
      } else if (data.user) {
        setEmail(data.user.email ?? null);

        const meta = (data.user.user_metadata as any) || {};
        setUsername(meta.username ?? '');
        setAvatarUrl(meta.avatar_url ?? null);
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      setMessage('Username cannot be empty.');
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: {
        username: username.trim(),
        avatar_url: avatarUrl ?? null,
      },
    });

    if (error) {
      console.log('Error updating user:', error);
      setMessage('Error saving changes: ' + error.message);
    } else {
      setMessage('Profile updated ✅');
    }

    setSaving(false);
  };

  const handlePickAvatar = async () => {
    setMessage(null);

    // ask permission
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setMessage('Permission to access photos is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    if (!asset.uri) return;

    setUploadingAvatar(true);

    try {
      // get current user id
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) {
        setMessage('Not logged in.');
        setUploadingAvatar(false);
        return;
      }

      const userId = userData.user.id;

      // convert file uri → blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const fileExt = asset.uri.split('.').pop() || 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // upload to storage bucket "avatars"
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          upsert: true,
        });

      if (uploadError) {
        console.log('Upload error:', uploadError);
        setMessage('Error uploading avatar: ' + uploadError.message);
        setUploadingAvatar(false);
        return;
      }

      // get public URL
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicData.publicUrl;
      setAvatarUrl(publicUrl);

      // save to user_metadata immediately
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: username.trim() || undefined,
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        console.log('Error saving avatar URL:', updateError);
        setMessage('Avatar uploaded, but failed to save profile.');
      } else {
        setMessage('Avatar updated ✅');
      }
    } catch (e: any) {
      console.log('Avatar upload exception:', e);
      setMessage('Unexpected error during upload.');
    }

    setUploadingAvatar(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🙂</Text>
          </View>
        )}

        <Pressable
          style={styles.changePhotoButton}
          onPress={handlePickAvatar}
          disabled={uploadingAvatar}
        >
          <Text style={styles.changePhotoText}>
            {uploadingAvatar ? 'Uploading...' : 'Change photo'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.title}>Your Profile</Text>

      {/* Email (read-only) */}
      <Text style={styles.label}>Email</Text>
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyText}>{email ?? 'Unknown'}</Text>
      </View>

      {/* Username */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter a username..."
        placeholderTextColor="#9ca3af"
        value={username}
        onChangeText={setUsername}
      />

      <Button
        title={saving ? 'Saving...' : 'Save changes'}
        onPress={handleSaveProfile}
      />

      {message && <Text style={styles.message}>{message}</Text>}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 42,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 999,
  },
  changePhotoButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  changePhotoText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: '#111827',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  readOnlyBox: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#e5e7eb',
    marginBottom: 16,
  },
  readOnlyText: {
    color: '#111827',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    color: '#111827',
    marginBottom: 16,
  },
  message: {
    marginTop: 10,
    textAlign: 'center',
    color: '#16a34a',
  },
});
