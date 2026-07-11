import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyState, ErrorView, LoadingView } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { Team } from '@/lib/types';

export default function TeamsScreen() {
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
      <SafeAreaView style={styles.fill} edges={['top']}>
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
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <ThemedText>{item.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.category || 'Team'} · {item.member_count ?? 0} member{item.member_count !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
                <Badge text="Active" color="green" />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  list: { padding: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120,120,128,0.2)',
  },
});
