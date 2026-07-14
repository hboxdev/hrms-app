import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorView, ListRow, LoadingView } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { Payslip } from '@/lib/types';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayslipsScreen() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ ok: true; payslips: Payslip[] }>('payslips')
      .then((res) => setPayslips(res.payslips))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={['bottom']}>
        {loading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView message={error} />
        ) : payslips.length === 0 ? (
          <EmptyState title="No payslips yet" sub="Your salary records will appear here once payroll runs" />
        ) : (
          <FlatList
            data={payslips}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ListRow
                title={`${MONTHS[item.salary_month]} ${item.salary_year}`}
                subtitle={`Rs ${Number(item.final_salary).toLocaleString()}`}
                onPress={() => router.push(`/profile/payslips/${item.id}`)}
                right={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Badge text={item.status} color={item.status === 'paid' ? 'green' : 'orange'} />
                    <ThemedText themeColor="textSecondary">›</ThemedText>
                  </View>
                }
              />
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { padding: Spacing.three, paddingBottom: BottomTabInset },
});
