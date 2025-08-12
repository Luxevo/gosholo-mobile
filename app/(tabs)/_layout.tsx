import { Tabs } from 'expo-router';
import React from 'react';

import { CustomTabBar } from '@/components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
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
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
