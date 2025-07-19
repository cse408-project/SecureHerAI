import React from "react";
import { Platform, StyleSheet, ViewStyle } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
  MapPressEvent,
} from "react-native-maps";

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
}

interface MapComponentProps {
  initialRegion?: MapLocation;
  markers?: MapMarker[];
  onPress?: (event: MapPressEvent) => void;
  onMarkerPress?: (marker: MapMarker) => void;
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
  onPress,
  onMarkerPress,
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
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          onPress={() => onMarkerPress?.(marker)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export { MapView, Marker, PROVIDER_GOOGLE };
export type { Region, MapPressEvent };
