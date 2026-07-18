import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { addConnection } from '../api/endpoints';
import { errMsg } from '../api/client';
import { Screen, Card, H1, Muted, Button } from '../components/ui';
import { PLATFORMS } from '../lib/config';
import { colors, platformColor, radius, space } from '../lib/theme';

export default function Connect() {
  const router = useRouter();
  const qc = useQueryClient();
  const [platform, setPlatform] = useState<string>('leetcode');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!username.trim()) {
      setError('Enter your username on that platform.');
      return;
    }
    setLoading(true);
    try {
      await addConnection(platform, username.trim());
      qc.invalidateQueries({ queryKey: ['connections'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      router.back();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <H1>Connect a platform</H1>
      <Muted>We fetch your public stats — no password needed for analytics.</Muted>

      <Card>
        <Text style={s.label}>Platform</Text>
        <View style={s.chips}>
          {PLATFORMS.map((p) => {
            const active = p === platform;
            return (
              <Pressable
                key={p}
                onPress={() => setPlatform(p)}
                style={[
                  s.chip,
                  active && { backgroundColor: (platformColor[p] || colors.brand) + '22', borderColor: platformColor[p] || colors.brand },
                ]}
              >
                <Text style={[s.chipText, active && { color: platformColor[p] || colors.brand, fontWeight: '700' }]}>
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[s.label, { marginTop: space(4) }]}>Username</Text>
        <TextInput
          style={s.input}
          placeholder={`your ${platform} handle`}
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
      </Card>

      <Button title="Connect" onPress={submit} loading={loading} />
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, color: colors.muted, marginBottom: space(2) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  chip: { paddingHorizontal: space(3), paddingVertical: space(2), borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.ink },
  input: {
    height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: space(4), fontSize: 16, color: colors.ink, backgroundColor: colors.card,
  },
  error: { color: colors.brand, fontSize: 13, marginTop: space(2) },
});
