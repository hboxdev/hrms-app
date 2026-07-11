import { Stack } from 'expo-router';

export default function TeamsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Team' }} />
    </Stack>
  );
}
