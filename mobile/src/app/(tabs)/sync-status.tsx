import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchSyncStatus, fetchSyncActivity, triggerSync } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { Screen, Card, H1, H2, Muted, Body, Pill, Button, Loading, ErrorView, EmptyView } from '../../components/ui';
import { colors, platformColor, space } from '../../lib/theme';

function asList(d: any): any[] {
  if (Array.isArray(d)) return d;
  return d?.items ?? d?.status ?? d?.activity ?? [];
}

export default function SyncStatus() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const status = useQuery({ queryKey: ['sync-status'], queryFn: fetchSyncStatus });
  const activity = useQuery({ queryKey: ['sync-activity'], queryFn: fetchSyncActivity });

  async function onSync() {
    setSyncing(true);
    try {
      await triggerSync();
      Alert.alert('Sync started', 'Your solutions are being synced to GitHub.');
      qc.invalidateQueries({ queryKey: ['sync-status'] });
      qc.invalidateQueries({ queryKey: ['sync-activity'] });
    } catch (e) {
      Alert.alert('Sync failed', errMsg(e));
    } finally {
      setSyncing(false);
    }
  }

  if (status.isLoading) return <Screen scroll={false}><Loading /></Screen>;
  if (status.isError) return <Screen scroll={false}><ErrorView message={errMsg(status.error)} onRetry={status.refetch} /></Screen>;

  const statusList = asList(status.data);
  const activityList = asList(activity.data);

  return (
    <Screen refreshing={status.isRefetching} onRefresh={() => { status.refetch(); activity.refetch(); }}>
      <H1>Sync</H1>
      <Button title="Sync now" onPress={onSync} loading={syncing} />

      {statusList.length === 0 ? (
        <EmptyView icon="🔄" title="Nothing synced yet" hint="Connect a platform and authorize sync first." />
      ) : (
        statusList.map((st: any, i: number) => (
          <Card key={i}>
            <View style={s.head}>
              <Body style={{ fontWeight: '700' }}>{st.username || st.platform}</Body>
              <Pill
                text={st.status || 'unknown'}
                color={st.status === 'expired' ? colors.brand : colors.green}
              />
            </View>
            <Muted>
              {st.platform ? `${st.platform} · ` : ''}
              {(st.itemsSynced ?? 0)} items
              {st.lastSyncedAt ? ` · last ${new Date(st.lastSyncedAt).toLocaleString()}` : ''}
            </Muted>
          </Card>
        ))
      )}

      {activityList.length > 0 && (
        <Card>
          <H2>Activity</H2>
          <View style={{ marginTop: space(2), gap: space(2) }}>
            {activityList.slice(0, 20).map((a: any, i: number) => (
              <View key={i} style={s.actRow}>
                <View style={[s.dot, { backgroundColor: a.type === 'error' ? colors.brand : colors.green }]} />
                <View style={{ flex: 1 }}>
                  <Body>{a.message || a.type}</Body>
                  <Muted>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</Muted>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actRow: { flexDirection: 'row', gap: space(2), alignItems: 'flex-start' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
});
