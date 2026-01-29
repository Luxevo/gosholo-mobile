import { EventCard } from '@/components/EventCard';
import EventDetailModal from '@/components/EventDetailModal';
import { LocationPicker, LocationPill } from '@/components/LocationPicker';
import { AppHeader } from '@/components/shared/AppHeader';
import { type Category } from '@/components/shared/CategoriesSection';
import { SearchBar } from '@/components/shared/SearchBar';
import { SkeletonList } from '@/components/SkeletonCard';
import { Toast } from '@/components/Toast';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocation } from '@/contexts/LocationContext';
import { useCategories } from '@/hooks/useCategories';
import { useEvents, EventWithCommerce } from '@/hooks/useEvents';
import { useFavorites } from '@/hooks/useFavorites';
import { useLikes } from '@/hooks/useLikes';
import { useMobileUser } from '@/hooks/useMobileUser';
import { matchesSearch } from '@/utils/searchUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Modal,
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

const getDateFiltersConfig = (t: any): Category[] => [
  { id: 'all', label: t('all'), icon: 'square.grid.2x2' },
  { id: 'ongoing', label: t('ongoing'), icon: 'play.circle' },
  { id: 'upcoming', label: t('upcoming'), icon: 'calendar' },
];

interface Filter {
  id: string;
  label: string;
}

const getDistanceFiltersConfig = (_t: any): Filter[] => [
  { id: 'near-100m', label: '100m' },
  { id: 'near-250m', label: '250m' },
  { id: 'near-500m', label: '500m' },
  { id: 'near-1km', label: '1km' },
];

export default function EventsScreen() {
  const { t, i18n } = useTranslation();
  const { activeLocation } = useLocation();
  const userLocation = activeLocation;
  const { profile } = useMobileUser();
  const { events, loading, error, refetch } = useEvents({ userLocation: userLocation || undefined });
  const { categories: dbCategories } = useCategories();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isLiked, toggleLike, getLikeCount, setLikeCount } = useLikes();

  const userName = profile?.first_name || profile?.username;
  const likeCountsInitialized = useRef(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithCommerce | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Initialize like counts from fetched events
  useEffect(() => {
    if (events.length > 0 && !likeCountsInitialized.current) {
      events.forEach(event => {
        if (event.like_count !== undefined) {
          setLikeCount('event', event.id, event.like_count);
        }
      });
      likeCountsInitialized.current = true;
    }
  }, [events, setLikeCount]);

  // Check for deep link data when screen focuses
  useFocusEffect(
    useCallback(() => {
      const checkDeepLink = async () => {
        try {
          const deepLinkData = await AsyncStorage.getItem('@gosholo_deep_link');
          if (deepLinkData) {
            const { type, id } = JSON.parse(deepLinkData);
            if (type === 'event' && id) {
              // Clear the deep link data immediately
              await AsyncStorage.removeItem('@gosholo_deep_link');
              // Find the event and open the modal
              const event = events.find(e => e.id === id);
              if (event) {
                setSelectedEvent(event);
                setShowModal(true);
              }
            }
          }
        } catch (error) {
          console.error('Error checking deep link:', error);
        }
      };

      // Only check if events are loaded
      if (events.length > 0) {
        checkDeepLink();
      }
    }, [events])
  );

  // Treats date-only (YYYY-MM-DD) as active through end of that day (UTC)
  const isEventActive = (end_date?: string | null, now: Date = new Date()) => {
    if (!end_date) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
      const end = new Date(`${end_date}T23:59:59Z`);
      return end.getTime() >= now.getTime();
    }
    const end = new Date(end_date);
    return !Number.isNaN(end.getTime()) && end.getTime() >= now.getTime();
  };

  const activeEvents = useMemo(() => {
    return (events ?? []).filter((e) => isEventActive((e as any).end_date));
  }, [events]);

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

  // Filter events by search, date and distance
  const filteredEvents = useMemo(() => {
    let filtered = activeEvents;

    // Filter by search query (accent-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      filtered = filtered.filter((event) =>
        matchesSearch(event.title, query) ||
        matchesSearch(event.description, query) ||
        matchesSearch(event.commerces?.name, query) ||
        matchesSearch(event.commerces?.category?.name_fr, query) ||
        matchesSearch(event.commerces?.category?.name_en, query)
      );
    }

    // Filter by categories (multi-select)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((event) => {
        return selectedCategories.includes(String(event.commerces?.category_id));
      });
    }

    // Filter by date ranges
    if (selectedDateFilter && selectedDateFilter !== 'all') {
      const now = new Date();

      filtered = filtered.filter((event) => {
        if (!event.start_date) return false;
        const startDate = new Date(event.start_date);
        const endDate = event.end_date ? new Date(event.end_date) : null;

        if (selectedDateFilter === 'ongoing') {
          // Event has started but hasn't ended yet
          const hasStarted = startDate <= now;
          const hasntEnded = !endDate || endDate >= now;
          return hasStarted && hasntEnded;
        } else if (selectedDateFilter === 'upcoming') {
          // Event hasn't started yet
          return startDate > now;
        }

        return true;
      });
    }

    // Filter by distance ranges
    if (selectedFilter && selectedFilter.startsWith('near-') && userLocation) {
      let radiusKm = 10;
      if (selectedFilter === 'near-100m') radiusKm = 0.1;
      else if (selectedFilter === 'near-250m') radiusKm = 0.25;
      else if (selectedFilter === 'near-500m') radiusKm = 0.5;
      else if (selectedFilter === 'near-1km') radiusKm = 1;

      filtered = filtered.filter((event) => {
        const eventLat = event.latitude || event.commerces?.latitude;
        const eventLng = event.longitude || event.commerces?.longitude;

        if (!eventLat || !eventLng) return false;

        const distance = calculateDistance(
          userLocation[1],
          userLocation[0],
          Number(eventLat),
          Number(eventLng)
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
  }, [activeEvents, searchQuery, selectedCategories, selectedDateFilter, selectedFilter, userLocation]);

  const handleEventPress = (event: EventWithCommerce) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleFavoritePress = async (eventId: string) => {
    const result = await toggleFavorite('event', eventId);

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

  const handleLikePress = async (eventId: string) => {
    const result = await toggleLike('event', eventId);

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

  const handleDateFilterPress = (filterId: string) => {
    if (filterId === 'all') {
      setSelectedDateFilter(null); // Clear filter
    } else {
      setSelectedDateFilter(prev => prev === filterId ? null : filterId);
    }
  };

  const handleFilterPress = (filterId: string) => {
    setSelectedFilter(prev => prev === filterId ? null : filterId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Fixed Header Section - shown immediately */}
        <View style={styles.fixedHeader}>
          <AppHeader userName={userName} avatarId={profile?.avatar_url} />
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('search_placeholder_events')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            <LocationPill onPress={() => setShowLocationPicker(true)} compact />
            <TouchableOpacity style={styles.categoryButton} onPress={() => setShowCategoryModal(true)}>
              <IconSymbol name="plus" size={12} color={COLORS.primary} />
              <Text style={styles.categoryButtonText}>{t('categories')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton} onPress={() => setShowDistanceModal(true)}>
              <IconSymbol name="location" size={12} color={COLORS.primary} />
              <Text style={styles.categoryButtonText}>{t('distance')}</Text>
            </TouchableOpacity>
            {getDateFiltersConfig(t).map((filter) => (
              <TouchableOpacity key={filter.id} style={styles.filterPill}>
                <Text style={styles.filterPillText}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Only cards show skeleton */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <SkeletonList count={3} type="event" />
        </ScrollView>
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

  if (activeEvents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <IconSymbol name="calendar" size={48} color={COLORS.darkGray} />
          <Text style={styles.title}>{t('no_events_title')}</Text>
          <Text style={styles.text}>{t('no_events_sub')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header Section */}
      <View style={styles.fixedHeader}>
        {/* Header */}
        <AppHeader
          userName={userName}
          avatarId={profile?.avatar_url}
          onProfilePress={() => router.push('/(tabs)/profile')}
        />

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('search_placeholder_events')}
        />

        {/* Filter Pills Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          <LocationPill onPress={() => setShowLocationPicker(true)} compact />
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategories.length > 0 && styles.categoryButtonActive
            ]}
            onPress={() => setShowCategoryModal(true)}
          >
            <IconSymbol
              name="plus"
              size={12}
              color={selectedCategories.length > 0 ? COLORS.white : COLORS.primary}
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategories.length > 0 && styles.categoryButtonTextActive
            ]}>
              {selectedCategories.length > 0
                ? t('categories_with_count', { count: selectedCategories.length })
                : t('categories')
              }
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedFilter && styles.categoryButtonActive
            ]}
            onPress={() => setShowDistanceModal(true)}
          >
            <IconSymbol
              name="location"
              size={12}
              color={selectedFilter ? COLORS.white : COLORS.primary}
            />
            <Text style={[
              styles.categoryButtonText,
              selectedFilter && styles.categoryButtonTextActive
            ]}>
              {selectedFilter
                ? getDistanceFiltersConfig(t).find(f => f.id === selectedFilter)?.label || t('distance')
                : t('distance')
              }
            </Text>
          </TouchableOpacity>
          {/* Date filters as pills */}
          {getDateFiltersConfig(t).map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterPill,
                selectedDateFilter === filter.id && styles.filterPillActive
              ]}
              onPress={() => handleDateFilterPress(filter.id)}
            >
              <Text style={[
                styles.filterPillText,
                selectedDateFilter === filter.id && styles.filterPillTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Event List */}
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => handleEventPress(event)}
            onFavoritePress={() => handleFavoritePress(event.id)}
            isFavorite={isFavorite('event', event.id)}
            onLikePress={() => handleLikePress(event.id)}
            isLiked={isLiked('event', event.id)}
            likeCount={getLikeCount('event', event.id) || event.like_count}
          />
        ))}
      </ScrollView>

      <EventDetailModal
        visible={showModal}
        event={selectedEvent}
        onClose={handleCloseModal}
        onFavoritePress={() => selectedEvent && handleFavoritePress(selectedEvent.id)}
        isFavorite={selectedEvent ? isFavorite('event', selectedEvent.id) : false}
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

      {/* Categories Modal - Multi-select */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowCategoryModal(false)}
            activeOpacity={1}
          />
          <View style={styles.categoryModalContainer}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>{t('categories')}</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <IconSymbol name="xmark" size={20} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            {/* Clear filters button */}
            {selectedCategories.length > 0 && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => setSelectedCategories([])}
              >
                <IconSymbol name="xmark.circle.fill" size={16} color={COLORS.primary} />
                <Text style={styles.clearFiltersText}>{t('clear_filters')}</Text>
              </TouchableOpacity>
            )}

            <ScrollView style={styles.categoryModalScroll}>
              {dbCategories.map((cat) => {
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
            </ScrollView>

            {/* Apply button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.applyButtonText}>
                {selectedCategories.length > 0
                  ? `${t('apply')} (${selectedCategories.length})`
                  : t('apply')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Distance Modal */}
      <Modal visible={showDistanceModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowDistanceModal(false)}
            activeOpacity={1}
          />
          <View style={styles.categoryModalContainer}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>{t('distance')}</Text>
              <TouchableOpacity onPress={() => setShowDistanceModal(false)}>
                <IconSymbol name="xmark" size={20} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            {selectedFilter && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSelectedFilter(null);
                  setShowDistanceModal(false);
                }}
              >
                <IconSymbol name="xmark.circle.fill" size={16} color={COLORS.primary} />
                <Text style={styles.clearFiltersText}>{t('clear_filters')}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.distanceOptions}>
              {getDistanceFiltersConfig(t).map((filter) => {
                const isSelected = selectedFilter === filter.id;
                return (
                  <TouchableOpacity
                    key={filter.id}
                    style={[
                      styles.distanceOption,
                      isSelected && styles.distanceOptionActive
                    ]}
                    onPress={() => {
                      handleFilterPress(filter.id);
                      setShowDistanceModal(false);
                    }}
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  fixedHeader: {
    backgroundColor: COLORS.white,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingBottom: 4,
  },
  locationPillContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },

  /* States */
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  text: { fontSize: 16, color: COLORS.darkGray, textAlign: 'center', marginTop: 12 },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  // Category button and modal styles
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  categoryButtonTextActive: {
    color: COLORS.white,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: COLORS.white,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  categoryModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  categoryModalScroll: {
    maxHeight: 400,
  },
  categoryModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  categoryModalItemActive: {
    backgroundColor: 'rgba(255, 98, 51, 0.08)',
  },
  categoryModalItemText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  categoryCheckbox: {
    width: 24,
    height: 24,
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
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
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
    padding: 16,
    gap: 12,
  },
  distanceOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  distanceOptionTextActive: {
    color: COLORS.white,
  },
});
