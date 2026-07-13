import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Badge, EmptyState, ErrorView, LoadingView } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { BottomTabInset, Brand, BrandDark, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiGet, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import type { Invoice, Pagination, Team } from '@/lib/types';

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
];

const PAYMENT_TYPES = [
  { key: '', label: 'All' },
  { key: 'Initial Payment', label: 'Initial' },
  { key: 'Recurring Payment', label: 'Recurring' },
  { key: 'Up Sell Payment', label: 'Up Sell' },
];

const badgeColor: Record<string, 'green' | 'orange' | 'red' | 'grey'> = {
  paid: 'green',
  pending: 'orange',
  overdue: 'red',
};

type UserOption = { id: number; name: string };

type Filters = {
  status: string;
  paymentType: string;
  teamId: number | '';
  userId: number | '';
  createdFrom: Date | null;
  createdTo: Date | null;
  paidFrom: Date | null;
  paidTo: Date | null;
};

const EMPTY_FILTERS: Filters = {
  status: '',
  paymentType: '',
  teamId: '',
  userId: '',
  createdFrom: null,
  createdTo: null,
  paidFrom: null,
  paidTo: null,
};

function fmtDate(d: Date | null) {
  if (!d) return 'Any';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <AnimatedPressable onPress={onPress} style={[styles.chip, { backgroundColor: active ? Brand : theme.backgroundElement }]}>
      <ThemedText type="small" style={active ? { color: BrandDark, fontWeight: '700' } : undefined}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

function DateField({ label, value, onChange }: { label: string; value: Date | null; onChange: (d: Date | null) => void }) {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 4 }}>{label}</ThemedText>
      <AnimatedPressable
        onPress={() => setPickerOpen(true)}
        style={[styles.dateField, { borderColor: theme.backgroundSelected }]}>
        <ThemedText type="small">{fmtDate(value)}</ThemedText>
        {value ? (
          <Pressable hitSlop={8} onPress={() => onChange(null)}>
            <ThemedText themeColor="textSecondary">✕</ThemedText>
          </Pressable>
        ) : (
          <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
        )}
      </AnimatedPressable>
      {pickerOpen && (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            setPickerOpen(false);
            if (event.type === 'set' && selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}

function OptionSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { id: number | ''; label: string }[];
  selectedId: number | '';
  onSelect: (id: number | '') => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <ThemedView type="backgroundElement" style={[styles.optionSheet, { paddingBottom: insets.bottom || Spacing.three }]}>
        <View style={styles.handle} />
        <ThemedText type="subtitle" style={styles.sheetTitle}>{title}</ThemedText>
        <ScrollView showsVerticalScrollIndicator={false}>
          {options.map((opt) => (
            <AnimatedPressable
              key={String(opt.id)}
              onPress={() => {
                onSelect(opt.id);
                onClose();
              }}
              style={styles.optionRow}>
              <ThemedText type={opt.id === selectedId ? 'smallBold' : 'default'}>{opt.label}</ThemedText>
              {opt.id === selectedId ? <ThemedText style={{ color: Brand }}>✓</ThemedText> : null}
            </AnimatedPressable>
          ))}
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

function FilterSheet({
  visible,
  onClose,
  filters,
  setFilters,
  teams,
  users,
  isAdmin,
}: {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  teams: Team[];
  users: UserOption[];
  isAdmin: boolean;
}) {
  const [draft, setDraft] = useState(filters);
  const [teamPickerOpen, setTeamPickerOpen] = useState(false);
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const teamOptions = [{ id: '' as const, label: 'All Teams' }, ...teams.map((t) => ({ id: t.id, label: t.name }))];
  const userOptions = [{ id: '' as const, label: 'All Users' }, ...users.map((u) => ({ id: u.id, label: u.name }))];
  const selectedTeamLabel = teams.find((t) => t.id === draft.teamId)?.name ?? 'All Teams';
  const selectedUserLabel = users.find((u) => u.id === draft.userId)?.name ?? 'All Users';
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <ThemedView type="backgroundElement" style={styles.filterSheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <ThemedText type="subtitle" style={{ fontSize: 20 }}>Filter Invoices</ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <ThemedText themeColor="textSecondary" style={{ fontSize: 20 }}>✕</ThemedText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>Status</ThemedText>
            <View style={styles.chipRow}>
              {STATUSES.map((s) => (
                <Chip key={s.key} label={s.label} active={draft.status === s.key} onPress={() => setDraft({ ...draft, status: s.key })} />
              ))}
            </View>

            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>Payment Type</ThemedText>
            <View style={styles.chipRow}>
              {PAYMENT_TYPES.map((p) => (
                <Chip key={p.key} label={p.label} active={draft.paymentType === p.key} onPress={() => setDraft({ ...draft, paymentType: p.key })} />
              ))}
            </View>

            {isAdmin && (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>Team</ThemedText>
                <AnimatedPressable onPress={() => setTeamPickerOpen(true)} style={styles.dropdown}>
                  <ThemedText type="small">{selectedTeamLabel}</ThemedText>
                  <Ionicons name="chevron-down" size={16} />
                </AnimatedPressable>

                <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>User</ThemedText>
                <AnimatedPressable onPress={() => setUserPickerOpen(true)} style={styles.dropdown}>
                  <ThemedText type="small">{selectedUserLabel}</ThemedText>
                  <Ionicons name="chevron-down" size={16} />
                </AnimatedPressable>
              </>
            )}

            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>Created Date</ThemedText>
            <View style={styles.dateRow}>
              <DateField label="From" value={draft.createdFrom} onChange={(d) => setDraft({ ...draft, createdFrom: d })} />
              <DateField label="To" value={draft.createdTo} onChange={(d) => setDraft({ ...draft, createdTo: d })} />
            </View>

            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>Paid Date</ThemedText>
            <View style={styles.dateRow}>
              <DateField label="From" value={draft.paidFrom} onChange={(d) => setDraft({ ...draft, paidFrom: d })} />
              <DateField label="To" value={draft.paidTo} onChange={(d) => setDraft({ ...draft, paidTo: d })} />
            </View>
          </ScrollView>

          <View style={[styles.sheetActions, { paddingBottom: insets.bottom || Spacing.three }]}>
            <AnimatedPressable
              onPress={() => {
                setDraft(EMPTY_FILTERS);
                setFilters(EMPTY_FILTERS);
              }}
              style={styles.clearBtn}>
              <ThemedText style={{ fontWeight: '600' }}>Clear All</ThemedText>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={() => {
                setFilters(draft);
                onClose();
              }}
              style={styles.applyBtn}>
              <ThemedText style={{ color: BrandDark, fontWeight: '700' }}>Apply</ThemedText>
            </AnimatedPressable>
          </View>
        </ThemedView>

      <OptionSheet
        visible={teamPickerOpen}
        title="Filter by Team"
        options={teamOptions}
        selectedId={draft.teamId}
        onSelect={(id) => setDraft({ ...draft, teamId: id })}
        onClose={() => setTeamPickerOpen(false)}
      />
      <OptionSheet
        visible={userPickerOpen}
        title="Filter by User"
        options={userOptions}
        selectedId={draft.userId}
        onSelect={(id) => setDraft({ ...draft, userId: id })}
        onClose={() => setUserPickerOpen(false)}
      />
    </Modal>
  );
}

export default function InvoicesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [page, setPage] = useState(1);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    apiGet<{ ok: true; teams: Team[] }>('teams').then((res) => setTeams(res.teams)).catch(() => {});
    apiGet<{ ok: true; users: UserOption[] }>('users').then((res) => setUsers(res.users)).catch(() => {});
  }, [isAdmin]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([, v]) => v !== '' && v !== null).length;
  }, [filters]);

  const load = useCallback(async (p: number, append: boolean) => {
    try {
      const res = await apiGet<{ ok: true; invoices: Invoice[]; pagination: Pagination }>('invoices', {
        page: p,
        status: filters.status,
        search,
        payment_type: filters.paymentType || undefined,
        team_id: filters.teamId || undefined,
        user_id: filters.userId || undefined,
        created_from: filters.createdFrom ? filters.createdFrom.toISOString().slice(0, 10) : undefined,
        created_to: filters.createdTo ? filters.createdTo.toISOString().slice(0, 10) : undefined,
        paid_from: filters.paidFrom ? filters.paidFrom.toISOString().slice(0, 10) : undefined,
        paid_to: filters.paidTo ? filters.paidTo.toISOString().slice(0, 10) : undefined,
      });
      setInvoices((prev) => (append ? [...prev, ...res.invoices] : res.invoices));
      setPagination(res.pagination);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
    }
  }, [filters, search]);

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
      <TopBar />
      <View style={styles.fill}>
        <ThemedText type="title" style={styles.title}>Invoices</ThemedText>
        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search invoices…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <AnimatedPressable onPress={() => setFilterSheetOpen(true)} style={[styles.filterBtn, { backgroundColor: theme.backgroundElement }]}>
            <Ionicons name="options-outline" size={20} color={theme.text} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
              </View>
            )}
          </AnimatedPressable>
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
              <AnimatedPressable onPress={() => router.push(`/invoices/${item.id}`)} style={[styles.row, { borderBottomColor: theme.backgroundSelected }]}>
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
              </AnimatedPressable>
            )}
          />
        )}
      </View>

      <FilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        setFilters={setFilters}
        teams={teams}
        users={users}
        isAdmin={isAdmin}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  search: { flex: 1, borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: 10, fontSize: 15 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  list: { paddingHorizontal: Spacing.three, paddingBottom: BottomTabInset },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(120,120,128,0.3)',
    alignSelf: 'center',
    marginVertical: Spacing.two,
  },
  optionSheet: {
    marginTop: 'auto',
    height: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.three,
  },
  sheetTitle: { fontSize: 18, marginBottom: Spacing.two },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
  filterSheet: {
    marginTop: 'auto',
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.three,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionLabel: { textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.three, marginBottom: Spacing.two },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: 8, borderRadius: 20 },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(120,120,128,0.1)',
  },
  dateRow: { flexDirection: 'row', gap: Spacing.two },
  dateField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  clearBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: 'rgba(120,120,128,0.1)',
  },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
    backgroundColor: Brand,
  },
});
