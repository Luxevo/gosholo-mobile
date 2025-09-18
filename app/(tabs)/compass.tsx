import BusinessDetailModal from '@/components/BusinessDetailModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCommerces, type Commerce } from '@/hooks/useCommerces';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Conditional import for Mapbox (native builds only)
let Mapbox: any,
  MapView: any,
  Camera: any,
  LocationPuck: any,
  FillExtrusionLayer: any,
  PointAnnotation: any,
  RasterDemSource: any,
  Terrain: any,
  SkyLayer: any;

try {
  const MapboxMaps = require('@rnmapbox/maps');
  Mapbox = MapboxMaps.default;
  MapView = MapboxMaps.MapView;
  Camera = MapboxMaps.Camera;
  LocationPuck = MapboxMaps.LocationPuck;
  FillExtrusionLayer = MapboxMaps.FillExtrusionLayer;
  PointAnnotation = MapboxMaps.PointAnnotation;
  RasterDemSource = MapboxMaps.RasterDemSource;
  Terrain = MapboxMaps.Terrain;
  SkyLayer = MapboxMaps.SkyLayer;
} catch (error) {
  console.log('Mapbox not available in Expo Go (use a dev build).');
}

// Initialize Mapbox (must happen before any map component mounts)
if (Mapbox) {
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
  // Optional: disable telemetry
  // Mapbox.setTelemetryEnabled(false);
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

  const cameraRef = useRef<any>(null);

  const { commerces, loading: commercesLoading, error: commercesError } = useCommerces();

  useEffect(() => {
    requestLocationPermission();
  }, []);

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

  const onLocatePress = async () => {
    const coord = await getCurrentLocation(true);
    if (!coord && userLocation && cameraRef.current) {
      // fall back to last known location
      cameraRef.current.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 15,
        animationDuration: 800,
      });
    }
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

  const categoryColors = useMemo(
    () => ({
      Restaurant: '#FF6233',
      Café: '#8B4513',
      Boulangerie: '#DEB887',
      Épicerie: '#32CD32',
      Commerce: '#4169E1',
      Service: '#FF8C00',
      Santé: '#DC143C',
      Beauté: '#FF69B4',
      Sport: '#00CED1',
      Culture: '#9370DB',
      Éducation: '#228B22',
      Autre: '#696969',
    }),
    []
  );

  const getCategoryIcon = (category: string) => categoryIcons[category as keyof typeof categoryIcons] || '📍';
  const getCategoryColor = (category: string) => (categoryColors as any)[category] || COLORS.primary;

  const defaultCenter: LngLat = userLocation ?? [-74.006, 40.7128]; // NYC fallback

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.debugText}>
            {commercesLoading
              ? 'Loading...'
              : commercesError
              ? `Error: ${commercesError}`
              : `${commerces.length} businesses`}
          </Text>

          <TouchableOpacity style={styles.toggleButton} onPress={toggleMapStyle}>
            <IconSymbol name={is3D ? 'cube' : 'map'} size={24} color={COLORS.primary} />
            <Text style={styles.toggleText}>{is3D ? '3D' : '2D'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listButton} onPress={toggleBusinessList}>
            <IconSymbol name="list.bullet" size={20} color={COLORS.white} />
            <Text style={styles.listButtonText}>List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container with Business List Overlay */}
      <View style={styles.mapContainer}>
        {/* Business List Overlay */}
        {showBusinessList && (
          <View style={styles.businessListOverlay}>
            <View style={styles.businessListHeader}>
              <Text style={styles.businessListTitle}>Businesses</Text>
              <TouchableOpacity onPress={toggleBusinessList}>
                <IconSymbol name="xmark" size={20} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={commerces}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.businessListItem}
                  onPress={() => handleBusinessPress(item)}
                >
                  <View style={styles.businessItemContent}>
                    <View style={[styles.businessItemIcon, { backgroundColor: getCategoryColor(item.category) }]}>
                      <Text style={styles.businessItemEmoji}>{getCategoryIcon(item.category)}</Text>
                    </View>
                    <View style={styles.businessItemDetails}>
                      <Text style={styles.businessItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.businessItemCategory}>{item.category}</Text>
                      {item.address && (
                        <Text style={styles.businessItemAddress} numberOfLines={1}>{item.address}</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Map */}
        {Mapbox && MapView ? (
          <MapView
            style={styles.map}
            styleURL={Mapbox?.StyleURL?.Streets ?? 'mapbox://styles/mapbox/streets-v12'}
            zoomEnabled
            scrollEnabled
          >
            <Camera
              ref={cameraRef}
              centerCoordinate={defaultCenter}
              zoomLevel={is3D ? 14.5 : 14}
              pitch={is3D ? 70 : 0}
              heading={is3D ? 45 : 0}
              animationDuration={2000}
            />

            {hasLocationPermission && userLocation && (
              <LocationPuck puckBearing="heading" puckBearingEnabled visible />
            )}

            {/* True 3D: terrain + sky (only when toggled) */}
            {is3D && RasterDemSource && Terrain && SkyLayer && (
              <>
                {/* DEM source for terrain */}
                <RasterDemSource
                  id="terrain-dem"
                  url="mapbox://mapbox.mapbox-terrain-dem-v1"
                  tileSize={512}
                  maxzoom={14}
                />
                <Terrain sourceID="terrain-dem" exaggeration={1.4} />
                <SkyLayer
                  id="sky"
                  style={{
                    skyType: 'atmosphere',
                    skyAtmosphereSun: [0.0, 0.0],
                    skyAtmosphereSunIntensity: 15.0,
                  }}
                />
              </>
            )}

            {/* 3D buildings (extrusions) */}
            {is3D && FillExtrusionLayer && (
              <FillExtrusionLayer
                id="buildings-3d" // stable id
                sourceID="composite"
                sourceLayerID="building"
                minZoom={10}
                filter={['==', ['get', 'extrude'], 'true']}
                style={{
                  fillExtrusionColor: [
                    'interpolate',
                    ['linear'],
                    ['get', 'height'],
                    0,
                    '#fefefe',
                    20,
                    '#f8f8f8',
                    50,
                    '#f0f0f0',
                    100,
                    '#e8e8e8',
                    200,
                    '#d4d4d4',
                    300,
                    '#a3a3a3',
                    500,
                    '#737373',
                  ],
                  fillExtrusionHeight: ['*', ['get', 'height'], 1.8],
                  fillExtrusionBase: ['get', 'min_height'],
                  fillExtrusionOpacity: 0.9,
                }}
              />
            )}

            {/* Business markers (PointAnnotation is fine for small sets) */}
            {PointAnnotation &&
              commerces.map((commerce: Commerce) => {
                if (!commerce.latitude || !commerce.longitude) return null;
                const isSelected = selectedBusiness?.id === commerce.id;
                return (
                  <PointAnnotation
                    key={commerce.id}
                    id={commerce.id}
                    coordinate={[commerce.longitude, commerce.latitude]}
                    onSelected={() => handleBusinessPress(commerce)}
                    onDeselected={() => setSelectedBusiness(null)}
                  >
                    <View
                      style={[
                        styles.businessMarker,
                        isSelected && styles.businessMarkerSelected,
                      ]}
                    >
                     
                        <View style={[styles.logoPlaceholder, { backgroundColor: getCategoryColor(commerce.category) }]}>
                          <Text style={styles.logoPlaceholderText}>
                            {commerce.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      
                      <View style={styles.businessNameContainer}>
                        <Text style={styles.businessNameText} numberOfLines={1}>
                          {commerce.name}
                        </Text>
                      </View>
                    </View>
                  </PointAnnotation>
                );
              })}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackText}>📍 Map available in a native dev build.</Text>
            <Text style={styles.mapFallbackTextSmall}>
              (Expo Go doesn’t support @rnmapbox/maps. Build a dev client.)
            </Text>
          </View>
        )}

        {/* Locate me */}
        {hasLocationPermission && (
          <TouchableOpacity style={styles.locationButton} onPress={onLocatePress}>
            <IconSymbol name="location.fill" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Permission denied helper */}
        {!hasLocationPermission && permissionDenied && (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionText}>
              Location permission denied. Enable it in Settings to show your position.
            </Text>
            <TouchableOpacity style={styles.permissionRetry} onPress={requestLocationPermission}>
              <Text style={styles.permissionRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      <BusinessDetailModal
        visible={showBusinessModal}
        business={selectedBusiness}
        onClose={handleCloseBusinessModal}
      />
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  listButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  mapFallbackText: {
    color: COLORS.darkGray,
    fontSize: 16,
    textAlign: 'center',
  },
  mapFallbackTextSmall: {
    color: COLORS.darkGray,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  locationButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  permissionBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  permissionText: {
    color: '#856404',
    fontSize: 12,
    marginBottom: 6,
  },
  permissionRetry: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  permissionRetryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerSelected: {
    transform: [{ scale: 1.2 }],
  },
  markerEmoji: {
    fontSize: 20,
  },
  businessMarker: {
    alignItems: 'center',
    maxWidth: 140,
  },
  businessMarkerSelected: {
    transform: [{ scale: 1.15 }],
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  businessLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  logoPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  businessNameContainer: {
    marginTop: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 60,
  },
  businessNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  businessListOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '45%',
    height: '100%',
    backgroundColor: COLORS.white,
    zIndex: 1000,
    borderRightWidth: 1,
    borderRightColor: COLORS.gray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  businessListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  businessListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  businessListItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  businessItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  businessItemEmoji: {
    fontSize: 18,
  },
  businessItemDetails: {
    flex: 1,
  },
  businessItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  businessItemCategory: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 2,
  },
  businessItemAddress: {
    fontSize: 11,
    color: COLORS.darkGray,
  },
});
