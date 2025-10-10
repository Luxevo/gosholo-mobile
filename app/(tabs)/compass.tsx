import BusinessDetailModal from '@/components/BusinessDetailModal';
import { LOGO_BASE64 } from '@/components/LogoBase64';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCommerces, type Commerce } from '@/hooks/useCommerces';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
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
  
  // Navigation states
  const [navigationSteps, setNavigationSteps] = useState<any[]>([]);
  const [alternativeRoutes, setAlternativeRoutes] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routingProfile, setRoutingProfile] = useState<'driving-traffic' | 'driving' | 'walking' | 'cycling'>('driving-traffic');
  const [showNavigationInstructions, setShowNavigationInstructions] = useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [voiceNavigationEnabled, setVoiceNavigationEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [followUserLocation, setFollowUserLocation] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [destinationMarker, setDestinationMarker] = useState<LngLat | null>(null);

  const cameraRef = useRef<any>(null);
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const { commerces, loading: commercesLoading, error: commercesError } = useCommerces();

  // Filter commerces based on search query
  const filteredCommerces = useMemo(() => {
    if (!searchQuery.trim()) return commerces;

    const query = searchQuery.toLowerCase();
    const filtered = commerces.filter((commerce) =>
      commerce.name?.toLowerCase().includes(query) ||
      commerce.category?.toLowerCase().includes(query) ||
      commerce.address?.toLowerCase().includes(query)
    );
    
    // If we have matching commerces, show search results
    if (filtered.length > 0 && searchQuery.length >= 2) {
      setShowSearchResults(true);
    }
    
    return filtered;
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
          // Nettoyer les paramètres après utilisation pour éviter les re-déclenchements
          router.setParams({ destination: undefined, type: undefined });
        }
      } else if (type === 'address') {
        // TODO: Implement geocoding for address
        console.log('Geocoding needed for address:', destination);
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

  const fetchDirections = async (destination: LngLat, profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling') => {
    if (!userLocation) {
      console.log('User location not available');
      return;
    }

    const selectedProfile = profile || routingProfile;

    try {
      const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
      const start = `${userLocation[0]},${userLocation[1]}`;
      const end = `${destination[0]},${destination[1]}`;
      
      // Paramètres avancés pour navigation style Google Maps/Waze
      const params = new URLSearchParams({
        geometries: 'geojson',
        steps: 'true', // Instructions turn-by-turn
        banner_instructions: 'true', // Instructions visuelles
        voice_instructions: 'true', // Instructions vocales
        alternatives: 'true', // Routes alternatives (jusqu'à 2)
        language: 'fr', // Instructions en français
        overview: 'full', // Vue complète de la route
        annotations: 'distance,duration,speed,congestion', // Infos de trafic
        continue_straight: 'true',
        access_token: accessToken || '',
      });

      const url = `https://api.mapbox.com/directions/v5/mapbox/${selectedProfile}/${start};${end}?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        // Route principale
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        const distance = route.distance; // in meters
        const duration = route.duration; // in seconds

        // Stocker les données de navigation complètes
        setRouteCoordinates(coordinates);
        setRouteDistance(distance);
        setRouteDuration(duration);
        
        // Set destination marker
        setDestinationMarker(destination);

        // Stocker les instructions turn-by-turn
        if (route.legs && route.legs[0].steps) {
          setNavigationSteps(route.legs[0].steps);
          setCurrentStepIndex(0);
          console.log('📍 Instructions:', route.legs[0].steps.length, 'étapes');
        }

        // Stocker les données de trafic/annotations
        if (route.legs && route.legs[0].annotation) {
          setTrafficData(route.legs[0].annotation);
        }

        // Stocker les routes alternatives (max 2)
        if (data.routes.length > 1) {
          setAlternativeRoutes(data.routes.slice(1));
          console.log('🔀 Routes alternatives:', data.routes.length - 1);
        } else {
          setAlternativeRoutes([]);
        }

        // Fit camera to show the entire route with extra bottom padding for route info pill
        if (cameraRef.current && userLocation) {
          cameraRef.current.fitBounds(
            userLocation,
            destination,
            [80, 50, 200, 50], // padding [top, right, bottom, left] - extra bottom for route pill
            500 // animation duration - reduced for better responsiveness
          );
        }
      } else if (data.code === 'NoRoute') {
        console.log('❌ Aucune route trouvée');
      }
    } catch (error) {
      console.log('Error fetching directions:', error);
    }
  };

  const clearRoute = () => {
    setRouteCoordinates(null);
    setRouteDistance(null);
    setRouteDuration(null);
    setNavigationSteps([]);
    setAlternativeRoutes([]);
    setCurrentStepIndex(0);
    setTrafficData(null);
    setShowNavigationInstructions(false);
    setVoiceNavigationEnabled(false);
    setDestinationMarker(null);
    stopSpeaking();
    // Clear URL params to prevent useEffect from re-triggering
    router.setParams({ destination: undefined, type: undefined });
  };

  const toggleMapStyle = () => setIs3D((v) => !v);

  const recenterOnUser = async () => {
    if (!userLocation || !cameraRef.current) return;
    
    setFollowUserLocation(true);
    cameraRef.current.setCamera({
      centerCoordinate: userLocation,
      zoomLevel: isNavigating ? 17 : 15,
      animationDuration: 500,
    });
  };

  const toggleFollowMode = () => {
    const newFollowState = !followUserLocation;
    setFollowUserLocation(newFollowState);
    if (newFollowState) {
      recenterOnUser();
    }
  };

  // Search addresses using Mapbox Geocoding API
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearchingAddress(true);

    try {
      const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
      // Montreal as default proximity for Quebec/Canada searches
      const proximity = userLocation ? `${userLocation[0]},${userLocation[1]}` : '-73.567,45.501';
      
      // Build URL with Canada/Quebec specific parameters
      const params = new URLSearchParams({
        access_token: accessToken || '',
        proximity: proximity,
        country: 'CA', // Canada only
        language: 'fr', // French language
        limit: '8', // More results for better coverage
        types: 'address,poi,place,postcode,locality,neighborhood',
        autocomplete: 'true',
      });
      
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        // Filter to prioritize Quebec results if needed
        const results = data.features;
        setSearchResults(results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.log('Error searching address:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleAddressSelect = (feature: any) => {
    const [lng, lat] = feature.center;
    setSearchQuery(feature.place_name);
    setShowSearchResults(false);
    
    // Center map on selected location
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 16,
        animationDuration: 1000,
      });
    }
    
    // Optionally start navigation to this location
    fetchDirections([lng, lat]);
  };

  const handleCommerceSelect = (commerce: Commerce) => {
    if (!commerce.latitude || !commerce.longitude) return;
    
    setSearchQuery(commerce.name || '');
    setShowSearchResults(false);
    
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
  };

  // Debounce search - combine commerces and addresses
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        // Combine local commerces with Mapbox addresses
        const query = searchQuery.toLowerCase();
        const matchingCommerces = commerces.filter((commerce) =>
          commerce.name?.toLowerCase().includes(query) ||
          commerce.category?.toLowerCase().includes(query) ||
          commerce.address?.toLowerCase().includes(query)
        );
        
        // Also search addresses if query is long enough
        if (searchQuery.trim().length >= 3) {
          searchAddress(searchQuery);
        }
        
        // Show results if we have matching commerces
        if (matchingCommerces.length > 0) {
          setShowSearchResults(true);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, commerces]);

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

  // Create route segments with traffic colors
  const routeSegments = useMemo(() => {
    if (!routeCoordinates || !trafficData?.congestion) return null;
    
    const segments: any[] = [];
    const congestion = trafficData.congestion;
    
    for (let i = 0; i < routeCoordinates.length - 1; i++) {
      const congestionLevel = congestion[i] || 'unknown';
      segments.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [routeCoordinates[i], routeCoordinates[i + 1]],
        },
        properties: {
          congestion: congestionLevel,
          color: getTrafficColor(congestionLevel),
        },
      });
    }
    
    return segments;
  }, [routeCoordinates, trafficData]);

  // Voice navigation functions
  const speakInstruction = async (instruction: string) => {
    if (!voiceNavigationEnabled) return;
    
    try {
      setIsSpeaking(true);
      await Speech.speak(instruction, {
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.log('Error speaking instruction:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const toggleVoiceNavigation = () => {
    const newState = !voiceNavigationEnabled;
    setVoiceNavigationEnabled(newState);
    
    if (newState && navigationSteps.length > 0 && currentStepIndex < navigationSteps.length) {
      // Speak the current instruction
      const currentStep = navigationSteps[currentStepIndex];
      speakInstruction(currentStep.maneuver?.instruction || 'Continuer tout droit');
    } else if (!newState) {
      stopSpeaking();
    }
  };

  // Auto-speak when step changes
  useEffect(() => {
    if (voiceNavigationEnabled && navigationSteps.length > 0 && currentStepIndex < navigationSteps.length) {
      const currentStep = navigationSteps[currentStepIndex];
      speakInstruction(currentStep.maneuver?.instruction || 'Continuer tout droit');
    }
  }, [currentStepIndex, voiceNavigationEnabled]);

  // Follow user location in real-time when in navigation mode
  useEffect(() => {
    if (!followUserLocation || !userLocation || !cameraRef.current) return;

    if (isNavigating) {
      // In navigation mode: follow user with smooth tracking
      cameraRef.current.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 17,
        animationDuration: 1000,
        heading: 0, // You can add heading based on user movement direction
      });
    }
  }, [userLocation, followUserLocation, isNavigating]);

  // Update navigation state when route is set
  useEffect(() => {
    setIsNavigating(!!routeCoordinates);
  }, [routeCoordinates]);

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
            onTouchStart={() => {
              // Disable follow mode when user manually moves the map
              if (followUserLocation) {
                setFollowUserLocation(false);
              }
            }}
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
              <>
                {/* Base route (always visible as fallback) */}
                {!routeSegments && (
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
                        lineColor: COLORS.blue,
                        lineWidth: 5,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                    />
                  </ShapeSource>
                )}
                
                {/* Traffic segments (colored by congestion) */}
                {routeSegments && routeSegments.map((segment, index) => (
                  <ShapeSource
                    key={`segment-${index}`}
                    id={`routeSegment-${index}`}
                    shape={segment}
                  >
                    <LineLayer
                      id={`routeSegmentLine-${index}`}
                      style={{
                        lineColor: segment.properties.color,
                        lineWidth: 5,
                        lineCap: 'round',
                        lineJoin: 'round',
                      }}
                    />
                  </ShapeSource>
                ))}
              </>
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
            
            {/* Destination Marker */}
            {MarkerView && destinationMarker && (
              <MarkerView
                id="destination-marker"
                coordinate={destinationMarker}
                allowOverlap={true}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.destinationMarkerContainer}>
                  <View style={styles.destinationMarkerPin}>
                    <IconSymbol name="mappin.circle.fill" size={40} color={COLORS.primary} />
                  </View>
                </View>
              </MarkerView>
            )}
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
            placeholder="Chercher une adresse ou un commerce"
            placeholderTextColor={COLORS.darkGray}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowSearchResults(false);
            }}>
              <IconSymbol name="xmark.circle.fill" size={16} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Results Dropdown */}
        {showSearchResults && (filteredCommerces.length > 0 || searchResults.length > 0) && (
          <View style={styles.searchResultsContainer}>
            <FlatList
              data={[
                // First: Local commerces (marked with a flag)
                ...filteredCommerces.slice(0, 5).map((commerce) => ({ 
                  type: 'commerce', 
                  data: commerce,
                  id: `commerce-${commerce.id}` 
                })),
                // Then: Mapbox addresses
                ...searchResults.slice(0, 5).map((result) => ({ 
                  type: 'address', 
                  data: result,
                  id: `address-${result.id}` 
                })),
              ]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                if (item.type === 'commerce') {
                  const commerce = item.data as Commerce;
                  return (
                    <TouchableOpacity
                      style={styles.searchResultItem}
                      onPress={() => handleCommerceSelect(commerce)}
                    >
                      <IconSymbol 
                        name="storefront.fill" 
                        size={20} 
                        color={COLORS.teal} 
                      />
                      <View style={styles.searchResultTextContainer}>
                        <Text style={styles.searchResultText} numberOfLines={1}>
                          {commerce.name}
                        </Text>
                        <Text style={styles.searchResultSubtext} numberOfLines={1}>
                          {commerce.category} • {commerce.address}
                        </Text>
                      </View>
                      <IconSymbol name="chevron.right" size={16} color={COLORS.darkGray} />
                    </TouchableOpacity>
                  );
                } else {
                  const address = item.data as any;
                  return (
                    <TouchableOpacity
                      style={styles.searchResultItem}
                      onPress={() => handleAddressSelect(address)}
                    >
                      <IconSymbol 
                        name={address.properties?.category === 'address' ? 'mappin.circle.fill' : 'building.2.fill'} 
                        size={20} 
                        color={COLORS.primary} 
                      />
                      <View style={styles.searchResultTextContainer}>
                        <Text style={styles.searchResultText} numberOfLines={1}>
                          {address.text}
                        </Text>
                        <Text style={styles.searchResultSubtext} numberOfLines={1}>
                          {address.place_name}
                        </Text>
                      </View>
                      <IconSymbol name="arrow.up.left" size={16} color={COLORS.darkGray} />
                    </TouchableOpacity>
                  );
                }
              }}
              style={styles.searchResultsList}
            />
          </View>
        )}
      </View>

      {/* Route Info Pill */}
      {routeDistance && routeDuration && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoPill}>
            <TouchableOpacity onPress={() => setShowProfileSwitcher(!showProfileSwitcher)} style={styles.profileIconButton}>
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
              <TouchableOpacity onPress={() => setShowNavigationInstructions(true)} style={styles.alternativesButton}>
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
                  setShowProfileSwitcher(false);
                  if (routeCoordinates) {
                    // Re-fetch with new profile
                    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
                    fetchDirections(lastCoord, 'driving-traffic');
                  }
                }}
              >
                <IconSymbol name="car.fill" size={20} color={routingProfile === 'driving-traffic' ? COLORS.teal : COLORS.darkGray} />
                <Text style={[styles.profileOptionText, routingProfile === 'driving-traffic' && styles.profileOptionTextActive]}>
                  Voiture (trafic)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.profileOption, routingProfile === 'driving' && styles.profileOptionActive]}
                onPress={() => {
                  setRoutingProfile('driving');
                  setShowProfileSwitcher(false);
                  if (routeCoordinates) {
                    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
                    fetchDirections(lastCoord, 'driving');
                  }
                }}
              >
                <IconSymbol name="car" size={20} color={routingProfile === 'driving' ? COLORS.teal : COLORS.darkGray} />
                <Text style={[styles.profileOptionText, routingProfile === 'driving' && styles.profileOptionTextActive]}>
                  Voiture (rapide)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.profileOption, routingProfile === 'walking' && styles.profileOptionActive]}
                onPress={() => {
                  setRoutingProfile('walking');
                  setShowProfileSwitcher(false);
                  if (routeCoordinates) {
                    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
                    fetchDirections(lastCoord, 'walking');
                  }
                }}
              >
                <IconSymbol name="figure.walk" size={20} color={routingProfile === 'walking' ? COLORS.teal : COLORS.darkGray} />
                <Text style={[styles.profileOptionText, routingProfile === 'walking' && styles.profileOptionTextActive]}>
                  Marche
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.profileOption, routingProfile === 'cycling' && styles.profileOptionActive]}
                onPress={() => {
                  setRoutingProfile('cycling');
                  setShowProfileSwitcher(false);
                  if (routeCoordinates) {
                    const lastCoord = routeCoordinates[routeCoordinates.length - 1];
                    fetchDirections(lastCoord, 'cycling');
                  }
                }}
              >
                <IconSymbol name="bicycle" size={20} color={routingProfile === 'cycling' ? COLORS.teal : COLORS.darkGray} />
                <Text style={[styles.profileOptionText, routingProfile === 'cycling' && styles.profileOptionTextActive]}>
                  Vélo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 2D/3D Toggle Pill - Under Search Bar */}
      <View style={styles.topLeftControls}>
        <TouchableOpacity style={styles.togglePill} onPress={toggleMapStyle}>
          <IconSymbol name={is3D ? 'cube' : 'map'} size={18} color={COLORS.primary} />
          <Text style={styles.togglePillText}>{is3D ? '3D' : '2D'}</Text>
        </TouchableOpacity>
      </View>

      {/* Recenter Button - Bottom Right */}
      <View style={[styles.bottomRightControls, routeDistance ? { bottom: 100 } : null]}>
        <TouchableOpacity 
          style={[styles.recenterButton, followUserLocation && styles.recenterButtonActive]} 
          onPress={recenterOnUser}
        >
          <IconSymbol 
            name="location.fill" 
            size={24} 
            color={followUserLocation ? COLORS.teal : COLORS.darkGray} 
          />
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

      {/* Navigation Instructions Panel */}
      {showNavigationInstructions && navigationSteps.length > 0 && (
        <View style={styles.navigationPanel}>
          <View style={styles.navigationHeader}>
            <Text style={styles.navigationTitle}>Instructions</Text>
            <TouchableOpacity onPress={() => setShowNavigationInstructions(false)}>
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
                    setRouteCoordinates(route.geometry.coordinates);
                    setRouteDistance(route.distance);
                    setRouteDuration(route.duration);
                    if (route.legs && route.legs[0].steps) {
                      setNavigationSteps(route.legs[0].steps);
                    }
                    setShowNavigationInstructions(false);
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
              // Géocodage si pas de coordonnées
              console.log('Geocoding needed for:', address);
            }
          }, 100);
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
  bottomRightControls: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 1000,
  },
  recenterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  recenterButtonActive: {
    backgroundColor: 'rgba(1, 97, 103, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.teal,
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
});
