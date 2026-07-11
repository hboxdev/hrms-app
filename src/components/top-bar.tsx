import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { NotificationsPanel } from '@/components/notifications-panel';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notifications-context';

export function TopBar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const theme = useTheme();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);

  if (!user) return null;

  function confirmLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <SafeAreaView edges={['top']}>
        <View style={[styles.bar, { borderBottomColor: theme.backgroundSelected }]}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />

          <View style={styles.actions}>
            <Pressable onPress={() => setPanelOpen(true)} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color={theme.text} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
                </View>
              )}
            </Pressable>

            <Pressable onPress={confirmLogout} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            </Pressable>

            <View style={styles.iconBtn}>
              <Avatar name={user.name} imagePath={user.profile_image} size={30} />
            </View>

            <Pressable onPress={() => router.push('/more')} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <NotificationsPanel visible={panelOpen} onClose={() => setPanelOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 10 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logo: { width: 32, height: 32, borderRadius: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
