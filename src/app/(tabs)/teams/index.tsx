import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Badge, EmptyState, ErrorView, LoadingView } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { Team } from '@/lib/types';

export default function TeamsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ ok: true; teams: Team[] }>('teams')
      .then((res) => setTeams(res.teams))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemedView style={styles.fill}>
      <TopBar />
      <View style={styles.fill}>
        <ThemedText type="title" style={styles.title}>Teams</ThemedText>
        {loading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView message={error} />
        ) : teams.length === 0 ? (
          <EmptyState title="No teams found" />
        ) : (
          <FlatList
            data={teams}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/teams/${item.id}`)} style={[styles.row, { borderBottomColor: theme.backgroundSelected }]}>
                <ThemedText style={{ flex: 1 }}>{item.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginRight: Spacing.two }}>
                  {item.category || 'Team'} · {item.member_count ?? 0} member{item.member_count !== 1 ? 's' : ''}
                </ThemedText>
                <Badge text="Active" color="green" />
              </Pressable>
            )}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  list: { padding: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
