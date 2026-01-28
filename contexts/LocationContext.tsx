import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const LOCATION_STORAGE_KEY = '@gosholo_selected_location';

type LngLat = [number, number];

interface SelectedLocation {
  coordinates: LngLat;
  name: string; // City name or address
  isCustom: boolean; // false = using device GPS, true = manually selected
}

interface LocationContextType {
  // The location used for filtering (either GPS or custom)
  activeLocation: LngLat | null;
  // The display name of the location
  locationName: string;
  // Whether using a custom location
  isCustomLocation: boolean;
  // Device's actual GPS location
  deviceLocation: LngLat | null;
  // Loading state
  loading: boolean;
  // Set a custom location
  setCustomLocation: (coordinates: LngLat, name: string) => Promise<void>;
  // Reset to device GPS location
  resetToDeviceLocation: () => Promise<void>;
  // Refresh device location
  refreshDeviceLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [deviceLocation, setDeviceLocation] = useState<LngLat | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceLocationName, setDeviceLocationName] = useState<string>('');

  // Load saved location preference on mount
  useEffect(() => {
    loadSavedLocation();
    getDeviceLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SelectedLocation;
        if (parsed.isCustom) {
          setSelectedLocation(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    }
  };

  const getDeviceLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords: LngLat = [location.coords.longitude, location.coords.latitude];
      setDeviceLocation(coords);

      // Reverse geocode to get city name
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          // Just show city name for cleaner UI
          const name = address.city || address.subregion || address.region || 'Current Location';
          setDeviceLocationName(name);
        }
      } catch (geocodeError) {
        console.error('Reverse geocode error:', geocodeError);
        setDeviceLocationName('Current Location');
      }
    } catch (error) {
      console.error('Error getting device location:', error);
    } finally {
      setLoading(false);
    }
  };

  const setCustomLocation = useCallback(async (coordinates: LngLat, name: string) => {
    const newLocation: SelectedLocation = {
      coordinates,
      name,
      isCustom: true,
    };
    setSelectedLocation(newLocation);

    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLocation));
    } catch (error) {
      console.error('Error saving location:', error);
    }
  }, []);

  const resetToDeviceLocation = useCallback(async () => {
    setSelectedLocation(null);

    try {
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch (error) {
      console.error('Error removing saved location:', error);
    }

    // Refresh device location
    await getDeviceLocation();
  }, []);

  const refreshDeviceLocation = useCallback(async () => {
    await getDeviceLocation();
  }, []);

  // Determine active location (custom takes priority over device)
  const activeLocation = selectedLocation?.isCustom
    ? selectedLocation.coordinates
    : deviceLocation;

  const locationName = selectedLocation?.isCustom
    ? selectedLocation.name
    : deviceLocationName || 'Loading...';

  const isCustomLocation = selectedLocation?.isCustom || false;

  return (
    <LocationContext.Provider
      value={{
        activeLocation,
        locationName,
        isCustomLocation,
        deviceLocation,
        loading,
        setCustomLocation,
        resetToDeviceLocation,
        refreshDeviceLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
