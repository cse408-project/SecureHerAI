import React from "react";
import { Platform, StyleSheet, ViewStyle } from "react-native";
import MapView, {
  Marker,
  Callout,
  PROVIDER_GOOGLE,
  Region,
  MapPressEvent,
} from "react-native-maps";
import CustomMarker from "./CustomMarker";
import HeatmapOverlay, { HeatmapPoint } from "./HeatmapOverlay";

export interface MapLocation {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface MapMarker {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  color?: string; // Add custom color support
  img_url?: string; // Add image URL support for safe zones
  type?:
    | "report"
    | "user-location"
    | "custom"
    | "police"
    | "hospital"
    | "medical"
    | "fire"
    | "safe_zone"
    | "government_building"
    | "police_station"
    | "fire_station"
    | "general"
    | "harassment"
    | "theft"
    | "assault"; // Add marker type including incident types
  // Additional data for callouts
  subtitle?: string;
  onCalloutPress?: () => void;
  showCallout?: boolean;
}

interface MapComponentProps {
  initialRegion?: MapLocation;
  markers?: MapMarker[];
  heatmapPoints?: HeatmapPoint[];
  showHeatmap?: boolean;
  onPress?: (event: MapPressEvent) => void;
  onMarkerPress?: (marker: MapMarker) => void;
  onCalloutPress?: (marker: MapMarker) => void;
  style?: ViewStyle;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  className?: string;
}

// Default location (Dhaka, Bangladesh)
const DEFAULT_REGION: Region = {
  latitude: 23.8103,
  longitude: 90.4125,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapComponent({
  initialRegion = DEFAULT_REGION,
  markers = [],
  heatmapPoints = [],
  showHeatmap = false,
  onPress,
  onMarkerPress,
  onCalloutPress,
  style,
  showsUserLocation = true,
  followsUserLocation = false,
  className,
}: MapComponentProps) {
  // Prepare the region with proper delta values
  const region: Region = {
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
    latitudeDelta: initialRegion.latitudeDelta || 0.05,
    longitudeDelta: initialRegion.longitudeDelta || 0.05,
  };

  const mapStyle = [styles.map, style];

  return (
    <MapView
      style={mapStyle}
      className={className}
      initialRegion={region}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      showsUserLocation={showsUserLocation}
      followsUserLocation={followsUserLocation}
      onPress={onPress}
    >
      {/* Heatmap Overlay - render first so it appears below markers */}
      {showHeatmap && heatmapPoints.length > 0 && (
        <HeatmapOverlay
          points={heatmapPoints}
          radius={300}
          opacity={0.7}
          maxIntensity={5}
        />
      )}

      {markers.map((marker) => {
        return (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerPress?.(marker)}
          >
            <CustomMarker 
              type={marker.type || "general"} 
              size={32} 
              imageUrl={marker.img_url}
            />
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  calloutContainer: {
    backgroundColor: "transparent",
  },
  calloutContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    minWidth: 240,
    maxWidth: 300,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  calloutSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
    lineHeight: 16,
  },
  calloutDescription: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
    marginBottom: 14,
  },
  reportMetadata: {
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  metadataText: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    padding: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  phoneText: {
    fontSize: 12,
    color: "#059669",
    marginLeft: 4,
    fontWeight: "500",
  },
  verificationText: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 8,
  },
  viewDetailsButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  viewDetailsButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
    marginRight: 6,
  },
  clickableHint: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 6,
    fontStyle: "italic",
  },
});

export { MapView, Marker, Callout, PROVIDER_GOOGLE };
export type { Region, MapPressEvent };
