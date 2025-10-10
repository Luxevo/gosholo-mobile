import BusinessDetailModal from '@/components/BusinessDetailModal';
import { LOGO_BASE64 } from '@/components/LogoBase64';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCommerces, type Commerce } from '@/hooks/useCommerces';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Conditional import for Mapbox (native builds only)
let Mapbox: any,
  MapView: any,
  Camera: any,
  LocationPuck: any,
  FillExtrusionLayer: any,
  PointAnnotation: any,
  MarkerView: any,
  RasterDemSource: any,
  Terrain: any,
  SkyLayer: any,
  ShapeSource: any,
  LineLayer: any;

try {
  const MapboxMaps = require('@rnmapbox/maps');
  Mapbox = MapboxMaps.default;
  MapView = MapboxMaps.MapView;
  Camera = MapboxMaps.Camera;
  LocationPuck = MapboxMaps.LocationPuck;
  FillExtrusionLayer = MapboxMaps.FillExtrusionLayer;
  PointAnnotation = MapboxMaps.PointAnnotation;
  MarkerView = MapboxMaps.MarkerView;
  RasterDemSource = MapboxMaps.RasterDemSource;
  Terrain = MapboxMaps.Terrain;
  SkyLayer = MapboxMaps.SkyLayer;
  ShapeSource = MapboxMaps.ShapeSource;
  LineLayer = MapboxMaps.LineLayer;
} catch (error) {
  console.log('Mapbox not available in Expo Go (use a dev build).');
}

// Initialize Mapbox
if (Mapbox) {
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
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

type LngLat = [number, number];

export default function CompassScreen() {
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Commerce | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showBusinessList, setShowBusinessList] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<LngLat[] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const cameraRef = useRef<any>(null);
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const { commerces, loading: commercesLoading, error: commercesError } = useCommerces();

  // Filter commerces based on search query
  const filteredCommerces = useMemo(() => {
    if (!searchQuery.trim()) return commerces;

    const query = searchQuery.toLowerCase();
    return commerces.filter((commerce) =>
      commerce.name?.toLowerCase().includes(query) ||
      commerce.category?.toLowerCase().includes(query) ||
      commerce.address?.toLowerCase().includes(query)
    );
  }, [commerces, searchQuery]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Handle navigation from offers/events
  useEffect(() => {
    if (params.destination && userLocation) {
      const destination = params.destination as string;
      const type = params.type as string;
      
      if (type === 'coordinates') {
        // Parse coordinates: "longitude,latitude"
        const [lng, lat] = destination.split(',').map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          fetchDirections([lng, lat]);
        }
      } else if (type === 'address') {
        // TODO: Implement geocoding for address
        console.log('Geocoding needed for address:', destination);
      }
    }
  }, [params, userLocation]);

  const requestLocationPermission = async () => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasLocationPermission(true);
        setPermissionDenied(false);
        await getCurrentLocation(true);
      } else {
        setHasLocationPermission(false);
        setPermissionDenied(!canAskAgain || status === 'denied');
      }
    } catch (error) {
      console.log('Location permission error:', error);
    }
  };

  const getCurrentLocation = async (animateCamera = false) => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const coord: LngLat = [loc.coords.longitude, loc.coords.latitude];
      setUserLocation(coord);

      if (cameraRef.current && animateCamera) {
        cameraRef.current.setCamera({
          centerCoordinate: coord,
          zoomLevel: 15,
          animationDuration: 800,
        });
      }
      return coord;
    } catch (error) {
      console.log('Get location error:', error);
    }
  };

  const fetchDirections = async (destination: LngLat) => {
    if (!userLocation) {
      console.log('User location not available');
      return;
    }

    try {
      const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const start = `${userLocation[0]},${userLocation[1]}`;
      const end = `${destination[0]},${destination[1]}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start};${end}?geometries=geojson&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        const distance = route.distance; // in meters
        const duration = route.duration; // in seconds

        setRouteCoordinates(coordinates);
        setRouteDistance(distance);
        setRouteDuration(duration);

        // Fit camera to show the entire route with extra bottom padding for route info pill
        if (cameraRef.current && userLocation) {
          cameraRef.current.fitBounds(
            userLocation,
            destination,
            [80, 50, 200, 50], // padding [top, right, bottom, left] - extra bottom for route pill
            1000 // animation duration
          );
        }
      }
    } catch (error) {
      console.log('Error fetching directions:', error);
    }
  };

  const clearRoute = () => {
    setRouteCoordinates(null);
    setRouteDistance(null);
    setRouteDuration(null);
  };

  const toggleMapStyle = () => setIs3D((v) => !v);

  const handleBusinessPress = (commerce: Commerce) => {
    setSelectedBusiness(commerce);
    setShowBusinessModal(true);
  };

  const handleCloseBusinessModal = () => {
    setShowBusinessModal(false);
    setSelectedBusiness(null);
  };

  const toggleBusinessList = () => {
    setShowBusinessList(!showBusinessList);
  };

  const categoryIcons = useMemo(
    () => ({
      Restaurant: '🍽️',
      Café: '☕',
      Boulangerie: '🥖',
      Épicerie: '🛒',
      Commerce: '🏪',
      Service: '🔧',
      Santé: '🏥',
      Beauté: '💄',
      Sport: '⚽',
      Culture: '🎭',
      Éducation: '📚',
      Autre: '📍',
    }),
    []
  );



  const getCategoryIcon = (category: string) => categoryIcons[category as keyof typeof categoryIcons] || '📍';

  const getBoostBadge = (commerce: Commerce) => {
    if (!commerce.boosted) return null;
    return t('boosted');
  };

  const getBoostBadgeColor = (commerce: Commerce) => {
    if (!commerce.boosted) return null;
    return '#FF6233'; // Primary color for visibility boost
  };

  const defaultCenter: LngLat = userLocation ?? [-74.006, 40.7128]; // fallback

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.mapContainer}>
        {/* Map */}
        {Mapbox && MapView ? (
          <MapView
            style={styles.map}
            styleURL={Mapbox?.StyleURL?.Streets ?? 'mapbox://styles/mapbox/streets-v12'}
          >
            <Camera
              ref={cameraRef}
              centerCoordinate={defaultCenter}
              zoomLevel={14}
              pitch={is3D ? 70 : 0}
              heading={is3D ? 45 : 0}
              animationDuration={2000}
            />

            {hasLocationPermission && userLocation && (
              <LocationPuck puckBearing="heading" puckBearingEnabled visible />
            )}

            {/* Route Line */}
            {ShapeSource && LineLayer && routeCoordinates && (
              <ShapeSource
                id="routeSource"
                shape={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates,
                  },
                }}
              >
                <LineLayer
                  id="routeLine"
                  style={{
                    lineColor: '#5BC4DB',
                    lineWidth: 4,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </ShapeSource>
            )}

            {/* Markers with logo */}
            {MarkerView &&
              filteredCommerces.map((commerce: Commerce) => {
                if (!commerce.latitude || !commerce.longitude) return null;
                const isBoosted = commerce.boosted;
                return (
                  <MarkerView
                    key={commerce.id}
                    id={commerce.id}
                    coordinate={[commerce.longitude, commerce.latitude]}
                    allowOverlap={true}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <TouchableOpacity
                      onPress={() => handleBusinessPress(commerce)}
                      activeOpacity={0.7}
                      style={styles.markerContainer}
                    >
                      {isBoosted && <View style={styles.boostGlow} pointerEvents="none" />}
                      <View 
                        style={[
                          styles.markerPin,
                          isBoosted && styles.markerPinBoosted
                        ]}
                        pointerEvents="none"
                      >
                        <Image
                          source={{ uri: LOGO_BASE64 }}
                          style={styles.markerLogo}
                          resizeMode="contain"
                        />
                      </View>
                    </TouchableOpacity>
                  </MarkerView>
                );
              })}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackText}>📍 Map available in a native dev build.</Text>
          </View>
        )}
      </View>

      {/* Search Pill */}
      <View style={styles.searchPillContainer}>
        <View style={styles.searchPill}>
          <IconSymbol name="magnifyingglass" size={16} color={COLORS.darkGray} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('search_placeholder_businesses')}
            placeholderTextColor={COLORS.darkGray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={16} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Route Info Pill */}
      {routeDistance && routeDuration && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoPill}>
            <IconSymbol name="car.fill" size={18} color={COLORS.blue} />
            <Text style={styles.routeInfoText}>
              {(routeDistance / 1000).toFixed(1)} km • {Math.round(routeDuration / 60)} min
            </Text>
            <TouchableOpacity onPress={clearRoute} style={styles.closeRouteButton}>
              <IconSymbol name="xmark.circle.fill" size={18} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 2D/3D Toggle Pill - Under Search Bar */}
      <View style={styles.topLeftControls}>
        <TouchableOpacity style={styles.togglePill} onPress={toggleMapStyle}>
          <IconSymbol name={is3D ? 'cube' : 'map'} size={18} color={COLORS.primary} />
          <Text style={styles.togglePillText}>{is3D ? '3D' : '2D'}</Text>
        </TouchableOpacity>
      </View>


      {/* Business List Overlay */}
      {showBusinessList && (
        <View style={styles.businessListContainer}>
          <View style={styles.businessListHeader}>
            <Text style={styles.businessListTitle}>{t('businesses')}</Text>
            <TouchableOpacity onPress={toggleBusinessList} style={styles.closeButton}>
              <IconSymbol name="xmark" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredCommerces}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.businessListContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.businessListItem,
                  item.boosted && styles.businessListItemBoosted
                ]}
                onPress={() => {
                  handleBusinessPress(item);
                  setShowBusinessList(false);
                }}
              >
                <View style={styles.businessItemContent}>
                  <Text style={styles.businessItemCategory}>
                    {getCategoryIcon(item.category)}
                  </Text>
                  <View style={styles.businessItemInfo}>
                    <View style={styles.businessNameRow}>
                      <Text style={styles.businessItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {item.boosted && (
                        <View style={[
                          styles.listBoostBadge,
                          { backgroundColor: getBoostBadgeColor(item) || COLORS.primary }
                        ]}>
                          <Text style={styles.listBoostBadgeText}>
                            {getBoostBadge(item)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.businessItemAddress} numberOfLines={1}>
                      {item.address || t('address_not_available')}
                    </Text>
                    <Text style={styles.businessItemCategory}>
                      {item.category}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={COLORS.darkGray} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>No businesses found</Text>
              </View>
            }
          />
        </View>
      )}

      <BusinessDetailModal
        visible={showBusinessModal}
        business={selectedBusiness}
        onClose={handleCloseBusinessModal}
        onGetDirections={(business) => {
          if (business.latitude && business.longitude) {
            fetchDirections([business.longitude, business.latitude]);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapFallbackText: { fontSize: 16, color: COLORS.darkGray },
  searchPillContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1001,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    padding: 0,
  },
  topLeftControls: {
    position: 'absolute',
    top: 125,
    left: 20,
    zIndex: 1000,
  },
  infoPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 160,
    maxWidth: 220,
  },
  infoPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
    textAlign: 'center',
  },
  clickablePill: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  togglePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  markerContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  markerPin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  markerPinBoosted: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  markerLogo: {
    width: 30,
    height: 30,
  },
  markerLogoBoosted: {
    width: 42,
    height: 42,
  },
  markerText: {
    fontSize: 24,
    fontWeight: '900',
    color: 'rgb(1,111,115)',
  },
  markerTextBoosted: {
    fontSize: 34,
  },
  boostGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgb(70,130,195)',
    opacity: 0.6,
  },
  businessListContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 999,
  },
  businessListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  businessListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  businessListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  businessListItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.gray,
    overflow: 'hidden',
  },
  businessItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  businessItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  businessItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  businessItemAddress: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  businessItemCategory: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  emptyListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  

  boostBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  boostBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  businessListItemBoosted: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5F3',
  },
  businessListItemFeatured: {
    borderColor: '#FFD700',
    backgroundColor: '#FFF9E6',
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listBoostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  listBoostBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  routeInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 999,
  },
  routeInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.blue,
  },
  routeInfoText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  closeRouteButton: {
    padding: 2,
  },
});
