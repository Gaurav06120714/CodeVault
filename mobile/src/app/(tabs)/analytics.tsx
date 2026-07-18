import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { normalizeStats, diffColors } from '../../lib/stats';
import { Screen, Card, H1, H2, Muted, Loading, ErrorView, EmptyView, StatCard } from '../../components/ui';
import { BarList, Donut, Heatmap } from '../../components/charts';
import { colors, platformColor, space } from '../../lib/theme';

export default function Analytics() {
  const q = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  if (q.isLoading) return <Screen scroll={false}><Loading /></Screen>;
  if (q.isError) return <Screen scroll={false}><ErrorView message={errMsg(q.error)} onRetry={q.refetch} /></Screen>;

  const vm = normalizeStats(q.data);
  if (vm.connected.length === 0)
    return <Screen scroll={false}><EmptyView icon="📈" title="No data yet" hint="Connect a platform to unlock analytics." /></Screen>;

  const diff = vm.byDifficulty;
  const diffTotal = diff.easy + diff.medium + diff.hard;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <H1>Analytics</H1>

      <View style={s.row}>
        <StatCard label="Total solved" value={vm.totalSolved} accent={colors.brand} />
        <StatCard label="Platforms" value={vm.connected.length} />
      </View>

      {vm.ratings.length > 0 && (
        <View style={s.row}>
          {vm.ratings.map((r) => (
            <StatCard
              key={r.platform}
              label={`${r.platform} · peak ${r.peak}`}
              value={r.current}
              accent={platformColor[r.platform]}
            />
          ))}
        </View>
      )}

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
        <H2>Solved per platform</H2>
        <View style={{ marginTop: space(2) }}>
          <BarList data={vm.perPlatform} />
        </View>
      </Card>

      {vm.topics.length > 0 && (
        <Card>
          <H2>Top topics</H2>
          <View style={{ marginTop: space(2) }}>
            <BarList data={vm.topics} color={colors.purple} />
          </View>
        </Card>
      )}

      {vm.languages.length > 0 && (
        <Card>
          <H2>Languages</H2>
          <View style={{ marginTop: space(2) }}>
            <BarList data={vm.languages} color={colors.blue} />
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

      {vm.topics.length === 0 && vm.languages.length === 0 && (
        <Muted>Topic and language breakdowns come from LeetCode; connect it for richer analytics.</Muted>
      )}
    </Screen>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={s.legend}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}><Muted>{label}</Muted></View>
      <Muted style={{ fontWeight: '700', color: colors.ink }}>{value}</Muted>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space(3), flexWrap: 'wrap' },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: space(4), marginTop: space(3) },
  legend: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
