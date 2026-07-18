import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { Loading } from '../components/ui';
import { View } from 'react-native';
import { colors } from '../lib/theme';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading label="Loading CodeVault…" />
      </View>
    );
  return <Redirect href={user ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}
