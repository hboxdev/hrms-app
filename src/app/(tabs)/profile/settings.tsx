import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionTitle } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandText, Spacing } from '@/constants/theme';
import { getThemePreference, setThemePreference, type ThemePreference } from '@/lib/theme-preference';

const OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const [selected, setSelected] = useState<ThemePreference>('system');

  useEffect(() => {
    getThemePreference().then(setSelected);
  }, []);

  async function choose(pref: ThemePreference) {
    setSelected(pref);
    await setThemePreference(pref);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.content}>
          <SectionTitle>Appearance</SectionTitle>
          <Card style={styles.noPad}>
            {OPTIONS.map((opt, i) => (
              <Pressable
                key={opt.key}
                onPress={() => choose(opt.key)}
                style={[styles.row, i === OPTIONS.length - 1 && { borderBottomWidth: 0 }]}>
                <ThemedText>{opt.label}</ThemedText>
                {selected === opt.key ? (
                  <ThemedText style={{ color: BrandText, fontWeight: '700' }}>✓</ThemedText>
                ) : null}
              </Pressable>
            ))}
          </Card>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three },
  noPad: { padding: 0, paddingHorizontal: Spacing.three },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
