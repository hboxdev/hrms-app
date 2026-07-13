import { BlurView } from 'expo-blur';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Badge, Card, ErrorView, LoadingView, SectionTitle, StatCard } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiGet, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { DashboardData, PerformanceData } from '@/lib/types';
import { useFocusEffect } from 'expo-router';

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function MonthSwitcher({ month, onChange }: { month: Date; onChange: (d: Date) => void }) {
  const isCurrentMonth = monthParam(month) === monthParam(new Date());
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return (
    <BlurView
      intensity={60}
      tint={isDark ? 'dark' : 'light'}
      experimentalBlurMethod="dimezisBlurView"
      style={[
        styles.monthSwitcher,
        { backgroundColor: isDark ? 'rgba(40,42,48,0.55)' : 'rgba(255,255,255,0.55)' },
      ]}>
      <Pressable hitSlop={12} onPress={() => onChange(addMonths(month, -1))} style={styles.monthArrow}>
        <ThemedText style={styles.monthArrowText}>‹</ThemedText>
      </Pressable>
      <ThemedText type="small" style={styles.monthLabel}>{monthLabel(month)}</ThemedText>
      <Pressable
        hitSlop={12}
        disabled={isCurrentMonth}
        onPress={() => onChange(addMonths(month, 1))}
        style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}>
        <ThemedText style={styles.monthArrowText}>›</ThemedText>
      </Pressable>
    </BlurView>
  );
}

export default function HomeScreen() {
  const { user, isAdmin } = useAuth();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const from = monthParam(month);
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
  }, [isAdmin, month]);

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
      <TopBar />
      <View style={styles.fill}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <ThemedText type="title" style={styles.greeting}>
            Hello, {user?.name.split(' ')[0]}
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </ThemedText>

          <MonthSwitcher month={month} onChange={setMonth} />

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
      </View>
    </ThemedView>
  );
}

function AdminDashboard({ data }: { data: DashboardData }) {
  const { totals, teams, recent_payments } = data;
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);

  return (
    <>
      <SectionTitle>Overview</SectionTitle>
      <View style={styles.statsGrid}>
        <StatCard label="Revenue" value={money(totals.revenue)} sub="Net after fees" />
        <StatCard label="Tax" value={money(totals.tax)} sub={`${totals.merchant_fee_percent}% merchant fee`} />
        <StatCard label="Expense" value={money(totals.expense)} sub="Total costs" />
        <StatCard label="Profit" value={money(totals.profit)} sub={totals.roi !== null ? `${totals.roi}% ROI` : '—'} />
        <StatCard label="Teams" value={String(teams.length)} sub="Active this month" />
      </View>

      <SectionTitle>Teams Performance</SectionTitle>
      {teams.map((t) => {
        const expanded = expandedTeamId === t.id;
        return (
          <AnimatedPressable key={t.id} onPress={() => setExpandedTeamId(expanded ? null : t.id)}>
            <Card>
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

              {expanded && (
                <View style={styles.teamBreakdown}>
                  <Metric label="Tax" value={money(t.tax)} style={styles.breakdownMetric} />
                  <Metric label="Salary" value={money(t.breakdown.salary)} style={styles.breakdownMetric} />
                  <Metric label="Sitting" value={money(t.breakdown.sitting)} style={styles.breakdownMetric} />
                  <Metric label="Ads" value={money(t.breakdown.ads)} style={styles.breakdownMetric} />
                  <Metric label="Subs" value={money(t.breakdown.subs)} style={styles.breakdownMetric} />
                </View>
              )}
            </Card>
          </AnimatedPressable>
        );
      })}

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
                <View style={{ alignItems: 'flex-end' }}>
                  <ThemedText style={{ color: '#22C55E' }}>{money(Number(p.total_amount))}</ThemedText>
                  {p.tax_amount > 0 && (
                    <ThemedText type="small" themeColor="textSecondary">-{money(p.tax_amount)} tax</ThemedText>
                  )}
                </View>
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

function Metric({ label, value, style }: { label: string; value: string; style?: object }) {
  return (
    <View style={[styles.metric, style]}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: BottomTabInset },
  greeting: { fontSize: 28 },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    overflow: 'hidden',
  },
  monthLabel: { minWidth: 150, textAlign: 'center' },
  monthArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: { opacity: 0.3 },
  monthArrowText: { fontSize: 22, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  teamMetrics: { flexDirection: 'row', marginTop: Spacing.two, gap: Spacing.three },
  teamBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120,120,128,0.2)',
  },
  metric: { flex: 1 },
  breakdownMetric: { flexBasis: '40%', flexGrow: 1 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
