import React, { useMemo } from 'react';
import { ShapeSource, LineLayer } from '@rnmapbox/maps';

interface TrafficRouteProps {
  coordinates: [number, number][];
  trafficData?: {
    congestion?: string[];
    distance?: number[];
  };
  isActive?: boolean;
}

const TRAFFIC_COLORS = {
  low: '#34A853',       // Green - light traffic
  moderate: '#FBBC04',  // Yellow - moderate traffic
  heavy: '#EA4335',     // Red - heavy traffic
  severe: '#C5221F',    // Dark Red - severe traffic
  unknown: '#4285F4',   // Blue - no data
};

const ROUTE_COLORS = {
  active: '#4285F4',      // Blue for active route
  inactive: '#9AA0A6',    // Gray for alternative routes
  border: '#FFFFFF',      // White border
};

export const TrafficRoute: React.FC<TrafficRouteProps> = ({
  coordinates,
  trafficData,
  isActive = true,
}) => {
  // Create segmented route with traffic colors
  const routeFeatures = useMemo(() => {
    if (!trafficData?.congestion || trafficData.congestion.length === 0) {
      // No traffic data - return single feature
      return {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {
            congestion: 'unknown',
          },
          geometry: {
            type: 'LineString',
            coordinates,
          },
        }],
      };
    }

    // Create separate features for each traffic segment
    const features = [];
    const segmentLength = Math.floor(coordinates.length / trafficData.congestion.length);

    for (let i = 0; i < trafficData.congestion.length; i++) {
      const startIdx = i * segmentLength;
      const endIdx = i === trafficData.congestion.length - 1
        ? coordinates.length
        : (i + 1) * segmentLength + 1; // +1 for overlap

      const segmentCoords = coordinates.slice(startIdx, endIdx);

      if (segmentCoords.length >= 2) {
        features.push({
          type: 'Feature',
          properties: {
            congestion: trafficData.congestion[i] || 'unknown',
          },
          geometry: {
            type: 'LineString',
            coordinates: segmentCoords,
          },
        });
      }
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [coordinates, trafficData]);

  return (
    <>
      {/* Route border (white outline) */}
      <ShapeSource
        id={`route-border-${isActive ? 'active' : 'inactive'}`}
        shape={routeFeatures as any}
      >
        <LineLayer
          id={`route-border-layer-${isActive ? 'active' : 'inactive'}`}
          style={{
            lineColor: ROUTE_COLORS.border,
            lineWidth: isActive ? 10 : 8,
            lineCap: 'round',
            lineJoin: 'round',
            lineOpacity: isActive ? 1 : 0.5,
          }}
        />
      </ShapeSource>

      {/* Main route with traffic colors */}
      <ShapeSource
        id={`route-main-${isActive ? 'active' : 'inactive'}`}
        shape={routeFeatures as any}
      >
        <LineLayer
          id={`route-main-layer-${isActive ? 'active' : 'inactive'}`}
          style={{
            lineColor: trafficData?.congestion
              ? [
                  'match',
                  ['get', 'congestion'],
                  'low', TRAFFIC_COLORS.low,
                  'moderate', TRAFFIC_COLORS.moderate,
                  'heavy', TRAFFIC_COLORS.heavy,
                  'severe', TRAFFIC_COLORS.severe,
                  isActive ? TRAFFIC_COLORS.unknown : ROUTE_COLORS.inactive,
                ]
              : isActive ? ROUTE_COLORS.active : ROUTE_COLORS.inactive,
            lineWidth: isActive ? 6 : 5,
            lineCap: 'round',
            lineJoin: 'round',
            lineOpacity: isActive ? 1 : 0.6,
          }}
        />
      </ShapeSource>
    </>
  );
};
