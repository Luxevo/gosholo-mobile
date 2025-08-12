import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
  
const COLORS = {
  primary: '#FF6233',
  teal: '#016167',
  green: '#B2FD9D',
  blue: '#5BC4DB',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  black: '#000000',
};

interface ProfileMenuItemProps {
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  title: string;
  onPress: () => void;
  iconBackgroundColor?: string;
}

function ProfileMenuItem({ icon, title, onPress, iconBackgroundColor = COLORS.green }: ProfileMenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: iconBackgroundColor }]}>
        <IconSymbol name={icon} size={20} color={COLORS.teal} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <IconSymbol name="chevron.right" size={16} color={COLORS.blue} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <IconSymbol name="gearshape" size={24} color={COLORS.teal} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <View style={styles.avatarImage} />
              <View style={styles.cameraIcon}>
                <IconSymbol name="camera.fill" size={16} color={COLORS.white} />
              </View>
            </View>
          </View>
          
          <Text style={styles.userName}>David Kim</Text>
          <Text style={styles.userInfo}>Food Explorer • Midtown</Text>
          
          <View style={styles.badges}>
            <View style={styles.premiumBadge}>
              <IconSymbol name="crown.fill" size={14} color={COLORS.black} />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <IconSymbol name="checkmark.shield.fill" size={14} color={COLORS.white} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>36</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Favourites</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <ProfileMenuItem
            icon="pencil"
            title="My Reviews"
            onPress={() => console.log('My Reviews pressed')}
          />
          
          <ProfileMenuItem
            icon="heart.fill"
            title="Favourite Restaurants"
            onPress={() => console.log('Favourite Restaurants pressed')}
          />
          
          <ProfileMenuItem
            icon="tag.fill"
            title="Saved Offers"
            onPress={() => console.log('Saved Offers pressed')}
          />
          
          <ProfileMenuItem
            icon="calendar"
            title="Attending Events"
            onPress={() => console.log('Attending Events pressed')}
          />
          
          <ProfileMenuItem
            icon="creditcard.fill"
            title="Payment & Wallet"
            onPress={() => console.log('Payment & Wallet pressed')}
          />
          
          <ProfileMenuItem
            icon="bell.fill"
            title="Notifications"
            onPress={() => console.log('Notifications pressed')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.teal,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: COLORS.gray,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 16,
  },
  badges: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },
  editProfileButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.gray,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.teal,
  },
}); 