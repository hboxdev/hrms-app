import { ScrollView, StyleSheet, View } from 'react-native';

import { Badge, Card, SectionTitle, StatCard } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

const DEMO_HISTORY: Array<{ date: string; status: 'present' | 'late' | 'absent'; checkIn: string; checkOut: string }> = [
  { date: 'Today', status: 'present', checkIn: '9:02 AM', checkOut: '—' },
  { date: 'Yesterday', status: 'present', checkIn: '8:56 AM', checkOut: '6:04 PM' },
  { date: 'Mon, Jul 6', status: 'late', checkIn: '9:41 AM', checkOut: '6:10 PM' },
  { date: 'Fri, Jul 3', status: 'present', checkIn: '8:50 AM', checkOut: '6:01 PM' },
  { date: 'Thu, Jul 2', status: 'absent', checkIn: '—', checkOut: '—' },
];

const STATUS_COLOR: Record<string, 'green' | 'orange' | 'red'> = {
  present: 'green',
  late: 'orange',
  absent: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
};

export default function AttendanceScreen() {
  return (
    <ThemedView style={styles.fill}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.demoNote}>
          Demo data — live attendance is coming soon
        </ThemedText>

        <Card>
          <View style={styles.todayRow}>
            <View>
              <ThemedText type="subtitle" style={{ fontSize: 19 }}>Today</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Check-in 9:02 AM</ThemedText>
            </View>
            <Badge text="Present" color="green" />
          </View>
        </Card>

        <SectionTitle>This Month</SectionTitle>
        <View style={styles.statsGrid}>
          <StatCard label="Present" value="21" sub="days" />
          <StatCard label="Late" value="2" sub="days" />
          <StatCard label="Absent" value="1" sub="day" />
          <StatCard label="Leaves" value="1" sub="approved" />
        </View>

        <SectionTitle>Recent</SectionTitle>
        <Card style={styles.noPad}>
          {DEMO_HISTORY.map((h, i) => (
            <View key={h.date} style={[styles.historyRow, i === DEMO_HISTORY.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <ThemedText type="default">{h.date}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{h.checkIn} – {h.checkOut}</ThemedText>
              </View>
              <Badge text={STATUS_LABEL[h.status]} color={STATUS_COLOR[h.status]} />
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
  demoNote: { textAlign: 'center', marginBottom: Spacing.two, fontStyle: 'italic' },
  todayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  noPad: { padding: 0, paddingHorizontal: Spacing.three },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
