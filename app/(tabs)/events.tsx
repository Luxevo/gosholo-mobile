import { EventCard } from '@/components/EventCard';
import EventDetailModal from '@/components/EventDetailModal';
import { AppHeader } from '@/components/shared/AppHeader';
import { CategoriesSection, type Category } from '@/components/shared/CategoriesSection';
import { FiltersSection, type Filter } from '@/components/shared/FiltersSection';
import { SearchBar } from '@/components/shared/SearchBar';
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
  { id: 'all', label: t('all'), icon: 'calendar' },
  { id: 'music', label: t('music'), icon: 'music.note' },
  { id: 'sports', label: t('sports'), icon: 'sportscourt' },
  { id: 'art', label: t('art'), icon: 'paintbrush' },
];

const getFiltersConfig = (t: any): Filter[] => [
  { id: 'filters', label: t('filters') },
  { id: 'near-me', label: t('near_me') },
  { id: 'this-week', label: t('this_week') },
  { id: 'free', label: t('free') },
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
          placeholder={t('search_placeholder_events')}
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
