import { EventCard } from '@/components/EventCard';
import EventDetailModal from '@/components/EventDetailModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useEvents } from '@/hooks/useEvents';
import { Event } from '@/lib/supabase';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'music', label: 'Music' },
  { id: 'sports', label: 'Sports' },
  { id: 'art', label: 'Art' },
];

const FILTERS = [
  { id: 'filters', label: 'Filters' },
  { id: 'near-me', label: 'Near Me' },
  { id: 'this-week', label: 'This Week' },
  { id: 'free', label: 'Free' },
];

export default function EventsScreen() {
  const { t } = useTranslation();
  const { events, loading, error, refetch } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

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

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleFavoritePress = () => {
    console.log('Favorite pressed for event:', selectedEvent?.id);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleFilterPress = (filterId: string) => {
    setSelectedFilter((prev) => (prev === filterId ? null : filterId));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.text}>{t('loading_events')}</Text>
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.logoRow}>
            <Text style={styles.logoText}>olo</Text>
            <TouchableOpacity style={styles.locationChip}>
              <IconSymbol name="mappin.and.ellipse" size={14} color={COLORS.primary} />
              <Text style={styles.locationText}>New York</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.profileAvatarContainer}>
            <View style={styles.avatarCircle}>
              <IconSymbol name="person.crop.circle.fill" size={28} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <IconSymbol name="magnifyingglass" size={20} color={COLORS.darkGray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search concerts, exhibitions, or activities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.darkGray}
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  category.id === selectedCategory && styles.selectedCategoryChip,
                  category.id === 'all' && styles.allCategoryChip,
                ]}
                onPress={() => handleCategoryPress(category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category.id === selectedCategory && styles.selectedCategoryChipText,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                selectedFilter === filter.id && styles.selectedFilterChip,
              ]}
              onPress={() => handleFilterPress(filter.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter.id && styles.selectedFilterChipText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Event List */}
        {activeEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => handleEventPress(event)}
            onFavoritePress={() => console.log('Favorite pressed:', event.id)}
          />
        ))}
      </ScrollView>

      <EventDetailModal
        visible={showModal}
        event={selectedEvent}
        onClose={handleCloseModal}
        onFavoritePress={handleFavoritePress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollView: { flex: 1 },

  /* Header */
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoText: { fontSize: 24, fontWeight: 'bold', color: COLORS.primary, letterSpacing: -0.5 },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F8F1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  locationText: { marginLeft: 5, fontSize: 13, fontWeight: '500', color: COLORS.primary },
  profileAvatarContainer: { alignItems: 'center', justifyContent: 'center' },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Search Bar */
  searchContainer: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.white },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: COLORS.black },

  /* Categories */
  sectionContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  seeAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  categoriesContainer: { paddingBottom: 8 },
  categoryChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  allCategoryChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  selectedCategoryChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryChipText: { fontSize: 14, color: COLORS.darkGray },
  selectedCategoryChipText: { color: COLORS.white },

  /* Filters */
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 12, color: COLORS.darkGray },
  selectedFilterChipText: { color: COLORS.white },

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
});
