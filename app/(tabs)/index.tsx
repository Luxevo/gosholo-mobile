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

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>olo</Text>
          <View style={styles.locationContainer}>
            <IconSymbol name="location.fill" size={12} color={COLORS.green} />
            <Text style={styles.locationText}>New York</Text>
          </View>
        </View>
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
            placeholder="Search restaurants, cuisines, or events..."
            placeholderTextColor={COLORS.darkGray}
          />
          <TouchableOpacity style={styles.searchButton}>
            <IconSymbol name="magnifyingglass" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <TouchableOpacity style={[styles.categoryButton, styles.activeCategory]}>
              <IconSymbol name="fork.knife" size={16} color={COLORS.white} />
              <Text style={styles.activeCategoryText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <IconSymbol name="clock" size={16} color={COLORS.darkGray} />
              <Text style={styles.categoryText}>Fast Food</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <IconSymbol name="globe" size={16} color={COLORS.darkGray} />
              <Text style={styles.categoryText}>Italian</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryButton}>
              <IconSymbol name="globe" size={16} color={COLORS.darkGray} />
              <Text style={styles.categoryText}>Asian</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <IconSymbol name="slider.horizontal.3" size={16} color={COLORS.black} />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterOption}>
            <Text style={styles.filterText}>Near Me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterOption}>
            <Text style={styles.filterText}>Highly Rated</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterOption}>
            <Text style={styles.filterText}>Open Now</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Now */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Now</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {/* Restaurant Cards */}
          <View style={styles.restaurantCard}>
            <View style={styles.cardImageContainer}>
              <View style={styles.cardImage} />
              <View style={styles.ratingBadge}>
                <IconSymbol name="star.fill" size={12} color={COLORS.green} />
                <Text style={styles.ratingText}>4.8 (120+)</Text>
              </View>
              <TouchableOpacity style={styles.favoriteButton}>
                <IconSymbol name="heart" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>Burger & Lobster</Text>
                <Text style={styles.restaurantCuisine}>American, Seafood</Text>
                <Text style={styles.deliveryInfo}>15-25 min • 1.2 miles away</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>20% Off</Text>
                </View>
                <View style={styles.deliveryBadge}>
                  <Text style={styles.deliveryText}>Free Delivery</Text>
                </View>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>$$$</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.restaurantCard}>
            <View style={styles.cardImageContainer}>
              <View style={styles.cardImage} />
              <View style={styles.ratingBadge}>
                <IconSymbol name="star.fill" size={12} color={COLORS.green} />
                <Text style={styles.ratingText}>4.6 (95+)</Text>
              </View>
              <TouchableOpacity style={styles.favoriteButton}>
                <IconSymbol name="heart" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>Pasta Paradise</Text>
                <Text style={styles.restaurantCuisine}>Italian, Pasta</Text>
                <Text style={styles.deliveryInfo}>20-30 min • 0.8 miles away</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceText}>$$</Text>
                </View>
              </View>
            </View>
          </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.teal,
    marginRight: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 4,
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  categoriesScroll: {
    paddingLeft: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
  },
  activeCategory: {
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    marginLeft: 4,
  },
  restaurantCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImageContainer: {
    position: 'relative',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.gray,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: COLORS.gray,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
    marginLeft: 4,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
    backgroundColor: COLORS.teal,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  restaurantInfo: {
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: COLORS.white,
  },
  restaurantCuisine: {
    fontSize: 14,
    marginBottom: 4,
    color: COLORS.white,
  },
  deliveryInfo: {
    fontSize: 12,
    color: COLORS.white,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: COLORS.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.black,
  },
  deliveryBadge: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  priceBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
}); 