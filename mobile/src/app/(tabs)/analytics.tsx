import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchStats } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { normalizeStats } from '../../lib/stats';
import { Screen, Card, H1, H2, Muted, Loading, ErrorView, EmptyView, StatCard } from '../../components/ui';
import { BarList } from '../../components/charts';
import { colors, platformColor, space } from '../../lib/theme';

export default function Analytics() {
  const q = useQuery({ queryKey: ['stats'], queryFn: fetchStats });

  if (q.isLoading) return <Screen scroll={false}><Loading /></Screen>;
  if (q.isError) return <Screen scroll={false}><ErrorView message={errMsg(q.error)} onRetry={q.refetch} /></Screen>;

  const vm = normalizeStats(q.data);
  if (vm.connected.length === 0)
    return <Screen scroll={false}><EmptyView icon="📈" title="No data yet" hint="Connect a platform to unlock analytics." /></Screen>;

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <H1>Analytics</H1>

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

      <Card>
        <H2>Solved per platform</H2>
        <View style={{ marginTop: space(2) }}>
          <BarList data={vm.perPlatform} />
        </View>
      </Card>

      {vm.topics.length === 0 && vm.languages.length === 0 && (
        <Muted>Topic and language breakdowns come from LeetCode; connect it for richer analytics.</Muted>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: space(3), flexWrap: 'wrap' },
});
