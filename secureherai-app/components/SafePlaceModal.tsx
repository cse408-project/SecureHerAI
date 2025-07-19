import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../context/AlertContext";
import cloudinaryService from "../services/cloudinary";

// Place type options
const placeOptions = [
  { label: "Select place...", value: "" },
  { label: "Home", value: "Home" },
  { label: "Office", value: "Office" },
  { label: "Campus", value: "Campus" },
  { label: "Work", value: "Work" },
];

interface PlaceInfo {
  id: string;
  placeName: string;
  longitude: string;
  latitude: string;
  address: string;
  img_url: string;
  created_at?: string;
}

interface CreatePlace {
  placeName: string;
  latitude: string;
  longitude: string;
  address: string;
  img_url: string;
}

// API Service for safe places
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

class SafePlaceApiService {
  private async getHeaders(
    includeAuth: boolean = false
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async getPlaceInfos() {
    try {
      const response = await fetch(`${API_BASE_URL}/favorite_place`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch Places",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching Places:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async addfavoritePlace(place_info: CreatePlace) {
    try {
      const response = await fetch(`${API_BASE_URL}/favorite_place/add`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ place_info }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to add place",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error adding Place:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async updatefavoritePlace(place_id: string, place_info: CreatePlace) {
    try {
      const response = await fetch(`${API_BASE_URL}/favorite_place/update`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ place_id, place_info }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to update place",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error updating place:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async deletefavoritePlace(place_id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/favorite_place/delete`, {
        method: "DELETE",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ place_id }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to delete place",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error deleting place:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }
}

const apiService = new SafePlaceApiService();

// Place Form Component
const PlaceForm = ({
  isEdit = false,
  onSubmit,
  newPlace,
  handlePlaceUpdate,
  handleFormCancel,
  isSubmitting,
  onImageUpload,
  isUploadingImage,
}: {
  isEdit?: boolean;
  onSubmit: () => void;
  newPlace: CreatePlace;
  handlePlaceUpdate: (field: keyof CreatePlace, value: any) => void;
  handleFormCancel: () => void;
  isSubmitting: boolean;
  onImageUpload: () => void;
  isUploadingImage: boolean;
}) => (
  <View className="bg-white rounded-lg p-4 m-4 max-w-sm">
    <Text className="text-lg font-bold text-[#67082F] mb-4 text-center">
      {isEdit ? "Update Safe Place" : "Add Safe Place"}
    </Text>

    {/* Place Type Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Place Type *</Text>
      <View className="bg-white border border-gray-300 rounded">
        <Picker
          selectedValue={newPlace.placeName}
          onValueChange={(value) => handlePlaceUpdate("placeName", value)}
          style={{ height: 50, color: "#111827" }}
        >
          {placeOptions.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
    </View>

    {/* Latitude Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Latitude *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <TextInput
          className="flex-1 text-gray-900"
          placeholder="Enter Latitude"
          placeholderTextColor="#9CA3AF"
          value={newPlace.latitude}
          onChangeText={(text) => handlePlaceUpdate("latitude", text)}
          keyboardType="numeric"
        />
      </View>
    </View>

    {/* Longitude Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Longitude *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <TextInput
          className="flex-1 text-gray-900"
          placeholder="Enter Longitude"
          placeholderTextColor="#9CA3AF"
          value={newPlace.longitude}
          onChangeText={(text) => handlePlaceUpdate("longitude", text)}
          keyboardType="numeric"
        />
      </View>
    </View>

    {/* Address Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Address *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <TextInput
          className="flex-1 text-gray-900"
          placeholder="Enter address"
          placeholderTextColor="#9CA3AF"
          value={newPlace.address}
          onChangeText={(text) => handlePlaceUpdate("address", text)}
          multiline
        />
      </View>
    </View>

    {/* Image Upload Section */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Place Image</Text>

      {/* Current Image Preview */}
      {newPlace.img_url ? (
        <View className="mb-2 relative">
          <Image
            source={{ uri: newPlace.img_url }}
            className="w-full h-32 rounded border border-gray-300"
            resizeMode="cover"
          />
          <TouchableOpacity
            className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
            onPress={() => handlePlaceUpdate("img_url", "")}
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

      {/* Upload Button */}
      <TouchableOpacity
        className="bg-[#67082F] rounded py-2 px-4 flex-row items-center justify-center"
        onPress={onImageUpload}
        disabled={isUploadingImage}
      >
        {isUploadingImage ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <MaterialIcons name="camera-alt" size={20} color="white" />
            <Text className="text-white font-medium ml-2">Upload Image</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Manual URL Input */}
      <View className="mt-2">
        <Text className="text-xs text-gray-600 mb-1">Or enter image URL:</Text>
        <TextInput
          className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
          placeholder="Enter image URL"
          placeholderTextColor="#9CA3AF"
          value={newPlace.img_url}
          onChangeText={(text) => handlePlaceUpdate("img_url", text)}
          autoCapitalize="none"
        />
      </View>
    </View>

    {/* Action Buttons */}
    <View className="flex-row gap-2">
      <TouchableOpacity
        className="flex-1 bg-gray-200 rounded py-3 px-3"
        onPress={handleFormCancel}
      >
        <Text className="text-center text-gray-700 font-medium">Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 rounded py-3 px-3 ${
          isSubmitting ? "bg-[#67082F]/60" : "bg-[#67082F]"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-center text-white font-medium">
            {isEdit ? "Update" : "Add"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

interface SafePlaceModalProps {
  visible: boolean;
  onClose: () => void;
  onPlacesUpdated: () => void;
}

export default function SafePlaceModal({
  visible,
  onClose,
  onPlacesUpdated,
}: SafePlaceModalProps) {
  const { showAlert, showConfirmAlert } = useAlert();
  const [placeInfos, setPlaceInfos] = useState<PlaceInfo[]>([]);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showEditPlace, setShowEditPlace] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [newPlace, setNewPlace] = useState<CreatePlace>({
    placeName: "",
    latitude: "",
    longitude: "",
    address: "",
    img_url: "",
  });

  // Load places when modal opens
  useEffect(() => {
    if (visible) {
      loadPlaceInfos();
    }
  }, [visible]);

  const loadPlaceInfos = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPlaceInfos();
      if (response.success && response.data) {
        setPlaceInfos(response.data.favoritePlaces || []);
      } else {
        showAlert("Error", response.error || "Failed to load places", "error");
      }
    } catch {
      showAlert("Error", "Failed to load places", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetNewPlace = () => {
    setNewPlace({
      placeName: "",
      latitude: "",
      longitude: "",
      address: "",
      img_url: "",
    });
  };

  const validatePlace = () => {
    if (!newPlace.placeName.trim()) {
      showAlert("Validation Error", "Please select a place type", "error");
      return false;
    }

    if (!newPlace.latitude.trim() || !newPlace.longitude.trim()) {
      showAlert(
        "Validation Error",
        "Please enter both latitude and longitude",
        "error"
      );
      return false;
    }

    if (!newPlace.address.trim()) {
      showAlert("Validation Error", "Please enter an address", "error");
      return false;
    }

    return true;
  };

  const handleAddPlace = async () => {
    if (!validatePlace()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.addfavoritePlace(newPlace);
      if (response.success) {
        showAlert("Success", "Safe place added successfully", "success");
        resetNewPlace();
        setShowAddPlace(false);
        loadPlaceInfos();
        onPlacesUpdated();
      } else {
        showAlert("Error", response.error || "Failed to add place", "error");
      }
    } catch {
      showAlert("Error", "Failed to add place", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlace = async () => {
    if (!editingPlace || !validatePlace()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.updatefavoritePlace(
        editingPlace.id,
        newPlace
      );
      if (response.success) {
        showAlert("Success", "Safe place updated successfully", "success");
        resetNewPlace();
        setShowEditPlace(false);
        setEditingPlace(null);
        loadPlaceInfos();
        onPlacesUpdated();
      } else {
        showAlert("Error", response.error || "Failed to update place", "error");
      }
    } catch {
      showAlert("Error", "Failed to update place", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlaces = async () => {
    if (selected.length === 0) return;

    const placeNames = selected
      .map((id) => placeInfos.find((p) => p.id === id)?.placeName)
      .filter(Boolean)
      .join(", ");

    showConfirmAlert(
      "Delete Safe Places",
      `Are you sure you want to delete: ${placeNames}?`,
      async () => {
        setIsSubmitting(true);
        try {
          for (const placeId of selected) {
            const response = await apiService.deletefavoritePlace(placeId);
            if (!response.success) {
              showAlert(
                "Error",
                response.error || "Failed to delete some places",
                "error"
              );
              break;
            }
          }

          showAlert("Success", "Safe places deleted successfully", "success");
          setSelected([]);
          setSelectionMode(false);
          loadPlaceInfos();
          onPlacesUpdated();
        } catch {
          showAlert("Error", "Failed to delete places", "error");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const startEditPlace = (place: PlaceInfo) => {
    setEditingPlace(place);
    setNewPlace({
      placeName: place.placeName,
      longitude: place.longitude,
      latitude: place.latitude,
      address: place.address,
      img_url: place.img_url,
    });
    setShowEditPlace(true);
  };

  const handlePlaceUpdate = (field: keyof CreatePlace, value: any) => {
    setNewPlace((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async () => {
    try {
      setIsUploadingImage(true);
      const result = await cloudinaryService.pickMultipleImagesFromGallery();

      if (result && !result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const uploadResult = await cloudinaryService.uploadEvidence(asset.uri);

        if (uploadResult.success && uploadResult.url) {
          handlePlaceUpdate("img_url", uploadResult.url);
          showAlert("Success", "Image uploaded successfully", "success");
        } else {
          showAlert(
            "Error",
            uploadResult.error || "Failed to upload image",
            "error"
          );
        }
      }
    } catch (error) {
      console.error("Image upload error:", error);
      showAlert("Error", "Failed to upload image", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSelect = (placeId: string) => {
    if (selectionMode) {
      setSelected((prev) =>
        prev.includes(placeId)
          ? prev.filter((id) => id !== placeId)
          : [...prev, placeId]
      );
    }
  };

  const handleLongPress = (placeId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelected([placeId]);
    }
  };

  const toggleSelectAll = () => {
    if (selected.length === placeInfos.length) {
      setSelected([]);
    } else {
      setSelected(placeInfos.map((p) => p.id));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-[#FFE4D6]">
        {/* Header */}
        <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#67082F" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-[#67082F]">
              Manage Safe Places
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddPlace(true)}
              className="bg-[#67082F] rounded-full p-2"
            >
              <MaterialIcons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Cancel Selection */}
          {selectionMode && (
            <View className="flex-row justify-between items-center mb-3">
              <TouchableOpacity
                className="bg-gray-200 rounded py-2 px-3 flex-row items-center"
                onPress={() => {
                  setSelectionMode(false);
                  setSelected([]);
                }}
              >
                <MaterialIcons name="cancel" size={16} color="#67082F" />
                <Text className="text-[#67082F] font-medium ml-1">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#67082F] rounded py-2 px-3 flex-row items-center"
                onPress={toggleSelectAll}
              >
                <MaterialIcons
                  name={
                    selected.length === placeInfos.length
                      ? "check-circle"
                      : "radio-button-unchecked"
                  }
                  size={16}
                  color="white"
                />
                <Text className="text-white font-medium ml-1">
                  {selected.length === placeInfos.length
                    ? "Deselect All"
                    : "Select All"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Delete Button */}
          {selected.length > 0 && (
            <View className="mb-3">
              <TouchableOpacity
                className="bg-red-600 rounded py-2 px-3 flex-row items-center justify-center"
                onPress={handleDeletePlaces}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="delete" size={16} color="white" />
                    <Text className="text-white font-medium ml-1">
                      Delete ({selected.length})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Safe Places List */}
          <Text className="text-lg font-bold text-[#67082F] mb-3">
            Safe Places
          </Text>

          {isLoading ? (
            <View className="items-center py-6">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="text-gray-600 mt-2">Loading...</Text>
            </View>
          ) : placeInfos.length === 0 ? (
            <View className="bg-white p-4 rounded-lg items-center">
              <MaterialIcons name="location-on" size={40} color="#9CA3AF" />
              <Text className="text-gray-600 mt-2 text-center">
                No safe places yet
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Add your first safe place to get started
              </Text>
            </View>
          ) : (
            placeInfos.map((place) => (
              <TouchableOpacity
                key={place.id}
                className={`flex-row items-center bg-white p-3 rounded-lg mb-2 ${
                  selected.includes(place.id) ? "border-2 border-red-600" : ""
                }`}
                onPress={() => handleSelect(place.id)}
                onLongPress={() => handleLongPress(place.id)}
              >
                {place.img_url ? (
                  <Image
                    source={{ uri: place.img_url }}
                    className="w-12 h-12 rounded-lg mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 bg-[#67082F]/10 rounded-lg items-center justify-center mr-3">
                    <MaterialIcons
                      name="location-on"
                      size={24}
                      color="#67082F"
                    />
                  </View>
                )}

                <View className="flex-1">
                  <Text className="font-medium text-gray-800">
                    {place.placeName}
                  </Text>
                  <Text className="text-gray-600 text-sm">{place.address}</Text>
                  <Text className="text-xs text-[#67082F]">
                    {place.latitude}, {place.longitude}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => startEditPlace(place)}
                    className="p-2"
                  >
                    <MaterialIcons name="edit" size={18} color="#67082F" />
                  </TouchableOpacity>

                  {selectionMode && (
                    <View className="ml-2">
                      {selected.includes(place.id) ? (
                        <MaterialIcons
                          name="check-circle"
                          size={20}
                          color="#dc2626"
                        />
                      ) : (
                        <MaterialIcons
                          name="radio-button-unchecked"
                          size={20}
                          color="#67082F"
                        />
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Add Place Modal */}
        <Modal
          visible={showAddPlace}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddPlace(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-4">
            <PlaceForm
              isEdit={false}
              onSubmit={handleAddPlace}
              newPlace={newPlace}
              handlePlaceUpdate={handlePlaceUpdate}
              handleFormCancel={() => {
                resetNewPlace();
                setShowAddPlace(false);
              }}
              isSubmitting={isSubmitting}
              onImageUpload={handleImageUpload}
              isUploadingImage={isUploadingImage}
            />
          </View>
        </Modal>

        {/* Edit Place Modal */}
        <Modal
          visible={showEditPlace}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowEditPlace(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-4">
            <PlaceForm
              isEdit={true}
              onSubmit={handleEditPlace}
              newPlace={newPlace}
              handlePlaceUpdate={handlePlaceUpdate}
              handleFormCancel={() => {
                resetNewPlace();
                setShowEditPlace(false);
                setEditingPlace(null);
              }}
              isSubmitting={isSubmitting}
              onImageUpload={handleImageUpload}
              isUploadingImage={isUploadingImage}
            />
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
