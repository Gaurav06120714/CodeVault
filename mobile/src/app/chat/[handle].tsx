import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getConversation, sendMessage } from '../../api/endpoints';
import { errMsg } from '../../api/client';
import { Loading, ErrorView } from '../../components/ui';
import { colors, radius, space } from '../../lib/theme';

export default function Chat() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const navigation = useNavigation();
  const qc = useQueryClient();
  const [text, setText] = useState('');

  const q = useQuery({
    queryKey: ['conversation', handle],
    queryFn: () => getConversation(String(handle)),
    enabled: !!handle,
    refetchInterval: 8000, // light polling so new incoming messages appear
  });

  React.useEffect(() => {
    const name = q.data?.user?.displayName || (handle ? `@${handle}` : 'Chat');
    navigation.setOptions({ title: name });
  }, [q.data?.user?.displayName, handle, navigation]);

  const mutation = useMutation({
    mutationFn: (content: string) => sendMessage(String(handle), content),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['conversation', handle] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  if (q.isLoading)
    return <SafeAreaView style={s.screen}><Loading /></SafeAreaView>;
  if (q.isError)
    return (
      <SafeAreaView style={s.screen}>
        <ErrorView message={errMsg(q.error)} onRetry={q.refetch} />
      </SafeAreaView>
    );

  const messages: any[] = q.data?.messages ?? []; // newest first

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          data={messages}
          inverted
          keyExtractor={(m, i) => m.id ?? String(i)}
          contentContainerStyle={{ padding: space(4), gap: space(2) }}
          renderItem={({ item }) => (
            <View style={[s.bubbleRow, item.fromMe ? s.rowMine : s.rowTheirs]}>
              <View style={[s.bubble, item.fromMe ? s.mine : s.theirs]}>
                <Text style={[s.msgText, item.fromMe && { color: '#fff' }]}>{item.content}</Text>
                <Text style={[s.time, item.fromMe && { color: '#ffffffcc' }]}>
                  {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={s.empty}>Say hi 👋</Text>
          }
        />

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Message…"
            placeholderTextColor={colors.faint}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[s.send, (!text.trim() || mutation.isPending) && { opacity: 0.4 }]}
            disabled={!text.trim() || mutation.isPending}
            onPress={() => mutation.mutate(text.trim())}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.sendText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  bubbleRow: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: space(3), paddingVertical: space(2), borderRadius: radius.lg },
  mine: { backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, color: colors.ink, lineHeight: 20 },
  time: { fontSize: 10, color: colors.faint, marginTop: 3, alignSelf: 'flex-end' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: space(10) },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: space(2),
    padding: space(3), borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 44, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: space(4), paddingTop: space(3), paddingBottom: space(3),
    fontSize: 15, color: colors.ink, backgroundColor: colors.card,
  },
  send: { height: 44, paddingHorizontal: space(4), borderRadius: radius.lg, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700' },
});
