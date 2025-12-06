export const MOODS = ['😊', '😢', '😡', '😴', '😌'] as const;

export type MoodType = typeof MOODS[number];

export const MOOD_LABELS: Record<MoodType, string> = {
  '😊': 'Happy',
  '😢': 'Sad',
  '😡': 'Angry',
  '😴': 'Tired',
  '😌': 'Calm',
} as const;

export const DEFAULT_MOOD: MoodType = '😊';
