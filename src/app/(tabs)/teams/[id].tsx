import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Card, ErrorView, LoadingView, SectionTitle } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { TeamDetail } from '@/lib/types';

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function pkr(n: number) {
  return 'Rs ' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ ok: true; team: TeamDetail }>('team', { id })
      .then((res) => setTeam(res.team))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingView />;
  if (error || !team) return <ErrorView message={error ?? 'Not found'} />;

  const visibleMembers = team.members.filter((m) => m.role !== 'admin');

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="subtitle" style={{ fontSize: 20 }}>{team.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{team.category}</ThemedText>
            </View>
            <Badge text={team.profit >= 0 ? 'Profit' : 'Loss'} color={team.profit >= 0 ? 'green' : 'red'} />
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
            {new Date(team.period.from + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </ThemedText>
        </Card>

        <SectionTitle>Financials</SectionTitle>
        <Card>
          <View style={styles.metricsGrid}>
            <Metric label="Revenue" value={money(team.revenue)} />
            <Metric label="Expense" value={money(team.expense)} />
            <Metric label="Profit" value={money(team.profit)} />
            <Metric label="ROI" value={team.roi !== null ? `${team.roi}%` : '—'} />
            <Metric label="Tax" value={money(team.tax)} />
          </View>
        </Card>

        <SectionTitle>Expense Breakdown</SectionTitle>
        <Card>
          <View style={styles.metricsGrid}>
            <Metric label="Salary" value={money(team.breakdown.salary)} />
            <Metric label="Sitting" value={money(team.breakdown.sitting)} />
            <Metric label="Ads" value={money(team.breakdown.ads)} />
            <Metric label="Subs" value={money(team.breakdown.subs)} />
          </View>
        </Card>

        <SectionTitle>Members ({visibleMembers.length})</SectionTitle>
        <Card style={styles.noPad}>
          {visibleMembers.map((m, i) => (
            <View key={m.id} style={[styles.memberRow, i === visibleMembers.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <ThemedText>{m.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {m.designation_name || m.role} · {m.department_name || '—'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{m.email}</ThemedText>
                {m.salary_pkr > 0 ? (
                  <ThemedText type="smallBold" style={{ marginTop: 4 }}>{pkr(m.salary_pkr)}</ThemedText>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {m.team_role ? <Badge text={m.team_role} color="grey" /> : null}
                <Badge text={m.status} color={m.status === 'active' ? 'green' : 'red'} />
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: BottomTabInset },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  noPad: { padding: 0, paddingHorizontal: Spacing.three },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  metric: { flexBasis: '40%', flexGrow: 1 },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
