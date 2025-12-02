import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Pressable } from 'react-native';
import { supabase } from '../supabaseClient';
import { useRouter } from 'expo-router';

export default function SignUp() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessageType('error');
      setMessage(error.message);
    } else {
      setMessageType('success');
      setMessage('Account created! You can now sign in.');
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>LaypPad</Text>
        <Text style={styles.subtitle}> Your Daily Dose of life✨</Text>
        <Text style={styles.title1}>Create Account</Text>

      <TextInput
  style={styles.input}
  placeholder="Email"
  placeholderTextColor="#9ca3af"
  value={email}
  autoCapitalize="none"
  onChangeText={setEmail}
/>

<TextInput
  style={styles.input}
  placeholder="Password"
  placeholderTextColor="#9ca3af"
  secureTextEntry
  value={password}
  onChangeText={setPassword}
/>


      <Button title={loading ? "Please wait..." : "Sign Up"} onPress={handleSignUp} />

      <Pressable onPress={() => router.push('/sign_in')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
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
    paddingHorizontal: 24,
    backgroundColor: '#f3f4f6', // light gray
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#111827', // dark text
  },
  title1: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    color: '#111827', // dark text
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
    color: '#6b7280', // muted gray
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    color: '#111827', // input text color
  },
  link: {
    textAlign: 'center',
    marginTop: 16,
    color: '#2563eb', // nice blue
    fontWeight: '500',
  },
  message: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  error: {
    color: 'red',
  },
  success: {
    color: 'green',
  },
});

