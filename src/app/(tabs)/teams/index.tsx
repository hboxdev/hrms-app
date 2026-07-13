import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/animated-pressable';
import { Card, EmptyState, ErrorView, LoadingView } from '@/components/common';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TopBar } from '@/components/top-bar';
import { BottomTabInset, Brand, BrandDark, Spacing } from '@/constants/theme';
import { apiGet, ApiError } from '@/lib/api-client';
import type { Team } from '@/lib/types';

const CATEGORY_COLORS: Record<string, string> = {
  Sales: '#4F8EF7',
  Production: '#B56CFF',
  Operations: '#00B9F2',
  HR: '#22C55E',
};

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function TeamsScreen() {
  const router = useRouter();
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
            renderItem={({ item }) => {
              const color = CATEGORY_COLORS[item.category] ?? Brand;
              return (
                <AnimatedPressable onPress={() => router.push(`/teams/${item.id}`)}>
                  <Card style={styles.row}>
                    <View style={[styles.iconCircle, { backgroundColor: color }]}>
                      <ThemedText style={[styles.iconText, { color: color === Brand ? BrandDark : '#fff' }]}>
                        {initials(item.name)}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="default">{item.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.category || 'Team'} · {item.member_count ?? 0} member{item.member_count !== 1 ? 's' : ''}
                      </ThemedText>
                    </View>
                    <ThemedText themeColor="textSecondary" style={{ fontSize: 20 }}>›</ThemedText>
                  </Card>
                </AnimatedPressable>
              );
            }}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  title: { fontSize: 28, paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  list: { padding: Spacing.three, paddingTop: 0, paddingBottom: BottomTabInset },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontWeight: '800', fontSize: 15 },
});
