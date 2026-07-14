import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Card, EmptyState, SectionTitle } from '@/components/common';
import { NotificationsPanel } from '@/components/notifications-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/lib/notifications-context';

export default function MoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState('');

  const modules = useMemo(
    () => [
      {
        key: 'notifications',
        title: 'Notifications',
        subtitle: unreadCount > 0 ? `${unreadCount} unread` : 'All caught up',
        icon: 'notifications-outline' as const,
        onPress: () => setPanelOpen(true),
      },
      {
        key: 'food',
        title: 'Order Food',
        subtitle: 'Rooftop menu & orders',
        icon: 'restaurant-outline' as const,
        onPress: () => router.push('/more/food'),
      },
      {
        key: 'payslips',
        title: 'Salary Slip',
        subtitle: 'View your monthly payslips',
        icon: 'document-text-outline' as const,
        onPress: () => router.push('/profile/payslips'),
      },
      {
        key: 'attendance',
        title: 'Attendance',
        subtitle: 'Check-in history & summary',
        icon: 'calendar-outline' as const,
        onPress: () => router.push('/more/attendance'),
      },
    ],
    [unreadCount, router]
  );

  const filteredModules = modules.filter((m) => m.title.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <ThemedView style={styles.fill}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>More</ThemedText>

        <View style={[styles.searchRow, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        <SectionTitle>Explore</SectionTitle>

        {filteredModules.length === 0 ? (
          <EmptyState title="Nothing found" sub="Try a different search term" />
        ) : (
          filteredModules.map((m) => (
            <AnimatedPressable key={m.key} onPress={m.onPress}>
              <Card style={styles.moduleCard}>
                <View style={[styles.moduleIcon, { backgroundColor: theme.backgroundSelected }]}>
                  <Ionicons name={m.icon} size={20} color={theme.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="default">{m.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{m.subtitle}</ThemedText>
                </View>
                <ThemedText themeColor="textSecondary">›</ThemedText>
              </Card>
            </AnimatedPressable>
          ))
        )}

        <ThemedText type="small" themeColor="textSecondary" style={styles.comingSoon}>
          More coming soon
        </ThemedText>
      </ScrollView>

      <NotificationsPanel visible={panelOpen} onClose={() => setPanelOpen(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: BottomTabInset },
  title: { fontSize: 28, marginBottom: Spacing.two },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15 },
  moduleCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoon: { textAlign: 'center', marginTop: Spacing.four },
});
