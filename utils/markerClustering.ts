/**
 * Marker Clustering Utilities
 * Groups commerces/offers/events that are at the same or very close locations
 */

import type { Commerce } from '@/hooks/useCommerces';
import type { EventWithCommerce } from '@/hooks/useEvents';
import type { OfferWithCommerce } from '@/hooks/useOffers';

export interface MarkerCluster {
  id: string;
  latitude: number;
  longitude: number;
  commerces: Commerce[];
  isBoosted: boolean;
}

export interface OfferCluster {
  id: string;
  latitude: number;
  longitude: number;
  offers: OfferWithCommerce[];
  isBoosted: boolean;
}

export interface EventCluster {
  id: string;
  latitude: number;
  longitude: number;
  events: EventWithCommerce[];
  isBoosted: boolean;
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

/**
 * Groups offers that are within the clustering threshold distance.
 * Uses the offer's own coordinates first, falls back to the commerce's coordinates.
 */
export function groupOffersByLocation(
  offers: OfferWithCommerce[],
  thresholdMeters: number = 20
): OfferCluster[] {
  const validOffers = offers.filter(o => {
    const lat = o.latitude || o.commerces?.latitude;
    const lng = o.longitude || o.commerces?.longitude;
    return lat != null && lng != null;
  });

  if (validOffers.length === 0) return [];

  const clusters: OfferCluster[] = [];
  const processed = new Set<string>();

  validOffers.forEach((offer) => {
    if (processed.has(offer.id)) return;

    const lat = (offer.latitude || offer.commerces?.latitude) as number;
    const lng = (offer.longitude || offer.commerces?.longitude) as number;

    const nearby = validOffers.filter((other) => {
      if (processed.has(other.id) || other.id === offer.id) return false;
      const oLat = (other.latitude || other.commerces?.latitude) as number;
      const oLng = (other.longitude || other.commerces?.longitude) as number;
      return calculateDistance(lat, lng, oLat, oLng) <= thresholdMeters;
    });

    processed.add(offer.id);
    nearby.forEach(o => processed.add(o.id));

    const clusterOffers = [offer, ...nearby];
    clusters.push({
      id: `offer-cluster-${offer.id}`,
      latitude: lat,
      longitude: lng,
      offers: clusterOffers,
      isBoosted: clusterOffers.some(o => !!o.boosted),
    });
  });

  return clusters;
}

/**
 * Groups events that are within the clustering threshold distance.
 */
export function groupEventsByLocation(
  events: EventWithCommerce[],
  thresholdMeters: number = 20
): EventCluster[] {
  const validEvents = events.filter(e => {
    const lat = e.latitude || e.commerces?.latitude;
    const lng = e.longitude || e.commerces?.longitude;
    return lat != null && lng != null;
  });

  if (validEvents.length === 0) return [];

  const clusters: EventCluster[] = [];
  const processed = new Set<string>();

  validEvents.forEach((event) => {
    if (processed.has(event.id)) return;

    const lat = (event.latitude || event.commerces?.latitude) as number;
    const lng = (event.longitude || event.commerces?.longitude) as number;

    const nearby = validEvents.filter((other) => {
      if (processed.has(other.id) || other.id === event.id) return false;
      const oLat = (other.latitude || other.commerces?.latitude) as number;
      const oLng = (other.longitude || other.commerces?.longitude) as number;
      return calculateDistance(lat, lng, oLat, oLng) <= thresholdMeters;
    });

    processed.add(event.id);
    nearby.forEach(e => processed.add(e.id));

    const clusterEvents = [event, ...nearby];
    clusters.push({
      id: `event-cluster-${event.id}`,
      latitude: lat,
      longitude: lng,
      events: clusterEvents,
      isBoosted: clusterEvents.some(e => !!e.boosted),
    });
  });

  return clusters;
}
