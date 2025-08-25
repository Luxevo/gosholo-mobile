import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Location from 'expo-location';

// Conditional import for Mapbox (only works in native builds)
let Mapbox: any, MapView: any, Camera: any, LocationPuck: any, FillExtrusionLayer: any;
try {
  const MapboxMaps = require('@rnmapbox/maps');
  Mapbox = MapboxMaps.default;
  MapView = MapboxMaps.MapView;
  Camera = MapboxMaps.Camera;
  LocationPuck = MapboxMaps.LocationPuck;
  FillExtrusionLayer = MapboxMaps.FillExtrusionLayer;
} catch (error) {
  console.log('Mapbox not available in Expo Go');
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
  Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
}

export default function CompassScreen() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [is3D, setIs3D] = useState(false);

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
    }
  };

  const toggleMapStyle = () => {
    setIs3D(!is3D);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Map</Text>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleMapStyle}>
          <IconSymbol name={is3D ? "cube" : "map"} size={24} color={COLORS.primary} />
          <Text style={styles.toggleText}>{is3D ? "3D" : "2D"}</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {Mapbox && MapView ? (
          <MapView
            style={styles.map}
            styleURL={Mapbox?.StyleURL?.Street || 'mapbox://styles/mapbox/streets-v12'}
            zoomEnabled={true}
            scrollEnabled={true}
          >
            <Camera
              centerCoordinate={userLocation || [-74.006, 40.7128]}
              zoomLevel={is3D ? 14.5 : 14}
              pitch={is3D ? 70 : 0}
              heading={is3D ? 45 : 0}
              animationDuration={2000}
            />
            
            {hasLocationPermission && userLocation && (
              <LocationPuck
                puckBearing="heading"
                puckBearingEnabled
                visible={true}
              />
            )}

            {is3D && FillExtrusionLayer && (
              <FillExtrusionLayer
                key="buildings-3d-layer"
                id={`buildings-3d-${Date.now()}`}
                sourceID="composite"
                sourceLayerID="building"
                minZoom={10}
                filter={['==', 'extrude', 'true']}
                style={{
                  fillExtrusionColor: [
                    'interpolate',
                    ['linear'],
                    ['get', 'height'],
                    0, '#fefefe',
                    20, '#f8f8f8',
                    50, '#f0f0f0', 
                    100, '#e8e8e8',
                    200, '#d4d4d4',
                    300, '#a3a3a3',
                    500, '#737373'
                  ],
                  fillExtrusionHeight: [
                    '*',
                    ['get', 'height'],
                    1.8
                  ],
                  fillExtrusionBase: ['get', 'min_height'],
                  fillExtrusionOpacity: 0.9,
                }}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackText}>
              📍 Map available in native build
            </Text>
          </View>
        )}
        
        {hasLocationPermission && (
          <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
            <IconSymbol name="location.fill" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
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
  },
  mapFallbackText: {
    color: COLORS.darkGray,
    fontSize: 16,
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});