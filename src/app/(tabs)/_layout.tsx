import { Redirect, Tabs } from 'expo-router';

import { LoadingView } from '@/components/common';
import { CustomTabBar } from '@/components/custom-tab-bar';
import { useAuth } from '@/lib/auth-context';

export default function TabLayout() {
  const { user, loading, isAdmin, isManager, isSales } = useAuth();

  if (loading) return <LoadingView />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="invoices" options={{ title: 'Invoices', href: isAdmin || isSales ? undefined : null }} />
      <Tabs.Screen name="teams" options={{ title: 'Teams', href: isAdmin || isManager ? undefined : null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
