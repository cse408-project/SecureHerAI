import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Header from "../../src/components/Header";
import ContactForm from "../../components/ContactForm";
import { useAlert } from "../../context/AlertContext";
import ApiService from "../../services/api";
import type {
  TrustedContact,
  CreateContactRequest,
} from "../../types/contacts";

// Emergency contacts - these remain static
const emergencyContacts = [
  { name: "Police", phone: "911", icon: "local-police" as const },
  { name: "Ambulance", phone: "911", icon: "medical-services" as const },
  {
    name: "Fire Department",
    phone: "911",
    icon: "local-fire-department" as const,
  },
];

export default function ContactsScreen() {
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(
    null
  );
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

  const { showAlert, showConfirmAlert } = useAlert();

  // Load trusted contacts on component mount
  useEffect(() => {
    loadTrustedContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTrustedContacts = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.getTrustedContacts();
      if (response.success && response.data) {
        setTrustedContacts(response.data.contacts || []);
      } else {
        showAlert(
          "Error",
          response.error || "Failed to load contacts",
          "error"
        );
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

  const handleAddContact = async () => {
    // Enhanced validation
    if (!newContact.name.trim()) {
      showAlert("Validation Error", "Please enter a contact name", "error");
      return;
    }

    if (!newContact.phone.trim()) {
      showAlert("Validation Error", "Please enter a phone number", "error");
      return;
    }

    if (!newContact.relationship.trim()) {
      showAlert("Validation Error", "Please specify the relationship", "error");
      return;
    }

    // Basic phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(newContact.phone.trim())) {
      showAlert(
        "Validation Error",
        "Please enter a valid phone number",
        "error"
      );
      return;
    }

    // Basic email validation if provided
    if (newContact.email && newContact.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newContact.email.trim())) {
        showAlert(
          "Validation Error",
          "Please enter a valid email address",
          "error"
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await ApiService.addTrustedContact(newContact);
      if (response.success) {
        showAlert("Success", "Contact added successfully", "success");
        resetNewContact();
        setShowAddContact(false);
        loadTrustedContacts(); // Reload contacts
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

    // Enhanced validation
    if (!newContact.name.trim()) {
      showAlert("Validation Error", "Please enter a contact name", "error");
      return;
    }

    if (!newContact.phone.trim()) {
      showAlert("Validation Error", "Please enter a phone number", "error");
      return;
    }

    if (!newContact.relationship.trim()) {
      showAlert("Validation Error", "Please specify the relationship", "error");
      return;
    }

    // Basic phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(newContact.phone.trim())) {
      showAlert(
        "Validation Error",
        "Please enter a valid phone number",
        "error"
      );
      return;
    }

    // Basic email validation if provided
    if (newContact.email && newContact.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newContact.email.trim())) {
        showAlert(
          "Validation Error",
          "Please enter a valid email address",
          "error"
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await ApiService.updateTrustedContact(
        editingContact.contactId,
        newContact
      );
      if (response.success) {
        showAlert("Success", "Contact updated successfully", "success");
        resetNewContact();
        setShowEditContact(false);
        setEditingContact(null);
        loadTrustedContacts(); // Reload contacts
      } else {
        showAlert(
          "Error",
          response.error || "Failed to update contact",
          "error"
        );
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
          // Delete contacts one by one
          for (const contactId of selected) {
            const response = await ApiService.deleteTrustedContact(contactId);
            if (!response.success) {
              showAlert(
                "Error",
                response.error || "Failed to delete some contacts",
                "error"
              );
              break;
            }
          }

          showAlert("Success", "Contacts deleted successfully", "success");
          setSelected([]);
          setSelectionMode(false);
          loadTrustedContacts(); // Reload contacts
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

  const handleContactChange = (contact: CreateContactRequest) => {
    setNewContact(contact);
  };

  const handleFormCancel = () => {
    resetNewContact();
    setShowAddContact(false);
    setShowEditContact(false);
    setEditingContact(null);
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <Header
        title="Emergency Contacts"
        onNotificationPress={() => {}}
        showNotificationDot={false}
      />

      {/* Add Contact Modal */}
      <Modal
        visible={showAddContact}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddContact(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            <ContactForm
              contact={newContact}
              onContactChange={handleContactChange}
              onSubmit={handleAddContact}
              onCancel={handleFormCancel}
              isSubmitting={isSubmitting}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        visible={showEditContact}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditContact(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            keyboardShouldPersistTaps="handled"
          >
            <ContactForm
              isEdit={true}
              contact={newContact}
              onContactChange={handleContactChange}
              onSubmit={handleEditContact}
              onCancel={handleFormCancel}
              isSubmitting={isSubmitting}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Emergency Services */}
        <Text className="text-lg font-bold text-[#67082F] mb-4">
          Emergency Services
        </Text>
        {emergencyContacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center bg-white p-4 rounded-lg mb-3 shadow-sm"
            onPress={() => handleCall(contact.phone)}
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 bg-[#67082F]/10 rounded-full items-center justify-center mr-4">
              <MaterialIcons name={contact.icon} size={24} color="#67082F" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800">
                {contact.name}
              </Text>
              <Text className="text-gray-600">{contact.phone}</Text>
            </View>
            <MaterialIcons name="phone" size={24} color="#67082F" />
          </TouchableOpacity>
        ))}

        {/* Action Buttons Section */}
        <View className="flex-row justify-between items-center mb-6 mt-4">
          {/* Add Contact Button */}
          <TouchableOpacity
            className="flex-1 mr-2 bg-[#67082F] rounded-lg py-3 px-4 flex-row items-center justify-center shadow-sm"
            onPress={() => setShowAddContact(true)}
          >
            <MaterialIcons
              name="add"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-semibold">Add Contact</Text>
          </TouchableOpacity>

          {/* Selection Mode Toggle */}
          {trustedContacts.length > 0 && (
            <TouchableOpacity
              className="flex-1 ml-2 bg-white rounded-lg py-3 px-4 flex-row items-center justify-center shadow-sm border border-gray-200"
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
                size={20}
                color="#67082F"
                style={{ marginRight: 8 }}
              />
              <Text className="text-[#67082F] font-semibold">
                {selectionMode ? "Cancel" : "Select"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Select All Button when in selection mode */}
        {selectionMode && trustedContacts.length > 0 && (
          <View className="mb-4">
            <TouchableOpacity
              className="bg-[#67082F]/10 rounded-lg py-2 px-4 flex-row items-center justify-center border border-[#67082F]/20"
              onPress={() => {
                if (selected.length === trustedContacts.length) {
                  setSelected([]);
                } else {
                  setSelected(
                    trustedContacts.map((contact) => contact.contactId)
                  );
                }
              }}
            >
              <MaterialIcons
                name={
                  selected.length === trustedContacts.length
                    ? "check-circle"
                    : "radio-button-unchecked"
                }
                size={18}
                color="#67082F"
                style={{ marginRight: 8 }}
              />
              <Text className="text-[#67082F] font-medium">
                {selected.length === trustedContacts.length
                  ? "Deselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Delete Button when contacts are selected */}
        {selected.length > 0 && (
          <View className="mb-4">
            <TouchableOpacity
              className="bg-red-600 rounded-lg py-3 px-4 flex-row items-center justify-center shadow-sm"
              onPress={handleDeleteContacts}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <MaterialIcons
                    name="delete"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white font-semibold">
                    Delete Selected ({selected.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Trusted Contacts */}
        <Text className="text-lg font-bold text-[#67082F] mb-4">
          Trusted Contacts
        </Text>

        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#67082F" />
            <Text className="text-gray-600 mt-2">Loading contacts...</Text>
          </View>
        ) : trustedContacts.length === 0 ? (
          <View className="bg-white p-6 rounded-lg shadow-sm items-center">
            <MaterialIcons name="contacts" size={48} color="#9CA3AF" />
            <Text className="text-gray-600 mt-2 text-center">
              No trusted contacts yet. Add your first contact!
            </Text>
          </View>
        ) : (
          trustedContacts.map((contact) => (
            <TouchableOpacity
              key={contact.contactId}
              className={`flex-row items-center bg-white p-4 rounded-lg mb-3 shadow-sm ${
                selected.includes(contact.contactId)
                  ? "border-2 border-red-600"
                  : ""
              }`}
              onPress={() => handleSelect(contact.contactId)}
              onLongPress={() => handleLongPress(contact.contactId)}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 bg-[#67082F]/10 rounded-full items-center justify-center mr-4">
                <MaterialIcons name="person" size={24} color="#67082F" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">
                  {contact.name}
                </Text>
                <Text className="text-gray-600">{contact.phone}</Text>
                <Text className="text-xs text-[#67082F]">
                  {contact.relationship}
                </Text>
                {contact.email && (
                  <Text className="text-xs text-gray-500">{contact.email}</Text>
                )}
              </View>

              <View className="flex-row items-center space-x-2">
                <TouchableOpacity
                  onPress={() => handleCall(contact.phone)}
                  className="p-2"
                >
                  <MaterialIcons name="phone" size={20} color="#67082F" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => startEditContact(contact)}
                  className="p-2"
                >
                  <MaterialIcons name="edit" size={20} color="#67082F" />
                </TouchableOpacity>

                {selectionMode && (
                  <View>
                    {selected.includes(contact.contactId) ? (
                      <MaterialIcons
                        name="check-circle"
                        size={24}
                        color="#dc2626"
                      />
                    ) : (
                      <MaterialIcons
                        name="radio-button-unchecked"
                        size={24}
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
