import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign_in" />
      <Stack.Screen name="sign_up" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
