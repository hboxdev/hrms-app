import { BlurView } from 'expo-blur';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return (
    <BlurView
      intensity={60}
      tint={isDark ? 'dark' : 'light'}
      experimentalBlurMethod="dimezisBlurView"
      style={[
        styles.card,
        { backgroundColor: isDark ? 'rgba(40,42,48,0.55)' : 'rgba(255,255,255,0.55)' },
        isDark ? styles.cardBorderDark : styles.cardBorderLight,
        style,
      ]}>
      {children}
    </BlurView>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
      {children}
    </ThemedText>
  );
}

export function StatCard({ label, value, sub, full }: { label: string; value: string; sub?: string; full?: boolean }) {
  return (
    <Card style={[styles.statCard, full && { flexBasis: '100%' }]}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="subtitle" style={styles.statValue}>{value}</ThemedText>
      {sub ? <ThemedText type="small" themeColor="textSecondary">{sub}</ThemedText> : null}
    </Card>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={[styles.row, { borderBottomColor: theme.backgroundSelected }]}>
      <View style={{ flex: 1 }}>
        <ThemedText type="default">{title}</ThemedText>
        {subtitle ? <ThemedText type="small" themeColor="textSecondary">{subtitle}</ThemedText> : null}
      </View>
      {right}
    </Wrapper>
  );
}

export function Badge({ text, color }: { text: string; color: 'green' | 'orange' | 'red' | 'grey' }) {
  const map = {
    green: { bg: 'rgba(34,197,94,0.15)', fg: '#22C55E' },
    orange: { bg: 'rgba(245,158,11,0.15)', fg: '#F59E0B' },
    red: { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' },
    grey: { bg: 'rgba(120,120,128,0.15)', fg: '#78787D' },
  }[color];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <ThemedText type="small" style={{ color: map.fg }}>{text}</ThemedText>
    </View>
  );
}

export function LoadingView() {
  return (
    <View style={styles.centerFill}>
      <ActivityIndicator />
    </View>
  );
}

export function ErrorView({ message }: { message: string }) {
  return (
    <View style={styles.centerFill}>
      <ThemedText themeColor="textSecondary">{message}</ThemedText>
    </View>
  );
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.centerFill}>
      <ThemedText type="default">{title}</ThemedText>
      {sub ? <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>{sub}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardBorderLight: { borderColor: 'rgba(255,255,255,0.5)' },
  cardBorderDark: { borderColor: 'rgba(255,255,255,0.12)' },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  statValue: {
    marginTop: 4,
    fontSize: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
});
