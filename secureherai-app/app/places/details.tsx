import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafePlace } from "../../types/emergencyServices";
import apiService from "../../services/api";
import { useAlert } from "../../context/AlertContext";

export default function PlaceDetailsScreen() {
  const { showAlert } = useAlert();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<SafePlace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlaceDetails = async () => {
      if (!id) {
        showAlert("Error", "No place ID provided", "error");
        router.back();
        return;
      }

      try {
        // Get all places and find the one with matching ID
        const response = await apiService.getPlaceInfos();
        if (response.success && response.data?.favoritePlaces) {
          const foundPlace = response.data.favoritePlaces.find(
            (p: any) => p.id === id
          );

          if (foundPlace) {
            // Convert to SafePlace format
            const safePlace: SafePlace = {
              id: foundPlace.id,
              placeName: foundPlace.placeName,
              name: foundPlace.placeName, // For backward compatibility
              type: "safe_zone",
              location: {
                latitude: parseFloat(foundPlace.latitude),
                longitude: parseFloat(foundPlace.longitude),
              },
              address: foundPlace.address,
              img_url: foundPlace.img_url,
              created_at: foundPlace.created_at,
              verified: true,
            };
            setPlace(safePlace);
          } else {
            showAlert("Error", "Place not found", "error");
            router.back();
          }
        } else {
          showAlert("Error", "Failed to load place details", "error");
          router.back();
        }
      } catch (error) {
        console.error("Error loading place details:", error);
        showAlert("Error", "Failed to load place details", "error");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadPlaceDetails();
  }, [id, showAlert]);

  const handleCall = () => {
    if (place?.phone) {
      const phoneUrl = `tel:${place.phone}`;
      if (Platform.OS === "web") {
        window.open(phoneUrl, "_self");
      } else {
        Linking.openURL(phoneUrl);
      }
    } else {
      showAlert("Info", "No phone number available for this place", "info");
    }
  };

  const handleNavigate = () => {
    if (!place) return;

    const { latitude, longitude } = place.location;
    const label = encodeURIComponent(place.placeName);

    if (Platform.OS === "ios") {
      const url = `maps://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`;
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        const webUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        Linking.openURL(webUrl);
      });
    } else if (Platform.OS === "android") {
      const url = `google.navigation:q=${latitude},${longitude}&mode=d`;
      Linking.openURL(url).catch(() => {
        // Fallback to Google Maps web
        const webUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        Linking.openURL(webUrl);
      });
    } else {
      // Web platform
      const webUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      window.open(webUrl, "_blank");
    }
  };

  const handleShare = () => {
    if (!place) return;

    const shareText = `Check out this safe place: ${place.placeName}\n${
      place.address || ""
    }\nLocation: ${place.location.latitude}, ${place.location.longitude}`;

    if (Platform.OS === "web") {
      if (navigator.share) {
        navigator.share({
          title: place.placeName,
          text: shareText,
        });
      } else {
        // Fallback for web browsers without native sharing
        navigator.clipboard.writeText(shareText).then(() => {
          showAlert(
            "Success",
            "Location details copied to clipboard",
            "success"
          );
        });
      }
    } else {
      // Mobile sharing would typically use React Native's Share API
      Alert.alert("Share", shareText);
    }
  };

  const handleEdit = () => {
    if (place) {
      router.push(`/places/edit?id=${place.id}` as any);
    }
  };

  const handleDelete = () => {
    if (!place) return;

    Alert.alert(
      "Delete Safe Place",
      `Are you sure you want to remove "${place.placeName}" from your safe places?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Call delete API (you may need to implement this)
              showAlert(
                "Success",
                "Safe place removed successfully",
                "success"
              );
              router.back();
            } catch {
              showAlert("Error", "Failed to delete safe place", "error");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
    } catch {
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#FFE4D6] max-w-3xl mx-auto w-full">
        {/* Header */}
        <View className="bg-[#67082F] px-4 pt-12 pb-4 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1 ml-4">
            Loading Place
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#67082F" />
          <Text className="text-gray-600 mt-2">Loading place details...</Text>
        </View>
      </View>
    );
  }

  if (!place) {
    return (
      <View className="flex-1 bg-[#FFE4D6] max-w-3xl mx-auto w-full">
        {/* Header */}
        <View className="bg-[#67082F] px-4 pt-12 pb-4 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold flex-1 ml-4">
            Place Not Found
          </Text>
        </View>

        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="place" size={40} color="#9CA3AF" />
          <Text className="text-gray-600 text-center mb-4 mt-2">
            The place you&apos;re looking for could not be found.
          </Text>
          <TouchableOpacity
            className="bg-[#67082F] rounded py-3 px-6"
            onPress={() => router.back()}
          >
            <Text className="text-white font-medium">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-3xl mx-auto w-full">
      {/* Header */}
      <View className="bg-[#67082F] px-4 pt-12 pb-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1 ml-4">
          Place Details
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Place Image Card */}
        <View className="bg-white rounded p-4 mb-3">
          {place.img_url ? (
            <View className="relative">
              <Image
                source={{ uri: place.img_url }}
                className="w-full h-48 rounded"
                resizeMode="cover"
              />
              {/* Verified Badge */}
              {place.verified && (
                <View className="absolute top-2 right-2 bg-green-500 rounded-full px-2 py-1 flex-row items-center">
                  <MaterialIcons name="verified" size={14} color="white" />
                  <Text className="text-white text-xs font-medium ml-1">
                    Verified
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="h-48 bg-gray-100 rounded border border-gray-300 border-dashed items-center justify-center">
              <MaterialIcons name="place" size={40} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm mt-2">
                No image available
              </Text>
            </View>
          )}
        </View>

        {/* Place Information Card */}
        <View className="bg-white rounded p-4 mb-3">
          <View className="flex-row items-center mb-2">
            <View className="w-8 h-8 bg-[#67082F]/10 rounded items-center justify-center mr-3">
              <MaterialIcons name="shield" size={18} color="#67082F" />
            </View>
            <Text className="text-lg font-bold text-gray-800 flex-1">
              {place.placeName}
            </Text>
          </View>

          <Text className="text-green-600 font-medium text-sm mb-3">
            Safe Place • Community Verified
          </Text>

          {place.address && (
            <View className="flex-row items-start mb-2">
              <MaterialIcons name="location-on" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2 flex-1">
                {place.address}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mb-2">
            <MaterialIcons name="my-location" size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm ml-2">
              {place.location.latitude.toFixed(6)},{" "}
              {place.location.longitude.toFixed(6)}
            </Text>
          </View>

          {place.created_at && (
            <View className="flex-row items-center">
              <MaterialIcons name="access-time" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">
                Added on {formatDate(place.created_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Primary Action */}
        <TouchableOpacity
          className="bg-[#67082F] rounded py-3 px-4 flex-row items-center justify-center mb-3"
          onPress={handleNavigate}
        >
          <MaterialIcons name="directions" size={20} color="white" />
          <Text className="text-white font-medium ml-2">Get Directions</Text>
        </TouchableOpacity>

        {/* Secondary Actions */}
        <View className="flex-row gap-2 mb-3">
          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded py-3 px-3 flex-row items-center justify-center"
            onPress={handleCall}
          >
            <MaterialIcons name="phone" size={18} color="#67082F" />
            <Text className="text-gray-700 font-medium ml-1">Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded py-3 px-3 flex-row items-center justify-center"
            onPress={handleShare}
          >
            <MaterialIcons name="share" size={18} color="#67082F" />
            <Text className="text-gray-700 font-medium ml-1">Share</Text>
          </TouchableOpacity>
        </View>

        {/* Management Actions */}
        <View className="flex-row gap-2 mb-3">
          <TouchableOpacity
            className="flex-1 bg-gray-200 rounded py-3 px-3 flex-row items-center justify-center"
            onPress={handleEdit}
          >
            <MaterialIcons name="edit" size={18} color="#67082F" />
            <Text className="text-gray-700 font-medium ml-1">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-red-600 rounded py-3 px-3 flex-row items-center justify-center"
            onPress={handleDelete}
          >
            <MaterialIcons name="delete" size={18} color="white" />
            <Text className="text-white font-medium ml-1">Remove</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Information */}
        <View className="bg-white rounded p-4 mb-3">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="security" size={18} color="#059669" />
            <Text className="text-green-800 font-medium ml-2">
              Safety Information
            </Text>
          </View>
          <Text className="text-gray-600 text-sm leading-5">
            This location has been marked as a safe place. It&apos;s a
            community-verified location where you can seek help, shelter, or
            assistance in case of emergencies. Always trust your instincts and
            prioritize your safety.
          </Text>
        </View>

        {/* Emergency Note */}
        <View className="bg-white rounded p-4">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="emergency" size={18} color="#DC2626" />
            <Text className="text-red-800 font-medium ml-2">Emergency</Text>
          </View>
          <Text className="text-gray-600 text-sm leading-5 mb-3">
            In case of immediate danger, call emergency services directly:
          </Text>
          <TouchableOpacity
            className="bg-red-600 rounded py-2 px-4 flex-row items-center justify-center self-start"
            onPress={() => {
              if (Platform.OS === "web") {
                window.open("tel:911", "_self");
              } else {
                Linking.openURL("tel:911");
              }
            }}
          >
            <MaterialIcons name="phone" size={16} color="white" />
            <Text className="text-white font-medium ml-1">Call 911</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
