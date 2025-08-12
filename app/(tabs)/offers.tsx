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
import { RestaurantCard } from '@/components/RestaurantCard';

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

export default function OffersScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exclusive Offers</Text>
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
            placeholder="Search offers, restaurants..."
            placeholderTextColor={COLORS.darkGray}
          />
          <TouchableOpacity style={styles.searchButton}>
            <IconSymbol name="magnifyingglass" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Promotional Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Get up to 40% OFF!</Text>
            <Text style={styles.promoSubtitle}>
              Limited time deals at your favorite restaurants in New York.
            </Text>
            <TouchableOpacity style={styles.seeDealsButton}>
              <Text style={styles.seeDealsText}>See Deals</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoIcon}>
            <IconSymbol name="percent" size={40} color={COLORS.primary} />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity style={[styles.filterTab, styles.activeFilterTab]}>
            <IconSymbol name="tag.fill" size={16} color={COLORS.white} />
            <Text style={styles.activeFilterText}>All Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterText}>Near Me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterText}>Free Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterTab}>
            <Text style={styles.filterText}>Dine-in Only</Text>
          </TouchableOpacity>
        </View>

        {/* Offers List */}
        <View style={styles.offersSection}>
          <RestaurantCard
            name="Crispy Bites"
            cuisine="Fast Food • Burgers"
            deliveryInfo="Min. spend $20 • 1.1 miles"
            rating={4.2}
            reviewCount={112}
            type="offers"
            badges={[
              { text: '40% OFF', type: 'discount' },
              { text: 'Free Delivery', type: 'delivery' },
              { text: '$$', type: 'price' },
            ]}
            onPress={() => console.log('Crispy Bites pressed')}
            onFavoritePress={() => console.log('Favorite pressed')}
          />

          <RestaurantCard
            name="Napoli Pizza"
            cuisine="Italian • Pizza"
            deliveryInfo="Dine-in Only • 0.6 miles"
            rating={4.7}
            reviewCount={289}
            type="offers"
            badges={[
              { text: 'Buy 1 Get 1', type: 'discount' },
              { text: '$$$', type: 'price' },
            ]}
            onPress={() => console.log('Napoli Pizza pressed')}
            onFavoritePress={() => console.log('Favorite pressed')}
          />

          <RestaurantCard
            name="Sushi Master"
            cuisine="Japanese • Sushi"
            deliveryInfo="25-30 min • 1.5 miles"
            rating={4.8}
            reviewCount={156}
            type="offers"
            badges={[
              { text: '30% OFF', type: 'discount' },
              { text: 'Free Delivery', type: 'delivery' },
              { text: '$$$$', type: 'price' },
            ]}
            onPress={() => console.log('Sushi Master pressed')}
            onFavoritePress={() => console.log('Favorite pressed')}
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
  backButton: {
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
  promoBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  promoSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 20,
  },
  seeDealsButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  seeDealsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  promoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginLeft: 6,
  },
  activeFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 6,
  },
  offersSection: {
    paddingBottom: 20,
  },
});