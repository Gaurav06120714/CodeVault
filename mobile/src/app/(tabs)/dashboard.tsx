import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchStats, fetchProblems } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { normalizeStats, diffColors } from '../../lib/stats';
import { useAuth } from '../../auth/AuthContext';
import {
  Screen, Card, H1, H2, Muted, Body, StatCard, Loading, ErrorView, EmptyView, Pill,
} from '../../components/ui';
import { Donut, Heatmap, BarList } from '../../components/charts';
import { colors, platformColor, space } from '../../lib/theme';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const q = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  // Synced problems come from git-service; failing silently keeps the dashboard
  // alive when git-service is down — we fall back to LeetCode recents.
  const problemsQ = useQuery({ queryKey: ['problems'], queryFn: fetchProblems, retry: 0 });

  if (q.isLoading) return <Screen scroll={false}><Loading label="Fetching your analysis…" /></Screen>;
  if (q.isError)
    return <Screen scroll={false}><ErrorView message={errMsg(q.error)} onRetry={q.refetch} /></Screen>;

  const vm = normalizeStats(q.data);
  const synced = (problemsQ.data?.items ?? []).map((p: any) => ({
    title: p.title || p.slug || `#${p.number}`,
    platform: p.platform,
    difficulty: p.difficulty as string | undefined,
    number: p.number as string | undefined,
    when: p.solvedAt
      ? new Date(p.solvedAt).toLocaleDateString()
      : p.syncedAt
        ? new Date(p.syncedAt).toLocaleDateString()
        : '',
  }));
  const recent: {
    title: string;
    platform: string;
    when: string;
    difficulty?: string;
    number?: string;
  }[] = synced.length ? synced : vm.recent;
  const diff = vm.byDifficulty;
  const diffTotal = diff.easy + diff.medium + diff.hard;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <View style={s.brandRow}>
        <Image
          source={require('../../../assets/images/codevault-icon.png')}
          style={s.brandLogo}
          resizeMode="contain"
        />
        <Text style={s.brandName}>CodeVault</Text>
      </View>
      <View>
        <Muted>Welcome back</Muted>
        <H1>{user?.displayName || user?.githubLogin || user?.handle}</H1>
      </View>

      {vm.connected.length === 0 ? (
        <Card>
          <EmptyView
            icon="🔌"
            title="No platforms connected"
            hint="Connect LeetCode, Codeforces, CodeChef or HackerRank to see your stats."
          />
          <Pressable style={s.cta} onPress={() => router.push('/connect')}>
            <Text style={s.ctaText}>Connect a platform</Text>
          </Pressable>
        </Card>
      ) : (
        <>
          <View style={s.row}>
            <StatCard label="Total solved" value={vm.totalSolved} accent={colors.brand} />
            <StatCard label="Platforms" value={vm.connected.length} />
          </View>

          {diffTotal > 0 && (
            <Card>
              <H2>Difficulty</H2>
              <View style={s.diffRow}>
                <Donut
                  segments={[
                    { value: diff.easy, color: diffColors.easy },
                    { value: diff.medium, color: diffColors.medium },
                    { value: diff.hard, color: diffColors.hard },
                  ]}
                  centerLabel={String(diffTotal)}
                  centerSub="solved"
                />
                <View style={{ gap: space(2), flex: 1 }}>
                  <Legend color={diffColors.easy} label="Easy" value={diff.easy} />
                  <Legend color={diffColors.medium} label="Medium" value={diff.medium} />
                  <Legend color={diffColors.hard} label="Hard" value={diff.hard} />
                </View>
              </View>
            </Card>
          )}

          <Card>
            <H2>By platform</H2>
            <View style={{ marginTop: space(2) }}>
              <BarList data={vm.perPlatform.map((p) => ({ ...p }))} />
            </View>
          </Card>

          {vm.heatmap.length > 0 && (
            <Card>
              <H2>Activity</H2>
              <Muted>Last 12 months</Muted>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: space(3) }}
              >
                <Heatmap days={vm.heatmap} />
              </ScrollView>
            </Card>
          )}

          {recent.length > 0 && (
            <Card>
              <H2>Recent accepted submissions</H2>
              <Muted>across all platforms</Muted>
              <View style={{ marginTop: space(2), gap: space(2) }}>
                {recent.slice(0, 8).map((r, i) => {
                  const row = (
                    <View style={s.recentRow}>
                      <View style={{ flex: 1 }}>
                        <Body style={{ fontWeight: '600' }}>{r.title}</Body>
                        <Muted>
                          {r.when}
                          {r.difficulty ? ` · ${r.difficulty}` : ''}
                        </Muted>
                      </View>
                      <Pill text={r.platform} color={platformColor[r.platform] || colors.brand} />
                    </View>
                  );
                  return r.number ? (
                    <Pressable
                      key={i}
                      onPress={() =>
                        router.push({
                          pathname: '/problem/[platform]/[number]',
                          params: { platform: r.platform, number: String(r.number), title: r.title },
                        })
                      }
                    >
                      {row}
                    </Pressable>
                  ) : (
                    <View key={i}>{row}</View>
                  );
                })}
              </View>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={s.legend}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.legendLabel}>{label}</Text>
      <Text style={s.legendValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  brandLogo: { width: 28, height: 28 },
  brandName: { fontSize: 18, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', gap: space(3) },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: space(4), marginTop: space(3) },
  legend: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, color: colors.ink, fontSize: 14 },
  legendValue: { fontWeight: '700', color: colors.ink },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  cta: { marginTop: space(3), backgroundColor: colors.brand, padding: space(3), borderRadius: 12, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '700' },
});
