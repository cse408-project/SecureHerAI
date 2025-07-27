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
    coordinates: { latitude: number; longitude: number }[];
  }) => void;
  onError?: (error: any) => void;
}

const MapViewDirectionsWeb: React.FC<MapViewDirectionsProps> = (props) => {
  // This component serves as a bridge for the web MapComponent
  // The actual directions rendering is handled by the MapComponent.web.tsx
  // when it processes its children

  if (Platform.OS === "web") {
    // On web, we need to return a valid React element with the props
    // so that MapComponent.web.tsx can read them via React.Children.forEach
    console.log("=== MapViewDirectionsWeb rendering with props ===", props);

    // Create a proper React component that preserves props
    const DirectionsBridge: React.FC<MapViewDirectionsProps> = (
      bridgeProps
    ) => {
      // This component doesn't render anything visible but preserves the props
      return (
        <span style={{ display: "none" }} data-component="MapViewDirections" />
      );
    };

    // Return the bridge component with our props
    // React will preserve these props for React.Children.forEach to access
    return <DirectionsBridge {...props} />;
  }

  // On native platforms, this should not be used
  // Use the actual react-native-maps-directions instead
  return null;
};

export default MapViewDirectionsWeb;
