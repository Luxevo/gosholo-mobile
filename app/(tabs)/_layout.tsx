import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        initialRouteName="ai"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="offers"
          options={{
            title: 'Offers',
          }}
        />
        <Tabs.Screen
          name="compass"
          options={{
            title: 'Compass',
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'AI',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
