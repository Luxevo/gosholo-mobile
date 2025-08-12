import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { RestaurantCard } from '@/components/RestaurantCard';
import * as Location from 'expo-location';

// Conditional import for Mapbox (only works in native builds)
let Mapbox: any, MapView: any, Camera: any, LocationPuck: any, PointAnnotation: any;
try {
  const MapboxMaps = require('@rnmapbox/maps');
  Mapbox = MapboxMaps.default;
  MapView = MapboxMaps.MapView;
  Camera = MapboxMaps.Camera;
  LocationPuck = MapboxMaps.LocationPuck;
  PointAnnotation = MapboxMaps.PointAnnotation;
} catch (error) {
  console.log('Mapbox not available in Expo Go - using fallback');
}

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

// Initialize Mapbox (only if available)
if (Mapbox) {
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZ29zaG9sb2RldiIsImEiOiJjbWU5MWk2azMwbHVoMmxvcGE1eGtremU0In0.q2nBfy2FIzS69h7sYrkOzQ');
}

export default function CompassScreen() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Sample restaurant locations
  const restaurantLocations = [
    { id: '1', name: 'Burger Bliss', coordinates: [-74.006, 40.7128] },
    { id: '2', name: 'Cozy Corner Café', coordinates: [-74.0059, 40.7127] },
    { id: '3', name: 'Pizza Paradise', coordinates: [-74.0058, 40.7129] },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasLocationPermission(true);
        getCurrentLocation();
      }
    } catch (error) {
      console.log('Location permission error:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation([location.coords.longitude, location.coords.latitude]);
    } catch (error) {
      console.log('Get location error:', error);
      // Default to NYC coordinates
      setUserLocation([-74.006, 40.7128]);
    }
  };

  const handleUseMyLocation = () => {
    if (hasLocationPermission) {
      getCurrentLocation();
    } else {
      requestLocationPermission();
    }
  };

  const handleOpenMap = () => {
    Alert.alert('Open Map', 'Opening full map view...');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol name="line.3.horizontal" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
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
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor={COLORS.darkGray}
          />
          <TouchableOpacity style={styles.searchButton}>
            <IconSymbol name="magnifyingglass" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapContainer}>
            {Mapbox && MapView ? (
              <MapView
                style={styles.map}
                styleURL={Mapbox.StyleURL.Street}
                zoomEnabled={true}
                scrollEnabled={true}
              >
                <Camera
                  centerCoordinate={userLocation || [-74.006, 40.7128]}
                  zoomLevel={14}
                  animationDuration={1000}
                />
                
                {hasLocationPermission && userLocation && (
                  <LocationPuck
                    puckBearing="heading"
                    puckBearingEnabled
                    topImage="topImage"
                    visible={true}
                  />
                )}

                {restaurantLocations.map((restaurant) => (
                  <PointAnnotation
                    key={restaurant.id}
                    id={restaurant.id}
                    coordinate={restaurant.coordinates as [number, number]}
                  >
                    <View style={styles.markerContainer}>
                      <View style={styles.marker}>
                        <IconSymbol name="fork.knife" size={16} color={COLORS.white} />
                      </View>
                    </View>
                  </PointAnnotation>
                ))}
              </MapView>
            ) : (
              // Fallback for Expo Go
              <View style={styles.mapFallback}>
                <View style={styles.mapGrid}>
                  {restaurantLocations.map((restaurant) => (
                    <View key={restaurant.id} style={styles.mapIcon}>
                      <IconSymbol name="fork.knife" size={12} color={COLORS.white} />
                    </View>
                  ))}
                </View>
                <Text style={styles.mapFallbackText}>
                  📍 Interactive map available in native build
                </Text>
              </View>
            )}
            
            <TouchableOpacity style={styles.locationButton} onPress={handleUseMyLocation}>
              <IconSymbol name="location.fill" size={16} color={COLORS.primary} />
              <Text style={styles.locationButtonText}>Use My Location</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.exploreSection}>
            <Text style={styles.exploreTitle}>Explore Nearby</Text>
            <Text style={styles.exploreSubtitle}>Find restaurants & events around you</Text>
            <TouchableOpacity style={styles.openMapButton} onPress={handleOpenMap}>
              <Text style={styles.openMapText}>Open Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.categoryFilters}>
          <TouchableOpacity style={[styles.categoryFilter, styles.activeCategoryFilter]}>
            <IconSymbol name="flame.fill" size={16} color={COLORS.white} />
            <Text style={styles.activeCategoryText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryFilter}>
            <IconSymbol name="cart.fill" size={16} color={COLORS.darkGray} />
            <Text style={styles.categoryText}>Fast Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryFilter}>
            <IconSymbol name="circle.fill" size={16} color={COLORS.darkGray} />
            <Text style={styles.categoryText}>Pizza</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryFilter}>
            <IconSymbol name="cup.and.saucer" size={16} color={COLORS.darkGray} />
            <Text style={styles.categoryText}>Café</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.categoryFilter}>
            <IconSymbol name="leaf.fill" size={16} color={COLORS.darkGray} />
            <Text style={styles.categoryText}>Asian</Text>
          </TouchableOpacity>
        </View>

        {/* Restaurant Cards */}
        <View style={styles.restaurantsSection}>
          <RestaurantCard
            name="Burger Bliss"
            cuisine="Burgers • Fast Food"
            deliveryInfo="Fast Food • 0.8 mi"
            rating={4.7}
            reviewCount={112}
            badges={[
              { text: 'Trending', type: 'trending' },
              { text: '$$', type: 'price' },
              { text: 'Free Delivery', type: 'delivery' },
            ]}
            specialBadge="Open"
            onPress={() => console.log('Burger Bliss pressed')}
            onFavoritePress={() => console.log('Favorite pressed')}
          />

          <RestaurantCard
            name="Cozy Corner Café"
            cuisine="Pizza • 1.2 mi"
            deliveryInfo="Pizza • 1.2 mi"
            rating={4.5}
            reviewCount={89}
            badges={[
              { text: 'Hot Now', type: 'hot' },
              { text: '$$', type: 'price' },
            ]}
            specialBadge="Open"
            onPress={() => console.log('Cozy Corner Café pressed')}
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
  mapSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    overflow: 'hidden',
    height: 180,
  },
  mapContainer: {
    position: 'relative',
    height: '100%',
  },
  map: {
    flex: 1,
    borderRadius: 16,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  mapFallback: {
    flex: 1,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  mapGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginBottom: 20,
  },
  mapIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapFallbackText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  locationButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  locationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  exploreSection: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  exploreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  exploreSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  openMapButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  openMapText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
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
  restaurantsSection: {
    paddingBottom: 20,
  },
});