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

// Emergency contacts - static data
const emergencyContacts = [
  { name: "Police", phone: "911", icon: "local-police" as const },
  { name: "Ambulance", phone: "911", icon: "medical-services" as const },
  { name: "Fire Department", phone: "911", icon: "local-fire-department" as const },
];

// Relationship options
const relationshipOptions = [
  { label: "Select relationship...", value: "" },
  { label: "Family", value: "Family" },
  { label: "Friend", value: "Friend" },
  { label: "Colleague", value: "Colleague" },
  { label: "Neighbor", value: "Neighbor" },
];

// Types
interface TrustedContact {
  contactId: string;
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  shareLocation?: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateContactRequest {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
  shareLocation?: boolean;
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

  async getTrustedContacts() {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: "GET",
        headers: await this.getHeaders(true),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to fetch contacts",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error fetching contacts:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async addTrustedContact(contact: CreateContactRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/add`, {
        method: "POST",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contact }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to add contact",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error adding contact:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async updateTrustedContact(contactId: string, contact: CreateContactRequest) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/update`, {
        method: "PUT",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contactId, contact }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to update contact",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error updating contact:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }

  async deleteTrustedContact(contactId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/contacts/delete`, {
        method: "DELETE",
        headers: await this.getHeaders(true),
        body: JSON.stringify({ contactId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to delete contact",
        };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error("API: Error deleting contact:", error);
      return {
        success: false,
        error: "Network error. Please check your connection and try again.",
      };
    }
  }
}

const apiService = new SimpleApiService();

// Simple Contact Form Component - moved outside to prevent re-creation
const ContactForm = ({ 
  isEdit = false, 
  onSubmit, 
  newContact, 
  handleContactChange, 
  handleFormCancel, 
  isSubmitting 
}: { 
  isEdit?: boolean; 
  onSubmit: () => void;
  newContact: CreateContactRequest;
  handleContactChange: (field: keyof CreateContactRequest, value: any) => void;
  handleFormCancel: () => void;
  isSubmitting: boolean;
}) => (
  <View className="bg-white rounded p-4 m-4 w-full max-w-sm">
    <Text className="text-lg font-bold text-[#67082F] mb-4 text-center">
      {isEdit ? "Edit Contact" : "Add Contact"}
    </Text>

    {/* Name Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Name *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <MaterialIcons name="person" size={20} color="#67082F" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Enter name"
          placeholderTextColor="#9CA3AF"
          value={newContact.name}
          onChangeText={(text) => handleContactChange("name", text)}
          autoCapitalize="words"
        />
      </View>
    </View>

    {/* Phone Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Phone *</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <MaterialIcons name="phone" size={20} color="#67082F" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Phone number"
          placeholderTextColor="#9CA3AF"
          value={newContact.phone}
          onChangeText={(text) => handleContactChange("phone", text)}
          keyboardType="phone-pad"
        />
      </View>
    </View>

    {/* Email Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Email</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded px-3 py-3">
        <MaterialIcons name="email" size={20} color="#67082F" />
        <TextInput
          className="flex-1 ml-2 text-gray-900"
          placeholder="Email (optional)"
          placeholderTextColor="#9CA3AF"
          value={newContact.email}
          onChangeText={(text) => handleContactChange("email", text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </View>

    {/* Relationship Field */}
    <View className="mb-3">
      <Text className="text-sm text-gray-700 mb-1">Relationship *</Text>
      <View className="bg-white border border-gray-300 rounded">
        <Picker
          selectedValue={newContact.relationship}
          onValueChange={(value) => handleContactChange("relationship", value)}
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
    </View>

    {/* Share Location Toggle */}
    <View className="bg-gray-100 rounded p-3 mb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm text-gray-700">Share Location</Text>
          <Text className="text-xs text-gray-600">Emergency location sharing</Text>
        </View>
        <Switch
          value={newContact.shareLocation}
          onValueChange={(value) => handleContactChange("shareLocation", value)}
          trackColor={{ false: "#E5E7EB", true: "#67082F" }}
          thumbColor="#FFFFFF"
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

export default function SimpleContactsScreen() {
  const { showAlert, showConfirmAlert } = useAlert();
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const [newContact, setNewContact] = useState<CreateContactRequest>({
    name: "",
    phone: "",
    relationship: "Friend",
    email: "",
    shareLocation: false,
  });

  // Load trusted contacts on component mount
  useEffect(() => {
    loadTrustedContacts();
  }, []);

  const loadTrustedContacts = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getTrustedContacts();
      if (response.success && response.data) {
        setTrustedContacts(response.data.contacts || []);
      } else {
        showAlert("Error", response.error || "Failed to load contacts", "error");
      }
    } catch {
      showAlert("Error", "Failed to load contacts", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetNewContact = () => {
    setNewContact({
      name: "",
      phone: "",
      relationship: "Friend",
      email: "",
      shareLocation: false,
    });
  };

  const validateContact = () => {
    if (!newContact.name.trim()) {
      showAlert("Validation Error", "Please enter a contact name", "error");
      return false;
    }

    if (!newContact.phone.trim()) {
      showAlert("Validation Error", "Please enter a phone number", "error");
      return false;
    }

    if (!newContact.relationship.trim()) {
      showAlert("Validation Error", "Please specify the relationship", "error");
      return false;
    }

    // Basic phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(newContact.phone.trim())) {
      showAlert("Validation Error", "Please enter a valid phone number", "error");
      return false;
    }

    // Basic email validation if provided
    if (newContact.email && newContact.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newContact.email.trim())) {
        showAlert("Validation Error", "Please enter a valid email address", "error");
        return false;
      }
    }

    return true;
  };

  const handleAddContact = async () => {
    if (!validateContact()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.addTrustedContact(newContact);
      if (response.success) {
        showAlert("Success", "Contact added successfully", "success");
        resetNewContact();
        setShowAddContact(false);
        loadTrustedContacts();
      } else {
        showAlert("Error", response.error || "Failed to add contact", "error");
      }
    } catch {
      showAlert("Error", "Failed to add contact", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditContact = async () => {
    if (!editingContact) {
      showAlert("Error", "No contact selected for editing", "error");
      return;
    }

    if (!validateContact()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.updateTrustedContact(editingContact.contactId, newContact);
      if (response.success) {
        showAlert("Success", "Contact updated successfully", "success");
        resetNewContact();
        setShowEditContact(false);
        setEditingContact(null);
        loadTrustedContacts();
      } else {
        showAlert("Error", response.error || "Failed to update contact", "error");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      showAlert("Error", "Failed to update contact", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContacts = async () => {
    if (selected.length === 0) return;

    const contactNames = selected
      .map((id) => trustedContacts.find((c) => c.contactId === id)?.name)
      .filter(Boolean)
      .join(", ");

    showConfirmAlert(
      "Delete Contacts",
      `Are you sure you want to delete: ${contactNames}?`,
      async () => {
        setIsSubmitting(true);
        try {
          for (const contactId of selected) {
            const response = await apiService.deleteTrustedContact(contactId);
            if (!response.success) {
              showAlert("Error", response.error || "Failed to delete some contacts", "error");
              break;
            }
          }

          showAlert("Success", "Contacts deleted successfully", "success");
          setSelected([]);
          setSelectionMode(false);
          loadTrustedContacts();
        } catch (error) {
          console.error("Error deleting contacts:", error);
          showAlert("Error", "Failed to delete contacts", "error");
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const startEditContact = (contact: TrustedContact) => {
    setEditingContact(contact);
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship,
      email: contact.email || "",
      shareLocation: contact.shareLocation || false,
    });
    setShowEditContact(true);
  };

  const handleLongPress = (contactId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelected([contactId]);
    }
  };

  const handleSelect = (contactId: string) => {
    if (selectionMode) {
      setSelected((prev) =>
        prev.includes(contactId)
          ? prev.filter((id) => id !== contactId)
          : [...prev, contactId]
      );
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleContactChange = (field: keyof CreateContactRequest, value: any) => {
    setNewContact({ ...newContact, [field]: value });
  };

  const handleFormCancel = () => {
    resetNewContact();
    setShowAddContact(false);
    setShowEditContact(false);
    setEditingContact(null);
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-3xl mx-auto w-full">
      {/* Simple Header */}
      <View className="bg-[#67082F] px-4 pt-12 pb-4 flex-row justify-between items-center">
        <Text className="text-white text-lg font-bold flex-1">Emergency Contacts</Text>
        <TouchableOpacity className="w-8 h-8 bg-red-700 rounded items-center justify-center">
          <MaterialIcons name="notifications" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContact}
        transparent={true}
        onRequestClose={() => setShowAddContact(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <ContactForm 
            onSubmit={handleAddContact}
            newContact={newContact}
            handleContactChange={handleContactChange}
            handleFormCancel={handleFormCancel}
            isSubmitting={isSubmitting}
          />
        </View>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        visible={showEditContact}
        transparent={true}
        onRequestClose={() => setShowEditContact(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <ContactForm 
            isEdit={true} 
            onSubmit={handleEditContact}
            newContact={newContact}
            handleContactChange={handleContactChange}
            handleFormCancel={handleFormCancel}
            isSubmitting={isSubmitting}
          />
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView className="flex-1 p-4">
        {/* Emergency Services */}
        <Text className="text-lg font-bold text-[#67082F] mb-3">Emergency Services</Text>
        {emergencyContacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center bg-white p-3 rounded mb-2"
            onPress={() => handleCall(contact.phone)}
          >
            <View className="w-8 h-8 bg-[#67082F]/10 rounded items-center justify-center mr-3">
              <MaterialIcons name={contact.icon} size={20} color="#67082F" />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-gray-800">{contact.name}</Text>
              <Text className="text-gray-600">{contact.phone}</Text>
            </View>
            <MaterialIcons name="phone" size={20} color="#67082F" />
          </TouchableOpacity>
        ))}

        {/* Action Buttons Section */}
        <View className="flex-row justify-between items-center mb-4 mt-3">
          <TouchableOpacity
            className="flex-1 mr-2 bg-[#67082F] rounded py-2 px-3 flex-row items-center justify-center"
            onPress={() => setShowAddContact(true)}
          >
            <MaterialIcons name="add" size={18} color="white" />
            <Text className="text-white font-medium ml-1">Add Contact</Text>
          </TouchableOpacity>

          {trustedContacts.length > 0 && (
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
        {selectionMode && trustedContacts.length > 0 && (
          <View className="mb-3">
            <TouchableOpacity
              className="bg-[#67082F]/10 rounded py-2 px-3 flex-row items-center justify-center border border-[#67082F]/20"
              onPress={() => {
                if (selected.length === trustedContacts.length) {
                  setSelected([]);
                } else {
                  setSelected(trustedContacts.map((contact) => contact.contactId));
                }
              }}
            >
              <MaterialIcons
                name={
                  selected.length === trustedContacts.length
                    ? "check-circle"
                    : "radio-button-unchecked"
                }
                size={16}
                color="#67082F"
              />
              <Text className="text-[#67082F] font-medium ml-1">
                {selected.length === trustedContacts.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Button when contacts are selected */}
        {selected.length > 0 && (
          <View className="mb-3">
            <TouchableOpacity
              className="bg-red-600 rounded py-2 px-3 flex-row items-center justify-center"
              onPress={handleDeleteContacts}
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

        {/* Trusted Contacts */}
        <Text className="text-lg font-bold text-[#67082F] mb-3">Trusted Contacts</Text>

        {isLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="large" color="#67082F" />
            <Text className="text-gray-600 mt-2">Loading...</Text>
          </View>
        ) : trustedContacts.length === 0 ? (
          <View className="bg-white p-4 rounded items-center">
            <MaterialIcons name="contacts" size={40} color="#9CA3AF" />
            <Text className="text-gray-600 mt-2 text-center">No contacts yet</Text>
          </View>
        ) : (
          trustedContacts.map((contact) => (
            <TouchableOpacity
              key={contact.contactId}
              className={`flex-row items-center bg-white p-3 rounded mb-2 ${
                selected.includes(contact.contactId)
                  ? "border border-red-600"
                  : ""
              }`}
              onPress={() => handleSelect(contact.contactId)}
              onLongPress={() => handleLongPress(contact.contactId)}
            >
              <View className="w-8 h-8 bg-[#67082F]/10 rounded items-center justify-center mr-3">
                <MaterialIcons name="person" size={20} color="#67082F" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-800">{contact.name}</Text>
                <Text className="text-gray-600">{contact.phone}</Text>
                <Text className="text-xs text-[#67082F]">{contact.relationship}</Text>
                {contact.email && (
                  <Text className="text-xs text-gray-500">{contact.email}</Text>
                )}
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => handleCall(contact.phone)} className="p-1 mr-1">
                  <MaterialIcons name="phone" size={18} color="#67082F" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => startEditContact(contact)} className="p-1 mr-1">
                  <MaterialIcons name="edit" size={18} color="#67082F" />
                </TouchableOpacity>

                {selectionMode && (
                  <View>
                    {selected.includes(contact.contactId) ? (
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
