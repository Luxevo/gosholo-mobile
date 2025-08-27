import HomeCard, { HomeCardData } from '@/components/HomeCard';
import { router } from 'expo-router';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#FF6233',
  ink: '#111827',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

// Card data configuration
const HOME_CARDS: HomeCardData[] = [
  {
    id: 'explore',
    title: 'Explore Nearby',
    subtitle: 'Find restaurants & events around you',
    image: require('@/assets/images/ui/map.png'),
    route: '/compass',
    hasButton: true,
    buttonText: 'Open Map',
  },
  {
    id: 'offers',
    title: 'Special Offers',
    subtitle: 'Discover amazing deals',
    image: require('@/assets/images/ui/offers.png'),
    route: '/offers',
    hasButton: true,
    buttonText: 'See Offers',
  },
  {
    id: 'events',
    title: 'Exciting Events',
    subtitle: 'Find exciting events',
    image: require('@/assets/images/ui/events.png'),
    route: '/events',
    hasButton: true,
    buttonText: 'See Events',
  },
];

export default function HomeScreen() {
  const handleCardPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.profileButton}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <View style={styles.avatar} />
        </TouchableOpacity>
      </View>

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome!</Text>
        <Text style={styles.welcomeSubtitle}>Where would you like to go?</Text>
      </View>

      {/* Navigation Cards */}
      <View style={styles.cardsContainer}>
        {HOME_CARDS.map((card) => (
          <HomeCard
            key={card.id}
            card={card}
            onPress={() => handleCardPress(card.route)}
          />
        ))}
      </View>
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  profileButton: {
    width: 32,
    height: 32,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray,
  },
  welcomeSection: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.ink,
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  card: {
    borderRadius: 16,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    height: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  cardContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  cardButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
}); 