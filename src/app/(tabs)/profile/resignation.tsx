import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Card, EmptyState, ErrorView, LoadingView, SectionTitle } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiGet, apiPostForm, ApiError } from '@/lib/api-client';
import type { Resignation } from '@/lib/types';

export default function ResignationScreen() {
  const theme = useTheme();
  const [history, setHistory] = useState<Resignation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resignationDate, setResignationDate] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [document, setDocument] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<{ ok: true; resignations: Resignation[] }>('resignation');
      setHistory(res.resignations);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function pickDocument() {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    });
    if (!res.canceled && res.assets?.[0]) setDocument(res.assets[0]);
  }

  async function submit() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(resignationDate) || !/^\d{4}-\d{2}-\d{2}$/.test(lastWorkingDay)) {
      Alert.alert('Missing dates', 'Please enter Resignation Date and Last Working Day as YYYY-MM-DD.');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('resignation_date', resignationDate);
      form.append('last_working_day', lastWorkingDay);
      if (noticePeriod) form.append('notice_period', noticePeriod);
      if (reason) form.append('reason', reason);
      if (description) form.append('description', description);
      if (document) {
        form.append('document', {
          uri: document.uri,
          name: document.name,
          type: document.mimeType ?? 'application/octet-stream',
        } as unknown as Blob);
      }

      await apiPostForm('resignation', form);
      setResignationDate('');
      setLastWorkingDay('');
      setNoticePeriod('');
      setReason('');
      setDescription('');
      setDocument(null);
      await load();
      Alert.alert('Submitted', 'Your resignation request has been recorded.');
    } catch (e) {
      Alert.alert('Failed', e instanceof ApiError ? e.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle>Submit Resignation</SectionTitle>
        <Card>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>Resignation Date (YYYY-MM-DD) *</ThemedText>
          <TextInput
            value={resignationDate}
            onChangeText={setResignationDate}
            placeholder="2026-07-11"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>Last Working Day (YYYY-MM-DD) *</ThemedText>
          <TextInput
            value={lastWorkingDay}
            onChangeText={setLastWorkingDay}
            placeholder="2026-08-11"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>Notice Period</ThemedText>
          <TextInput
            value={noticePeriod}
            onChangeText={setNoticePeriod}
            placeholder="1 month"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>Reason</ThemedText>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for leaving"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>Description</ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholder="Additional details (optional)"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />

          <Pressable onPress={pickDocument} style={[styles.attachBtn, { borderColor: theme.backgroundSelected }]}>
            <ThemedText type="small">{document ? document.name : 'Attach document (optional)'}</ThemedText>
          </Pressable>

          <Pressable
            onPress={submit}
            disabled={submitting}
            style={[styles.submitBtn, { backgroundColor: '#4F8EF7', opacity: submitting ? 0.6 : 1 }]}>
            {submitting ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.submitText}>Submit Resignation</ThemedText>}
          </Pressable>
        </Card>

        <SectionTitle>History</SectionTitle>
        {loading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView message={error} />
        ) : history.length === 0 ? (
          <EmptyState title="No resignation requests yet" />
        ) : (
          history.map((r) => (
            <Card key={r.id}>
              <ThemedText type="smallBold">Filed {r.resignation_date}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Last working day: {r.last_working_day}</ThemedText>
              {r.reason ? <ThemedText style={{ marginTop: 4 }}>{r.reason}</ThemedText> : null}
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
  label: { marginTop: Spacing.two, marginBottom: 4, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: Spacing.two, paddingVertical: 10, fontSize: 15 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  attachBtn: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: Spacing.two, marginTop: Spacing.three, alignItems: 'center' },
  submitBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.three },
  submitText: { color: '#fff', fontWeight: '600' },
});
