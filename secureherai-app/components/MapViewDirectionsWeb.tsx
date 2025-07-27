import React from "react";
import { Platform } from "react-native";

interface MapViewDirectionsProps {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  apikey: string;
  strokeWidth?: number;
  strokeColor?: string;
  mode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
  onReady?: (result: {
    distance: number;
    duration: number;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }) => void;
}

const MapViewDirectionsWeb: React.FC<MapViewDirectionsProps> = (props) => {
  // This component serves as a bridge for the web MapComponent
  // The actual directions rendering is handled by the MapComponent.web.tsx
  // when it processes its children

  if (Platform.OS === "web") {
    // On web, this component doesn't render anything visible
    // The MapComponent.web.tsx will read the props and handle directions
    return null;
  }

  // On native platforms, this should not be used
  // Use the actual react-native-maps-directions instead
  return null;
};

export default MapViewDirectionsWeb;
