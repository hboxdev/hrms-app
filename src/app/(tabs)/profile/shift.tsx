import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, EmptyState, ErrorView, LoadingView } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { ShiftInfo } from '@/lib/types';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>{label}</ThemedText>
      <ThemedText style={{ flex: 1, textAlign: 'right' }}>{value}</ThemedText>
    </View>
  );
}

export default function ShiftScreen() {
  const [shift, setShift] = useState<ShiftInfo>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ ok: true; shift: ShiftInfo }>('shift')
      .then((res) => setShift(res.shift))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} />;
  if (!shift) return <EmptyState title="No shift assigned" sub="Contact HR if you believe this is a mistake" />;

  return (
    <ThemedView style={styles.fill}>
      <View style={styles.content}>
        <Card>
          <ThemedText type="subtitle" style={{ fontSize: 19 }}>{shift.name}</ThemedText>
          <ThemedText type="title" style={{ marginTop: Spacing.two, color: '#4F8EF7', fontSize: 32 }}>
            {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)}
          </ThemedText>
        </Card>
        <Card style={styles.noPad}>
          <Row label="Break" value={`${shift.break_minutes} min`} />
          <Row label="Grace Period" value={`${shift.grace_period_minutes} min`} />
        </Card>
      </View>
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
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
