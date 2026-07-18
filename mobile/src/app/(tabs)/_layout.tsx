import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { Loading } from '../../components/ui';
import { colors } from '../../lib/theme';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading />
      </View>
    );
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Overview', tabBarIcon: ({ focused }) => <Icon emoji="📊" focused={focused} /> }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: 'Analytics', tabBarIcon: ({ focused }) => <Icon emoji="📈" focused={focused} /> }}
      />
      <Tabs.Screen
        name="repositories"
        options={{ title: 'Repos', tabBarIcon: ({ focused }) => <Icon emoji="🗂️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="sync-status"
        options={{ title: 'Sync', tabBarIcon: ({ focused }) => <Icon emoji="🔄" focused={focused} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Inbox', tabBarIcon: ({ focused }) => <Icon emoji="💬" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ focused }) => <Icon emoji="⚙️" focused={focused} /> }}
      />
    </Tabs>
  );
}
