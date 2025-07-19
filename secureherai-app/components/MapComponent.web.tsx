import React, { useEffect, useRef } from "react";
import { StyleSheet, ViewStyle, View, Text } from "react-native";

// Enhanced marker styling function that exactly matches CustomMarker.tsx with advanced SVG shadows and styling
const getAdvancedCustomMarkerStyle = (
  type: string,
  size: number = 32,
  imageUrl?: string
) => {
  const pinHeight = size * 1.2;
  const shadowOffset = 4;
  const shadowBlur = 8;

  // Base style configuration matching CustomMarker.tsx structure
  const baseStyle = {
    anchor: { x: size / 2, y: pinHeight },
    scaledSize: {
      width: size + shadowOffset,
      height: pinHeight + shadowOffset,
    },
  };

  // Color and emoji mappings that exactly match CustomMarker.tsx
  const markerConfigs: Record<
    string,
    { color: string; emoji: string; description?: string; useImage?: boolean }
  > = {
    harassment: {
      color: "#DC2626",
      emoji: "⚠️",
      description: "Harassment Report",
    },
    theft: { color: "#7C2D12", emoji: "💰", description: "Theft Report" },
    assault: { color: "#B91C1C", emoji: "🚨", description: "Assault Report" },
    safe_zone: {
      color: "#10B981",
      emoji: "🛡️",
      description: "Safe Zone",
    },
    police: { color: "#1E40AF", emoji: "👮", description: "Police Station" },
    police_station: {
      color: "#1E40AF",
      emoji: "👮",
      description: "Police Station",
    },
    hospital: { color: "#DC2626", emoji: "🏥", description: "Hospital" },
    medical: { color: "#DC2626", emoji: "🏥", description: "Medical Facility" },
    fire: { color: "#EA580C", emoji: "🚒", description: "Fire Station" },
    fire_station: {
      color: "#EA580C",
      emoji: "🚒",
      description: "Fire Station",
    },
    government_building: {
      color: "#6B21A8",
      emoji: "🏛️",
      description: "Government Building",
    },
    general: { color: "#6B7280", emoji: "📍", description: "Location" },
  };

  // Special handling for user location
  if (type === "user-location") {
    return {
      anchor: { x: size / 2, y: size / 2 },
      scaledSize: { width: size, height: size },
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="userLocationShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
            </filter>
          </defs>
          <circle cx="20" cy="20" r="16" fill="#4285F4" stroke="#FFFFFF" stroke-width="4" filter="url(#userLocationShadow)"/>
          <circle cx="20" cy="20" r="6" fill="#FFFFFF"/>
          <circle cx="20" cy="20" r="2" fill="#4285F4"/>
        </svg>
      `)}`,
    };
  }

  // Get marker configuration
  const config = markerConfigs[type] || markerConfigs.general;

  // Special handling for safe zone - just use the shield icon
  if (type === "safe_zone") {
    // Always use the shield pattern for safe zones
    const svgContent = `
      <svg width="${size + shadowOffset}" height="${
      pinHeight + shadowOffset
    }" viewBox="0 0 ${size + shadowOffset} ${
      pinHeight + shadowOffset
    }" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="safeZoneShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="${shadowOffset}" stdDeviation="${shadowBlur}" flood-color="rgba(0,0,0,0.8)" flood-opacity="0.8"/>
          </filter>
        </defs>
        
        <!-- Pin pointed triangle (bottom part) with shadow -->
        <path d="M ${size / 2} ${size + 6} L ${size / 2 - 6} ${size - 2} L ${
      size / 2 + 6
    } ${size - 2} Z" 
              fill="${config.color}" 
              filter="url(#safeZoneShadow)"/>
        
        <!-- Main circular pin body with white border -->
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" 
                fill="${config.color}" 
                stroke="#FFFFFF" 
                stroke-width="3" 
                filter="url(#safeZoneShadow)"/>
        
        <!-- Safe zone shield emoji -->
        <text x="${size / 2}" y="${size / 2 + 5}" 
              text-anchor="middle" 
              dominant-baseline="middle"
              fill="white" 
              font-size="${size * 0.5}" 
              font-family="Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji"
              style="user-select: none; pointer-events: none;">${
                config.emoji
              }</text>
      </svg>
    `;

    return {
      ...baseStyle,
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`,
    };
  }

  // Generate advanced SVG with shadow effects, exact pin shape, and proper styling
  const svgContent = `
    <svg width="${size + shadowOffset}" height="${
    pinHeight + shadowOffset
  }" viewBox="0 0 ${size + shadowOffset} ${
    pinHeight + shadowOffset
  }" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="pinShadow${type}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="${shadowOffset}" stdDeviation="${shadowBlur}" flood-color="rgba(0,0,0,0.8)" flood-opacity="0.8"/>
        </filter>
        <filter id="circleShadow${type}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="${shadowOffset}" stdDeviation="${shadowBlur}" flood-color="rgba(0,0,0,0.8)" flood-opacity="0.8"/>
        </filter>
      </defs>
      
      <!-- Pin pointed triangle (bottom part) with shadow -->
      <path d="M ${size / 2} ${size + 6} L ${size / 2 - 6} ${size - 2} L ${
    size / 2 + 6
  } ${size - 2} Z" 
            fill="${config.color}" 
            filter="url(#pinShadow${type})"/>
      
      <!-- Main circular pin body with shadow and white border -->
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" 
              fill="${config.color}" 
              stroke="#FFFFFF" 
              stroke-width="3" 
              filter="url(#circleShadow${type})"/>
      
      <!-- Emoji content with proper positioning and sizing -->
      <text x="${size / 2}" y="${size / 2 + 5}" 
            text-anchor="middle" 
            dominant-baseline="middle"
            fill="white" 
            font-size="${size * 0.5}" 
            font-family="Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji"
            style="user-select: none; pointer-events: none;">${
              config.emoji
            }</text>
    </svg>
  `;

  return {
    ...baseStyle,
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgContent)}`,
  };
};

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    google?: any;
    handleCalloutPress?: (markerId: string) => void;
  }
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight?: number;
}

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
  // Extended properties from map.tsx
  safePlace?: any;
  reportData?: any;
}

interface MapPressEvent {
  nativeEvent: {
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
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
const DEFAULT_REGION = {
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const heatmapRef = useRef<any>(null);

  // Get web API key from environment variables
  const webApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY;

  useEffect(() => {
    if (!webApiKey) return;

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${webApiKey}&libraries=places,visualization`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      // Initialize map
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: initialRegion.latitude, lng: initialRegion.longitude },
        zoom: 13,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Add click listener
      if (onPress) {
        mapInstance.current.addListener("click", (event: any) => {
          const coordinate = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
          };
          onPress({
            nativeEvent: { coordinate },
          });
        });
      }

      // Add markers
      updateMarkers();

      // Add heatmap
      updateHeatmap();
    };

    const updateHeatmap = () => {
      if (!mapInstance.current || !window.google?.maps?.visualization) return;

      // Clear existing heatmap
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }

      // Add new heatmap if enabled and has points
      if (showHeatmap && heatmapPoints.length > 0) {
        const heatmapData = heatmapPoints.map((point) => ({
          location: new window.google.maps.LatLng(
            point.latitude,
            point.longitude
          ),
          weight: point.weight || 1,
        }));

        heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: mapInstance.current,
          radius: 25,
          opacity: 0.8,
            // Perfect red-to-blue gradient (reversed)
            gradient: [
            "rgba(255, 0, 0, 0)", // Transparent red
            "rgba(255, 50, 0, 0.6)", // Light red
            "rgba(255, 100, 0, 0.7)", // Medium red-orange
            "rgba(255, 150, 0, 0.8)", // Bright orange
            "rgba(200, 200, 50, 0.8)", // Orange-yellow
            "rgba(150, 200, 100, 0.8)", // Yellow-green
            "rgba(100, 200, 150, 0.8)", // Green-cyan
            "rgba(50, 200, 200, 0.9)", // Cyan
            "rgba(0, 200, 255, 0.9)", // Light blue
            "rgba(0, 150, 255, 1.0)", // Medium blue
            "rgba(0, 100, 255, 1.0)", // Bright blue
            "rgba(0, 0, 255, 1.0)", // Pure blue
          ],
          dissipating: true,
          maxIntensity: 10,
        });
      }
    };

    const updateMarkers = () => {
      if (!mapInstance.current) return;

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // Add new markers
      markers.forEach((marker) => {
        const markerOptions: any = {
          position: {
            lat: marker.coordinate.latitude,
            lng: marker.coordinate.longitude,
          },
          map: mapInstance.current,
          title: marker.title,
        };

        // Use advanced custom marker styling that exactly matches mobile CustomMarker
        const customIconConfig = getAdvancedCustomMarkerStyle(
          marker.type || "general",
          32,
          marker.img_url
        );
        if (customIconConfig) {
          markerOptions.icon = {
            url: customIconConfig.url,
            anchor: new window.google.maps.Point(
              customIconConfig.anchor.x,
              customIconConfig.anchor.y
            ),
            scaledSize: new window.google.maps.Size(
              customIconConfig.scaledSize.width,
              customIconConfig.scaledSize.height
            ),
          };
        }

        const googleMarker = new window.google.maps.Marker(markerOptions);

        if (marker.title || marker.description) {
          // Format content based on marker type
          let htmlContent = "";

          if (marker.safePlace) {
            // Safe place HTML formatting
            htmlContent = `
              <div style="font-family: Arial, sans-serif; margin: 0; padding: 8px; background: white; border-radius: 4px; min-width: 200px;">
                <div style="padding: 4px; background: #d1fae5; margin: 0 0 8px 0; border-radius: 4px;">
                  <span style="font-size: 16px;">🛡️</span>
                  <span style="color: #065f46; font-weight: bold; font-size: 14px; margin-left: 8px;">SAFE ZONE</span>
                  <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">VERIFIED</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <div style="color: #374151; font-size: 12px; line-height: 1.4; margin-bottom: 4px;">
                    ${
                      marker.description
                        ? marker.description.split("\n")[0]
                        : "Verified safe location"
                    }
                  </div>
                </div>
                <div style="padding: 6px; background: #ecfdf5; border-radius: 4px; border-left: 3px solid #10b981;">
                  <div style="color: #065f46; font-size: 10px; line-height: 1.3;">
                    🛡️ Designated safe space for emergency shelter and quick access assistance.
                  </div>
                </div>
                <div style="margin-top: 8px; text-align: center;">
                  <a href="javascript:window.handleCalloutPress('${
                    marker.id
                  }')" 
                     style="display: inline-block; background: #10b981; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 11px;">
                    View Details
                  </a>
                </div>
              </div>
            `;
          } else if (marker.reportData) {
            // Report HTML formatting
            const incidentEmoji =
              marker.type === "harassment"
                ? "🚨"
                : marker.type === "theft"
                ? "💰"
                : "⚠️";
            htmlContent = `
              <div style="font-family: Arial, sans-serif; margin: 0; padding: 8px; background: white; border-radius: 4px; min-width: 200px;">
                <div style="padding: 4px; background: #fee2e2; margin: 0 0 8px 0; border-radius: 4px;">
                  <span style="font-size: 16px;">${incidentEmoji}</span>
                  <span style="color: #991b1b; font-weight: bold; font-size: 14px; margin-left: 8px;">${
                    marker.type !== undefined ? marker.type.toUpperCase() : ""
                  }</span>
                  <span style="background: #dc2626; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">INCIDENT</span>
                </div>
                <div style="margin-bottom: 8px;">
                  <div style="color: #374151; font-size: 12px; line-height: 1.4;">
                    ${
                      marker.description
                        ? marker.description.split("\n\n")[0]
                        : "Safety incident reported"
                    }
                  </div>
                </div>
                <div style="padding: 6px; background: #fef2f2; border-radius: 4px; border-left: 3px solid #dc2626;">
                  <div style="color: #991b1b; font-size: 10px; line-height: 1.3;">
                    🚨 Exercise caution in this area. Consider alternative routes if possible.
                  </div>
                </div>
                <div style="margin-top: 8px; text-align: center;">
                  <a href="javascript:window.handleCalloutPress('${
                    marker.id
                  }')" 
                     style="display: inline-block; background: #dc2626; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 11px;">
                    View Details
                  </a>
                </div>
              </div>
            `;
          } else {
            // Default formatting for other markers
            htmlContent = `
              <div style="font-family: Arial, sans-serif; margin: 0; padding: 8px; background: white; border-radius: 4px;">
                ${
                  marker.description
                    ? `<p style="margin: 0 0 8px 0; color: #374151; font-size: 12px;">${marker.description}</p>`
                    : ""
                }
                <div style="text-align: center;">
                  <a href="javascript:window.handleCalloutPress('${
                    marker.id
                  }')" 
                     style="display: inline-block; background: #4285F4; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 11px;">
                    View Details
                  </a>
                </div>
              </div>
            `;
          }

          const infoWindow = new window.google.maps.InfoWindow({
            content: htmlContent,
          });

          googleMarker.addListener("click", () => {
            infoWindow.open(mapInstance.current, googleMarker);
            if (onMarkerPress) {
              onMarkerPress(marker);
            }
          });

          // Set up global callback for callout press
          if (!window.handleCalloutPress) {
            window.handleCalloutPress = (markerId: string) => {
              const clickedMarker = markers.find((m) => m.id === markerId);
              if (clickedMarker && onCalloutPress) {
                onCalloutPress(clickedMarker);
              } else if (clickedMarker?.onCalloutPress) {
                clickedMarker.onCalloutPress();
              }
            };
          }
        }

        markersRef.current.push(googleMarker);
      });
    };

    loadGoogleMaps();

    return () => {
      // Cleanup
      markersRef.current.forEach((marker) => marker.setMap(null));
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
    };
  }, [
    webApiKey,
    initialRegion,
    markers,
    heatmapPoints,
    showHeatmap,
    onPress,
    onMarkerPress,
    onCalloutPress,
  ]);

  const mapStyle = [styles.map, style];

  if (!webApiKey) {
    return (
      <View style={[mapStyle, styles.fallback]}>
        <Text style={styles.fallbackText}>
          Google Maps API key not configured for web platform.{"\n"}
          Please set EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY in your .env file.
        </Text>
      </View>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "100%",
        flex: 1,
        minHeight: 400,
      }}
      className={className}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  fallbackText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
  },
});

// Export mock components for consistency
export const Marker = () => null;
export const Callout = () => null;
export const PROVIDER_GOOGLE = "google";
export { MapComponent as MapView };
export type { MapPressEvent };

// For type compatibility
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
