import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Notification } from '@/lib/notifications-context';
import { useNotifications } from '@/lib/notifications-context';

function timeAgo(ms: number) {
  const diff = Math.max(0, Date.now() - ms);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function iconFor(n: Notification): { name: keyof typeof Ionicons.glyphMap; color: string } {
  if (n.source === 'payment') return { name: 'cash-outline', color: '#22C55E' };
  switch (n.alertType) {
    case 'warning':
      return { name: 'warning-outline', color: '#F59E0B' };
    case 'danger':
      return { name: 'alert-circle-outline', color: '#EF4444' };
    case 'success':
      return { name: 'checkmark-circle-outline', color: '#22C55E' };
    default:
      return { name: 'information-circle-outline', color: '#4F8EF7' };
  }
}

export function NotificationsPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { notifications, markAllRead } = useNotifications();

  useEffect(() => {
    if (visible) markAllRead();
  }, [visible, markAllRead]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView style={styles.sheetWrap} edges={['bottom']}>
        <ThemedView type="backgroundElement" style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <ThemedText type="subtitle" style={{ fontSize: 20 }}>Notifications</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 20 }}>✕</ThemedText>
            </Pressable>
          </View>

          {notifications.length === 0 ? (
            <EmptyState title="No notifications" sub="You're all caught up" />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.map((n, i) => {
                const icon = iconFor(n);
                return (
                  <View key={n.id} style={[styles.row, i === notifications.length - 1 && { borderBottomWidth: 0 }]}>
                    <Ionicons name={icon.name} size={20} color={icon.color} style={styles.icon} />
                    <View style={{ flex: 1 }}>
                      <ThemedText type={n.read ? 'default' : 'smallBold'}>{n.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{n.body}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                        {timeAgo(n.createdAt)}
                      </ThemedText>
                    </View>
                    {!n.read && <View style={styles.dot} />}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrap: { marginTop: 'auto' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    maxHeight: '75%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,120,128,0.3)',
    alignSelf: 'center',
    marginVertical: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
  icon: { marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F8EF7',
    marginTop: 6,
  },
});
