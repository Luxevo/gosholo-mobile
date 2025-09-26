import BusinessDetailModal from '@/components/BusinessDetailModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCommerces, type Commerce } from '@/hooks/useCommerces';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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

  const defaultCenter: LngLat = userLocation ?? [-74.006, 40.7128]; // fallback

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

            {/* Markers with name always visible */}
            {PointAnnotation &&
              commerces.map((commerce: Commerce) => {
                if (!commerce.latitude || !commerce.longitude) return null;
                return (
                  <PointAnnotation
                    key={commerce.id}
                    id={commerce.id}
                    coordinate={[commerce.longitude, commerce.latitude]}
                    onSelected={() => handleBusinessPress(commerce)}
                  >
                    <Text style={styles.markerTextOnly}>
                      {commerce.name}
                    </Text>
                  </PointAnnotation>
                );
              })}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackText}>📍 Map available in a native dev build.</Text>
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
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  debugText: { fontSize: 12, color: COLORS.darkGray },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.black },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginLeft: 6 },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  listButtonText: { fontSize: 12, fontWeight: '600', color: COLORS.white },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapFallbackText: { fontSize: 16, color: COLORS.darkGray },
  markerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 140,
    minWidth: 60,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
  },
  markerTextOnly: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
});
