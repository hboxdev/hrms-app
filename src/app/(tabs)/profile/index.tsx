import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Card, ListRow, SectionTitle } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

function roleLabel(role: string) {
  const map: Record<string, string> = {
    admin: 'Administrator',
    human_resource: 'HR Manager',
    manager: 'Manager',
    sales: 'Sales',
    operation_manager: 'Operations Manager',
    finance: 'Finance',
    user: 'Employee',
  };
  return map[role] ?? role;
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <ThemedView style={styles.fill}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Avatar name={user.name} imagePath={user.profile_image} size={80} />
          </View>
          <ThemedText type="subtitle" style={styles.name}>{user.name}</ThemedText>
          <ThemedText themeColor="textSecondary">
            {roleLabel(user.role)}
            {user.designation_name ? ` · ${user.designation_name}` : ''}
          </ThemedText>
        </View>

        <SectionTitle>Account</SectionTitle>
        <Card style={styles.noPad}>
          <ListRow title="Email" subtitle={user.email} />
          {user.employee_code ? <ListRow title="Employee Code" subtitle={user.employee_code} /> : null}
          {user.department_name ? <ListRow title="Department" subtitle={user.department_name} /> : null}
        </Card>

        <SectionTitle>HR Self-Service</SectionTitle>
        <Card style={styles.noPad}>
          <ListRow title="My Payslips" onPress={() => router.push('/profile/payslips')} right={<ThemedText themeColor="textSecondary">›</ThemedText>} />
          <ListRow title="Shift Timing" onPress={() => router.push('/profile/shift')} right={<ThemedText themeColor="textSecondary">›</ThemedText>} />
          <ListRow title="Resignation" onPress={() => router.push('/profile/resignation')} right={<ThemedText themeColor="textSecondary">›</ThemedText>} />
        </Card>

        <SectionTitle>Preferences</SectionTitle>
        <Card style={styles.noPad}>
          <ListRow title="Settings" onPress={() => router.push('/profile/settings')} right={<ThemedText themeColor="textSecondary">›</ThemedText>} />
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  header: { alignItems: 'center', paddingVertical: Spacing.four },
  avatarWrap: { marginBottom: Spacing.two },
  name: { marginTop: 4 },
  noPad: { padding: 0, paddingHorizontal: Spacing.three },
});
