/**
 * Marker Clustering Utilities
 * Groups commerces that are at the same or very close locations
 */

import type { Commerce } from '@/hooks/useCommerces';

export interface MarkerCluster {
  id: string;
  latitude: number;
  longitude: number;
  commerces: Commerce[];
  isBoosted: boolean; // True if any commerce in cluster is boosted
}

/**
 * Calculate distance between two points in meters using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Groups commerces that are within the clustering threshold distance
 * Default threshold: 20 meters (same building/address)
 *
 * @param commerces - Array of commerce objects with coordinates
 * @param thresholdMeters - Distance threshold for clustering (default: 20m)
 * @returns Array of marker clusters
 */
export function groupCommercesByLocation(
  commerces: Commerce[],
  thresholdMeters: number = 20
): MarkerCluster[] {
  // Filter out commerces without valid coordinates
  const validCommerces = commerces.filter(
    c => c.latitude != null && c.longitude != null
  );

  if (validCommerces.length === 0) {
    return [];
  }

  const clusters: MarkerCluster[] = [];
  const processed = new Set<string>();

  validCommerces.forEach((commerce) => {
    if (processed.has(commerce.id)) {
      return;
    }

    // Find all commerces within threshold distance
    const nearbyCommerces = validCommerces.filter((other) => {
      if (processed.has(other.id) || commerce.id === other.id) {
        return false;
      }

      const distance = calculateDistance(
        commerce.latitude!,
        commerce.longitude!,
        other.latitude!,
        other.longitude!
      );

      return distance <= thresholdMeters;
    });

    // Mark all as processed
    processed.add(commerce.id);
    nearbyCommerces.forEach(c => processed.add(c.id));

    // Create cluster
    const clusterCommerces = [commerce, ...nearbyCommerces];
    const isBoosted = clusterCommerces.some(c => c.boosted);

    clusters.push({
      id: `cluster-${commerce.id}`,
      latitude: commerce.latitude!,
      longitude: commerce.longitude!,
      commerces: clusterCommerces,
      isBoosted,
    });
  });

  return clusters;
}
