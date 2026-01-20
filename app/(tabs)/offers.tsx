import { OfferCard } from '@/components/OfferCard';
import OfferDetailModal from '@/components/OfferDetailModal';
import { AppHeader } from '@/components/shared/AppHeader';
import { CategoriesSection, type Category } from '@/components/shared/CategoriesSection';
import { FiltersSection, type Filter } from '@/components/shared/FiltersSection';
import { SearchBar } from '@/components/shared/SearchBar';
import { Toast } from '@/components/Toast';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCategories } from '@/hooks/useCategories';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { useOffers, OfferWithCommerce } from '@/hooks/useOffers';
import { matchesSearch } from '@/utils/searchUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
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

const getFiltersConfig = (t: any, sortOrder: 'new_to_old' | 'old_to_new'): Filter[] => [
  { id: 'sort_toggle', label: sortOrder === 'new_to_old' ? `↓ ${t('recent') || 'Recent'}` : `↑ ${t('oldest') || 'Oldest'}` },
  { id: 'near-100m', label: '100m' },
  { id: 'near-250m', label: '250m' },
  { id: 'near-500m', label: '500m' },
  { id: 'near-1km', label: '1km' },
];

export default function OffersScreen() {
  const { t, i18n } = useTranslation();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [userCity, setUserCity] = useState<string>('');
  const { offers, loading, error, refetch } = useOffers({ userLocation });
  const { categories: dbCategories } = useCategories();
  const { isFavorite, toggleFavorite, isLoggedIn } = useFavorites();
  const { isLiked, toggleLike } = useLikes();
  const [selectedOffer, setSelectedOffer] = useState<OfferWithCommerce | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'new_to_old' | 'old_to_new'>('new_to_old');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

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

  // Check for deep link data when screen focuses
  useFocusEffect(
    useCallback(() => {
      const checkDeepLink = async () => {
        try {
          const deepLinkData = await AsyncStorage.getItem('@gosholo_deep_link');
          if (deepLinkData) {
            const { type, id } = JSON.parse(deepLinkData);
            if (type === 'offer' && id) {
              // Clear the deep link data immediately
              await AsyncStorage.removeItem('@gosholo_deep_link');
              // Find the offer and open the modal
              const offer = offers.find(o => o.id === id);
              if (offer) {
                setSelectedOffer(offer);
                setShowModal(true);
              }
            }
          }
        } catch (error) {
          console.error('Error checking deep link:', error);
        }
      };

      // Only check if offers are loaded
      if (offers.length > 0) {
        checkDeepLink();
      }
    }, [offers])
  );

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

    // Filter by search query (accent-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      filtered = filtered.filter((offer) =>
        matchesSearch(offer.title, query) ||
        matchesSearch(offer.description, query) ||
        matchesSearch(offer.commerces?.name, query)
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

    // Sort based on selectedFilter
    if (selectedFilter === 'sort_toggle') {
      // Sort by date when sort_toggle is selected
      filtered = [...filtered].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        if (sortOrder === 'new_to_old') {
          return dateB - dateA; // Newest first
        } else {
          return dateA - dateB; // Oldest first
        }
      });
    } else if (userLocation) {
      // Default: Sort by distance (closest to farthest)
      filtered = [...filtered].sort((a, b) => {
        const aLat = a.latitude || a.commerces?.latitude;
        const aLng = a.longitude || a.commerces?.longitude;
        const bLat = b.latitude || b.commerces?.latitude;
        const bLng = b.longitude || b.commerces?.longitude;

        const distA = (aLat && aLng) ? calculateDistance(userLocation[1], userLocation[0], Number(aLat), Number(aLng)) : Infinity;
        const distB = (bLat && bLng) ? calculateDistance(userLocation[1], userLocation[0], Number(bLat), Number(bLng)) : Infinity;

        return distA - distB;
      });
    }

    return filtered;
  }, [activeOffers, searchQuery, selectedCategory, selectedFilter, userLocation, sortOrder]);

  const handleOfferPress = (offer: OfferWithCommerce) => {
    setSelectedOffer(offer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOffer(null);
  };

  const handleFavoritePress = async (offerId: string) => {
    const result = await toggleFavorite('offer', offerId);

    if (result.needsLogin) {
      Alert.alert(
        t('login_to_favorite'),
        t('login_to_access_features'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/(auth)/login') }
        ]
      );
    } else if (result.success && result.action) {
      setToastMessage(result.action === 'added' ? t('added_to_favorites') : t('removed_from_favorites'));
      setShowToast(true);
    }
  };

  const handleLikePress = async (offerId: string) => {
    const result = await toggleLike('offer', offerId);

    if (result.needsLogin) {
      Alert.alert(
        t('login_required'),
        t('login_to_access_features'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/(auth)/login') }
        ]
      );
    } else if (result.success && result.action) {
      setToastMessage(result.action === 'liked' ? t('liked') : t('unliked'));
      setShowToast(true);
    }
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
    if (filterId === 'sort_toggle') {
      // Toggle sort order
      setSortOrder(prev => prev === 'new_to_old' ? 'old_to_new' : 'new_to_old');
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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

        {/* Categories */}
        <CategoriesSection
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryPress={handleCategoryPress}
          onSeeAllPress={() => setSelectedCategory('all')}
        />

        {/* Filters */}
        <FiltersSection
          filters={getFiltersConfig(t, sortOrder)}
          selectedFilter={selectedFilter}
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
            onFavoritePress={() => handleFavoritePress(offer.id)}
            isFavorite={isFavorite('offer', offer.id)}
            onLikePress={() => handleLikePress(offer.id)}
            isLiked={isLiked('offer', offer.id)}
            likeCount={offer.like_count}
          />
        ))}
      </ScrollView>

      <OfferDetailModal
        visible={showModal}
        offer={selectedOffer}
        onClose={handleCloseModal}
        onFavoritePress={() => selectedOffer && handleFavoritePress(selectedOffer.id)}
        isFavorite={selectedOffer ? isFavorite('offer', selectedOffer.id) : false}
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

      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
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
