import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Card, ErrorView, LoadingView, SectionTitle, StatCard } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { apiGet, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { DashboardData, PerformanceData } from '@/lib/types';
import { useFocusEffect } from 'expo-router';

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { user, isAdmin } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const from = currentMonth();
    try {
      if (isAdmin) {
        const res = await apiGet<{ ok: true } & DashboardData>('dashboard', { month_from: from, month_to: from });
        setDashboard(res);
      } else {
        const res = await apiGet<{ ok: true } & PerformanceData>('performance', { month_from: from, month_to: from });
        setPerformance(res);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <ThemedText type="title" style={styles.greeting}>
            Hello, {user?.name.split(' ')[0]}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </ThemedText>

          {loading ? (
            <LoadingView />
          ) : error ? (
            <ErrorView message={error} />
          ) : isAdmin && dashboard ? (
            <AdminDashboard data={dashboard} />
          ) : performance ? (
            <SalesDashboard data={performance} />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function AdminDashboard({ data }: { data: DashboardData }) {
  const { totals, teams, recent_payments } = data;
  return (
    <>
      <SectionTitle>Overview</SectionTitle>
      <View style={styles.statsGrid}>
        <StatCard label="Revenue" value={money(totals.revenue)} sub="Net after fees" />
        <StatCard label="Expense" value={money(totals.expense)} sub="Total costs" />
        <StatCard label="Profit" value={money(totals.profit)} sub={totals.roi !== null ? `${totals.roi}% ROI` : '—'} />
        <StatCard label="Teams" value={String(teams.length)} sub="Active this month" />
      </View>

      <SectionTitle>Teams Performance</SectionTitle>
      {teams.map((t) => (
        <Card key={t.id}>
          <View style={styles.teamHeader}>
            <View>
              <ThemedText type="default">{t.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{t.category}</ThemedText>
            </View>
            <Badge text={t.profit >= 0 ? 'Profit' : 'Loss'} color={t.profit >= 0 ? 'green' : 'red'} />
          </View>
          <View style={styles.teamMetrics}>
            <Metric label="Revenue" value={money(t.revenue)} />
            <Metric label="Expense" value={money(t.expense)} />
            <Metric label="ROI" value={t.roi !== null ? `${t.roi}%` : '—'} />
          </View>
        </Card>
      ))}

      {recent_payments.length > 0 && (
        <>
          <SectionTitle>Recent Payments</SectionTitle>
          <Card>
            {recent_payments.slice(0, 6).map((p, i) => (
              <View key={p.id} style={[styles.paymentRow, i === recent_payments.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText>{p.customer_name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{p.owner_name}</ThemedText>
                </View>
                <ThemedText style={{ color: '#22C55E' }}>{money(Number(p.total_amount))}</ThemedText>
              </View>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function SalesDashboard({ data }: { data: PerformanceData }) {
  const pct = data.achievement_pct;
  return (
    <>
      <SectionTitle>My Performance</SectionTitle>
      <View style={styles.statsGrid}>
        <StatCard full label="My Revenue" value={money(data.revenue)} sub={`${data.invoice_count} paid invoice${data.invoice_count !== 1 ? 's' : ''}`} />
        <StatCard label="Target" value={data.target > 0 ? money(data.target) : '—'} sub="Monthly goal" />
        <StatCard label="Achievement" value={pct !== null ? `${pct}%` : '—'} sub="Of target" />
      </View>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  greeting: { fontSize: 28 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  teamMetrics: { flexDirection: 'row', marginTop: Spacing.two, gap: Spacing.three },
  metric: { flex: 1 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
