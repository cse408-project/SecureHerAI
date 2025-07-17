import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../context/AlertContext";

// // Emergency favourite-place - static data
// const emergencyFavouritePlaces = [
//   { name: "Police", phone: "911", icon: "local-police" as const },
//   { name: "Ambulance", phone: "911", icon: "medical-services" as const },
//   { name: "Fire Department", phone: "911", icon: "local-fire-department" as const },
// ];

// Relationship options
const relationshipOptions = [
  { label: "Select relationship...", value: "" },
  { label: "Family", value: "Family" },
  { label: "Friend", value: "Friend" },
  { label: "Colleague", value: "Colleague" },
  { label: "Neighbor", value: "Neighbor" },
];

interface Location {
    latitude: string;
    longitude: string;
    address: string;
}

// Types
interface FavouritePlace {
  favId: string;
  placeName: string;
  location: Location;
  imageUrl: string;
  createdAt: string;
}

interface CreateFavouritePlaceRequest {
  placeName: string;
  location: Location;
  imageUrl: string;
}

// API Service - simplified and embedded
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

class SimpleApiService {
  private async getHeaders(includeAuth: boolean = false): Promise<Record<string, string>> {
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

  async getFavouritePlaces() {
    try {
      const response = await fetch(`${API_BASE_URL}/favourite-place`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch favourite-place",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching favourite-place:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async addFavouritePlace(favouritePlace: CreateFavouritePlaceRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/favourite-place/add`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ favouritePlace }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to add favouritePlace",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error adding favouritePlace:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async updateFavouritePlace(favId: string, favouritePlace: CreateFavouritePlaceRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/favourite-place/update`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ favId, favouritePlace }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to update favouritePlace",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error updating favouritePlace:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async deleteFavouritePlace(favId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/favourite-place/delete`, {
        method: "DELETE",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ favId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to delete favouritePlace",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error deleting favouritePlace:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }


  async getOneFavouritePlace(favId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/favourite-place/id`, {
        method: "GET",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ favId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to get favouritePlace",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error geting favouritePlace:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }
}

const apiService = new SimpleApiService();

// Simple FavouritePlace Form Component - moved outside to prevent re-creation
const FavouritePlaceForm = ({ 
  isEdit = false, 
  onSubmit, 
  newFavouritePlace, 
  handleFavouritePlaceChange, 
  handleFormCancel, 
  isSubmitting 
}: { 
  isEdit?: boolean; 
  onSubmit: () => void;
  newFavouritePlace: CreateFavouritePlaceRequest;
  handleFavouritePlaceChange: (field: keyof CreateFavouritePlaceRequest | string, value: any) => void;
  handleFormCancel: () => void;
  isSubmitting: boolean;
}) => (
  <View className="bg-white rounded p-4 m-4 w-full max-w-sm">
    <Text className="text-lg font-bold text-[#67082F] mb-4 text-center">
      {isEdit ? "Edit FavouritePlace" : "Add FavouritePlace"}
    </Text>

    {/* Name Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Place Name *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <MaterialIcons name="place" size={20} color="#67082F" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="PlaceName"
          placeholderTextColor="#9CA3AF"
          value={newFavouritePlace.placeName}
          onChangeText={(text) => handleFavouritePlaceChange("placeName", text)}
          autoCapitalize="words"
        />
      </View>
    </View>

    {/* Phone Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Image Url *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <MaterialIcons name="image" size={20} color="#67082F" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="person"
          placeholderTextColor="#9CA3AF"
          value={newFavouritePlace.imageUrl}
          onChangeText={(text) => handleFavouritePlaceChange("imageUrl", text)}
          autoCapitalize="words"
        />
      </View>
    </View>

    {/* Email Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Latitude</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <MaterialIcons name="place" size={20} color="#67082F" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Latitude"
          placeholderTextColor="#9CA3AF"
          value={newFavouritePlace.location.latitude}
          onChangeText={(text) => handleFavouritePlaceChange("location.latitude", text)}
          keyboardType="phone-pad"
        />
      </View>
    </View>

    {/* Email Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Longitude</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <MaterialIcons name="place" size={20} color="#67082F" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Longitude"
          placeholderTextColor="#9CA3AF"
          value={newFavouritePlace.location.longitude}
          onChangeText={(text) => handleFavouritePlaceChange("location.longitude", text)}
          keyboardType="phone-pad"
        />
      </View>
    </View>

    {/* Name Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Address *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <MaterialIcons name="home" size={20} color="#67082F" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Address"
          placeholderTextColor="#9CA3AF"
          value={newFavouritePlace.location.address}
          onChangeText={(text) => handleFavouritePlaceChange("location.address", text)}
          autoCapitalize="words"
        />
      </View>
    </View>

    {/* Relationship Field
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Relationship *</Text>
      <View className="bg-white border border-gray-300 rounded">
        <Picker
          selectedValue={newFavouritePlace.relationship}
          onValueChange={(value) => handleFavouritePlaceChange("relationship", value)}
          style={{ 
            height: 50,
            color: '#111827'
          }}
        >
          {relationshipOptions.map((option) => (
            <Picker.Item 
              key={option.value} 
              label={option.label} 
              value={option.value} 
            />
          ))}
        </Picker>
      </View>
    </View> */}

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

export default function SimpleFavouritePlacesScreen() {
  const { showAlert, showConfirmAlert } = useAlert();
  const [favouritePlaces, setFavouritePlaces] = useState<FavouritePlace[]>([]);
  const [showAddFavouritePlace, setShowAddFavouritePlace] = useState(false);
  const [showEditFavouritePlace, setShowEditFavouritePlace] = useState(false);
  const [editingFavouritePlace, setEditingFavouritePlace] = useState<FavouritePlace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const [newFavouritePlace, setNewFavouritePlace] = useState<CreateFavouritePlaceRequest>({
    placeName: "",
    location: {
        latitude: "",
        longitude: "",
        address: "",
    },
    imageUrl: "",
  });

  // Load trusted favourite-place on component mount
  useEffect(() => {
    loadFavouritePlaces();
  }, []);

  const loadFavouritePlaces = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getFavouritePlaces();
      if (response.success && response.data) {
        console.log("FavouritePlaces loaded successfully:", response.data);
        setFavouritePlaces(response.data.contacts || []);
      } else {
        showAlert("Error", response.error || "Failed to load favourite-place", "error");

      }
    } catch {
      showAlert("Error", "Failed to load favourite-place", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetNewFavouritePlace = () => {
    setNewFavouritePlace({
        placeName: "",
        location: {
            latitude: "",
            longitude: "",
            address: "",
        },
        imageUrl: "",
    });
  };

  const validateFavouritePlace = () => {
    if (!newFavouritePlace.placeName.trim()) {
      showAlert("Validation Error", "Please enter a favouritePlace placeName", "error");
      return false;
    }

    if (!newFavouritePlace.imageUrl.trim()) {
      showAlert("Validation Error", "Please enter a phone number", "error");
      return false;
    }

    // if (!newFavouritePlace.relationship.trim()) {
    //   showAlert("Validation Error", "Please specify the relationship", "error");
    //   return false;
    // }

    // // Basic phone validation
    // const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    // if (!phoneRegex.test(newFavouritePlace.imageUrl.trim())) {
    //   showAlert("Validation Error", "Please enter a valid phone number", "error");
    //   return false;
    // }

    // // Basic email validation if provided
    // if (newFavouritePlace.location.latitude && newFavouritePlace.location.latitude.trim()) {
    //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //   if (!emailRegex.test(newFavouritePlace.location.latitude.trim())) {
    //     showAlert("Validation Error", "Please enter a valid email address", "error");
    //     return false;
    //   }
    // }

    return true;
  };

  const handleAddFavouritePlace = async () => {
    if (!validateFavouritePlace()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.addFavouritePlace(newFavouritePlace);
      if (response.success) {
        showAlert("Success", "FavouritePlace added successfully", "success");
        resetNewFavouritePlace();
        setShowAddFavouritePlace(false);
        loadFavouritePlaces();
      } else {
        showAlert("Error", response.error || "Failed to add favouritePlace", "error");
      }
    } catch {
      showAlert("Error", "Failed to add favouritePlace", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFavouritePlace = async () => {
    if (!editingFavouritePlace) {
      showAlert("Error", "No favouritePlace selected for editing", "error");
      return;
    }

    if (!validateFavouritePlace()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.updateFavouritePlace(editingFavouritePlace.favId, newFavouritePlace);
      if (response.success) {
        showAlert("Success", "FavouritePlace updated successfully", "success");
        resetNewFavouritePlace();
        setShowEditFavouritePlace(false);
        setEditingFavouritePlace(null);
        loadFavouritePlaces();
      } else {
        showAlert("Error", response.error || "Failed to update favouritePlace", "error");
      }
    } catch (error) {
      console.error("Error updating favouritePlace:", error);
      showAlert("Error", "Failed to update favouritePlace", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFavouritePlaces = async () => {
    if (selected.length === 0) return;

    const favouritePlaceNames = selected
      .map((id) => favouritePlaces.find((c) => c.favId === id)?.placeName)
      .filter(Boolean)
      .join(", ");

    showConfirmAlert(
      "Delete FavouritePlaces",
      `Are you sure you want to delete: ${favouritePlaceNames}?`,
      async () => {
        setIsSubmitting(true);
        try {
          for (const favId of selected) {
            const response = await apiService.deleteFavouritePlace(favId);
            if (!response.success) {
              showAlert("Error", response.error || "Failed to delete some favourite-place", "error");
              break;
            }
          }

          showAlert("Success", "FavouritePlaces deleted successfully", "success");
          setSelected([]);
          setSelectionMode(false);
          loadFavouritePlaces();
        } catch (error) {
          console.error("Error deleting favourite-place:", error);
          showAlert("Error", "Failed to delete favourite-place", "error");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const startEditFavouritePlace = (favouritePlace: FavouritePlace) => {
    setEditingFavouritePlace(favouritePlace);
    setNewFavouritePlace({
      placeName: favouritePlace.placeName,
      imageUrl: favouritePlace.imageUrl,
      location: favouritePlace.location
    });
    setShowEditFavouritePlace(true);
  };

  const handleLongPress = (favId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelected([favId]);
    }
  };

  const handleSelect = (favId: string) => {
    if (selectionMode) {
      setSelected((prev) =>
        prev.includes(favId)
          ? prev.filter((id) => id !== favId)
          : [...prev, favId]
      );
    }
  };

//   const handleCall = (phone: string) => {
//     Linking.openURL(`tel:${phone}`);
//   };

  const handleFavouritePlaceChange = (field: keyof CreateFavouritePlaceRequest | string, value: any) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1] as keyof typeof newFavouritePlace.location;
      setNewFavouritePlace({
        ...newFavouritePlace,
        location: {
          ...newFavouritePlace.location,
          [locationField]: value
        }
      });
    } else {
      setNewFavouritePlace({ 
        ...newFavouritePlace, 
        [field as keyof CreateFavouritePlaceRequest]: value 
      });
    }
  };

  const handleFormCancel = () => {
    resetNewFavouritePlace();
    setShowAddFavouritePlace(false);
    setShowEditFavouritePlace(false);
    setEditingFavouritePlace(null);
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-3xl mx-auto w-full">
      {/* Simple Header */}
      {/* <View className="bg-[#67082F] px-4 pt-12 pb-4 flex-row justify-between items-center">
        <Text className="text-white text-lg font-bold flex-1">Emergency FavouritePlaces</Text>
        <TouchableOpacity className="w-8 h-8 bg-red-700 rounded items-center justify-center">
          <MaterialIcons name="notifications" size={20} color="white" />
        </TouchableOpacity>
      </View> */}

      {/* Add FavouritePlace Modal */}
      <Modal
        visible={showAddFavouritePlace}
        transparent={true}
        onRequestClose={() => setShowAddFavouritePlace(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <FavouritePlaceForm 
            onSubmit={handleAddFavouritePlace}
            newFavouritePlace={newFavouritePlace}
            handleFavouritePlaceChange={handleFavouritePlaceChange}
            handleFormCancel={handleFormCancel}
            isSubmitting={isSubmitting}
          />
        </View>
      </Modal>

      {/* Edit FavouritePlace Modal */}
      <Modal
        visible={showEditFavouritePlace}
        transparent={true}
        onRequestClose={() => setShowEditFavouritePlace(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <FavouritePlaceForm 
            isEdit={true} 
            onSubmit={handleEditFavouritePlace}
            newFavouritePlace={newFavouritePlace}
            handleFavouritePlaceChange={handleFavouritePlaceChange}
            handleFormCancel={handleFormCancel}
            isSubmitting={isSubmitting}
          />
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView className="flex-1 p-4">
        {/* Emergency Services
        <Text className="text-lg font-bold text-[#67082F] mb-3">Emergency Services</Text>
        {emergencyFavouritePlaces.map((favouritePlace, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center bg-white p-3 rounded mb-2"
            onPress={() => handleCall(favouritePlace.imageUrl)}
          >
            <View className="w-8 h-8 bg-[#67082F]/10 rounded items-center justify-center mr-3">
              <MaterialIcons name={favouritePlace.icon} size={20} color="#67082F" />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-gray-800">{favouritePlace.name}</Text>
              <Text className="text-gray-600">{favouritePlace.imageUrl}</Text>
            </View>
            <MaterialIcons name="imageUrl" size={20} color="#67082F" />
          </TouchableOpacity>
        ))} */}

        {/* Action Buttons Section */}
        <View className="flex-row justify-between items-center mb-4 mt-3">
          <TouchableOpacity
            className="flex-1 mr-2 bg-[#67082F] rounded py-2 px-3 flex-row items-center justify-center"
            onPress={() => setShowAddFavouritePlace(true)}
          >
            <MaterialIcons name="add" size={18} color="white" />
            <Text className="text-white font-medium ml-1">Add FavouritePlace</Text>
          </TouchableOpacity>

          {favouritePlaces.length > 0 && (
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
              <MaterialIcons name={selectionMode ? "close" : "checklist"} size={18} color="#67082F" />
              <Text className="text-[#67082F] font-medium ml-1">
                {selectionMode ? "Cancel" : "Select"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Select All Button when in selection mode */}
        {selectionMode && favouritePlaces.length > 0 && (
          <View className="mb-3">
            <TouchableOpacity
              className="bg-[#67082F]/10 rounded py-2 px-3 flex-row items-center justify-center border border-[#67082F]/20"
              onPress={() => {
                if (selected.length === favouritePlaces.length) {
                  setSelected([]);
                } else {
                  setSelected(favouritePlaces.map((favouritePlace) => favouritePlace.favId));
                }
              }}
            >
              <MaterialIcons
                name={
                  selected.length === favouritePlaces.length
                    ? "check-circle"
                    : "radio-button-unchecked"
                }
                size={16}
                color="#67082F"
              />
              <Text className="text-[#67082F] font-medium ml-1">
                {selected.length === favouritePlaces.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Button when favourite-place are selected */}
        {selected.length > 0 && (
          <View className="mb-3">
            <TouchableOpacity
              className="bg-red-600 rounded py-2 px-3 flex-row items-center justify-center"
              onPress={handleDeleteFavouritePlaces}
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

        {/*  FavouritePlaces */}
        <Text className="text-lg font-bold text-[#67082F] mb-3"> FavouritePlaces</Text>

        {isLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="large" color="#67082F" />
            <Text className="text-gray-600 mt-2">Loading...</Text>
          </View>
        ) : favouritePlaces.length === 0 ? (
          <View className="bg-white p-4 rounded items-center">
            <MaterialIcons name="place" size={40} color="#9CA3AF" />
            <Text className="text-gray-600 mt-2 text-center">No FavouritePlace yet</Text>
          </View>
        ) : (
          favouritePlaces.map((favouritePlace) => (
            <TouchableOpacity
              key={favouritePlace.favId}
              className={`flex-row items-center bg-white p-3 rounded mb-2 ${
                selected.includes(favouritePlace.favId)
                  ? "border border-red-600"
                  : ""
              }`}
              onPress={() => handleSelect(favouritePlace.favId)}
              onLongPress={() => handleLongPress(favouritePlace.favId)}
            >
              <View className="w-8 h-8 bg-[#67082F]/10 rounded items-center justify-center mr-3">
                <MaterialIcons name="person" size={20} color="#67082F" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-800">{favouritePlace.placeName}</Text>
                <Text className="text-gray-600">{favouritePlace.imageUrl}</Text>
                <Text className="text-xs text-[#67082F]">{favouritePlace.location.latitude}</Text>
                <Text className="text-xs text-gray-500">{favouritePlace.location.longitude}</Text>
                <Text className="text-xs text-gray-500">{favouritePlace.location.address}</Text>
              </View>

              <View className="flex-row items-center">
                {/* <TouchableOpacity onPress={() => handleCall(favouritePlace.imageUrl)} className="p-1 mr-1">
                  <MaterialIcons name="phone" size={18} color="#67082F" />
                </TouchableOpacity> */}

                <TouchableOpacity onPress={() => startEditFavouritePlace(favouritePlace)} className="p-1 mr-1">
                  <MaterialIcons name="edit" size={18} color="#67082F" />
                </TouchableOpacity>

                {selectionMode && (
                  <View>
                    {selected.includes(favouritePlace.favId) ? (
                      <MaterialIcons name="check-circle" size={20} color="#dc2626" />
                    ) : (
                      <MaterialIcons name="radio-button-unchecked" size={20} color="#67082F" />
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
