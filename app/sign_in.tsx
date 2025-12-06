import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { supabase } from '../supabaseClient';
import { useRouter } from 'expo-router';

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessageType('error');
      setMessage(error.message);
    } else {
      setMessageType('success');
      setMessage(`Welcome ${data.user?.email}`);
      router.replace('/(tabs)');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/Logo1.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>LaypPad</Text>
      <Text style={styles.subtitle}>Your Daily Dose of Life ✨</Text>

      {/* Email Field */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      {/* Password Field with Eye Icon */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={22}
            color="#6b7280"
          />
        </Pressable>
      </View>

      <Button title={loading ? 'Please wait...' : 'Sign In'} onPress={handleSignIn} />

      <Pressable onPress={() => router.push('/sign_up')}>
        <Text style={styles.link}>{"Don't have an account? Create one"}</Text>
      </Pressable>

      {message && (
        <Text style={[styles.message, messageType === 'error' ? styles.error : styles.success]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',    
    paddingHorizontal: 24,
    backgroundColor: '#f3f4f6',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 16,
    borderRadius: 400,         
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#111827',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    color: '#6b7280',
  },
  input: {
    width: '100%',         
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 3,
  },
  link: {
    textAlign: 'center',
    marginTop: 16,
    color: '#2563eb',
    fontWeight: '500',
  },
  message: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  error: { color: 'red' },
  success: { color: 'green' },
});
