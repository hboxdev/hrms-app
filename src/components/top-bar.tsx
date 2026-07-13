import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { NotificationsPanel } from '@/components/notifications-panel';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notifications-context';

export function TopBar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const theme = useTheme();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
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
      <BlurView
        intensity={60}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={[styles.blur, { backgroundColor: isDark ? 'rgba(20,20,22,0.6)' : 'rgba(255,255,255,0.6)', borderBottomColor: theme.backgroundSelected }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.bar}>
            <Image source={require('@/assets/images/icon.png')} style={styles.logo} />

            <View style={styles.actions}>
              <AnimatedPressable onPress={() => setPanelOpen(true)} hitSlop={10} style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
                <Ionicons name="notifications-outline" size={17} color={theme.text} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</ThemedText>
                  </View>
                )}
              </AnimatedPressable>

              <AnimatedPressable onPress={confirmLogout} hitSlop={10} style={[styles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name="power-outline" size={17} color="#EF4444" />
              </AnimatedPressable>
            </View>
          </View>
        </SafeAreaView>
      </BlurView>

      <NotificationsPanel visible={panelOpen} onClose={() => setPanelOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 10 },
  blur: { borderBottomWidth: StyleSheet.hairlineWidth },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  logo: { width: 26, height: 26, borderRadius: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
