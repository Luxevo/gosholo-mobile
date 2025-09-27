import BusinessDetailModal from '@/components/BusinessDetailModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCommerces, type Commerce } from '@/hooks/useCommerces';
import * as Location from 'expo-location';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
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
  const { t } = useTranslation();

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
                    <View collapsable={false} style={[styles.markerPill,commerce.boosted&& {backgroundColor:"#FF6233"}]
                    }>
                      <Text style={[styles.markerTextOnly ,commerce.boosted && {fontSize:20,color:"white"}]}>
                        {commerce.name}
                      </Text>
                    </View>

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

      {/* Floating Info Cards */}
      <View style={styles.floatingControls}>
        {/* Business Count Pill */}
        <TouchableOpacity
          style={[styles.infoPill, styles.clickablePill]}
          onPress={toggleBusinessList}
          activeOpacity={0.8}
        >
          <View style={styles.pillContent}>
            <IconSymbol name="list.bullet" size={14} color={COLORS.primary} />
            <Text style={styles.infoPillText} numberOfLines={1}>
              {commercesLoading
                ? 'Loading...'
                : commercesError
                ? 'Error loading'
                : `${commerces.length} businesses`}
            </Text>
            <IconSymbol name="chevron.right" size={12} color={COLORS.darkGray} />
          </View>
        </TouchableOpacity>

        {/* 2D/3D Toggle Pill */}
        <TouchableOpacity style={styles.togglePill} onPress={toggleMapStyle}>
          <IconSymbol name={is3D ? 'cube' : 'map'} size={20} color={COLORS.primary} />
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
            data={commerces}
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
                      {item.address || 'Address not available'}
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
  floatingControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  togglePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
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
  markerPill: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 16,
  },
  markerTextOnly: {
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
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
});
