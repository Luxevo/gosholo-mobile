import { EventCard } from '@/components/EventCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useEvents } from '@/hooks/useEvents';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function EventsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'this_week' | 'upcoming'>('all');
  
  const { events, loading, error, refetch } = useEvents({
    searchQuery,
    filterType: activeFilter,
  });

  const renderEvents = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={COLORS.darkGray} />
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (events.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol name="calendar" size={48} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>No events found</Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? `No events match "${searchQuery}"` 
              : 'Check back later for new events!'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.eventsSection}>
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => console.log('Event pressed:', event.id)}
            onFavoritePress={() => console.log('Favorite pressed:', event.id)}
          />
        ))}
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, workshops..."
            placeholderTextColor={COLORS.darkGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton}>
            <IconSymbol name="magnifyingglass" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >

        {/* Events List */}
        {renderEvents()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.teal,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    marginRight: 12,
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
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: COLORS.black,
  },
  searchButton: {
    padding: 8,
  },
  categoryFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
  },
  activeCategoryFilter: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginLeft: 6,
  },
  activeCategoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 6,
  },
  eventsSection: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
});