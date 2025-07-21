import React from "react";
import { Circle } from "react-native-maps";

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight?: number; // 0-1, where 1 is highest intensity
  type?: string; // incident type for color coding
  timestamp?: Date; // for time-based weighting
}

export interface HeatmapProps {
  points: HeatmapPoint[];
  radius?: number; // in meters
  opacity?: number;
  maxIntensity?: number;
  gradient?: Record<number, string>; // key is intensity (0-1), value is color
}

// Default gradient from cool to hot
const DEFAULT_GRADIENT: Record<number, string> = {
  0.0: "#3B82F6", // Blue - low intensity
  0.2: "#10B981", // Green - mild intensity
  0.4: "#F59E0B", // Yellow - medium intensity
  0.6: "#F97316", // Orange - high intensity
  0.8: "#EF4444", // Red - very high intensity
  1.0: "#DC2626", // Dark red - maximum intensity
};

// Clustering algorithm to group nearby points
const clusterPoints = (points: HeatmapPoint[], clusterRadius: number = 100) => {
  const clusters: {
    center: { latitude: number; longitude: number };
    weight: number;
    count: number;
    types: string[];
  }[] = [];

  const processed = new Set<number>();

  points.forEach((point, index) => {
    if (processed.has(index)) return;

    const cluster = {
      center: { latitude: point.latitude, longitude: point.longitude },
      weight: point.weight || 1,
      count: 1,
      types: [point.type || "general"],
    };

    // Find nearby points to cluster
    points.forEach((otherPoint, otherIndex) => {
      if (processed.has(otherIndex) || index === otherIndex) return;

      const distance = getDistance(point, otherPoint);

      if (distance <= clusterRadius) {
        // Add to cluster
        cluster.weight += otherPoint.weight || 1;
        cluster.count += 1;
        if (otherPoint.type && !cluster.types.includes(otherPoint.type)) {
          cluster.types.push(otherPoint.type);
        }

        // Update cluster center (weighted average)
        cluster.center.latitude =
          (cluster.center.latitude * (cluster.count - 1) +
            otherPoint.latitude) /
          cluster.count;
        cluster.center.longitude =
          (cluster.center.longitude * (cluster.count - 1) +
            otherPoint.longitude) /
          cluster.count;

        processed.add(otherIndex);
      }
    });

    clusters.push(cluster);
    processed.add(index);
  });

  return clusters;
};

// Calculate distance between two points in meters
const getDistance = (point1: HeatmapPoint, point2: HeatmapPoint): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

// Get color from gradient based on intensity
const getColorFromGradient = (
  intensity: number,
  gradient: Record<number, string> = DEFAULT_GRADIENT
): string => {
  const keys = Object.keys(gradient)
    .map(Number)
    .sort((a, b) => a - b);

  // Find the two closest gradient stops
  let lowerKey = 0;
  let upperKey = 1;

  for (let i = 0; i < keys.length - 1; i++) {
    if (intensity >= keys[i] && intensity <= keys[i + 1]) {
      lowerKey = keys[i];
      upperKey = keys[i + 1];
      break;
    }
  }

  // If intensity is exactly at a stop, return that color
  if (gradient[lowerKey] && intensity === lowerKey) return gradient[lowerKey];
  if (gradient[upperKey] && intensity === upperKey) return gradient[upperKey];

  // Linear interpolation between colors (simplified - using the upper color)
  return gradient[upperKey] || gradient[lowerKey] || "#6B7280";
};

// Apply time-based decay to weight
const applyTimeDecay = (point: HeatmapPoint): number => {
  if (!point.timestamp) return point.weight || 1;

  const now = new Date();
  const hoursOld =
    (now.getTime() - point.timestamp.getTime()) / (1000 * 60 * 60);

  // Decay factor: full weight for first 24 hours, then gradual decay
  let decayFactor = 1;
  if (hoursOld > 24) {
    decayFactor = Math.max(0.1, 1 - (hoursOld - 24) / (24 * 7)); // Decay over a week
  }

  return (point.weight || 1) * decayFactor;
};

// Get severity multiplier based on incident type
const getSeverityMultiplier = (type?: string): number => {
  switch (type) {
    case "assault":
      return 1.0; // Highest severity
    case "harassment":
      return 0.8;
    case "theft":
      return 0.6;
    default:
      return 0.5; // General incidents
  }
};

const HeatmapOverlay: React.FC<HeatmapProps> = ({
  points,
  radius = 200,
  opacity = 0.6,
  maxIntensity = 10,
  gradient = DEFAULT_GRADIENT,
}) => {
  if (!points || points.length === 0) return null;

  // Apply time decay and severity weighting to points
  const weightedPoints = points.map((point) => ({
    ...point,
    weight: applyTimeDecay(point) * getSeverityMultiplier(point.type),
  }));

  // Cluster nearby points
  const clusters = clusterPoints(weightedPoints, radius * 0.7);

  // Find max weight for normalization
  const maxWeight = Math.max(...clusters.map((c) => c.weight), maxIntensity);

  return (
    <>
      {clusters.map((cluster, index) => {
        // Normalize intensity (0-1)
        const normalizedIntensity = Math.min(cluster.weight / maxWeight, 1);

        // Calculate radius based on cluster size and intensity
        const circleRadius =
          radius * (0.5 + 0.5 * normalizedIntensity) * Math.sqrt(cluster.count);

        // Get color based on intensity
        const baseColor = getColorFromGradient(normalizedIntensity, gradient);

        // Adjust opacity based on intensity by modifying the color alpha
        const circleOpacity = Math.max(0.3, opacity * normalizedIntensity);
        const fillColor = `${baseColor}${Math.round(circleOpacity * 255)
          .toString(16)
          .padStart(2, "0")}`;
        const strokeColor = `${baseColor}${Math.round(circleOpacity * 0.8 * 255)
          .toString(16)
          .padStart(2, "0")}`;

        return (
          <Circle
            key={`heatmap-${index}`}
            center={cluster.center}
            radius={circleRadius}
            fillColor={fillColor}
            strokeColor={strokeColor}
            strokeWidth={1}
            zIndex={1} // Ensure heatmap is below markers
          />
        );
      })}
    </>
  );
};

export default HeatmapOverlay;
