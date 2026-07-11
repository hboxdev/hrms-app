import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, SectionTitle } from '@/components/common';
import { NotificationsPanel } from '@/components/notifications-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useNotifications } from '@/lib/notifications-context';

export default function MoreScreen() {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle>Modules</SectionTitle>

        <Pressable onPress={() => setPanelOpen(true)}>
          <Card style={styles.moduleCard}>
            <View style={[styles.moduleIcon, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name="notifications-outline" size={20} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="default">Notifications</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </ThemedText>
            </View>
            <ThemedText themeColor="textSecondary">›</ThemedText>
          </Card>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.comingSoon}>
          More modules coming soon
        </ThemedText>
      </ScrollView>

      <NotificationsPanel visible={panelOpen} onClose={() => setPanelOpen(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
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
