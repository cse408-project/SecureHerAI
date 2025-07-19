import React from "react";
import { View, Text, Image } from "react-native";

interface CustomMarkerProps {
  type: string;
  size?: number;
  imageUrl?: string; // Add imageUrl prop for safe zones with images
}

export default function CustomMarker({ type, size = 32, imageUrl }: CustomMarkerProps) {
  const getMarkerIcon = () => {
    switch (type) {
      case "harassment":
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#DC2626",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#DC2626",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
              }}
            >
              <Text style={{ fontSize: size * 0.7, textAlign: "center" }}>
                ⚠️
              </Text>
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#DC2626",
              }}
            />
          </View>
        );

      case "theft":
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#7C2D12",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#7C2D12",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
              }}
            >
              <Text style={{ fontSize: size * 0.6, textAlign: "center" }}>
                💰
              </Text>
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#7C2D12",
              }}
            />
          </View>
        );

      case "assault":
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#B91C1C",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#B91C1C",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
              }}
            >
              <Text style={{ fontSize: size * 0.7, textAlign: "center" }}>
                🚨
              </Text>
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#B91C1C",
              }}
            />
          </View>
        );

      case "safe_zone":
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#10B981",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#10B981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
                overflow: "hidden", // Ensure image fits within circle
              }}
            >
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{
                    width: size - 6, // Account for border
                    height: size - 6,
                    borderRadius: (size - 6) / 2,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: size * 0.7, textAlign: "center" }}>
                  🛡️
                </Text>
              )}
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#10B981",
              }}
            />
          </View>
        );

      case "police":
      case "police_station":
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#1E40AF",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#1E40AF",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
              }}
            >
              <Text style={{ fontSize: size * 0.7, textAlign: "center" }}>
                👮
              </Text>
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#1E40AF",
              }}
            />
          </View>
        );

      case "hospital":
      case "medical":
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#DC2626",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#DC2626",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
              }}
            >
              <Text style={{ fontSize: size * 0.7, textAlign: "center" }}>
                🏥
              </Text>
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#DC2626",
              }}
            />
          </View>
        );

      case "fire":
      case "fire_station":
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#EA580C",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#EA580C",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
              }}
            >
              <Text style={{ fontSize: size * 0.7, textAlign: "center" }}>
                🚒
              </Text>
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#EA580C",
              }}
            />
          </View>
        );

      case "government_building":
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#6B21A8",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#6B21A8",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
              }}
            >
              <Text style={{ fontSize: size * 0.7, textAlign: "center" }}>
                🏛️
              </Text>
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#6B21A8",
              }}
            />
          </View>
        );

      case "user-location":
        return (
          <View
            style={{
              backgroundColor: "#4285F4",
              borderRadius: size / 2,
              width: size,
              height: size,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 4,
              borderColor: "#FFFFFF",
              shadowColor: "#4285F4",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
              elevation: 15,
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: (size * 0.3) / 2,
                width: size * 0.3,
                height: size * 0.3,
              }}
            />
          </View>
        );

      default:
        return (
          <View
            style={{
              position: "relative",
              width: size,
              height: size * 1.2,
              alignItems: "center",
            }}
          >
            {/* Pin base */}
            <View
              style={{
                backgroundColor: "#6B7280",
                borderRadius: size / 2,
                width: size,
                height: size,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 3,
                borderColor: "#FFFFFF",
                shadowColor: "#6B7280",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 15,
              }}
            >
              <Text style={{ fontSize: size * 0.7, textAlign: "center" }}>
                📍
              </Text>
            </View>
            {/* Pin point */}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.15,
                borderRightWidth: size * 0.15,
                borderTopWidth: size * 0.2,
                borderStyle: "solid",
                backgroundColor: "transparent",
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderTopColor: "#6B7280",
              }}
            />
          </View>
        );
    }
  };

  return getMarkerIcon();
}
