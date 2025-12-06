import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Entry } from '../types/Entry';
import { MOOD_LABELS } from '../constants/moods';

interface EntryItemProps {
  entry: Entry;
  onPress: (entry: Entry) => void;
}

export function EntryItem({ entry, onPress }: EntryItemProps) {
  const date = new Date(entry.created_at);
  const formatted = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const moodEmoji = entry.mood || '–';
  const moodDescription =
    entry.title ||
    MOOD_LABELS[moodEmoji as keyof typeof MOOD_LABELS] ||
    '(No description)';

  return (
    <Pressable onPress={() => onPress(entry)}>
      <View style={{
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
      }}>
        <Text style={{
          fontSize: 13,
          color: '#111827',
          width: 70,
        }}>
          {formatted}
        </Text>
        <Text style={{
          fontSize: 13,
          color: '#111827',
          width: 50,
          textAlign: 'center',
        }}>
          {moodEmoji}
        </Text>
        <Text style={{
          fontSize: 13,
          color: '#111827',
          flex: 1,
          paddingLeft: 8,
        }} numberOfLines={1}>
          {moodDescription}
        </Text>
      </View>
    </Pressable>
  );
}
