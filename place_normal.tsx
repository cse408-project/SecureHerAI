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


// Relationship options
const places_options = [
  { label: "Select place...", value: "" },
  { label: "Home", value: "Home" },
  { label: "Office", value: "Office" },
  { label: "Campus", value: "Campus" },
  { label: "Work", value: "Work" },
];


interface PlaceInfo{
  id:string;
  placeName:string;
  longitude:string;
  latitude:string;
  address:string;
  img_url: string;
  created_at?: string
}


interface CreatPlace{
  placeName:string;
  latitude:string;
  longitude:string;
  address:string;
  img_url:string;
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

  async addfavoritePlace(place_info: CreatPlace) {
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

  async updatefavoritePlace(place_id: string, place_info: CreatPlace) {
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


    async getonefavoritePlace(place_id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/favorite_place/get_one`, {
        method: "GET",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ place_id }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to get place",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error getting place:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }
}

const apiService = new SimpleApiService();



// The component accepts the following props:

// isEdit: A boolean that determines whether the form is for editing an existing Place (true) or adding a new one (false). Defaults to false.
//is edit diya 2 ta  kaj kora jai 
// onSubmit: A callback function that will be triggered when the user submits the form (either to add or update the Place).
//jkono form submission e ei function kaje lage 
// newPlace: An object that holds the current Place's data. It is used to populate the fields.
//current place / Place data hold kore 
// handlePlaceUpdate: A function to handle updates to the fields (such as name, phone, email, etc.). This function will be called when the user modifies a field's value.
//value update korle eita call hoi 
// handleFormCancel: A function that will be called if the user cancels the form (e.g., pressing the "Cancel" button).

// isSubmitting: A boolean that indicates if the form is currently in the process of being submitted, preventing multiple submissions.
// // Simple Place Form Component - moved outside to prevent re-creation
const PlaceForm = ({ 


  isEdit = false, 
  onSubmit, 
  newPlace, 
  handlePlaceUpdate, 
  handleFormCancel, 
  isSubmitting 
}: { 
  isEdit?: boolean; 
  onSubmit: () => void;
  newPlace: CreatPlace;
  handlePlaceUpdate: (field: keyof CreatPlace, value: any) => void;
  handleFormCancel: () => void;
  isSubmitting: boolean;
}) => (
  <View className="bg-white rounded p-4 m-4 w-full max-w-sm">
    <Text className="text-lg font-bold text-[#67082F] mb-4 text-center">
      {isEdit ? "Update Place" : "Add Place"}
    </Text>
    {/* //eta moadl er jonno */}

    {/* Name Field
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Place Name *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
      
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Enter place name"
          placeholderTextColor="#9CA3AF"
          value={newPlace.placeName}
          onChangeText={(text) => handlePlaceUpdate("placeName", text)}
          autoCapitalize="words"
        />
      </View>
    </View> */}



        {/* Relationship Field */}
        <View className="mb-3">
          <Text className="text-sm text-gray-700 mb-1">Place_name* *</Text>
          <View className="bg-white border border-gray-300 rounded">
            <Picker
              selectedValue={newPlace.placeName}
              onValueChange={(value) => handlePlaceUpdate("placeName", value)}
              style={{ 
                height: 50,
                color: '#111827'
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
    

    {/* Lattitude Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Latitude *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        {/* <MaterialIcons name="phone" size={20} color="#67082F" /> */}
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Enter Latitude"
          placeholderTextColor="#9CA3AF"
          value={newPlace.latitude}
          onChangeText={(text) => handlePlaceUpdate("latitude", text)}
          autoCapitalize="words"
        />
      </View>
    </View>



    {/* Longitude Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Longitude *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        {/* <MaterialIcons name="phone" size={20} color="#67082F" /> */}
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Enter Longitude"
          placeholderTextColor="#9CA3AF"
          value={newPlace.longitude}
          onChangeText={(text) => handlePlaceUpdate("longitude", text)}
          autoCapitalize="words"
        />
      </View>
    </View>

    {/* address Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Address *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        {/* <MaterialIcons name="email" size={20} color="#67082F" /> */}
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Enter address name"
          placeholderTextColor="#9CA3AF"
          value={newPlace.address}
          onChangeText={(text) => handlePlaceUpdate("address", text)}
          autoCapitalize="words"
        />
      </View>
    </View>

    {/* imag_url Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Img_URL</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        {/* <MaterialIcons name="email" size={20} color="#67082F" /> */}
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Enter image url "
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

export default function SimplePlacesScreen() {
  const { showAlert, showConfirmAlert } = useAlert();
  const [PlaceInfos, setPlaceInfos] = useState<PlaceInfo[]>([]);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [showEditPlace, setShowEditPlace] = useState(false);
  const [editingPlace, setEditingPlace] = useState<PlaceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const [newPlace, setnewPlace] = useState<CreatPlace>({
    placeName: "",
    latitude: "",
    longitude: "",
    address: "unknown location",
    img_url: "",
  });

  // Load trusted Places on component mount
  useEffect(() => {
    loadPlaceInfos();
  }, []);

  const loadPlaceInfos = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPlaceInfos();
      console.log('inside load');
      if (response.success && response.data) {
        setPlaceInfos(response.data.favoritePlaces || []);
        // favoritePlaces eta actually getPlaceInfo() er body te ki name response  dey
      } else {
        showAlert("Error", response.error || "Failed to load Places", "error");
      }
    } catch {
      showAlert("Error", "Failed to load Places", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetnewPlace = () => {
    setnewPlace({
    placeName: "",
    latitude: "",
    longitude: "",
    address: "unknown location",
    img_url: "",
    });
  };

  const validatePlace = () => {
    if (!newPlace.placeName.trim()) {
      showAlert("Validation Error", "Please enter a Place name", "error");
      return false;
    }

    // if (!newPlace.longitude.trim()) {
    //   showAlert("Validation Error", "Please enter a longitude", "error");
    //   return false;
    // }

    // if (!newPlace.latitude.trim()) {
    //   showAlert("Validation Error", "Please specify the latitude", "error");
    //   return false;
    // }



    return true;
  };

  const handleAddPlace = async () => {
    if (!validatePlace()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.addfavoritePlace(newPlace);
      if (response.success) {
        showAlert("Success", "Place added successfully", "success");
        resetnewPlace();
        setShowAddPlace(false);
        loadPlaceInfos();
      } else {
        showAlert("Error", response.error || "Failed to add Place", "error");
      }
    } catch {
      showAlert("Error", "Failed to add Place", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlace = async () => {
    if (!editingPlace) {
      showAlert("Error", "No Place selected for editing", "error");
      return;
    }

    if (!validatePlace()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.updatefavoritePlace(editingPlace.id, newPlace);
      if (response.success) {
        showAlert("Success", "Place updated successfully", "success");
        resetnewPlace();
        setShowEditPlace(false);
        setEditingPlace(null);
        loadPlaceInfos();
      } else {
        showAlert("Error", response.error || "Failed to update Place", "error");
      }
    } catch (error) {
      console.error("Error updating Place:", error);
      showAlert("Error", "Failed to update Place", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlaces = async () => {
    if (selected.length === 0) return;

    const PlaceNames = selected
      .map((id) => PlaceInfos.find((c) => c.id === id)?.placeName)
      .filter(Boolean)
      .join(", ");

    showConfirmAlert(
      "Delete Places",
      `Are you sure you want to delete: ${PlaceNames}?`,
      async () => {
        setIsSubmitting(true);
        try {
          for (const PlaceId of selected) {
            const response = await apiService.deletefavoritePlace(PlaceId);
            if (!response.success) {
              showAlert("Error", response.error || "Failed to delete some Places", "error");
              break;
            }
          }

          showAlert("Success", "Places deleted successfully", "success");
          setSelected([]);
          setSelectionMode(false);
          loadPlaceInfos();
        } catch (error) {
          console.error("Error deleting Places:", error);
          showAlert("Error", "Failed to delete Places", "error");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const startEditPlace = (Place: PlaceInfo) => {
    setEditingPlace(Place);
    setnewPlace({
      placeName: Place.placeName,
      longitude: Place.longitude,
      latitude: Place.latitude,
      address:Place.address,
      img_url:Place.img_url
      
    });
    setShowEditPlace(true);
  };

  const handleLongPress = (PlaceId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelected([PlaceId]);
    }
  };

  const handleSelect = (PlaceId: string) => {
    if (selectionMode) {
      setSelected((prev) =>
        prev.includes(PlaceId)
          ? prev.filter((id) => id !== PlaceId)
          : [...prev, PlaceId]
      );
    }
  };



  const handlePlaceUpdate = (field: keyof CreatPlace, value: any) => {
    setnewPlace({ ...newPlace, [field]: value });
  };

  const handleFormCancel = () => {
    resetnewPlace();
    setShowAddPlace(false);
    setShowEditPlace(false);
    setEditingPlace(null);
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-3xl mx-auto w-full">
      {/* Simple Header */}
      {/* header of this page */}
     
      <View className="bg-[#67082F] px-4 pt-12 pb-4 flex-row justify-between items-center">
        <Text className="text-white text-lg font-bold flex-1">Favorite Places</Text>

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
          />
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

          {PlaceInfos.length > 0 && (
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
        {selectionMode && PlaceInfos.length > 0 && (
          <View className="mb-3">
            <TouchableOpacity
              className="bg-[#67082F]/10 rounded py-2 px-3 flex-row items-center justify-center border border-[#67082F]/20"
              onPress={() => {
                if (selected.length === PlaceInfos.length) {
                  setSelected([]);
                } else {
                  setSelected(PlaceInfos.map((Place) => Place.id));
                }
              }}
            >
              <MaterialIcons
                name={
                  selected.length === PlaceInfos.length
                    ? "check-circle"
                    : "radio-button-unchecked"
                }
                size={16}
                color="#67082F"
              />
              <Text className="text-[#67082F] font-medium ml-1">
                {selected.length === PlaceInfos.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Button when Places are selected */}
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

        {/* Trusted Places */}
        <Text className="text-lg font-bold text-[#67082F] mb-3">Trusted Places</Text>

        {isLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="large" color="#67082F" />
            <Text className="text-gray-600 mt-2">Loading...</Text>
          </View>
        ) : PlaceInfos.length === 0 ? (
          <View className="bg-white p-4 rounded items-center">
            {/* <MaterialIcons name="Places" size={40} color="#9CA3AF" /> */}
            <Text className="text-gray-600 mt-2 text-center">No Places yet</Text>
          </View>
        ) : (
          PlaceInfos.map((Place) => (
            <TouchableOpacity
              key={Place.id}
              className={`flex-row items-center bg-white p-3 rounded mb-2 ${
                selected.includes(Place.id)
                  ? "border border-red-600"
                  : ""
              }`}
              onPress={() => handleSelect(Place.id)}
              onLongPress={() => handleLongPress(Place.id)}
            >
              <View className="w-8 h-8 bg-[#67082F]/10 rounded items-center justify-center mr-3">
                <MaterialIcons name="person" size={20} color="#67082F" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-800">{Place.placeName}</Text>
                <Text className="text-gray-600">{Place.longitude}</Text>
                <Text className="text-xs text-[#67082F]">{Place.latitude}</Text>
                <Text className="text-xs text-[#67082F]">{Place.img_url}</Text>
                <Text className="text-xs text-[#67082F]">{Place.address}</Text>
                
          
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => handleAddPlace()} className="p-1 mr-1">
                  {/* <MaterialIcons name="phone" size={18} color="#67082F" /> */}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => startEditPlace(Place)} className="p-1 mr-1">
                  <MaterialIcons name="edit" size={18} color="#67082F" />
                </TouchableOpacity>

                {selectionMode && (
                  <View>
                    {selected.includes(Place.id) ? (
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
