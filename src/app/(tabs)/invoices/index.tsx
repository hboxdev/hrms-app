import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorView, LoadingView } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { Invoice, Pagination } from '@/lib/types';

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
];

const badgeColor: Record<string, 'green' | 'orange' | 'red' | 'grey'> = {
  paid: 'green',
  pending: 'orange',
  overdue: 'red',
};

export default function InvoicesScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number, append: boolean) => {
    try {
      const res = await apiGet<{ ok: true; invoices: Invoice[]; pagination: Pagination }>('invoices', {
        page: p,
        status,
        search,
      });
      setInvoices((prev) => (append ? [...prev, ...res.invoices] : res.invoices));
      setPagination(res.pagination);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }, [status, search]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    load(1, false).finally(() => setLoading(false));
  }, [load]);

  async function loadMore() {
    if (loadingMore || !pagination || page >= pagination.pages) return;
    setLoadingMore(true);
    const next = page + 1;
    await load(next, true);
    setPage(next);
    setLoadingMore(false);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['top']}>
        <View style={styles.searchWrap}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search invoices…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
        </View>
        <View style={styles.pills}>
          {STATUSES.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setStatus(s.key)}
              style={[
                styles.pill,
                { backgroundColor: status === s.key ? '#4F8EF7' : theme.backgroundElement },
              ]}>
              <ThemedText type="small" style={status === s.key ? { color: '#fff' } : undefined}>
                {s.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView message={error} />
        ) : invoices.length === 0 ? (
          <EmptyState title="No invoices found" sub="Try changing the filter or search" />
        ) : (
          <FlatList
            data={invoices}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            onEndReachedThreshold={0.4}
            onEndReached={loadMore}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: Spacing.three }} /> : null}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/invoices/${item.id}`)} style={[styles.row, { borderBottomColor: theme.backgroundSelected }]}>
                <View style={{ flex: 1 }}>
                  <ThemedText>{item.customer_name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.invoice_no} · {item.owner_name}
                  </ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <ThemedText type="smallBold">${Number(item.total_amount).toLocaleString()}</ThemedText>
                  <Badge text={item.status} color={badgeColor[item.status] ?? 'grey'} />
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  searchWrap: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  search: { borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 10, fontSize: 15 },
  pills: { flexDirection: 'row', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  pill: { paddingHorizontal: Spacing.three, paddingVertical: 6, borderRadius: 20 },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
