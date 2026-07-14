import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Card, EmptyState, ErrorView, LoadingView } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { RooftopOrder } from '@/lib/types';

const STATUS_COLOR: Record<RooftopOrder['status'], 'green' | 'orange' | 'red' | 'grey'> = {
  pending: 'orange',
  preparing: 'orange',
  done: 'green',
  cancelled: 'red',
};

const STATUS_LABEL: Record<RooftopOrder['status'], string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  done: 'Delivered',
  cancelled: 'Cancelled',
};

function pkr(n: number) {
  return 'Rs ' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function MonthSwitcher({ month, onChange }: { month: Date; onChange: (d: Date) => void }) {
  const isCurrentMonth = monthKey(month) === monthKey(new Date());
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

export default function MyOrdersScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [orders, setOrders] = useState<RooftopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ ok: true; orders: RooftopOrder[] }>('rooftopMyOrders')
      .then((res) => setOrders(res.orders))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  const monthOrders = useMemo(
    () => orders.filter((o) => monthKey(new Date(o.created_at)) === monthKey(month)),
    [orders, month]
  );

  const { paidTotal, unpaidTotal } = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    for (const o of monthOrders) {
      if (o.payment_status === 'paid') paid += Number(o.total_amount);
      else unpaid += Number(o.total_amount);
    }
    return { paidTotal: paid, unpaidTotal: unpaid };
  }, [monthOrders]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} />;

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing.four }]}>
        <MonthSwitcher month={month} onChange={setMonth} />

        <Card style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <ThemedText type="small" themeColor="textSecondary">Paid</ThemedText>
            <ThemedText type="smallBold" style={{ color: '#22C55E' }}>{pkr(paidTotal)}</ThemedText>
          </View>
          <View style={[styles.summaryCol, styles.summaryDivider]}>
            <ThemedText type="small" themeColor="textSecondary">Unpaid</ThemedText>
            <ThemedText type="smallBold" style={{ color: '#EF4444' }}>{pkr(unpaidTotal)}</ThemedText>
          </View>
        </Card>

        {monthOrders.length === 0 ? (
          <EmptyState title="No orders this month" sub="Your rooftop food orders will appear here" />
        ) : (
          monthOrders.map((order) => (
            <Card key={order.id}>
              <View style={styles.headerRow}>
                <ThemedText type="default">Order #{order.id}</ThemedText>
                <Badge text={STATUS_LABEL[order.status]} color={STATUS_COLOR[order.status]} />
              </View>
              <ThemedText type="small" themeColor="textSecondary">{fmtDate(order.created_at)}</ThemedText>

              <View style={styles.itemsWrap}>
                {order.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <ThemedText type="small" themeColor="textSecondary">{item.quantity}× {item.item_name}</ThemedText>
                    <ThemedText type="small">{pkr(Number(item.subtotal))}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.footerRow}>
                <ThemedText type="smallBold">Total: {pkr(Number(order.total_amount))}</ThemedText>
                <Badge text={order.payment_status === 'paid' ? 'Paid' : 'Unpaid'} color={order.payment_status === 'paid' ? 'green' : 'grey'} />
              </View>

              {order.status === 'cancelled' && order.cancel_reason ? (
                <ThemedText type="small" style={{ color: '#EF4444', marginTop: Spacing.two }}>
                  Cancelled: {order.cancel_reason}
                </ThemedText>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
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
  summaryCard: { flexDirection: 'row' },
  summaryCol: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: 'rgba(120,120,128,0.2)' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsWrap: { marginTop: Spacing.two, gap: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(120,120,128,0.2)',
  },
});
