import { Redirect } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

import { LoadingView } from '@/components/common';
import { useAuth } from '@/lib/auth-context';

export default function TabLayout() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <LoadingView />;
  if (!user) return <Redirect href="/login" />;

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="invoices">
        <Label>Invoices</Label>
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="teams" hidden={!isAdmin}>
        <Label>Teams</Label>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
