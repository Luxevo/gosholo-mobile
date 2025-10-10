import { OfferCard } from '@/components/OfferCard';
import OfferDetailModal from '@/components/OfferDetailModal';
import { AppHeader } from '@/components/shared/AppHeader';
import { CategoriesSection, type Category } from '@/components/shared/CategoriesSection';
import { FiltersSection, type Filter } from '@/components/shared/FiltersSection';
import { PromoBanner } from '@/components/shared/PromoBanner';
import { SearchBar } from '@/components/shared/SearchBar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useOffers } from '@/hooks/useOffers';
import { Offer } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#FF6233',
  white: '#FFFFFF',
  gray: '#F5F5F5',
  darkGray: '#666666',
  black: '#000000',
};

const getCategoriesConfig = (t: any): Category[] => [
  { id: 'all', label: t('all'), icon: 'fork.knife' },
  { id: 'fast-food', label: t('fast_food'), icon: 'fork.knife.circle.fill' },
  { id: 'italian', label: t('italian'), icon: 'fork.knife' },
  { id: 'asian', label: t('asian'), icon: 'takeoutbag.and.cup.and.straw' },
];

const getFiltersConfig = (t: any): Filter[] => [
  { id: 'filters', label: t('filters') },
  { id: 'near-me', label: t('near_me') },
  { id: 'highly-rated', label: t('highly_rated') },
  { id: 'open-now', label: t('open_now') },
];

export default function OffersScreen() {
  const { t } = useTranslation();
  const { offers, loading, error, refetch } = useOffers();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const isOfferActive = (end_date?: string | null, now: Date = new Date()) => {
    if (!end_date) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
      const end = new Date(`${end_date}T23:59:59Z`);
      return end.getTime() >= now.getTime();
    }
    const end = new Date(end_date);
    return !Number.isNaN(end.getTime()) && end.getTime() >= now.getTime();
  };

  const activeOffers = useMemo(() => {
    return (offers ?? []).filter((o) => isOfferActive((o as any).end_date));
  }, [offers]);

  const handleOfferPress = (offer: Offer) => {
    setSelectedOffer(offer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOffer(null);
  };

  const handleFavoritePress = () => {
    console.log('Favorite pressed for offer:', selectedOffer?.id);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleFilterPress = (filterId: string) => {
    setSelectedFilter(prev => prev === filterId ? null : filterId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>{t('loading_offers')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={COLORS.darkGray} />
          <Text style={styles.title}>{t('something_wrong')}</Text>
          <TouchableOpacity style={styles.button} onPress={refetch}>
            <Text style={styles.buttonText}>{t('try_again')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (activeOffers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <IconSymbol name="tag" size={48} color={COLORS.darkGray} />
          <Text style={styles.title}>{t('no_offers_title')}</Text>
          <Text style={styles.text}>{t('no_offers_sub')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <AppHeader
          location="Montréal"
          onLocationPress={() => console.log('Location pressed')}
          onNotificationPress={() => console.log('Notifications pressed')}
          onProfilePress={() => console.log('Profile pressed')}
        />

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('search_placeholder_offers')}
        />

        {/* Promo Banner */}
        <PromoBanner
          onPress={() => console.log('Promo banner pressed')}
        />

        {/* Categories */}
        <CategoriesSection
          categories={getCategoriesConfig(t)}
          selectedCategory={selectedCategory}
          onCategoryPress={handleCategoryPress}
          onSeeAllPress={() => console.log('See all categories')}
        />

        {/* Filters */}
        <FiltersSection
          filters={getFiltersConfig(t)}
          selectedFilter={selectedFilter}
          onFilterPress={handleFilterPress}
        />

        {/* Offers */}
        {activeOffers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            onPress={() => handleOfferPress(offer)}
            onFavoritePress={() => console.log('Favorite pressed:', offer.id)}
          />
          
        ))}
      </ScrollView>

      <OfferDetailModal
        visible={showModal}
        offer={selectedOffer}
        onClose={handleCloseModal}
        onFavoritePress={handleFavoritePress}
        onNavigateToMap={(address, coordinates) => {
          // Naviguer vers la carte avec l'itinéraire
          if (coordinates) {
            router.push({
              pathname: '/compass',
              params: { 
                destination: `${coordinates[0]},${coordinates[1]}`,
                type: 'coordinates'
              }
            });
          } else if (address) {
            router.push({
              pathname: '/compass',
              params: { 
                destination: address,
                type: 'address'
              }
            });
          } else {
            router.push('/compass');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },

  /* Loading & Error */
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
});
