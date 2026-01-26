import BusinessDetailModal from '@/components/BusinessDetailModal';
import EventDetailModal from '@/components/EventDetailModal';
import OfferDetailModal from '@/components/OfferDetailModal';
import { LOGO_BASE64 } from '@/components/LogoBase64';
import { useFavorites } from '@/hooks/useFavorites';
import { useFollows } from '@/hooks/useFollows';
import { useLikes } from '@/hooks/useLikes';
import { NavigationBanner } from '@/components/navigation/NavigationBanner';
import { SimpleNavigationBar } from '@/components/navigation/SimpleNavigationBar';
import { POIModal } from '@/components/POIModal';
import { SearchOverlay } from '@/components/SearchOverlay';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCommerces, type Commerce } from '@/hooks/useCommerces';
import { useOffers, type OfferWithCommerce } from '@/hooks/useOffers';
import { useEvents, type EventWithCommerce } from '@/hooks/useEvents';
import { getMapboxSearchService, type SearchSuggestion } from '@/utils/mapboxSearch';
import {
  groupCommercesByLocation,
  type MarkerCluster,
} from '@/utils/markerClustering';
import { matchesSearch } from '@/utils/searchUtils';
import {
  calculateETA,
  getCurrentStepIndex,
  getDistanceFromLine,
} from '@/utils/navigationHelpers';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
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
  MarkerView: any,
  RasterDemSource: any,
  Terrain: any,
  SkyLayer: any,
  ShapeSource: any,
  LineLayer: any,
  SymbolLayer: any;

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
  SymbolLayer = MapboxMaps.SymbolLayer;
} catch (error) {
  // Mapbox not available in Expo Go (use a dev build)
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

// Optimized marker components for better performance
// Android: PointAnnotation with text (reliable clicks)
// iOS: MarkerView with logo (better rendering)
const CommerceMarker = React.memo(({ commerce, onPress }: { commerce: Commerce; onPress: (commerce: Commerce) => void }) => {
  const isBoosted = commerce.boosted;
  const isAndroid = Platform.OS === 'android';

  if (isAndroid) {
    // Android: Use PointAnnotation with text "gosholo"
    return (
      <PointAnnotation
        id={commerce.id}
        coordinate={[commerce.longitude!, commerce.latitude!]}
        anchor={{ x: 0.5, y: 0.5 }}
        draggable={false}
        onSelected={() => onPress(commerce)}
      >
        <View
          style={[
            styles.markerPin,
            styles.markerPinButton,
            isBoosted && styles.markerPinBoosted,
            isBoosted && styles.markerPinButtonBoosted
          ]}
          collapsable={false}
        >
          <Text
            style={[styles.markerText, isBoosted && styles.markerTextBoosted]}
            numberOfLines={1}
            adjustsFontSizeToFit={false}
          >
            gosholo
          </Text>
        </View>
      </PointAnnotation>
    );
  } else {
    // iOS: Use MarkerView with logo image
    return (
      <MarkerView
        id={commerce.id}
        coordinate={[commerce.longitude!, commerce.latitude!]}
        allowOverlap={true}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <TouchableOpacity
          onPress={() => onPress(commerce)}
          activeOpacity={0.7}
          style={styles.markerContainer}
        >
          {isBoosted && <View style={styles.boostGlow} pointerEvents="none" />}
          <View
            style={[
              styles.markerPin,
              isBoosted && styles.markerPinBoosted
            ]}
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
  }
});

// Clustered Marker - Shows number when multiple businesses at same location
const ClusteredMarker = React.memo(({
  cluster,
  onPress
}: {
  cluster: MarkerCluster;
  onPress: (cluster: MarkerCluster) => void
}) => {
  const isBoosted = cluster.isBoosted;
  const count = cluster.commerces.length;
  const isAndroid = Platform.OS === 'android';

  if (isAndroid) {
    // Android: Use PointAnnotation with count number
    return (
      <PointAnnotation
        id={cluster.id}
        coordinate={[cluster.longitude, cluster.latitude]}
        anchor={{ x: 0.5, y: 0.5 }}
        draggable={false}
        onSelected={() => onPress(cluster)}
      >
        <View
          style={[
            styles.markerPin,
            styles.markerPinButton,
            isBoosted && styles.markerPinBoosted,
            isBoosted && styles.markerPinButtonBoosted
          ]}
          collapsable={false}
        >
          <Text
            style={[
              styles.clusterCountText,
              isBoosted && styles.clusterCountTextBoosted
            ]}
            numberOfLines={1}
          >
            {count}
          </Text>
        </View>
      </PointAnnotation>
    );
  } else {
    // iOS: Use MarkerView with count number
    return (
      <MarkerView
        id={cluster.id}
        coordinate={[cluster.longitude, cluster.latitude]}
        allowOverlap={true}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <TouchableOpacity
          onPress={() => onPress(cluster)}
          activeOpacity={0.7}
          style={styles.markerContainer}
        >
          {isBoosted && <View style={styles.boostGlow} pointerEvents="none" />}
          <View
            style={[
              styles.markerPin,
              isBoosted && styles.markerPinBoosted
            ]}
          >
            <Text
              style={[
                styles.clusterCountText,
                isBoosted && styles.clusterCountTextBoosted
              ]}
              numberOfLines={1}
            >
              {count}
            </Text>
          </View>
        </TouchableOpacity>
      </MarkerView>
    );
  }
});

const DestinationMarker = React.memo(({ coordinate }: { coordinate: LngLat }) => (
  <MarkerView
    id="destination-marker"
    coordinate={coordinate}
    allowOverlap={true}
    anchor={{ x: 0.5, y: 1 }}
  >
    <View style={styles.destinationMarkerContainer}>
      <View style={styles.destinationMarkerPin}>
        <IconSymbol name="mappin.circle.fill" size={40} color={COLORS.primary} />
      </View>
    </View>
  </MarkerView>
));

// Offer Marker Component
const OfferMarker = React.memo(({ offer, onPress }: { offer: OfferWithCommerce; onPress: (offer: OfferWithCommerce) => void }) => {
  const isBoosted = offer.boosted;
  const isAndroid = Platform.OS === 'android';

  const lat = offer.latitude || offer.commerces?.latitude;
  const lng = offer.longitude || offer.commerces?.longitude;

  if (!lat || !lng) return null;

  if (isAndroid) {
    return (
      <PointAnnotation
        id={`offer-${offer.id}`}
        coordinate={[lng, lat]}
        anchor={{ x: 0.5, y: 0.5 }}
        draggable={false}
        onSelected={() => onPress(offer)}
      >
        <View
          style={[
            styles.offerMarkerPin,
            isBoosted && styles.offerMarkerPinBoosted
          ]}
          collapsable={false}
        >
          <IconSymbol name="tag.fill" size={16} color={COLORS.white} />
        </View>
      </PointAnnotation>
    );
  } else {
    return (
      <MarkerView
        id={`offer-${offer.id}`}
        coordinate={[lng, lat]}
        allowOverlap={true}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <TouchableOpacity
          onPress={() => onPress(offer)}
          activeOpacity={0.7}
          style={styles.markerContainer}
        >
          {isBoosted && <View style={styles.offerBoostGlow} pointerEvents="none" />}
          <View
            style={[
              styles.offerMarkerPin,
              isBoosted && styles.offerMarkerPinBoosted
            ]}
          >
            <IconSymbol name="tag.fill" size={16} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      </MarkerView>
    );
  }
});

// Event Marker Component
const EventMarker = React.memo(({ event, onPress }: { event: EventWithCommerce; onPress: (event: EventWithCommerce) => void }) => {
  const isBoosted = event.boosted;
  const isAndroid = Platform.OS === 'android';

  const lat = event.latitude || event.commerces?.latitude;
  const lng = event.longitude || event.commerces?.longitude;

  if (!lat || !lng) return null;

  if (isAndroid) {
    return (
      <PointAnnotation
        id={`event-${event.id}`}
        coordinate={[lng, lat]}
        anchor={{ x: 0.5, y: 0.5 }}
        draggable={false}
        onSelected={() => onPress(event)}
      >
        <View
          style={[
            styles.eventMarkerPin,
            isBoosted && styles.eventMarkerPinBoosted
          ]}
          collapsable={false}
        >
          <IconSymbol name="calendar" size={16} color={COLORS.white} />
        </View>
      </PointAnnotation>
    );
  } else {
    return (
      <MarkerView
        id={`event-${event.id}`}
        coordinate={[lng, lat]}
        allowOverlap={true}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <TouchableOpacity
          onPress={() => onPress(event)}
          activeOpacity={0.7}
          style={styles.markerContainer}
        >
          {isBoosted && <View style={styles.eventBoostGlow} pointerEvents="none" />}
          <View
            style={[
              styles.eventMarkerPin,
              isBoosted && styles.eventMarkerPinBoosted
            ]}
          >
            <IconSymbol name="calendar" size={16} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      </MarkerView>
    );
  }
});

type MapTab = 'businesses' | 'offers' | 'events';

export default function CompassScreen() {
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [userHeading, setUserHeading] = useState<number>(0);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Consolidated map state
  const [mapState, setMapState] = useState({
    is3D: false,
    followUserLocation: true,
    isNavigating: false,
    showRouteOverview: false,
  });
  
  // Consolidated modal state
  const [modalState, setModalState] = useState({
    selectedBusiness: null as Commerce | null,
    showBusinessModal: false,
    showBusinessList: false,
    showNavigationInstructions: false,
    showProfileSwitcher: false,
    showSearchResults: false,
    selectedPOI: null as any,
    showPOIModal: false,
    selectedCluster: null as MarkerCluster | null,
    showClusterModal: false,
  });
  
  // Consolidated navigation state
  const [navigationState, setNavigationState] = useState({
    routeCoordinates: null as LngLat[] | null,
    routeDistance: null as number | null,
    routeDuration: null as number | null,
    navigationSteps: [] as any[],
    alternativeRoutes: [] as any[],
    selectedRouteIndex: 0,
    currentStepIndex: 0,
    trafficData: null as any,
    destinationMarker: null as LngLat | null,
  });
  
  // Consolidated search state
  const [searchState, setSearchState] = useState({
    query: '',
    results: [] as any[],
    isSearchingAddress: false,
    showFullScreenSearch: false,
  });
  
  // Consolidated voice state
  const [voiceState, setVoiceState] = useState({
    voiceNavigationEnabled: false,
    isSpeaking: false,
  });
  
  const [routingProfile, setRoutingProfile] = useState<'driving-traffic' | 'driving' | 'walking' | 'cycling'>('driving-traffic');
  const [activeTab, setActiveTab] = useState<MapTab>('businesses');
  const [selectedOffer, setSelectedOffer] = useState<OfferWithCommerce | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithCommerce | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const headingSubscription = useRef<Location.LocationSubscription | null>(null);

  // Extract individual states for easier access
  const { is3D, followUserLocation, isNavigating, showRouteOverview } = mapState;
  const { selectedBusiness, showBusinessModal, showBusinessList, showNavigationInstructions, showProfileSwitcher, showSearchResults, selectedPOI, showPOIModal, selectedCluster, showClusterModal } = modalState;
  const { routeCoordinates, routeDistance, routeDuration, navigationSteps, alternativeRoutes, currentStepIndex, trafficData, destinationMarker } = navigationState;
  const { query: searchQuery, results: searchResults, showFullScreenSearch } = searchState;
  const { voiceNavigationEnabled } = voiceState;

  const cameraRef = useRef<any>(null);
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();

  const { commerces, loading: commercesLoading, error: commercesError } = useCommerces();
  const { offers, loading: offersLoading } = useOffers({ userLocation: userLocation || undefined });
  const { events, loading: eventsLoading } = useEvents();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isFollowing, toggleFollow } = useFollows();
  const { isLiked, toggleLike } = useLikes();

  // Memoized filtered commerces - no side effects (accent-insensitive search)
  const filteredCommerces = useMemo(() => {
    if (!searchQuery.trim()) return commerces;

    const query = searchQuery.trim();
    return commerces.filter((commerce) =>
      matchesSearch(commerce.name, query) ||
      matchesSearch(commerce.category?.name_en, query) ||
      matchesSearch(commerce.category?.name_fr, query) ||
      matchesSearch(commerce.address, query)
    );
  }, [commerces, searchQuery]);

  // Group commerces by location to show numbered markers for co-located businesses
  const markerClusters = useMemo(() => {
    return groupCommercesByLocation(filteredCommerces, 20); // 20m threshold (same building)
  }, [filteredCommerces]);

  // Filter offers with valid locations
  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const hasLocation = (offer.latitude && offer.longitude) ||
                         (offer.commerces?.latitude && offer.commerces?.longitude);
      if (!hasLocation) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.trim();
      return matchesSearch(offer.title, query) ||
             matchesSearch(offer.description, query) ||
             matchesSearch(offer.commerces?.name, query);
    });
  }, [offers, searchQuery]);

  // Filter events with valid locations
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const hasLocation = (event.latitude && event.longitude) ||
                         (event.commerces?.latitude && event.commerces?.longitude);
      if (!hasLocation) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.trim();
      return matchesSearch(event.title, query) ||
             matchesSearch(event.description, query) ||
             matchesSearch(event.commerces?.name, query);
    });
  }, [events, searchQuery]);

  // Handlers for offer/event press
  const handleOfferPress = useCallback((offer: OfferWithCommerce) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
  }, []);

  const handleEventPress = useCallback((event: EventWithCommerce) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Track user heading for navigation
  useEffect(() => {
    if (!hasLocationPermission) return;

    const startHeadingTracking = async () => {
      try {
        const subscription = await Location.watchHeadingAsync((heading) => {
          setUserHeading(heading.trueHeading || heading.magHeading);
        });
        headingSubscription.current = subscription;
      } catch (error) {
        console.error('Error tracking heading:', error);
      }
    };

    startHeadingTracking();

    return () => {
      headingSubscription.current?.remove();
    };
  }, [hasLocationPermission]);

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
          // Nettoyer les paramètres après utilisation pour éviter les re-déclenchements
          router.setParams({ destination: undefined, type: undefined });
        }
      } else if (type === 'address') {
        // TODO: Implement geocoding for address
        router.setParams({ destination: undefined, type: undefined });
      }
    }
  }, [params.destination, params.type, userLocation]);

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
      // Location permission error
    }
  };

  const getCurrentLocation = useCallback(async (animateCamera = false) => {
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
      // Get location error
    }
  }, []);

  const fetchDirections = useCallback(async (destination: LngLat, profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling') => {
    if (!userLocation) {
      return;
    }

    const selectedProfile = profile || routingProfile;

    try {
      const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const start = `${userLocation[0]},${userLocation[1]}`;
      const end = `${destination[0]},${destination[1]}`;
      
      const params = new URLSearchParams({
        geometries: 'geojson',
        steps: 'true',
        banner_instructions: 'true',
        voice_instructions: 'true',
        alternatives: 'true',
        language: 'fr',
        overview: 'full',
        annotations: 'distance,duration,speed,congestion',
        continue_straight: 'true',
        access_token: accessToken || '',
      });

      const url = `https://api.mapbox.com/directions/v5/mapbox/${selectedProfile}/${start};${end}?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        const distance = route.distance;
        const duration = route.duration;

        // Update navigation state in one go
        setNavigationState({
          routeCoordinates: coordinates,
          routeDistance: distance,
          routeDuration: duration,
          navigationSteps: route.legs?.[0]?.steps || [],
          alternativeRoutes: data.routes.slice(1) || [],
          selectedRouteIndex: 0,
          currentStepIndex: 0,
          trafficData: route.legs?.[0]?.annotation || null,
          destinationMarker: destination,
        });
        
        setMapState(prev => ({ ...prev, isNavigating: true, followUserLocation: true }));

        // Enable voice navigation by default
        setVoiceState({ voiceNavigationEnabled: true, isSpeaking: false });

        // Zoom to user position first for navigation view
        if (cameraRef.current && userLocation) {
          cameraRef.current.setCamera({
            centerCoordinate: userLocation,
            zoomLevel: 18,
            pitch: 60,
            heading: userHeading,
            animationDuration: 1000,
            animationMode: 'flyTo',
          });
        }

        // Speak first instruction
        if (route.legs?.[0]?.steps?.[0]?.maneuver?.instruction) {
          speakInstruction(route.legs[0].steps[0].maneuver.instruction);
        }
      } else if (data.code === 'NoRoute') {
        // No route found
      }
    } catch (error) {
      // Error fetching directions
    }
  }, [userLocation, routingProfile]);

  const clearRoute = useCallback(() => {
    setNavigationState({
      routeCoordinates: null,
      routeDistance: null,
      routeDuration: null,
      navigationSteps: [],
      alternativeRoutes: [],
      selectedRouteIndex: 0,
      currentStepIndex: 0,
      trafficData: null,
      destinationMarker: null,
    });

    setModalState(prev => ({ ...prev, showNavigationInstructions: false, showSearchResults: false }));
    setVoiceState({ voiceNavigationEnabled: false, isSpeaking: false });
    setMapState(prev => ({ ...prev, isNavigating: false }));
    setSearchState({ query: '', results: [], isSearchingAddress: false, showFullScreenSearch: false });

    stopSpeaking();
    router.setParams({ destination: undefined, type: undefined });
  }, []);

  const toggleMapStyle = useCallback(() => {
    setMapState(prev => ({ ...prev, is3D: !prev.is3D }));
  }, []);

  const recenterOnUser = useCallback(async () => {
    if (!userLocation || !cameraRef.current) return;
    
    setMapState(prev => ({ ...prev, followUserLocation: true }));
    cameraRef.current.setCamera({
      centerCoordinate: userLocation,
      zoomLevel: isNavigating ? 17 : 15,
      animationDuration: 500,
    });
  }, [userLocation, isNavigating]);

  const toggleFollowMode = useCallback(() => {
    const newFollowState = !followUserLocation;
    setMapState(prev => ({ ...prev, followUserLocation: newFollowState }));
    if (newFollowState) {
      recenterOnUser();
    }
  }, [followUserLocation, recenterOnUser]);

  // Search using Mapbox Search Box API (with session tokens for cost optimization)
  const searchAddress = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchState(prev => ({ ...prev, results: [], isSearchingAddress: false }));
      setModalState(prev => ({ ...prev, showSearchResults: false }));
      return;
    }

    setSearchState(prev => ({ ...prev, isSearchingAddress: true }));

    try {
      const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!accessToken) {
        console.error('Mapbox access token not found');
        return;
      }

      const searchService = getMapboxSearchService(accessToken);
      const suggestions = await searchService.getSuggestions(query, {
        proximity: userLocation || [-73.567, 45.501], // Montreal fallback
        language: 'fr',
        country: 'CA',
        limit: 6,
        types: 'address,poi,place',
      });

      if (suggestions.length > 0) {
        // Convert SearchSuggestion to match old format for compatibility
        const results = suggestions.map((suggestion: SearchSuggestion) => ({
          id: suggestion.mapbox_id,
          text: suggestion.name,
          place_name: suggestion.full_address || suggestion.place_formatted || suggestion.name,
          properties: {
            mapbox_id: suggestion.mapbox_id,
            feature_type: suggestion.feature_type,
          },
          // Add search suggestion object for retrieval
          _suggestion: suggestion,
        }));

        setSearchState(prev => ({ ...prev, results, isSearchingAddress: false }));
        setModalState(prev => ({ ...prev, showSearchResults: true }));
      } else {
        setSearchState(prev => ({ ...prev, results: [], isSearchingAddress: false }));
        setModalState(prev => ({ ...prev, showSearchResults: false }));
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchState(prev => ({ ...prev, results: [], isSearchingAddress: false }));
      setModalState(prev => ({ ...prev, showSearchResults: false }));
    }
  }, [userLocation]);

  const handleAddressSelect = useCallback(async (feature: any) => {
    // Use Search Box API retrieve to get full coordinates
    const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) return;

    try {
      const searchService = getMapboxSearchService(accessToken);
      const mapboxId = feature.properties?.mapbox_id || feature.id;

      const result = await searchService.retrievePlace(mapboxId);

      if (result) {
        const [lng, lat] = result.coordinates;
        setSearchState(prev => ({ ...prev, query: result.name }));
        setModalState(prev => ({ ...prev, showSearchResults: false }));

        // Center map on selected location
        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: 16,
            animationDuration: 1000,
          });
        }

        // Start navigation to this location
        fetchDirections([lng, lat]);
      }
    } catch (error) {
      console.error('Error retrieving place:', error);
      // Fallback to old method if center coords available
      if (feature.center) {
        const [lng, lat] = feature.center;
        setSearchState(prev => ({ ...prev, query: feature.place_name || feature.text }));
        setModalState(prev => ({ ...prev, showSearchResults: false }));

        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: 16,
            animationDuration: 1000,
          });
        }

        fetchDirections([lng, lat]);
      }
    }
  }, [fetchDirections]);

  const handleCommerceSelect = useCallback((commerce: Commerce) => {
    if (!commerce.latitude || !commerce.longitude) return;

    // Clear search state completely to prevent dropdown from reappearing
    setSearchState({ query: '', results: [], isSearchingAddress: false, showFullScreenSearch: false });
    setModalState(prev => ({ ...prev, showSearchResults: false }));

    // Center map on commerce
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [commerce.longitude, commerce.latitude],
        zoomLevel: 16,
        animationDuration: 1000,
      });
    }

    // Open commerce modal or start navigation
    handleBusinessPress(commerce);
  }, []);

  // Optimized debounced search with better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = searchQuery.trim();
      
      if (query.length >= 2) {
        // Show search results if we have matching commerces
        const hasMatchingCommerces = filteredCommerces.length > 0;
        
        if (hasMatchingCommerces) {
          setModalState(prev => ({ ...prev, showSearchResults: true }));
        }
        
        // Search addresses only if query is long enough and no local matches
        if (query.length >= 3 && !hasMatchingCommerces) {
          searchAddress(query);
        } else if (query.length >= 3 && hasMatchingCommerces) {
          // Still search addresses but with lower priority
          searchAddress(query);
        }
      } else {
        setSearchState(prev => ({ ...prev, results: [] }));
        setModalState(prev => ({ ...prev, showSearchResults: false }));
      }
    }, 800); // Increased debounce time for better performance

    return () => clearTimeout(timer);
  }, [searchQuery, filteredCommerces, searchAddress]);

  const handleBusinessPress = useCallback((commerce: Commerce) => {
    setModalState(prev => ({
      ...prev,
      selectedBusiness: commerce,
      showBusinessModal: true,
    }));
  }, []);

  const handleCloseBusinessModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      showBusinessModal: false,
      selectedBusiness: null,
    }));
  }, []);

  const handleFavoritePress = useCallback(async (commerceId: string) => {
    const result = await toggleFavorite('commerce', commerceId);
    if (result.needsLogin) {
      Alert.alert(
        t('login_to_favorite'),
        t('login_to_access_features'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/(auth)/login') }
        ]
      );
    }
  }, [toggleFavorite, t]);

  const handleFollowPress = useCallback(async (commerceId: string) => {
    const result = await toggleFollow(commerceId);
    if (result.needsLogin) {
      Alert.alert(
        t('login_required'),
        t('login_to_access_features'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('login'), onPress: () => router.push('/(auth)/login') }
        ]
      );
    }
  }, [toggleFollow, t]);

  const handleClusterPress = useCallback((cluster: MarkerCluster) => {
    // If only one commerce, open it directly
    if (cluster.commerces.length === 1) {
      handleBusinessPress(cluster.commerces[0]);
    } else {
      // Show list of all businesses at this location
      setModalState(prev => ({
        ...prev,
        selectedCluster: cluster,
        showClusterModal: true,
      }));
    }
  }, [handleBusinessPress]);

  const handleCloseClusterModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      selectedCluster: null,
      showClusterModal: false,
    }));
  }, []);

  const toggleBusinessList = useCallback(() => {
    setModalState(prev => ({ ...prev, showBusinessList: !prev.showBusinessList }));
  }, []);

  // Get color based on traffic congestion level
  const getTrafficColor = (congestion?: string) => {
    if (!congestion) return COLORS.blue; // Default blue
    switch (congestion) {
      case 'low':
        return '#4CAF50'; // Green
      case 'moderate':
        return '#FFC107'; // Yellow/Orange
      case 'heavy':
        return '#FF5722'; // Red
      case 'severe':
        return '#B71C1C'; // Dark Red
      default:
        return COLORS.blue;
    }
  };

  // Simple route line - no traffic segments for maximum performance

  // Optimized voice navigation functions
  const speakInstruction = useCallback(async (instruction: string) => {
    if (!voiceNavigationEnabled) return;
    
    try {
      setVoiceState(prev => ({ ...prev, isSpeaking: true }));
      await Speech.speak(instruction, {
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setVoiceState(prev => ({ ...prev, isSpeaking: false })),
        onError: () => setVoiceState(prev => ({ ...prev, isSpeaking: false })),
      });
    } catch (error) {
      setVoiceState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, [voiceNavigationEnabled]);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setVoiceState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  const toggleVoiceNavigation = useCallback(() => {
    const newState = !voiceNavigationEnabled;
    setVoiceState(prev => ({ ...prev, voiceNavigationEnabled: newState }));
    
    if (newState && navigationSteps.length > 0 && currentStepIndex < navigationSteps.length) {
      const currentStep = navigationSteps[currentStepIndex];
      speakInstruction(currentStep.maneuver?.instruction || 'Continuer tout droit');
    } else if (!newState) {
      stopSpeaking();
    }
  }, [voiceNavigationEnabled, navigationSteps, currentStepIndex, speakInstruction, stopSpeaking]);

  // Optimized auto-speak when step changes
  useEffect(() => {
    if (voiceNavigationEnabled && navigationSteps.length > 0 && currentStepIndex < navigationSteps.length) {
      const currentStep = navigationSteps[currentStepIndex];
      speakInstruction(currentStep.maneuver?.instruction || 'Continuer tout droit');
    }
  }, [currentStepIndex, voiceNavigationEnabled, navigationSteps, speakInstruction]);

  // Throttled location following to reduce camera updates
  const throttledCameraUpdate = useMemo(
    () => {
      let lastUpdate = 0;
      const throttleDelay = 2000; // Update camera max every 2 seconds

      return (location: LngLat) => {
        const now = Date.now();
        if (now - lastUpdate < throttleDelay) return;

        lastUpdate = now;
        if (cameraRef.current && followUserLocation) {
          // Google Maps-style camera follow during navigation
          cameraRef.current.setCamera({
            centerCoordinate: location,
            zoomLevel: isNavigating ? 18 : 15,
            pitch: isNavigating ? 60 : 0,  // Tilt view during navigation
            heading: isNavigating ? userHeading : 0,  // Rotate map to movement direction
            animationDuration: 1000,
            animationMode: 'flyTo',
          });
        }
      };
    },
    [followUserLocation, isNavigating, userHeading]
  );

  // Optimized location following effect
  useEffect(() => {
    if (!followUserLocation || !userLocation) return;
    throttledCameraUpdate(userLocation);
  }, [userLocation, throttledCameraUpdate]);

  // Update navigation state when route is set - optimized
  useEffect(() => {
    const hasRoute = !!routeCoordinates;
    if (hasRoute !== isNavigating) {
      setMapState(prev => ({ ...prev, isNavigating: hasRoute }));
    }
  }, [routeCoordinates, isNavigating]);

  // Auto-update current step based on user location
  useEffect(() => {
    if (!isNavigating || !userLocation || !navigationSteps.length || !routeCoordinates) return;

    const newStepIndex = getCurrentStepIndex(userLocation, navigationSteps, routeCoordinates);

    if (newStepIndex !== currentStepIndex) {
      setNavigationState(prev => ({
        ...prev,
        currentStepIndex: newStepIndex,
      }));
    }
  }, [userLocation, isNavigating, navigationSteps, routeCoordinates, currentStepIndex]);

  // Rerouting when off-track
  useEffect(() => {
    if (!isNavigating || !userLocation || !routeCoordinates || !destinationMarker) return;

    const checkReroute = setInterval(() => {
      const distanceFromRoute = getDistanceFromLine(userLocation, routeCoordinates);

      // If more than 50 meters off route, recalculate
      if (distanceFromRoute > 50) {
        Alert.alert(
          t('nav_rerouting'),
          t('nav_off_route'),
          [
            {
              text: t('yes'),
              onPress: () => fetchDirections(destinationMarker, routingProfile),
            },
            {
              text: t('cancel'),
              style: 'cancel',
            },
          ]
        );
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkReroute);
  }, [isNavigating, userLocation, routeCoordinates, destinationMarker, routingProfile, t]);

  // Memoized category icons - moved outside component for better performance
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



  // Memoized utility functions
  const getCategoryIcon = useCallback((category: string) => 
    categoryIcons[category as keyof typeof categoryIcons] || '📍', [categoryIcons]);

  const getBoostBadge = useCallback((commerce: Commerce) => {
    if (!commerce.boosted) return null;
    return t('boosted');
  }, [t]);

  const getBoostBadgeColor = useCallback((commerce: Commerce) => {
    if (!commerce.boosted) return null;
    return '#FF6233';
  }, []);

  

  const defaultCenter: LngLat = userLocation ?? [-73.5673, 45.5017]; // Montreal fallback

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.mapContainer}>
        {/* Map */}
        {Mapbox && MapView ? (
          <MapView
            style={styles.map}
            styleURL={Mapbox?.StyleURL?.Streets ?? 'mapbox://styles/mapbox/streets-v12'}
            onTouchStart={useCallback(() => {
              // Disable follow mode when user manually moves the map
              if (followUserLocation) {
                setMapState(prev => ({ ...prev, followUserLocation: false }));
              }
            }, [followUserLocation])}
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

            {/* POI Labels - Like Real Maps - ALL POIS */}
            {SymbolLayer && (
              <SymbolLayer
                id="poi-labels"
                sourceID="composite"
                sourceLayerID="poi_label"
                minZoomLevel={13}
                style={{
                  textField: ['get', 'name_en'],
                  textSize: [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    13, 10,
                    16, 12,
                    18, 14
                  ],
                  textFont: ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                  textColor: '#666666',
                  textHaloColor: '#FFFFFF',
                  textHaloWidth: 1,
                  textHaloBlur: 0.5,
                  textAnchor: 'top',
                  textOffset: [0, 0.5],
                  textOptional: true,
                  textAllowOverlap: false,
                  iconImage: ['coalesce', ['get', 'maki'], 'marker-15'],
                  iconSize: [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    13, 0.8,
                    16, 1.0,
                    18, 1.2
                  ],
                  iconOpacity: 0.8,
                  iconAllowOverlap: false,
                  iconIgnorePlacement: false,
                }}
              />
            )}

            {/* Simple Blue Route Line - Fast & Clean */}
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
                    lineColor: '#4285F4', // Google Maps blue
                    lineWidth: 6,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </ShapeSource>
            )}

            {/* Business Markers - Show when businesses tab is active */}
            {(MarkerView || PointAnnotation) && activeTab === 'businesses' &&
              markerClusters
                .slice(0, 50) // Limit to 50 markers for performance
                .map((cluster: MarkerCluster) => {
                  // Render clustered marker if multiple commerces, otherwise single marker
                  if (cluster.commerces.length > 1) {
                    return (
                      <ClusteredMarker
                        key={cluster.id}
                        cluster={cluster}
                        onPress={handleClusterPress}
                      />
                    );
                  } else {
                    return (
                      <CommerceMarker
                        key={cluster.commerces[0].id}
                        commerce={cluster.commerces[0]}
                        onPress={handleBusinessPress}
                      />
                    );
                  }
                })}

            {/* Offer Markers - Show when offers tab is active */}
            {(MarkerView || PointAnnotation) && activeTab === 'offers' &&
              filteredOffers
                .slice(0, 50)
                .map((offer) => (
                  <OfferMarker
                    key={offer.id}
                    offer={offer}
                    onPress={handleOfferPress}
                  />
                ))}

            {/* Event Markers - Show when events tab is active */}
            {(MarkerView || PointAnnotation) && activeTab === 'events' &&
              filteredEvents
                .slice(0, 50)
                .map((event) => (
                  <EventMarker
                    key={event.id}
                    event={event}
                    onPress={handleEventPress}
                  />
                ))}
            
            {/* Optimized Destination Marker */}
            {MarkerView && destinationMarker && (
              <DestinationMarker coordinate={destinationMarker} />
            )}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackText}>📍 Map available in a native dev build.</Text>
          </View>
        )}
      </View>

      {/* Floating Chip Tabs - Hide when navigating */}
      {!isNavigating && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipTabsContainer}
          contentContainerStyle={styles.chipTabsContent}
        >
          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'businesses' && styles.chipTabActive]}
            onPress={() => setActiveTab('businesses')}
            activeOpacity={0.8}
          >
            <IconSymbol name="storefront.fill" size={14} color={activeTab === 'businesses' ? COLORS.white : COLORS.teal} />
            <Text style={[styles.chipTabText, activeTab === 'businesses' && styles.chipTabTextActive]}>
              {t('businesses')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'offers' && styles.chipTabActiveOffer]}
            onPress={() => setActiveTab('offers')}
            activeOpacity={0.8}
          >
            <IconSymbol name="tag.fill" size={14} color={activeTab === 'offers' ? COLORS.white : COLORS.primary} />
            <Text style={[styles.chipTabText, activeTab === 'offers' && styles.chipTabTextActive]}>
              {t('offers')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chipTab, activeTab === 'events' && styles.chipTabActiveEvent]}
            onPress={() => setActiveTab('events')}
            activeOpacity={0.8}
          >
            <IconSymbol name="calendar" size={14} color={activeTab === 'events' ? COLORS.white : COLORS.blue} />
            <Text style={[styles.chipTabText, activeTab === 'events' && styles.chipTabTextActive]}>
              {t('events')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Search Pill - Hide when navigating - Tap to open full screen */}
      {!isNavigating && (
        <View style={styles.searchPillContainer}>
          <TouchableOpacity
            style={styles.searchPill}
            onPress={() => setSearchState(prev => ({ ...prev, showFullScreenSearch: true }))}
            activeOpacity={0.8}
          >
            <IconSymbol name="magnifyingglass" size={16} color={COLORS.darkGray} />
            <Text style={styles.searchPlaceholder}>
              {searchQuery || t('search_placeholder_businesses')}
            </Text>
          </TouchableOpacity>
        
        {/* Search Results Dropdown - GoSholo businesses only */}
        {showSearchResults && filteredCommerces.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={filteredCommerces.slice(0, 8)}
              keyExtractor={(item) => item.id}
              renderItem={({ item: commerce }) => (
                <TouchableOpacity
                  style={[
                    styles.searchResultItem,
                    commerce.boosted && styles.searchResultItemBoosted
                  ]}
                  onPress={() => handleCommerceSelect(commerce)}
                >
                  {commerce.image_url ? (
                    <Image
                      source={{ uri: commerce.image_url }}
                      style={styles.searchResultLogo}
                    />
                  ) : (
                    <IconSymbol
                      name="storefront.fill"
                      size={20}
                      color={commerce.boosted ? COLORS.primary : COLORS.teal}
                    />
                  )}
                  <View style={styles.searchResultTextContainer}>
                    <View style={styles.searchResultNameRow}>
                      <Text style={[styles.searchResultText, commerce.boosted && styles.searchResultTextBoosted]} numberOfLines={1}>
                        {commerce.name}
                      </Text>
                      {commerce.boosted && (
                        <View style={styles.searchBoostedBadge}>
                          <IconSymbol name="star.fill" size={10} color={COLORS.white} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.searchResultSubtext} numberOfLines={1}>
                      {commerce.category ? (i18n.language === 'fr' ? commerce.category.name_fr : commerce.category.name_en) : 'Commerce'} • {commerce.address}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={COLORS.darkGray} />
                </TouchableOpacity>
              )}
              style={styles.searchResultsList}
            />
          </View>
        )}
        </View>
      )}

      {/* Google Maps-Style Navigation Banner */}
      {isNavigating && navigationSteps.length > 0 && currentStepIndex < navigationSteps.length && (
        <NavigationBanner
          currentStep={navigationSteps[currentStepIndex]}
          estimatedArrival={routeDuration ? calculateETA(routeDuration) : undefined}
        />
      )}

      {/* Google Maps-Style Simple Bottom Bar */}
      {isNavigating && routeDistance && routeDuration && !showNavigationInstructions && !showBusinessList && (
        <SimpleNavigationBar
          distance={routeDistance}
          duration={routeDuration}
          arrivalTime={calculateETA(routeDuration)}
          hasAlternatives={alternativeRoutes.length > 0}
          onShowAlternatives={() => setModalState(prev => ({ ...prev, showNavigationInstructions: true }))}
          onClose={clearRoute}
        />
      )}

      {/* Old Route Info Pill (KEEP FOR PROFILE SWITCHER) */}
      {routeDistance && routeDuration && showProfileSwitcher && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoPill}>
              <TouchableOpacity onPress={() => setModalState(prev => ({ ...prev, showProfileSwitcher: !prev.showProfileSwitcher }))} style={styles.profileIconButton}>
              <IconSymbol 
                name={routingProfile === 'driving-traffic' || routingProfile === 'driving' ? 'car.fill' : routingProfile === 'walking' ? 'figure.walk' : 'bicycle'} 
                size={18} 
                color={COLORS.blue} 
              />
            </TouchableOpacity>
            <Text style={styles.routeInfoText}>
              {(routeDistance / 1000).toFixed(1)} km • {Math.round(routeDuration / 60)} min
            </Text>
            
            {/* Voice Navigation Button */}
            {navigationSteps.length > 0 && (
              <TouchableOpacity onPress={toggleVoiceNavigation} style={styles.voiceButton}>
                <IconSymbol 
                  name={voiceNavigationEnabled ? 'speaker.wave.3.fill' : 'speaker.slash.fill'} 
                  size={18} 
                  color={voiceNavigationEnabled ? COLORS.teal : COLORS.darkGray} 
                />
              </TouchableOpacity>
            )}
            
            {alternativeRoutes.length > 0 && (
              <TouchableOpacity onPress={() => setModalState(prev => ({ ...prev, showNavigationInstructions: true }))} style={styles.alternativesButton}>
                <Text style={styles.alternativesText}>+{alternativeRoutes.length}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearRoute} style={styles.closeRouteButton}>
              <IconSymbol name="xmark.circle.fill" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>
          
          {/* Profile Switcher Dropdown */}
          {showProfileSwitcher && (
            <View style={styles.profileSwitcher}>
              <TouchableOpacity 
                style={[styles.profileOption, routingProfile === 'driving-traffic' && styles.profileOptionActive]}
                onPress={() => {
                  setRoutingProfile('driving-traffic');
                  setModalState(prev => ({ ...prev, showProfileSwitcher: false }));
                  if (routeCoordinates) {
                    // Re-fetch with new profile
                    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
                    fetchDirections(lastCoord, 'driving-traffic');
                  }
                }}
              >
                <IconSymbol name="car.fill" size={20} color={routingProfile === 'driving-traffic' ? COLORS.teal : COLORS.darkGray} />
                <Text style={[styles.profileOptionText, routingProfile === 'driving-traffic' && styles.profileOptionTextActive]}>
                  {t('nav_driving_traffic')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.profileOption, routingProfile === 'driving' && styles.profileOptionActive]}
                onPress={() => {
                  setRoutingProfile('driving');
                  setModalState(prev => ({ ...prev, showProfileSwitcher: false }));
                  if (routeCoordinates) {
                    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
                    fetchDirections(lastCoord, 'driving');
                  }
                }}
              >
                <IconSymbol name="car" size={20} color={routingProfile === 'driving' ? COLORS.teal : COLORS.darkGray} />
                <Text style={[styles.profileOptionText, routingProfile === 'driving' && styles.profileOptionTextActive]}>
                  {t('nav_driving_fast')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.profileOption, routingProfile === 'walking' && styles.profileOptionActive]}
                onPress={() => {
                  setRoutingProfile('walking');
                  setModalState(prev => ({ ...prev, showProfileSwitcher: false }));
                  if (routeCoordinates) {
                    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
                    fetchDirections(lastCoord, 'walking');
                  }
                }}
              >
                <IconSymbol name="figure.walk" size={20} color={routingProfile === 'walking' ? COLORS.teal : COLORS.darkGray} />
                <Text style={[styles.profileOptionText, routingProfile === 'walking' && styles.profileOptionTextActive]}>
                  {t('nav_walking')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.profileOption, routingProfile === 'cycling' && styles.profileOptionActive]}
                onPress={() => {
                  setRoutingProfile('cycling');
                  setModalState(prev => ({ ...prev, showProfileSwitcher: false }));
                  if (routeCoordinates) {
                    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
                    fetchDirections(lastCoord, 'cycling');
                  }
                }}
              >
                <IconSymbol name="bicycle" size={20} color={routingProfile === 'cycling' ? COLORS.teal : COLORS.darkGray} />
                <Text style={[styles.profileOptionText, routingProfile === 'cycling' && styles.profileOptionTextActive]}>
                  {t('nav_cycling')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 2D/3D Toggle Pill - Hide when navigating */}
      {!isNavigating && (
        <View style={styles.topLeftControls}>
          <TouchableOpacity style={styles.togglePill} onPress={toggleMapStyle}>
            <IconSymbol name={is3D ? 'cube' : 'map'} size={18} color={COLORS.primary} />
            <Text style={styles.togglePillText}>{is3D ? '3D' : '2D'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Google Maps-Style Right Side Buttons */}
      <View style={[styles.rightSideButtons, isNavigating ? { bottom: 140 } : { bottom: 30 }]}>
        {/* Recenter/Compass Button */}
        <TouchableOpacity
          style={[styles.sideButton, followUserLocation && styles.sideButtonActive]}
          onPress={recenterOnUser}
        >
          <IconSymbol
            name="location.fill"
            size={24}
            color={followUserLocation ? COLORS.teal : COLORS.white}
          />
        </TouchableOpacity>

        {/* Search Button - Only show during navigation */}
        {isNavigating && (
          <TouchableOpacity
            style={styles.sideButton}
            onPress={() => {
              // Open full-screen search
              setSearchState(prev => ({ ...prev, showFullScreenSearch: true }));
            }}
          >
            <IconSymbol
              name="magnifyingglass"
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
        )}

        {/* Voice/Mute Button - Only show during navigation */}
        {isNavigating && (
          <TouchableOpacity
            style={styles.sideButton}
            onPress={toggleVoiceNavigation}
          >
            <IconSymbol
              name={voiceNavigationEnabled ? "speaker.wave.3.fill" : "speaker.slash.fill"}
              size={24}
              color={voiceNavigationEnabled ? COLORS.teal : COLORS.white}
            />
          </TouchableOpacity>
        )}
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
                    setModalState(prev => ({ ...prev, showBusinessList: false }));
                  }}
              >
                <View style={styles.businessItemContent}>
                  <Text style={styles.businessItemCategory}>
                    {getCategoryIcon(item.category?.name_fr || 'Commerce')}
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
                      {item.category ? (i18n.language === 'fr' ? item.category.name_fr : item.category.name_en) : 'Commerce'}
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

      {/* Navigation Instructions Panel */}
      {showNavigationInstructions && navigationSteps.length > 0 && (
        <View style={styles.navigationPanel}>
          <View style={styles.navigationHeader}>
            <Text style={styles.navigationTitle}>Instructions</Text>
            <TouchableOpacity onPress={() => setModalState(prev => ({ ...prev, showNavigationInstructions: false }))}>
              <IconSymbol name="xmark.circle.fill" size={24} color={COLORS.darkGray} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={navigationSteps}
            keyExtractor={(item, index) => `step-${index}`}
            renderItem={({ item, index }) => (
              <View style={[styles.navigationStep, index === currentStepIndex && styles.navigationStepActive]}>
                <View style={styles.navigationStepIcon}>
                  <Text style={styles.navigationStepNumber}>{index + 1}</Text>
                </View>
                <View style={styles.navigationStepContent}>
                  <Text style={styles.navigationStepText}>{item.maneuver?.instruction || 'Continuer'}</Text>
                  <Text style={styles.navigationStepDistance}>
                    {item.distance < 1000 
                      ? `${Math.round(item.distance)} m` 
                      : `${(item.distance / 1000).toFixed(1)} km`}
                  </Text>
                </View>
              </View>
            )}
          />
          
          {/* Alternative Routes */}
          {alternativeRoutes.length > 0 && (
            <View style={styles.alternativeRoutesSection}>
              <Text style={styles.alternativeRoutesTitle}>Routes alternatives</Text>
              {alternativeRoutes.map((route, index) => (
                <TouchableOpacity
                  key={`alt-${index}`}
                  style={styles.alternativeRoute}
                  onPress={() => {
                    // Switch to alternative route
                    setNavigationState(prev => ({
                      ...prev,
                      routeCoordinates: route.geometry.coordinates,
                      routeDistance: route.distance,
                      routeDuration: route.duration,
                      navigationSteps: route.legs?.[0]?.steps || [],
                    }));
                    setModalState(prev => ({ ...prev, showNavigationInstructions: false }));
                  }}
                >
                  <Text style={styles.alternativeRouteText}>
                    Route {index + 2}: {(route.distance / 1000).toFixed(1)} km • {Math.round(route.duration / 60)} min
                  </Text>
                  {route.duration < routeDuration! && (
                    <Text style={styles.alternativeRouteFaster}>Plus rapide!</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      <BusinessDetailModal
        visible={showBusinessModal}
        business={selectedBusiness}
        onClose={handleCloseBusinessModal}
        onGetDirections={(business) => {
          if (business.latitude && business.longitude) {
            handleCloseBusinessModal(); // Fermer le modal d'abord
            fetchDirections([business.longitude, business.latitude]);
          }
        }}
        onNavigateToMap={(address, coordinates) => {
          handleCloseBusinessModal(); // Fermer le modal d'abord

          setTimeout(() => {
            if (coordinates) {
              fetchDirections(coordinates);
            } else {
              // Geocoding needed for address
            }
          }, 100);
        }}
        isFollowing={selectedBusiness ? isFollowing(selectedBusiness.id) : false}
        onFollowPress={selectedBusiness ? () => handleFollowPress(selectedBusiness.id) : undefined}
      />

      {/* Offer Detail Modal */}
      <OfferDetailModal
        visible={showOfferModal}
        offer={selectedOffer}
        onClose={() => {
          setShowOfferModal(false);
          setSelectedOffer(null);
        }}
        isFavorite={selectedOffer ? isFavorite('offer', selectedOffer.id) : false}
        onFavoritePress={selectedOffer ? () => toggleFavorite('offer', selectedOffer.id) : undefined}
        onNavigateToMap={(address, coordinates) => {
          setShowOfferModal(false);
          setSelectedOffer(null);
          setTimeout(() => {
            if (coordinates) {
              fetchDirections(coordinates);
            }
          }, 100);
        }}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        visible={showEventModal}
        event={selectedEvent}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        isFavorite={selectedEvent ? isFavorite('event', selectedEvent.id) : false}
        onFavoritePress={selectedEvent ? () => toggleFavorite('event', selectedEvent.id) : undefined}
        onNavigateToMap={(address, coordinates) => {
          setShowEventModal(false);
          setSelectedEvent(null);
          setTimeout(() => {
            if (coordinates) {
              fetchDirections(coordinates);
            }
          }, 100);
        }}
      />

      {/* Full-Screen Search Overlay */}
      <SearchOverlay
        visible={showFullScreenSearch}
        initialQuery={searchQuery}
        onClose={() => setSearchState(prev => ({ ...prev, showFullScreenSearch: false }))}
        onSearchChange={(query) => {
          setSearchState(prev => ({ ...prev, query }));
          searchAddress(query);
        }}
        onSelectCommerce={handleCommerceSelect}
        onSelectAddress={handleAddressSelect}
        commerceResults={filteredCommerces}
        addressResults={searchResults}
        isSearching={searchState.isSearchingAddress}
      />

      {/* Cluster Modal - Show list of businesses at same location */}
      <Modal visible={showClusterModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={handleCloseClusterModal}
            activeOpacity={1}
          />
          <View style={styles.clusterModalContainer}>
            {/* Header */}
            <View style={styles.clusterModalHeader}>
              <Text style={styles.clusterModalTitle}>
                {t('multiple_businesses_here')}
              </Text>
              <TouchableOpacity onPress={handleCloseClusterModal}>
                <IconSymbol name="xmark" size={20} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={styles.clusterModalSubtitle}>
              {t('businesses_at_this_location', { count: selectedCluster?.commerces.length || 0 })}
            </Text>

            {/* Business List */}
            <ScrollView style={styles.clusterModalScroll}>
              {selectedCluster?.commerces.map((commerce: Commerce) => (
                <TouchableOpacity
                  key={commerce.id}
                  style={[
                    styles.clusterCommerceItem,
                    commerce.boosted && styles.clusterCommerceItemBoosted
                  ]}
                  onPress={() => {
                    handleCloseClusterModal();
                    setTimeout(() => handleBusinessPress(commerce), 100);
                  }}
                >
                  {/* Logo */}
                  {commerce.image_url ? (
                    <Image
                      source={{ uri: commerce.image_url }}
                      style={styles.clusterCommerceLogo}
                    />
                  ) : (
                    <View style={styles.clusterCommerceLogo}>
                      <IconSymbol
                        name="storefront.fill"
                        size={20}
                        color={commerce.boosted ? COLORS.primary : COLORS.teal}
                      />
                    </View>
                  )}

                  {/* Info */}
                  <View style={styles.clusterCommerceInfo}>
                    <Text style={styles.clusterCommerceName} numberOfLines={1}>
                      {commerce.name}
                    </Text>
                    <Text style={styles.clusterCommerceCategory} numberOfLines={1}>
                      {commerce.category ? (i18n.language === 'fr' ? commerce.category.name_fr : commerce.category.name_en) : 'Commerce'}
                    </Text>
                    <Text style={styles.clusterCommerceAddress} numberOfLines={1}>
                      {commerce.address || t('address_not_available')}
                    </Text>
                  </View>

                  {/* Arrow */}
                  <IconSymbol name="chevron.right" size={16} color={COLORS.darkGray} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* POI Modal - Google Maps Style */}
      <POIModal
        visible={showPOIModal}
        poi={selectedPOI}
        onClose={() => setModalState(prev => ({ ...prev, showPOIModal: false, selectedPOI: null }))}
        onGetDirections={(coordinates) => {
          fetchDirections(coordinates);
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
    zIndex: 1003,
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
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  topLeftControls: {
    position: 'absolute',
    top: 165,
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
  markerPinButton: {
    // Android: Button shape (pill/rounded rectangle) with green fluo background
    width: 60,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 2,
    paddingVertical: 1,
    minWidth: 60,
    backgroundColor: COLORS.green, // Green fluo
    borderWidth: 0,
  },
  markerPinButtonBoosted: {
    // Android boosted: Better styled button with border and shadow
    minWidth: 70,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.teal,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
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
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.teal,
    textAlign: 'center',
  },
  markerTextBoosted: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.teal,
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
    padding: 8,
    marginLeft: 4,
  },
  profileIconButton: {
    marginRight: 8,
    padding: 4,
  },
  voiceButton: {
    marginLeft: 8,
    padding: 4,
  },
  alternativesButton: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  alternativesText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  profileSwitcher: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  profileOptionActive: {
    backgroundColor: 'rgba(1, 97, 103, 0.1)',
  },
  profileOptionText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 12,
    fontWeight: '500',
  },
  profileOptionTextActive: {
    color: COLORS.teal,
    fontWeight: '600',
  },
  navigationPanel: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    maxHeight: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 1000,
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  navigationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  navigationStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 8,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
  },
  navigationStepActive: {
    backgroundColor: 'rgba(1, 97, 103, 0.1)',
    borderWidth: 2,
    borderColor: COLORS.teal,
  },
  navigationStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.teal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  navigationStepNumber: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  navigationStepContent: {
    flex: 1,
  },
  navigationStepText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
    marginBottom: 4,
  },
  navigationStepDistance: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  alternativeRoutesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  alternativeRoutesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  alternativeRoute: {
    padding: 12,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    marginBottom: 8,
  },
  alternativeRouteText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  alternativeRouteFaster: {
    fontSize: 12,
    color: COLORS.teal,
    fontWeight: '600',
    marginTop: 4,
  },
  // Google Maps-style right side buttons
  rightSideButtons: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
    gap: 12,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1C1C1E', // Dark gray like Google
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sideButtonActive: {
    backgroundColor: '#2C2C2E',
  },
  searchResultsContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    maxHeight: 300,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  searchResultsList: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  searchResultLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray,
  },
  searchResultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  searchResultSubtext: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  searchResultItemBoosted: {
    backgroundColor: 'rgba(255, 98, 51, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  searchResultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  searchResultTextBoosted: {
    color: COLORS.primary,
  },
  searchBoostedBadge: {
    backgroundColor: COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationMarkerPin: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  // Cluster marker styles
  clusterCountText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.teal,
    textAlign: 'center',
  },
  clusterCountTextBoosted: {
    fontSize: 28,
    color: COLORS.primary,
  },
  // Cluster modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  clusterModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  clusterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  clusterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  clusterModalSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  clusterModalScroll: {
    paddingHorizontal: 16,
  },
  clusterCommerceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  clusterCommerceItemBoosted: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5F3',
  },
  clusterCommerceLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray,
  },
  clusterCommerceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  clusterCommerceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  clusterCommerceCategory: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 2,
  },
  clusterCommerceAddress: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  // Floating Chip Tab styles
  chipTabsContainer: {
    position: 'absolute',
    top: 115,
    left: 0,
    right: 0,
    zIndex: 1002,
  },
  chipTabsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  chipTabActive: {
    backgroundColor: COLORS.teal,
    borderColor: COLORS.teal,
  },
  chipTabActiveOffer: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipTabActiveEvent: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  chipTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  chipTabTextActive: {
    color: COLORS.white,
  },
  // Offer marker styles
  offerMarkerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  offerMarkerPinBoosted: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
  },
  offerBoostGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
  },
  // Event marker styles
  eventMarkerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  eventMarkerPinBoosted: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
  },
  eventBoostGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.blue,
    opacity: 0.3,
  },
});
