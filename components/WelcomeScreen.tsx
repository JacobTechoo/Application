import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <View style={{
      padding: 20,
      borderRadius: 16,
      marginBottom: 20,
    }}>
      <Text style={{
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 6,
      }}>
        Welcome To LaypPad
      </Text>
      <Text style={{
        fontSize: 15,
        color: '#1e293b',
        marginBottom: 12,
      }}>
        Ready to unload your thoughts for today?
      </Text>
      <Pressable
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#2563eb',
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 999,
        }}
        onPress={onStart}
      >
        <Text style={{
          color: '#ffffff',
          fontWeight: '600',
        }}>
          Start your day
        </Text>
      </Pressable>
    </View>
  );
}
