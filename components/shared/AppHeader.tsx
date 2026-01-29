import { AvatarDisplay } from '@/components/AvatarPicker';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#FF6233',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  green: '#10B981',
  greenBg: '#ECFDF5',
  teal: 'rgb(1,111,115)',
  lightGreen: 'rgb(178,253,157)',
};

interface AppHeaderProps {
  userName?: string;
  avatarId?: string | null;
  onProfilePress?: () => void;
}

export function AppHeader({
  userName,
  avatarId,
  onProfilePress,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Left side: Logo */}
      <View style={styles.leftSection}>
        <Image
          source={require('@/assets/images/darker-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Right side: User avatar and name */}
      {userName && (
        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.userChip}
            onPress={onProfilePress}
            accessibilityRole="button"
            accessibilityLabel={`User: ${userName}`}
          >
            <AvatarDisplay avatarId={avatarId} size={24} />
            <Text style={styles.userText}>{userName}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 0,
    backgroundColor: COLORS.white,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 95,
    height: 50,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  userText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.teal,
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
