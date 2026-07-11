import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Card, ErrorView, LoadingView, SectionTitle } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandText, Spacing } from '@/constants/theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { InvoiceDetail } from '@/lib/types';

const badgeColor: Record<string, 'green' | 'orange' | 'red' | 'grey'> = {
  paid: 'green',
  pending: 'orange',
  overdue: 'red',
};

function fmtDate(s?: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1 }}>{label}</ThemedText>
      <ThemedText style={{ flex: 1.5, textAlign: 'right' }}>{value || '—'}</ThemedText>
    </View>
  );
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ ok: true; invoice: InvoiceDetail }>('invoice', { id })
      .then((res) => setInvoice(res.invoice))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingView />;
  if (error || !invoice) return <ErrorView message={error ?? 'Not found'} />;

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">Invoice No.</ThemedText>
              <ThemedText type="subtitle" style={{ fontSize: 19 }}>{invoice.invoice_no}</ThemedText>
            </View>
            <Badge text={invoice.status} color={badgeColor[invoice.status] ?? 'grey'} />
          </View>
          <ThemedText type="title" style={{ marginTop: Spacing.two, color: BrandText }}>
            ${Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Total Amount</ThemedText>
        </Card>

        <SectionTitle>Details</SectionTitle>
        <Card style={styles.noPad}>
          <Row label="Customer" value={invoice.customer_name} />
          <Row label="Service" value={invoice.service_name} />
          <Row label="Owner" value={invoice.owner_name} />
          <Row label="Payment" value={invoice.payment_type} />
          <Row label="Created" value={fmtDate(invoice.created_at)} />
          {invoice.paid_at ? <Row label="Paid On" value={fmtDate(invoice.paid_at)} /> : null}
        </Card>

        {invoice.notes ? (
          <>
            <SectionTitle>Notes</SectionTitle>
            <Card><ThemedText>{invoice.notes}</ThemedText></Card>
          </>
        ) : null}

        {invoice.payments?.length > 0 ? (
          <>
            <SectionTitle>Payment Records</SectionTitle>
            <Card style={styles.noPad}>
              {invoice.payments.map((p) => (
                <View key={p.id} style={styles.detailRow}>
                  <View>
                    <ThemedText type="small">{fmtDate(p.created_at)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{p.gateway || p.method || '—'}</ThemedText>
                  </View>
                  <ThemedText type="smallBold">${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</ThemedText>
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
