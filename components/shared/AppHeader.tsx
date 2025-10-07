import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#FF6233',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  green: '#10B981',
  greenBg: '#ECFDF5',
};

interface AppHeaderProps {
  location?: string;
  onLocationPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export function AppHeader({
  location = 'New York',
  onLocationPress,
  onNotificationPress,
  onProfilePress,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Left side: Logo + Location */}
      <View style={styles.leftSection}>
        <Image
          source={require('@/assets/images/dark_green.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.locationChip}
          onPress={onLocationPress}
          accessibilityRole="button"
          accessibilityLabel={`Location: ${location}`}
        >
          <IconSymbol name="mappin" size={14} color={COLORS.green} />
          <Text style={styles.locationText}>{location}</Text>
        </TouchableOpacity>
      </View>

      {/* Right side: Notification + Profile */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <IconSymbol name="bell" size={20} color={COLORS.darkGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <IconSymbol name="person.crop.circle.fill" size={32} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 60,
    height: 32,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.green,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
