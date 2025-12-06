import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../supabaseClient';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading profile...</Text>
      </View>
    );
  }

  const initial = username.trim().charAt(0).toUpperCase() || '🙂';

  return (
    <View style={styles.container}>
      {/* Avatar + username display */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>
            {username.trim() ? initial : '🙂'}
          </Text>
        </View>

        <Text style={styles.profileUsername}>
          {username.trim() || 'Set your username'}
        </Text>
      </View>

      <Text style={styles.title}>Your Profile</Text>

      {/* Email (read-only) */}
      <Text style={styles.label}>Email</Text>
      <View style={styles.readOnlyBox}>
        <Text style={styles.readOnlyText}>{email ?? 'Unknown'}</Text>
      </View>

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
  profileUsername: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
