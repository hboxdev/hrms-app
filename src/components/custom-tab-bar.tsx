import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, UIManager, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home',
  invoices: 'document-text',
  teams: 'people',
  profile: 'person-circle',
  more: 'ellipsis-horizontal-circle',
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [state.index]);

  const visibleRoutes = state.routes.filter(
    (route) => (descriptors[route.key].options as { href?: string | null }).href !== null
  );

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || 12 }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const originalIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === originalIndex;
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <AnimatedPressable key={route.key} onPress={onPress} style={[styles.pill, isFocused && styles.pillActive]}>
              <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={20} color={isFocused ? '#0A0A0A' : '#FFFFFF'} />
              {isFocused && (
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
              )}
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    backgroundColor: '#0A0A0A',
    borderRadius: 32,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  pill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 16,
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  label: { color: '#0A0A0A', fontSize: 14, fontWeight: '600' },
});
