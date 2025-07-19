import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { SafePlace } from "../../types/emergencyServices";
import apiService from "../../services/api";
import { useAlert } from "../../context/AlertContext";

export default function EditPlaceScreen() {
  const { showAlert } = useAlert();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [place, setPlace] = useState<SafePlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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
              name: foundPlace.placeName,
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
            setPlaceName(safePlace.placeName);
            setAddress(safePlace.address || "");
            setImageUrl(safePlace.img_url || "");
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

  const handleSave = async () => {
    if (!place) return;

    if (!placeName.trim()) {
      showAlert("Validation Error", "Place name is required", "error");
      return;
    }

    setSaving(true);
    try {
      // Here you would implement the API call to update the place
      // For now, we'll just show a success message

      // Example API call structure:
      // const updateData = {
      //   id: place.id,
      //   placeName: placeName.trim(),
      //   address: address.trim(),
      //   img_url: imageUrl.trim(),
      // };
      //
      // const response = await apiService.updateFavoritePlace(updateData);
      // if (response.success) {
      //   showAlert("Success", "Place updated successfully", "success");
      //   router.back();
      // } else {
      //   showAlert("Error", "Failed to update place", "error");
      // }

      // Temporary success simulation
      showAlert("Success", "Place updated successfully", "success");
      router.back();
    } catch (error) {
      console.error("Error updating place:", error);
      showAlert("Error", "Failed to update place", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!place) return;

    Alert.alert(
      "Delete Safe Place",
      `Are you sure you want to remove "${place.placeName}" from your safe places? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Here you would implement the API call to delete the place
              // const response = await apiService.deleteFavoritePlace(place.id);
              // if (response.success) {
              //   showAlert("Success", "Safe place removed successfully", "success");
              //   router.replace("/places/manage" as any);
              // } else {
              //   showAlert("Error", "Failed to delete safe place", "error");
              // }

              // Temporary success simulation
              showAlert(
                "Success",
                "Safe place removed successfully",
                "success"
              );
              router.replace("/places/manage" as any);
            } catch {
              showAlert("Error", "Failed to delete safe place", "error");
            }
          },
        },
      ]
    );
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
            Edit Safe Place
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
          Edit Safe Place
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Form Card */}
        <View className="bg-white rounded p-4 mb-3">
          <Text className="text-lg font-bold text-[#67082F] mb-4 text-center">
            Update Place
          </Text>

          {/* Place Name Field */}
          <View className="mb-3">
            <Text className="text-sm text-gray-700 mb-1">Place Name *</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
              <TextInput
                className="flex-1 text-gray-900"
                placeholder="Enter place name"
                placeholderTextColor="#9CA3AF"
                value={placeName}
                onChangeText={setPlaceName}
                maxLength={100}
              />
            </View>
          </View>

          {/* Address Field */}
          <View className="mb-3">
            <Text className="text-sm text-gray-700 mb-1">Address</Text>
            <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
              <TextInput
                className="flex-1 text-gray-900"
                placeholder="Enter address"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
                maxLength={200}
              />
            </View>
          </View>

          {/* Image Upload Section */}
          <View className="mb-3">
            <Text className="text-sm text-gray-700 mb-1">Place Image</Text>

            {/* Current Image Preview */}
            {imageUrl ? (
              <View className="mb-2 relative">
                <Image
                  source={{ uri: imageUrl }}
                  className="w-full h-32 rounded border border-gray-300"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                  onPress={() => setImageUrl("")}
                >
                  <MaterialIcons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="h-32 bg-gray-100 rounded border border-gray-300 border-dashed items-center justify-center mb-2">
                <MaterialIcons name="image" size={40} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm">No image selected</Text>
              </View>
            )}

            {/* Manual URL Input */}
            <View>
              <Text className="text-xs text-gray-600 mb-1">Image URL:</Text>
              <TextInput
                className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
                placeholder="Enter image URL"
                placeholderTextColor="#9CA3AF"
                value={imageUrl}
                onChangeText={setImageUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Location Info (Read-only) */}
          <View className="mb-4 p-3 bg-gray-100 rounded">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Location (Read-only)
            </Text>
            <Text className="text-gray-600 text-sm">
              Latitude: {place.location.latitude.toFixed(6)}
            </Text>
            <Text className="text-gray-600 text-sm">
              Longitude: {place.location.longitude.toFixed(6)}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              To change location, create a new place
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 bg-gray-200 rounded py-3 px-3"
              onPress={() => router.back()}
            >
              <Text className="text-center text-gray-700 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 rounded py-3 px-3 ${
                saving ? "bg-[#67082F]/60" : "bg-[#67082F]"
              }`}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-center text-white font-medium">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Section */}
        <View className="bg-white rounded p-4 mb-3">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="warning" size={18} color="#DC2626" />
            <Text className="text-red-800 font-medium ml-2">Danger Zone</Text>
          </View>
          <Text className="text-gray-600 text-sm mb-3">
            Permanently remove this place from your safe places. This action
            cannot be undone.
          </Text>
          <TouchableOpacity
            className="bg-red-600 rounded py-3 px-4 flex-row items-center justify-center"
            onPress={handleDelete}
          >
            <MaterialIcons name="delete-forever" size={18} color="white" />
            <Text className="text-white font-medium ml-1">Delete Place</Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View className="bg-white rounded p-4">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="info" size={18} color="#3B82F6" />
            <Text className="text-blue-800 font-medium ml-2">Editing Tips</Text>
          </View>
          <Text className="text-gray-600 text-sm leading-5 mb-2">
            • Use a descriptive name that helps you identify this location
            quickly
          </Text>
          <Text className="text-gray-600 text-sm leading-5 mb-2">
            • Include the full address for better navigation
          </Text>
          <Text className="text-gray-600 text-sm leading-5">
            • Image URLs should be direct links to images (ending in .jpg, .png,
            etc.)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
