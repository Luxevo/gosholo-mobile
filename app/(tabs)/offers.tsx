import { OfferCard } from '@/components/OfferCard';
import OfferDetailModal from '@/components/OfferDetailModal';
import { AppHeader } from '@/components/shared/AppHeader';
import { CategoriesSection, type Category } from '@/components/shared/CategoriesSection';
import { FiltersSection, type Filter } from '@/components/shared/FiltersSection';
import { PromoBanner } from '@/components/shared/PromoBanner';
import { SearchBar } from '@/components/shared/SearchBar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCategories } from '@/hooks/useCategories';
import { useOffers } from '@/hooks/useOffers';
import { Offer } from '@/lib/supabase';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

const getFiltersConfig = (t: any): Filter[] => [
  { id: 'all', label: t('all') },
  { id: 'near-100m', label: '100m' },
  { id: 'near-250m', label: '250m' },
  { id: 'near-500m', label: '500m' },
  { id: 'near-1km', label: '1km' },
];

export default function OffersScreen() {
  const { t, i18n } = useTranslation();
  const { offers, loading, error, refetch } = useOffers();
  const { categories: dbCategories } = useCategories();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userCity, setUserCity] = useState<string>('');

  // Get user location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.longitude, location.coords.latitude]);

        // Reverse geocode to get city name
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          if (address.city) {
            setUserCity(address.city);
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
      }
    })();
  }, []);

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

  // Helper: Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter offers by search query and selected category
  const filteredOffers = useMemo(() => {
    let filtered = activeOffers;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((offer) =>
        offer.title?.toLowerCase().includes(query) ||
        offer.description?.toLowerCase().includes(query) ||
        offer.commerces?.name?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((offer) => {
        return offer.commerces?.category_id === Number(selectedCategory);
      });
    }

    // Filter by distance ranges
    if (selectedFilter && selectedFilter.startsWith('near-') && userLocation) {
      let radiusKm = 10;
      if (selectedFilter === 'near-100m') radiusKm = 0.1;
      else if (selectedFilter === 'near-250m') radiusKm = 0.25;
      else if (selectedFilter === 'near-500m') radiusKm = 0.5;
      else if (selectedFilter === 'near-1km') radiusKm = 1;

      filtered = filtered.filter((offer) => {
        const offerLat = offer.latitude || offer.commerces?.latitude;
        const offerLng = offer.longitude || offer.commerces?.longitude;

        if (!offerLat || !offerLng) return false;

        const distance = calculateDistance(
          userLocation[1],
          userLocation[0],
          Number(offerLat),
          Number(offerLng)
        );

        return distance <= radiusKm;
      });
    }

    return filtered;
  }, [activeOffers, searchQuery, selectedCategory, selectedFilter, userLocation]);

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

  // Convert database categories to UI categories
  const categories = useMemo(() => {
    const allCategory: Category = { id: 'all', label: t('all'), icon: 'square.grid.2x2' };
    const mapped: Category[] = dbCategories.map((cat) => ({
      id: String(cat.id),
      label: i18n.language === 'fr' ? cat.name_fr : cat.name_en,
    }));
    return [allCategory, ...mapped];
  }, [dbCategories, i18n.language, t]);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleFilterPress = (filterId: string) => {
    if (filterId === 'all') {
      setSelectedFilter(null); // Clear filter
    } else {
      setSelectedFilter(prev => prev === filterId ? null : filterId);
    }
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

  const hasNoOffers = activeOffers.length === 0;
  const hasNoFilteredOffers = filteredOffers.length === 0 && !hasNoOffers;

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
          location={userCity}
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
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryPress={handleCategoryPress}
          onSeeAllPress={() => setSelectedCategory('all')}
        />

        {/* Filters */}
        <FiltersSection
          filters={getFiltersConfig(t)}
          selectedFilter={selectedFilter || 'all'}
          onFilterPress={handleFilterPress}
        />

        {/* Offers */}
        {hasNoOffers && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="tag" size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>{t('no_offers_title')}</Text>
            <Text style={styles.emptyText}>{t('no_offers_sub')}</Text>
          </View>
        )}

        {hasNoFilteredOffers && (
          <View style={styles.emptyContainer}>
            <IconSymbol name="magnifyingglass" size={48} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>{t('no_results')}</Text>
            <Text style={styles.emptyText}>{t('try_different_filter')}</Text>
          </View>
        )}

        {!hasNoOffers && !hasNoFilteredOffers && filteredOffers.map((offer) => (
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
          // Fermer la modal avant de naviguer
          handleCloseModal();
          
          // Petit délai pour laisser la modal se fermer
          setTimeout(() => {
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
          }, 100);
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 8,
    textAlign: 'center',
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
