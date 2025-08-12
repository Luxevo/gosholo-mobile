import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { EventCard } from '@/components/EventCard';

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
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol name="line.3.horizontal" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <IconSymbol name="bell" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.avatar} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search food events, workshops..."
            placeholderTextColor={COLORS.darkGray}
          />
          <TouchableOpacity style={styles.searchButton}>
            <IconSymbol name="magnifyingglass" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <View style={styles.categoryFilters}>
          <TouchableOpacity style={[styles.categoryFilter, styles.activeCategoryFilter]}>
            <IconSymbol name="flame.fill" size={16} color={COLORS.white} />
            <Text style={styles.activeCategoryText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryFilter}>
            <IconSymbol name="flame" size={16} color={COLORS.darkGray} />
            <Text style={styles.categoryText}>Trending</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryFilter}>
            <IconSymbol name="fork.knife" size={16} color={COLORS.darkGray} />
            <Text style={styles.categoryText}>Food Fest</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryFilter}>
            <IconSymbol name="cup.and.saucer" size={16} color={COLORS.darkGray} />
            <Text style={styles.categoryText}>Coffee</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryFilter}>
            <IconSymbol name="hammer" size={16} color={COLORS.darkGray} />
            <Text style={styles.categoryText}>Workshop</Text>
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <EventCard
            title="Midtown Food Festival"
            location="Central Park, Midtown"
            dateTime="Sat, May 25 • 6-10 PM"
            attendees="1.2k+ attending"
            type="Food Fest"
            category="Trending"
            isFree={true}
            onGetTickets={() => console.log('Get Tickets pressed')}
            onViewDetails={() => console.log('View Details pressed')}
            onSave={() => console.log('Save pressed')}
          />

          <EventCard
            title="Barista Latte Art Workshop"
            location="BrewLab Café, Downtown"
            dateTime="Sun, May 28 • 2-4 PM"
            spotsLeft={32}
            type="Workshop"
            category="Coffee"
            price="$20"
            onBookNow={() => console.log('Book Now pressed')}
            onViewDetails={() => console.log('View Details pressed')}
            onSave={() => console.log('Save pressed')}
          />

          <EventCard
            title="Chef Pop-up Experience"
            location="Rooftop Garden, SoHo"
            dateTime="Fri, Jun 2 • 7-11 PM"
            attendees="500+ attending"
            type="Pop-up"
            category="Food Fest"
            price="$45"
            onGetTickets={() => console.log('Get Tickets pressed')}
            onViewDetails={() => console.log('View Details pressed')}
            onSave={() => console.log('Save pressed')}
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
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
});