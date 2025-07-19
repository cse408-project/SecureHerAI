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
import { router } from "expo-router";
import apiService from "../../services/api";
import { useAlert } from "../../context/AlertContext";
import cloudinaryService from "../../services/cloudinary";

// Place type options
const places_options = [
  { label: "Select place type...", value: "" },
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
  <View className="bg-white rounded p-4 m-4 w-full max-w-sm">
    <Text className="text-lg font-bold text-[#67082F] mb-4 text-center">
      {isEdit ? "Update Place" : "Add Place"}
    </Text>

    {/* Place Type Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Place Type *</Text>
      <View className="bg-white border border-gray-300 rounded">
        <Picker
          selectedValue={newPlace.placeName}
          onValueChange={(value) => handlePlaceUpdate("placeName", value)}
          style={{
            height: 50,
            color: "#111827",
          }}
        >
          {places_options.map((option) => (
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
          className="flex-1 ml-2 text-gray-900"
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
          className="flex-1 ml-2 text-gray-900"
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
          className="flex-1 ml-2 text-gray-900"
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

export default function ManageSafePlacesScreen() {
  const { showAlert, showConfirmAlert } = useAlert();
  const [placeInfos, setPlaceInfos] = useState<PlaceInfo[]>([]);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showEditPlace, setShowEditPlace] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const [newPlace, setNewPlace] = useState<CreatePlace>({
    placeName: "",
    latitude: "",
    longitude: "",
    address: "",
    img_url: "",
  });

  // Image upload states
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load places on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getPlaceInfos();
        console.log("Loading places...");
        if (response.success && response.data) {
          setPlaceInfos(response.data.favoritePlaces || []);
        } else {
          showAlert(
            "Error",
            response.error || "Failed to load places",
            "error"
          );
        }
      } catch (error) {
        console.error("Error loading places:", error);
        showAlert("Error", "Failed to load places", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [showAlert]);

  const resetNewPlace = () => {
    setNewPlace({
      placeName: "",
      latitude: "",
      longitude: "",
      address: "",
      img_url: "",
    });
  };

  const reloadPlaces = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPlaceInfos();
      if (response.success && response.data) {
        setPlaceInfos(response.data.favoritePlaces || []);
      } else {
        showAlert("Error", response.error || "Failed to load places", "error");
      }
    } catch (error) {
      console.error("Error loading places:", error);
      showAlert("Error", "Failed to load places", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const validatePlace = () => {
    if (!newPlace.placeName.trim()) {
      showAlert("Validation Error", "Please select a place type", "error");
      return false;
    }

    if (!newPlace.latitude.trim()) {
      showAlert("Validation Error", "Please enter latitude", "error");
      return false;
    }

    if (!newPlace.longitude.trim()) {
      showAlert("Validation Error", "Please enter longitude", "error");
      return false;
    }

    if (!newPlace.address.trim()) {
      showAlert("Validation Error", "Please enter an address", "error");
      return false;
    }

    // Validate latitude and longitude ranges
    const lat = parseFloat(newPlace.latitude);
    const lng = parseFloat(newPlace.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      showAlert(
        "Validation Error",
        "Latitude must be between -90 and 90",
        "error"
      );
      return false;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      showAlert(
        "Validation Error",
        "Longitude must be between -180 and 180",
        "error"
      );
      return false;
    }

    return true;
  };

  const handleAddPlace = async () => {
    if (!validatePlace()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.addFavoritePlace(newPlace);
      if (response.success) {
        showAlert("Success", "Place added successfully", "success");
        resetNewPlace();
        setShowAddPlace(false);
        reloadPlaces();
      } else {
        showAlert("Error", response.error || "Failed to add place", "error");
      }
    } catch (error) {
      console.error("Error adding place:", error);
      showAlert("Error", "Failed to add place", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlace = async () => {
    if (!editingPlace) {
      showAlert("Error", "No place selected for editing", "error");
      return;
    }

    if (!validatePlace()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.updateFavoritePlace(
        editingPlace.id,
        newPlace
      );
      if (response.success) {
        showAlert("Success", "Place updated successfully", "success");
        resetNewPlace();
        setShowEditPlace(false);
        setEditingPlace(null);
        reloadPlaces();
      } else {
        showAlert("Error", response.error || "Failed to update place", "error");
      }
    } catch (error) {
      console.error("Error updating place:", error);
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
      "Delete Places",
      `Are you sure you want to delete: ${placeNames}?`,
      async () => {
        setIsSubmitting(true);
        try {
          for (const placeId of selected) {
            const response = await apiService.deleteFavoritePlace(placeId);
            if (!response.success) {
              showAlert(
                "Error",
                response.error || "Failed to delete some places",
                "error"
              );
              break;
            }
          }

          showAlert("Success", "Places deleted successfully", "success");
          setSelected([]);
          setSelectionMode(false);
          reloadPlaces();
        } catch (error) {
          console.error("Error deleting places:", error);
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

  const handleLongPress = (placeId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelected([placeId]);
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

  const handlePlaceUpdate = (field: keyof CreatePlace, value: any) => {
    setNewPlace({ ...newPlace, [field]: value });
  };

  const handleFormCancel = () => {
    resetNewPlace();
    setShowAddPlace(false);
    setShowEditPlace(false);
    setEditingPlace(null);
  };

  // Image upload functions
  const uploadImageToCloudinary = async (
    option: "camera" | "gallery" | "url"
  ) => {
    setIsUploadingImage(true);

    try {
      if (option === "url") {
        setShowImageUploadModal(false);
        return;
      }

      const result = await cloudinaryService.uploadProfilePictureWithPicker(
        option
      );

      if (result.success && result.url) {
        handlePlaceUpdate("img_url", result.url);
        showAlert("Success", "Image uploaded successfully!", "success");
      } else {
        showAlert("Error", result.error || "Failed to upload image", "error");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      showAlert("Error", "Failed to upload image", "error");
    } finally {
      setIsUploadingImage(false);
      setShowImageUploadModal(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-3xl mx-auto w-full">
      {/* Header */}
      <View className="bg-[#67082F] px-4 pt-12 pb-4 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold flex-1 ml-4">
          Manage Safe Places
        </Text>
      </View>

      {/* Add Place Modal */}
      <Modal
        visible={showAddPlace}
        transparent={true}
        onRequestClose={() => setShowAddPlace(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <PlaceForm
            onSubmit={handleAddPlace}
            newPlace={newPlace}
            handlePlaceUpdate={handlePlaceUpdate}
            handleFormCancel={handleFormCancel}
            isSubmitting={isSubmitting}
            onImageUpload={() => setShowImageUploadModal(true)}
            isUploadingImage={isUploadingImage}
          />
        </View>
      </Modal>

      {/* Edit Place Modal */}
      <Modal
        visible={showEditPlace}
        transparent={true}
        onRequestClose={() => setShowEditPlace(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <PlaceForm
            isEdit={true}
            onSubmit={handleEditPlace}
            newPlace={newPlace}
            handlePlaceUpdate={handlePlaceUpdate}
            handleFormCancel={handleFormCancel}
            isSubmitting={isSubmitting}
            onImageUpload={() => setShowImageUploadModal(true)}
            isUploadingImage={isUploadingImage}
          />
        </View>
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        visible={showImageUploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageUploadModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#67082F] mb-4 text-center">
              Upload Place Image
            </Text>

            <TouchableOpacity
              className="bg-[#67082F] rounded py-3 px-4 mb-3 flex-row items-center justify-center"
              onPress={() => uploadImageToCloudinary("camera")}
              disabled={isUploadingImage}
            >
              <MaterialIcons name="camera-alt" size={20} color="white" />
              <Text className="text-white font-medium ml-2">Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#67082F] rounded py-3 px-4 mb-3 flex-row items-center justify-center"
              onPress={() => uploadImageToCloudinary("gallery")}
              disabled={isUploadingImage}
            >
              <MaterialIcons name="photo-library" size={20} color="white" />
              <Text className="text-white font-medium ml-2">
                Choose from Gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 rounded py-3 px-4 flex-row items-center justify-center"
              onPress={() => setShowImageUploadModal(false)}
              disabled={isUploadingImage}
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView className="flex-1 p-4">
        {/* Action Buttons Section */}
        <View className="flex-row justify-between items-center mb-4 mt-3">
          <TouchableOpacity
            className="flex-1 mr-2 bg-[#67082F] rounded py-2 px-3 flex-row items-center justify-center"
            onPress={() => setShowAddPlace(true)}
          >
            <MaterialIcons name="add" size={18} color="white" />
            <Text className="text-white font-medium ml-1">Add Place</Text>
          </TouchableOpacity>

          {placeInfos.length > 0 && (
            <TouchableOpacity
              className="flex-1 ml-2 bg-white rounded py-2 px-3 flex-row items-center justify-center border border-gray-200"
              onPress={() => {
                if (selectionMode) {
                  setSelectionMode(false);
                  setSelected([]);
                } else {
                  setSelectionMode(true);
                }
              }}
            >
              <MaterialIcons
                name={selectionMode ? "close" : "checklist"}
                size={18}
                color="#67082F"
              />
              <Text className="text-[#67082F] font-medium ml-1">
                {selectionMode ? "Cancel" : "Select"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Select All Button when in selection mode */}
        {selectionMode && placeInfos.length > 0 && (
          <View className="mb-3">
            <TouchableOpacity
              className="bg-[#67082F]/10 rounded py-2 px-3 flex-row items-center justify-center border border-[#67082F]/20"
              onPress={() => {
                if (selected.length === placeInfos.length) {
                  setSelected([]);
                } else {
                  setSelected(placeInfos.map((place) => place.id));
                }
              }}
            >
              <MaterialIcons
                name={
                  selected.length === placeInfos.length
                    ? "check-circle"
                    : "radio-button-unchecked"
                }
                size={16}
                color="#67082F"
              />
              <Text className="text-[#67082F] font-medium ml-1">
                {selected.length === placeInfos.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Button when places are selected */}
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
          <View className="bg-white p-4 rounded items-center">
            <MaterialIcons name="place" size={40} color="#9CA3AF" />
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
              className={`flex-row items-center bg-white p-3 rounded mb-2 ${
                selected.includes(place.id) ? "border border-red-600" : ""
              }`}
              onPress={() => handleSelect(place.id)}
              onLongPress={() => handleLongPress(place.id)}
            >
              {/* Place Image or Icon */}
              <View className="w-12 h-12 mr-3">
                {place.img_url ? (
                  <Image
                    source={{ uri: place.img_url }}
                    className="w-12 h-12 rounded"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-12 h-12 bg-[#67082F]/10 rounded items-center justify-center">
                    <MaterialIcons name="place" size={24} color="#67082F" />
                  </View>
                )}
              </View>

              <View className="flex-1">
                <Text className="font-medium text-gray-800">
                  {place.placeName}
                </Text>
                <Text className="text-gray-600 text-sm">{place.address}</Text>
                <Text className="text-xs text-gray-500">
                  {place.latitude}, {place.longitude}
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => startEditPlace(place)}
                  className="p-2 mr-1"
                >
                  <MaterialIcons name="edit" size={18} color="#67082F" />
                </TouchableOpacity>

                {selectionMode && (
                  <View>
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
    </View>
  );
}
