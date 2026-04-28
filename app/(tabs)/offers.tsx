import { AdBanner } from '@/components/AdBanner';
import { LocationPicker, LocationPill } from '@/components/LocationPicker';
import { OfferCard } from '@/components/OfferCard';
import OfferDetailModal from '@/components/OfferDetailModal';
import { AppHeader } from '@/components/shared/AppHeader';
import { Toast } from '@/components/Toast';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocation } from '@/contexts/LocationContext';
import { useCategories } from '@/hooks/useCategories';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { useMobileUser } from '@/hooks/useMobileUser';
import { useOffers, OfferWithCommerce } from '@/hooks/useOffers';
import { useAd } from '@/hooks/useAd';
import { matchesSearch } from '@/utils/searchUtils';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

interface Filter {
  id: string;
  label: string;
}

const getFiltersConfig = (_t: any): Filter[] => [
  { id: 'near-100m', label: '100m' },
  { id: 'near-250m', label: '250m' },
  { id: 'near-500m', label: '500m' },
  { id: 'near-1km', label: '1km' },
];

export default function OffersScreen() {
  const { t, i18n } = useTranslation();
  const { activeLocation } = useLocation();
  const userLocation = activeLocation;
  const { profile } = useMobileUser();
  const ad = useAd();
  const { offers, loading, error, refetch } = useOffers({ userLocation: userLocation || undefined });
  const { categories: dbCategories } = useCategories();
  const { isFavorite, toggleFavorite, isLoggedIn } = useFavorites();
  const { isLiked, toggleLike, getLikeCount, setLikeCount } = useLikes();

  const userName = profile?.first_name || profile?.username;
  const likeCountsInitialized = useRef(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithCommerce | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Initialize like counts from fetched offers
  useEffect(() => {
    if (offers.length > 0 && !likeCountsInitialized.current) {
      offers.forEach(offer => {
        if (offer.like_count !== undefined) {
          setLikeCount('offer', offer.id, offer.like_count);
        }
      });
      likeCountsInitialized.current = true;
    }
  }, [offers, setLikeCount]);


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
        matchesSearch(offer.commerces?.name, query) ||
        matchesSearch(offer.commerces?.category?.name_fr, query) ||
        matchesSearch(offer.commerces?.category?.name_en, query)
      );
    }

    // Filter by categories (multi-select)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((offer) => {
        return selectedCategories.includes(String(offer.commerces?.category_id));
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

    // Sort by distance (closest to farthest) if user location available
    if (userLocation) {
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
  }, [activeOffers, searchQuery, selectedCategories, selectedFilter, userLocation]);

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

  const handleFilterPress = (filterId: string) => {
    setSelectedFilter(prev => prev === filterId ? null : filterId);
  };


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
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        <AppHeader
          userName={userName}
          avatarId={profile?.avatar_url}
          onProfilePress={() => router.push('/(tabs)/profile')}
        />

        <View style={styles.headerActions}>
          <View style={styles.headerSearchContainer}>
            <IconSymbol name="magnifyingglass" size={14} color={COLORS.darkGray} />
            <TextInput
              style={styles.headerSearchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('search_placeholder_offers')}
              placeholderTextColor={COLORS.darkGray}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={14} color={COLORS.darkGray} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              (selectedCategories.length > 0 || selectedFilter) && styles.filterButtonActive
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <IconSymbol
              name="line.3.horizontal.decrease"
              size={14}
              color={(selectedCategories.length > 0 || selectedFilter) ? COLORS.white : COLORS.primary}
            />
            {(selectedCategories.length + (selectedFilter ? 1 : 0)) > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {selectedCategories.length + (selectedFilter ? 1 : 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <LocationPill onPress={() => setShowLocationPicker(true)} compact />
        </View>
      </View>

      {/* Scrollable Content */}
      {(hasNoOffers || hasNoFilteredOffers) ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
        >
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
        </ScrollView>
      ) : (
        <FlatList
          data={filteredOffers}
          keyExtractor={(item) => item.id}
          renderItem={({ item: offer, index }) => (
            <>
              <OfferCard
                offer={offer}
                onPress={() => handleOfferPress(offer)}
                onFavoritePress={() => handleFavoritePress(offer.id)}
                isFavorite={isFavorite('offer', offer.id)}
                onLikePress={() => handleLikePress(offer.id)}
                isLiked={isLiked('offer', offer.id)}
                likeCount={getLikeCount('offer', offer.id) || offer.like_count}
              />
              {index === 0 && ad && <AdBanner ad={ad} />}
            </>
          )}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
        />
      )}

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

      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
      />

      {/* Unified Filter Modal */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowFilterModal(false)}
            activeOpacity={1}
          />
          <View style={styles.filterModalContainer}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{t('filters')}</Text>
              {(selectedCategories.length > 0 || selectedFilter) && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCategories([]);
                    setSelectedFilter(null);
                  }}
                >
                  <Text style={styles.clearAllText}>{t('clear_filters')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <IconSymbol name="xmark" size={20} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalScroll} keyboardShouldPersistTaps="handled">
              {/* Distance */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('distance')}</Text>
                <View style={styles.distanceOptions}>
                  {getFiltersConfig(t).map((filter) => {
                    const isSelected = selectedFilter === filter.id;
                    return (
                      <TouchableOpacity
                        key={filter.id}
                        style={[
                          styles.distanceOption,
                          isSelected && styles.distanceOptionActive
                        ]}
                        onPress={() => handleFilterPress(filter.id)}
                      >
                        <Text style={[
                          styles.distanceOptionText,
                          isSelected && styles.distanceOptionTextActive
                        ]}>
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Categories */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{t('categories')}</Text>
                <View style={styles.categorySearchContainer}>
                  <IconSymbol name="magnifyingglass" size={14} color={COLORS.darkGray} />
                  <TextInput
                    style={styles.categorySearchInput}
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                    placeholder={t('search_categories')}
                    placeholderTextColor={COLORS.darkGray}
                  />
                  {categorySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setCategorySearch('')}>
                      <IconSymbol name="xmark.circle.fill" size={14} color={COLORS.darkGray} />
                    </TouchableOpacity>
                  )}
                </View>
                {dbCategories.filter((cat) => {
                  if (!categorySearch.trim()) return true;
                  const q = categorySearch.trim().toLowerCase();
                  return cat.name_fr?.toLowerCase().includes(q) || cat.name_en?.toLowerCase().includes(q);
                }).map((cat) => {
                  const isSelected = selectedCategories.includes(String(cat.id));
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryModalItem,
                        isSelected && styles.categoryModalItemActive
                      ]}
                      onPress={() => {
                        setSelectedCategories(prev =>
                          isSelected
                            ? prev.filter(id => id !== String(cat.id))
                            : [...prev, String(cat.id)]
                        );
                      }}
                    >
                      <Text style={styles.categoryModalItemText}>
                        {i18n.language === 'fr' ? cat.name_fr : cat.name_en}
                      </Text>
                      <View style={[
                        styles.categoryCheckbox,
                        isSelected && styles.categoryCheckboxActive
                      ]}>
                        {isSelected && (
                          <IconSymbol name="checkmark" size={12} color={COLORS.white} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>{t('apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  fixedHeader: {
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  locationPillContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  // Header actions row
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  headerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 32,
    gap: 6,
    flexShrink: 1,
    flexGrow: 1,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.black,
    paddingVertical: 0,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray,
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Filter modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  filterModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
    gap: 12,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    flex: 1,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterModalScroll: {
    maxHeight: 500,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
  },
  categorySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
    marginBottom: 8,
  },
  categorySearchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  categoryModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  categoryModalItemActive: {
    backgroundColor: 'rgba(255, 98, 51, 0.05)',
  },
  categoryModalItemText: {
    fontSize: 15,
    color: COLORS.black,
    flex: 1,
  },
  categoryCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCheckboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  distanceOption: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  distanceOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  distanceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  distanceOptionTextActive: {
    color: COLORS.white,
  },
});
