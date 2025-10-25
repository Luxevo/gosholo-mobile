// Foursquare Places API service for fetching POI details with opening hours
// Documentation: https://docs.foursquare.com/fsq-developers-places/

type LngLat = [number, number];

interface FoursquarePlace {
  fsq_id: string;
  name: string;
  categories: Array<{
    id: number;
    name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  location: {
    address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
    country?: string;
    formatted_address?: string;
  };
  geocodes: {
    main: {
      latitude: number;
      longitude: number;
    };
  };
  distance?: number;
  tel?: string;
  website?: string;
  email?: string;
}

interface FoursquarePlaceDetails extends FoursquarePlace {
  description?: string;
  hours?: {
    display?: string;
    is_local_holiday?: boolean;
    open_now?: boolean;
    regular?: Array<{
      day: number; // 1=Monday, 7=Sunday
      open: string; // "0900"
      close: string; // "1700"
    }>;
  };
  rating?: number;
  price?: number;
  popularity?: number;
  photos?: Array<{
    id: string;
    prefix: string;
    suffix: string;
    width: number;
    height: number;
  }>;
  tips?: Array<{
    id: string;
    created_at: string;
    text: string;
  }>;
}

interface SearchResponse {
  results: FoursquarePlace[];
  context?: {
    geo_bounds?: {
      circle?: {
        center: {
          latitude: number;
          longitude: number;
        };
        radius: number;
      };
    };
  };
}

/**
 * Search for places near coordinates
 * @param coordinates [longitude, latitude]
 * @param radius Search radius in meters (default: 50m for tight matching)
 * @param query Optional search query to filter by name
 */
export async function searchNearbyPlaces(
  coordinates: LngLat,
  radius = 50,
  query?: string
): Promise<FoursquarePlace[]> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_FOURSQUARE_API_KEY;

    if (!apiKey) {
      console.warn('Foursquare API key not configured');
      return [];
    }

    const [lng, lat] = coordinates;

    // Build query parameters
    const params = new URLSearchParams({
      ll: `${lat},${lng}`,
      radius: radius.toString(),
      limit: '5', // Limit to top 5 matches
    });

    if (query) {
      params.append('query', query);
    }

    const url = `https://places-api.foursquare.com/places/search?${params.toString()}`;

    console.log('🔍 Foursquare Search URL:', url);
    console.log('🔑 API Key (first 10 chars):', apiKey.substring(0, 10) + '...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': apiKey,
        'X-Places-Api-Version': '2025-06-17', // Required for new Places API
      },
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Foursquare search error:', response.status, response.statusText, errorText);
      return [];
    }

    const data: SearchResponse = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching Foursquare places:', error);
    return [];
  }
}

/**
 * Get detailed place information including opening hours (Premium tier)
 * @param fsqId Foursquare place ID
 */
export async function getPlaceDetails(fsqId: string): Promise<FoursquarePlaceDetails | null> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_FOURSQUARE_API_KEY;

    if (!apiKey) {
      console.warn('Foursquare API key not configured');
      return null;
    }

    // Request Premium fields including hours
    const fields = [
      'fsq_id',
      'name',
      'categories',
      'location',
      'geocodes',
      'tel',
      'website',
      'email',
      'description',
      'hours', // Premium field
      'rating',
      'price',
      'popularity',
      'photos',
      'tips',
    ].join(',');

    const url = `https://places-api.foursquare.com/places/${fsqId}?fields=${fields}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': apiKey,
        'X-Places-Api-Version': '2025-06-17', // Required for new Places API
      },
    });

    if (!response.ok) {
      console.error('Foursquare details error:', response.status, response.statusText);
      return null;
    }

    const data: FoursquarePlaceDetails = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Foursquare place details:', error);
    return null;
  }
}

/**
 * Format opening hours for display
 * Returns a human-readable string for today's hours
 */
export function formatTodaysHours(details: FoursquarePlaceDetails): string | undefined {
  if (!details.hours?.regular || details.hours.regular.length === 0) {
    return undefined;
  }

  const now = new Date();
  const today = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  // Foursquare format: 1=Monday, 7=Sunday
  const foursquareDay = today === 0 ? 7 : today;

  const todayHours = details.hours.regular.find(h => h.day === foursquareDay);

  if (!todayHours) {
    return 'Fermé aujourd\'hui';
  }

  // Format time from "0900" to "9:00"
  const formatTime = (time: string): string => {
    const hours = parseInt(time.slice(0, 2), 10);
    const minutes = time.slice(2, 4);
    return `${hours}:${minutes}`;
  };

  const openTime = formatTime(todayHours.open);
  const closeTime = formatTime(todayHours.close);

  return `${openTime} - ${closeTime}`;
}

/**
 * Check if place is currently open based on hours
 */
export function isPlaceOpen(details: FoursquarePlaceDetails): boolean | undefined {
  // Use the API's open_now field if available
  if (details.hours?.open_now !== undefined) {
    return details.hours.open_now;
  }

  // Fallback: calculate from regular hours
  if (!details.hours?.regular || details.hours.regular.length === 0) {
    return undefined;
  }

  const now = new Date();
  const today = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 14:30 = 1430

  // Foursquare format: 1=Monday, 7=Sunday
  const foursquareDay = today === 0 ? 7 : today;

  const todayHours = details.hours.regular.find(h => h.day === foursquareDay);

  if (!todayHours) {
    return false; // Closed today
  }

  const openTime = parseInt(todayHours.open, 10);
  const closeTime = parseInt(todayHours.close, 10);

  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Combined function: Find place by coordinates and get its details
 * This is optimized for POI clicks on the map
 */
export async function findAndGetPlaceDetails(
  coordinates: LngLat,
  name?: string
): Promise<FoursquarePlaceDetails | null> {
  try {
    // Step 1: Search for nearby places
    const places = await searchNearbyPlaces(coordinates, 50, name);

    if (places.length === 0) {
      console.log('No Foursquare places found nearby');
      return null;
    }

    // Step 2: Get the best match
    let bestMatch = places[0];

    // If name is provided, try to find exact match
    if (name) {
      const exactMatch = places.find(place =>
        place.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(place.name.toLowerCase())
      );
      if (exactMatch) {
        bestMatch = exactMatch;
      }
    }

    // Step 3: Get detailed info with opening hours
    const details = await getPlaceDetails(bestMatch.fsq_id);
    return details;
  } catch (error) {
    console.error('Error in findAndGetPlaceDetails:', error);
    return null;
  }
}
