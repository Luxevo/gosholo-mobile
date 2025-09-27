import CompactLanguageSwitcher from '@/components/CompactLanguageSwitcher';
import HomeCard, { HomeCardData } from '@/components/HomeCard';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View
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


export default function HomeScreen() {
  const { t } = useTranslation();

  const handleCardPress = (route: string) => {
    router.push(route as any);
  };

  // Generate cards with translations
  const HOME_CARDS: HomeCardData[] = [
    {
      id: 'explore',
      title: t('explore_nearby'),
      subtitle: t('explore_nearby_subtitle'),
      image: require('@/assets/images/ui/map.png'),
      route: '/compass',
      hasButton: true,
      buttonText: t('open_map'),
    },
    {
      id: 'offers',
      title: t('special_offers'),
      subtitle: t('special_offers_subtitle'),
      image: require('@/assets/images/ui/offers.png'),
      route: '/offers',
      hasButton: true,
      buttonText: t('see_offers'),
    },
    {
      id: 'events',
      title: t('exciting_events'),
      subtitle: t('exciting_events_subtitle'),
      image: require('@/assets/images/ui/events.png'),
      route: '/events',
      hasButton: true,
      buttonText: t('see_events'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Absolute Language Switcher */}
      <CompactLanguageSwitcher style={styles.languageSwitcher} />

      {/* Welcome Section */}
      <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/darker-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.tagline}>
              {t('welcome_subtitle')}
            </Text>
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
  languageSwitcher: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : SPACING.xl + 10,
    right: SPACING.xl,
    zIndex: 10,
  },
  logoSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  profileButton: {
    width: 32,
    height: 32,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  logo: {
    width: 280,
    height: 90,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray,
  },
  welcomeSection: {
    paddingTop:10,
    ...Platform.select({
      ios: {
        paddingVertical: 32,
      },
      android: {
        paddingBottom: 0,
      },

    }),
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