import { useRouter } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, ListRow, SectionTitle } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

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
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  function confirmLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>{initials(user.name)}</ThemedText>
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

          <View style={styles.logoutWrap}>
            <ThemedText onPress={confirmLogout} style={styles.logout}>Sign Out</ThemedText>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, padding: Spacing.three },
  header: { alignItems: 'center', paddingVertical: Spacing.four },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#4F8EF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { marginTop: 4 },
  noPad: { padding: 0, paddingHorizontal: Spacing.three },
  logoutWrap: { marginTop: Spacing.three },
  logout: { color: '#EF4444', textAlign: 'center', fontWeight: '600', paddingVertical: Spacing.three },
});
