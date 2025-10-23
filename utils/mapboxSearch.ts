/**
 * Mapbox Search Box API Helper
 * https://docs.mapbox.com/api/search/search-box/
 *
 * Uses session tokens for cost optimization:
 * - One session = 1 /suggest call + 1 /retrieve call
 * - Billed as a single request instead of per keystroke
 */

// Generate UUID v4 for session tokens
function generateSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface SearchSuggestion {
  name: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  context?: {
    country?: { name: string; country_code: string };
    region?: { name: string; region_code: string };
    postcode?: { name: string };
    place?: { name: string };
    locality?: { name: string };
    neighborhood?: { name: string };
  };
}

export interface SearchResult {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  address: string;
  full_address: string;
  feature_type: string;
  mapbox_id: string;
}

class MapboxSearchService {
  private accessToken: string;
  private currentSessionToken: string;
  private baseUrl = 'https://api.mapbox.com/search/searchbox/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.currentSessionToken = generateSessionToken();
  }

  /**
   * Get autocomplete suggestions as user types
   * @param query - Search query string
   * @param options - Additional search options
   */
  async getSuggestions(
    query: string,
    options: {
      proximity?: [number, number]; // [lng, lat] - Bias results near user
      language?: string; // 'en' | 'fr'
      country?: string; // 'CA' for Canada
      limit?: number; // Max results (default 10)
      types?: string; // Comma-separated: 'address,poi,place'
    } = {}
  ): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) return [];

    const params = new URLSearchParams({
      q: query,
      access_token: this.accessToken,
      session_token: this.currentSessionToken,
      language: options.language || 'fr',
      country: options.country || 'CA',
      limit: (options.limit || 6).toString(),
    });

    if (options.proximity) {
      params.append('proximity', `${options.proximity[0]},${options.proximity[1]}`);
    }

    if (options.types) {
      params.append('types', options.types);
    }

    try {
      const response = await fetch(`${this.baseUrl}/suggest?${params}`);
      const data = await response.json();

      if (!data.suggestions || data.suggestions.length === 0) {
        return [];
      }

      return data.suggestions.map((suggestion: any) => ({
        name: suggestion.name,
        mapbox_id: suggestion.mapbox_id,
        feature_type: suggestion.feature_type,
        address: suggestion.address,
        full_address: suggestion.full_address,
        place_formatted: suggestion.place_formatted,
        context: suggestion.context,
      }));
    } catch (error) {
      console.error('Mapbox Search error:', error);
      return [];
    }
  }

  /**
   * Retrieve full details for a selected suggestion
   * This completes the session and resets the session token
   * @param mapboxId - The mapbox_id from a suggestion
   */
  async retrievePlace(mapboxId: string): Promise<SearchResult | null> {
    const params = new URLSearchParams({
      access_token: this.accessToken,
      session_token: this.currentSessionToken,
    });

    try {
      const response = await fetch(`${this.baseUrl}/retrieve/${mapboxId}?${params}`);
      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        return null;
      }

      const feature = data.features[0];
      const result: SearchResult = {
        name: feature.properties.name,
        coordinates: feature.geometry.coordinates,
        address: feature.properties.address || '',
        full_address: feature.properties.full_address || feature.properties.place_formatted || '',
        feature_type: feature.properties.feature_type,
        mapbox_id: feature.properties.mapbox_id,
      };

      // Session completed - generate new token for next search
      this.resetSession();

      return result;
    } catch (error) {
      console.error('Mapbox Retrieve error:', error);
      return null;
    }
  }

  /**
   * Reset session token (called after retrieve completes)
   */
  private resetSession() {
    this.currentSessionToken = generateSessionToken();
  }

  /**
   * Manually reset session (e.g., if user cancels search)
   */
  public cancelSession() {
    this.resetSession();
  }
}

// Singleton instance
let searchServiceInstance: MapboxSearchService | null = null;

export function getMapboxSearchService(accessToken: string): MapboxSearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new MapboxSearchService(accessToken);
  }
  return searchServiceInstance;
}
