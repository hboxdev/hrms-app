import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, title: 'More' }} />
      <Stack.Screen name="food" options={{ title: 'Order Food' }} />
      <Stack.Screen name="orders" options={{ title: 'My Orders' }} />
      <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
    </Stack>
  );
}
