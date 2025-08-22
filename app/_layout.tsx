// app/_layout.tsx - Root layout
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}/>
  );
}