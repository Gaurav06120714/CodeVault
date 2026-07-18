import React from 'react';
import { StyleSheet, Pressable, Image, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { listConversations } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { Screen, Card, H1, Muted, Body, Loading, ErrorView, EmptyView } from '../../components/ui';
import { colors, space } from '../../lib/theme';

export default function Messages() {
  const router = useRouter();
  const q = useQuery({ queryKey: ['conversations'], queryFn: listConversations });

  if (q.isLoading) return <Screen scroll={false}><Loading /></Screen>;
  if (q.isError) return <Screen scroll={false}><ErrorView message={errMsg(q.error)} onRetry={q.refetch} /></Screen>;

  const convos: any[] = q.data?.conversations ?? [];

  return (
    <Screen refreshing={q.isRefetching} onRefresh={q.refetch}>
      <H1>Inbox</H1>
      {convos.length === 0 ? (
        <EmptyView icon="💬" title="No conversations" hint="Open someone's profile to start a chat." />
      ) : (
        convos.map((c, i) => {
          const u = c.user ?? {};
          const preview = c.lastMessage
            ? `${c.lastMessage.fromMe ? 'You: ' : ''}${c.lastMessage.content}`
            : `@${u.handle}`;
          return (
            <Pressable key={u.id ?? i} onPress={() => u.handle && router.push(`/chat/${u.handle}`)}>
              <Card style={s.row}>
                {u.avatarUrl ? (
                  <Image source={{ uri: u.avatarUrl }} style={s.avatar} />
                ) : (
                  <View style={[s.avatar, s.avatarFallback]} />
                )}
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '700' }}>{u.displayName || `@${u.handle}`}</Body>
                  <Muted style={{ marginTop: 2 }} >
                    {preview.length > 48 ? preview.slice(0, 48) + '…' : preview}
                  </Muted>
                </View>
                {c.unread > 0 ? (
                  <View style={s.badge}>
                    <Body style={s.badgeText}>{c.unread}</Body>
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.cardAlt },
  avatarFallback: { borderWidth: 1, borderColor: colors.border },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
