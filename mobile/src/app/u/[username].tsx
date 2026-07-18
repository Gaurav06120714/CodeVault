import React from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicProfile } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { Screen, Card, H1, H2, Muted, Body, StatCard, Button, Loading, ErrorView } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { Donut, Heatmap, BarList } from '../../components/charts';
import { normalizeStats, diffColors } from '../../lib/stats';
import { colors, space } from '../../lib/theme';

export default function PublicProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ['public', username],
    queryFn: () => fetchPublicProfile(String(username)),
    enabled: !!username,
  });

  if (q.isLoading) return <Screen scroll={false}><Loading /></Screen>;
  if (q.isError) return <Screen scroll={false}><ErrorView message={errMsg(q.error)} onRetry={q.refetch} /></Screen>;

  const p: any = q.data ?? {};
  // Public profile may already be aggregated, or carry a `platforms` map like /stats.
  const vm = normalizeStats(p.platforms ? p : { platforms: p.byPlatformRaw, totalSolved: p.totalSolved });
  const diff = p.byDifficulty || vm.byDifficulty;
  const diffTotal = (diff.easy || 0) + (diff.medium || 0) + (diff.hard || 0);

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <Card style={s.header}>
        {p.avatarUrl ? (
          <Image source={{ uri: p.avatarUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, { borderWidth: 1, borderColor: colors.border }]} />
        )}
        <View style={{ flex: 1 }}>
          <H2>{p.displayName || p.handle || username}</H2>
          <Muted>@{p.handle || username}</Muted>
        </View>
      </Card>

      {user?.handle !== (p.handle || username) && (
        <Button title="Message" onPress={() => router.push(`/chat/${p.handle || username}`)} />
      )}

      <View style={s.row}>
        <StatCard label="Total solved" value={p.totalSolved ?? vm.totalSolved} accent={colors.brand} />
        {typeof p.bestStreak === 'number' ? <StatCard label="Best streak" value={p.bestStreak} /> : null}
      </View>

      {diffTotal > 0 && (
        <Card>
          <H2>Difficulty</H2>
          <View style={{ alignItems: 'center', marginTop: space(3) }}>
            <Donut
              segments={[
                { value: diff.easy || 0, color: diffColors.easy },
                { value: diff.medium || 0, color: diffColors.medium },
                { value: diff.hard || 0, color: diffColors.hard },
              ]}
              centerLabel={String(diffTotal)}
              centerSub="solved"
            />
          </View>
        </Card>
      )}

      {vm.heatmap.length > 0 && (
        <Card>
          <H2>Activity</H2>
          <Muted>Last 12 months</Muted>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space(3) }}>
            <Heatmap days={vm.heatmap} />
          </ScrollView>
        </Card>
      )}

      {vm.perPlatform.length > 0 && (
        <Card>
          <H2>By platform</H2>
          <View style={{ marginTop: space(2) }}>
            <BarList data={vm.perPlatform} />
          </View>
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.cardAlt },
  row: { flexDirection: 'row', gap: space(3) },
});
