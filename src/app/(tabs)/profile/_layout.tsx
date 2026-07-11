import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="payslips/index" options={{ title: 'Payslips' }} />
      <Stack.Screen name="payslips/[id]" options={{ title: 'Payslip' }} />
      <Stack.Screen name="shift" options={{ title: 'Shift Timing' }} />
      <Stack.Screen name="resignation" options={{ title: 'Resignation' }} />
    </Stack>
  );
}
