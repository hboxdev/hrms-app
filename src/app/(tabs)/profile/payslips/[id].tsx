import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Card, ErrorView, LoadingView, SectionTitle } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { PayslipDetail } from '@/lib/types';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function money(v: string | number) {
  return `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>{label}</ThemedText>
      <ThemedText style={{ flex: 1, textAlign: 'right' }}>{value}</ThemedText>
    </View>
  );
}

export default function PayslipDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [slip, setSlip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ ok: true; payslip: PayslipDetail }>('payslip', { id })
      .then((res) => setSlip(res.payslip))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingView />;
  if (error || !slip) return <ErrorView message={error ?? 'Not found'} />;

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.headerRow}>
            <ThemedText type="subtitle" style={{ fontSize: 19 }}>
              {MONTHS[slip.salary_month]} {slip.salary_year}
            </ThemedText>
            <Badge text={slip.status} color={slip.status === 'paid' ? 'green' : 'orange'} />
          </View>
          <ThemedText type="title" style={{ marginTop: Spacing.two, color: '#4F8EF7' }}>{money(slip.final_salary)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Final Salary{slip.paid_date ? ` · Paid ${slip.paid_date}` : ''}</ThemedText>
        </Card>

        <SectionTitle>Earnings</SectionTitle>
        <Card style={styles.noPad}>
          <Row label="Basic Salary" value={money(slip.basic_salary)} />
          <Row label="Car Allowance" value={money(slip.car_allowance)} />
          <Row label="Fuel Allowance" value={money(slip.fuel_allowance)} />
          <Row label="Attendance Allowance" value={money(slip.attendance_allowance)} />
          <Row label="Bonus" value={money(slip.bonus)} />
          <Row label="Arrears" value={money(slip.arrears_amount)} />
        </Card>

        <SectionTitle>Deductions</SectionTitle>
        <Card style={styles.noPad}>
          <Row label="Fixed Deduction" value={money(slip.deduction)} />
          <Row label="Security Fund" value={money(slip.security_fund)} />
          <Row label="Rooftop/Food Deduction" value={money(slip.rooftop_food_deduction)} />
          <Row label="Late (count)" value={String(slip.late_deduction)} />
          <Row label="Absent (count)" value={String(slip.absent_deduction)} />
          <Row label="Half Day (count)" value={String(slip.half_day_deduction)} />
          <Row label="Penalty (count)" value={String(slip.penalty)} />
          <Row label="Approved Leaves" value={String(slip.approved_leaves)} />
        </Card>
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Late/absent/half-day/penalty are attendance counts factored into Final Salary by payroll — not standalone rupee amounts.
        </ThemedText>

        {slip.notes ? (
          <>
            <SectionTitle>Notes</SectionTitle>
            <Card><ThemedText>{slip.notes}</ThemedText></Card>
          </>
        ) : null}

        {slip.status_history?.length > 0 ? (
          <>
            <SectionTitle>Status History</SectionTitle>
            <Card style={styles.noPad}>
              {slip.status_history.map((h, i) => (
                <View key={i} style={styles.row}>
                  <ThemedText type="small" themeColor="textSecondary">{h.changed_at}</ThemedText>
                  <ThemedText type="small">
                    {h.old_status ?? '—'} → {h.new_status}{h.changed_by_name ? ` (${h.changed_by_name})` : ''}
                  </ThemedText>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  noPad: { padding: 0, paddingHorizontal: Spacing.three },
  note: { marginTop: Spacing.one, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
