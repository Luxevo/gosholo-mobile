/**
 * Navigation Helper Utilities
 * Bilingual support for English and French
 */

type LngLat = [number, number];

/**
 * Calculate estimated arrival time
 * @param durationSeconds - Duration in seconds
 * @returns Formatted time string (e.g., "15:45")
 */
export const calculateETA = (durationSeconds: number): string => {
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + durationSeconds * 1000);

  const hours = arrivalTime.getHours().toString().padStart(2, '0');
  const minutes = arrivalTime.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

/**
 * Calculate distance from a point to a line (route)
 * Used for off-route detection
 * @param point - User location [lng, lat]
 * @param line - Route coordinates array
 * @returns Distance in meters
 */
export const getDistanceFromLine = (
  point: LngLat,
  line: LngLat[]
): number => {
  if (line.length < 2) return Infinity;

  let minDistance = Infinity;

  for (let i = 0; i < line.length - 1; i++) {
    const distance = pointToSegmentDistance(point, line[i], line[i + 1]);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
};

/**
 * Calculate distance from point to line segment
 * @param point - Point [lng, lat]
 * @param start - Segment start [lng, lat]
 * @param end - Segment end [lng, lat]
 * @returns Distance in meters
 */
const pointToSegmentDistance = (
  point: LngLat,
  start: LngLat,
  end: LngLat
): number => {
  const x = point[0];
  const y = point[1];
  const x1 = start[0];
  const y1 = start[1];
  const x2 = end[0];
  const y2 = end[1];

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;

  // Convert to meters using Haversine
  return haversineDistance([x, y], [xx, yy]);
};

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 - [lng, lat]
 * @param point2 - [lng, lat]
 * @returns Distance in meters
 */
export const haversineDistance = (point1: LngLat, point2: LngLat): number => {
  const R = 6371000; // Earth's radius in meters
  const lat1 = (point1[1] * Math.PI) / 180;
  const lat2 = (point2[1] * Math.PI) / 180;
  const deltaLat = ((point2[1] - point1[1]) * Math.PI) / 180;
  const deltaLng = ((point2[0] - point1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Get bounds from coordinates array
 * @param coordinates - Array of [lng, lat]
 * @returns Bounds object
 */
export const getBounds = (coordinates: LngLat[]): {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
} => {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return { minLng, maxLng, minLat, maxLat };
};

/**
 * Determine which step user is currently on based on their location
 * @param userLocation - [lng, lat]
 * @param steps - Array of navigation steps
 * @param routeCoordinates - Full route coordinates
 * @returns Current step index
 */
export const getCurrentStepIndex = (
  userLocation: LngLat,
  steps: any[],
  routeCoordinates: LngLat[]
): number => {
  if (steps.length === 0 || routeCoordinates.length === 0) return 0;

  // Find closest point on route
  let minDistance = Infinity;
  let closestIndex = 0;

  routeCoordinates.forEach((coord, index) => {
    const distance = haversineDistance(userLocation, coord);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  // Map route index to step index
  // This is a simplified approach - you may need to enhance based on actual step geometry
  let cumulativeDistance = 0;
  for (let i = 0; i < steps.length; i++) {
    cumulativeDistance += steps[i].distance;
    const stepPercentage = cumulativeDistance / steps.reduce((sum, s) => sum + s.distance, 0);
    const stepCoordIndex = Math.floor(stepPercentage * routeCoordinates.length);

    if (closestIndex <= stepCoordIndex) {
      return i;
    }
  }

  return steps.length - 1;
};

/**
 * Get traffic level from congestion array
 * @param congestion - Array of congestion strings
 * @returns Overall traffic level
 */
export const getOverallTrafficLevel = (
  congestion?: string[]
): 'low' | 'moderate' | 'heavy' | undefined => {
  if (!congestion || congestion.length === 0) return undefined;

  const counts = {
    low: 0,
    moderate: 0,
    heavy: 0,
    severe: 0,
  };

  congestion.forEach((level) => {
    if (level in counts) {
      counts[level as keyof typeof counts]++;
    }
  });

  // Determine overall level
  const total = congestion.length;
  if (counts.severe > 0 || counts.heavy / total > 0.5) return 'heavy';
  if (counts.moderate / total > 0.5) return 'moderate';
  return 'low';
};
