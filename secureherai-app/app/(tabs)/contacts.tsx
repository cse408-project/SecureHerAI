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
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../../components/Header";
import PageControlBar from "../../components/PageControlBar";
import ContactForm from "../../components/ContactForm";
import EmergencyContactsModal from "../../components/EmergencyContactsModal";
import { useAlert } from "../../context/AlertContext";
import { useAuth } from "../../context/AuthContext";
import ApiService from "../../services/api";
import type {
  TrustedContact,
  CreateContactRequest,
} from "../../types/contacts";
import type {
  UserContactData,
  GetAllUsersContactsResponse,
} from "../../types/usersAndContacts";
import NotificationModal from "../../components/NotificationModal";
import { ResponderSearchResult } from "../../types/alertResponder";

export default function ContactsScreen() {
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isResponder, setIsResponder] = useState(false);
  const [allUsersAndContacts, setAllUsersAndContacts] = useState<
    UserContactData[]
  >([]);
  const [allResponders, setAllResponders] = useState<ResponderSearchResult[]>(
    [],
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"my" | "all">("my"); // Toggle between my contacts and all responders

  const [newContact, setNewContact] = useState<CreateContactRequest>({
    name: "",
    phone: "",
    relationship: "Friend",
    email: "",
    shareLocation: false,
  });

  const { showAlert, showConfirmAlert } = useAlert();
  const { user } = useAuth(); // Get user from auth context

  // Check if user is a responder
  const checkUserRole = async () => {
    try {
      // First try to get role from auth context user
      if (user?.role) {
        const isResponderUser = user.role === "RESPONDER";
        console.log(
          "ContactsScreen: User role from context:",
          user.role,
          "Is responder:",
          isResponderUser,
        );
        setIsResponder(isResponderUser);
        return;
      }

      // Fallback to AsyncStorage if auth context doesn't have user data yet
      const userDataStr = await AsyncStorage.getItem("user_data");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log("ContactsScreen: User data from storage:", userData);
        // Check the role property (not roles array)
        const userRole = userData.role;
        const isResponderUser = userRole === "RESPONDER";
        console.log(
          "ContactsScreen: User role from storage:",
          userRole,
          "Is responder:",
          isResponderUser,
        );
        setIsResponder(isResponderUser);
      } else {
        // No user data found, default to regular user
        setIsResponder(false);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsResponder(false);
    }
  };

  // Load trusted contacts on component mount
  useEffect(() => {
    checkUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load contacts when role is determined
  useEffect(() => {
    if (isResponder !== null) {
      loadTrustedContacts();
      loadAllResponders();
    }
  }, [isResponder]);

  const loadAllResponders = async () => {
    try {
      const response = await ApiService.searchResponders("");
      if (response.success && response.data) {
        setAllResponders(response.data);
      }
    } catch (error) {
      console.error("Error loading all responders:", error);
    }
  };

  const loadTrustedContacts = async () => {
    setIsLoading(true);
    try {
      let response;

      if (isResponder) {
        // Responder: Load all users and their contacts
        console.log(
          "ContactsScreen: Loading all users and contacts for responder",
        );
        response = await ApiService.getAllUsersAndContacts();
        console.log("ContactsScreen: Response data for responder:", response);
        if (response.success && response.data) {
          // The response.data contains a nested data property with the actual array
          console.log("ContactsScreen: Users data received:", response.data);
          const usersData = Array.isArray(response.data.data)
            ? response.data.data
            : [];
          console.log("ContactsScreen: Users data to set:", usersData);
          setAllUsersAndContacts(usersData);
          console.log(
            "ContactsScreen: All users and contacts loaded:",
            allUsersAndContacts,
          );
          setTrustedContacts([]); // Clear regular contacts for responder view
        } else {
          showAlert(
            "Error",
            response.error || "Failed to load user contacts",
            "error",
          );
        }
      } else {
        // Regular user: Load only their own trusted contacts
        console.log(
          "ContactsScreen: Loading trusted contacts for regular user",
        );
        response = await ApiService.getTrustedContacts();
        if (response.success && response.data) {
          setTrustedContacts(response.data.contacts || []);
          setAllUsersAndContacts([]); // Clear responder data for user view
        } else {
          showAlert(
            "Error",
            response.error || "Failed to load contacts",
            "error",
          );
        }
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
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
        "error",
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
          "error",
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
        "error",
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
          "error",
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await ApiService.updateTrustedContact(
        editingContact.contactId,
        newContact,
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
          "error",
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
                "error",
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
      },
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
          : [...prev, contactId],
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

  // Filter functions for search
  const filterTrustedContacts = () => {
    if (!searchQuery.trim()) return trustedContacts;
    const query = searchQuery.toLowerCase();
    return trustedContacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query) ||
        contact.relationship.toLowerCase().includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query)),
    );
  };

  const filterResponders = () => {
    if (!searchQuery.trim()) return allResponders;
    const query = searchQuery.toLowerCase();
    return allResponders.filter(
      (responder) =>
        responder.fullName?.toLowerCase().includes(query) ||
        responder.badgeNumber?.toLowerCase().includes(query) ||
        responder.branch?.toLowerCase().includes(query) ||
        responder.phone?.toLowerCase().includes(query) ||
        responder.email?.toLowerCase().includes(query),
    );
  };

  const filterAllUsersAndContacts = () => {
    if (!searchQuery.trim()) return allUsersAndContacts;
    const query = searchQuery.toLowerCase();
    return allUsersAndContacts.filter(
      (userInfo) =>
        userInfo.fullName?.toLowerCase().includes(query) ||
        userInfo.phone?.toLowerCase().includes(query) ||
        userInfo.email?.toLowerCase().includes(query) ||
        userInfo.trustedContacts?.some(
          (contact) =>
            contact.name.toLowerCase().includes(query) ||
            contact.phone.toLowerCase().includes(query),
        ),
    );
  };

  return (
    <>
      <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
        <Header
          title="Emergency Contacts"
          onNotificationPress={() => setShowNotifications(true)}
          showNotificationDot={false}
        />

        {/* Standardized Control Bar */}
        <PageControlBar
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode)}
          myLabel={isResponder ? "All Users" : "My Contacts"}
          allLabel="All Responders"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search contacts..."
          showFilter={false}
          onAddPress={!isResponder ? () => setShowAddContact(true) : undefined}
          addLabel="Add Contact"
          showAdd={!isResponder}
          extraButtons={
            !isResponder && (
              <TouchableOpacity
                className="flex-row items-center px-3 py-2 rounded-lg bg-red-600 mr-2"
                onPress={() => setShowEmergencyContacts(true)}
              >
                <MaterialIcons name="emergency" size={16} color="white" />
                <Text className="text-white text-xs font-medium ml-1">
                  Emergency
                </Text>
              </TouchableOpacity>
            )
          }
        />

        <EmergencyContactsModal
          visible={showEmergencyContacts}
          onClose={() => setShowEmergencyContacts(false)}
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
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Emergency Services moved to modal accessed from control bar */}

          {/* Selection Mode Controls - only for non-responders when in my contacts view */}
          {!isResponder && viewMode === "my" && trustedContacts.length > 0 && (
            <View className="mb-4">
              <View className="flex-row justify-between items-center">
                <TouchableOpacity
                  className={`flex-1 py-2 px-4 rounded-lg flex-row items-center justify-center ${
                    selectionMode
                      ? "bg-gray-200 border border-gray-300"
                      : "bg-gray-50 border border-gray-200"
                  }`}
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
                    size={16}
                    color="#67082F"
                  />
                  <Text className="text-[#67082F] text-xs font-medium ml-1">
                    {selectionMode ? "Cancel" : "Select"}
                  </Text>
                </TouchableOpacity>

                {selectionMode && (
                  <>
                    <TouchableOpacity
                      className="flex-1 mx-2 py-2 px-4 rounded-lg bg-gray-50 border border-gray-200 flex-row items-center justify-center"
                      onPress={() => {
                        if (selected.length === trustedContacts.length) {
                          setSelected([]);
                        } else {
                          setSelected(
                            trustedContacts.map((contact) => contact.contactId),
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
                        size={16}
                        color="#67082F"
                      />
                      <Text className="text-[#67082F] text-xs font-medium ml-1">
                        {selected.length === trustedContacts.length
                          ? "Deselect All"
                          : "Select All"}
                      </Text>
                    </TouchableOpacity>

                    {selected.length > 0 && (
                      <TouchableOpacity
                        className="flex-1 py-2 px-4 rounded-lg bg-red-600 flex-row items-center justify-center"
                        onPress={handleDeleteContacts}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <MaterialIcons
                              name="delete"
                              size={16}
                              color="white"
                            />
                            <Text className="text-white text-xs font-medium ml-1">
                              Delete ({selected.length})
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          )}

          {/* Contacts Section */}
          {viewMode === "my" && (
            <>
              <Text className="text-lg font-bold text-[#67082F] mb-4">
                {isResponder ? "All Users" : "My Contacts"}
              </Text>

              {isLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#67082F" />
                  <Text className="text-gray-600 mt-2">
                    Loading contacts...
                  </Text>
                </View>
              ) : isResponder ? (
                // Responder View: Display all users and their contacts
                filterAllUsersAndContacts().length === 0 ? (
                  <View className="bg-white p-6 rounded-lg shadow-sm items-center mb-6">
                    <MaterialIcons name="contacts" size={48} color="#9CA3AF" />
                    <Text className="text-gray-600 mt-2 text-center">
                      {searchQuery
                        ? "No users match your search."
                        : "No user contact information available."}
                    </Text>
                  </View>
                ) : (
                  filterAllUsersAndContacts()
                    .filter((u) => u.role !== "RESPONDER")
                    .map((userInfo, index) => {
                      return (
                        <View
                          key={index}
                          className="bg-white rounded-lg mb-4 shadow-sm"
                        >
                          {/* User Header */}
                          <View className="bg-[#67082F]/5 p-4 rounded-t-lg border-l-4 border-[#67082F]">
                            <View className="flex-row items-center">
                              <View className="w-12 h-12 bg-[#67082F]/10 rounded-full items-center justify-center mr-3">
                                <MaterialIcons
                                  name="person"
                                  size={24}
                                  color="#67082F"
                                />
                              </View>
                              <View className="flex-1">
                                <Text className="font-bold text-gray-800 text-lg">
                                  {userInfo.fullName || "Unknown User"}
                                </Text>
                                <Text className="text-[#67082F] font-medium">
                                  👤 User
                                </Text>
                                <Text className="text-gray-600 text-sm">
                                  📧 {userInfo.email || "No email"}
                                </Text>
                                <Text className="text-gray-600 text-sm">
                                  📞 {userInfo.phone || "No phone"}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() =>
                                  userInfo.phone && handleCall(userInfo.phone)
                                }
                                className="p-2"
                                disabled={!userInfo.phone}
                              >
                                <MaterialIcons
                                  name="phone"
                                  size={24}
                                  color={userInfo.phone ? "#67082F" : "#9CA3AF"}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Emergency Contacts */}
                          {userInfo.trustedContacts &&
                          userInfo.trustedContacts.length > 0 ? (
                            <View className="p-4">
                              <Text className="font-semibold text-gray-700 mb-3">
                                Emergency Contacts (
                                {userInfo.trustedContacts.length})
                              </Text>
                              {userInfo.trustedContacts.map(
                                (contact, contactIndex) => (
                                  <View
                                    key={contactIndex}
                                    className="flex-row items-center bg-gray-50 p-3 rounded-lg mb-2"
                                  >
                                    <View className="w-8 h-8 bg-[#67082F]/10 rounded-full items-center justify-center mr-3">
                                      <MaterialIcons
                                        name="contact-phone"
                                        size={16}
                                        color="#67082F"
                                      />
                                    </View>
                                    <View className="flex-1">
                                      <Text className="font-medium text-gray-800">
                                        {contact.name}
                                      </Text>
                                      <Text className="text-gray-600 text-sm">
                                        {contact.phone}
                                      </Text>
                                      <Text className="text-xs text-[#67082F]">
                                        {contact.relationship}
                                      </Text>
                                      {contact.email && (
                                        <Text className="text-xs text-gray-500">
                                          {contact.email}
                                        </Text>
                                      )}
                                    </View>
                                    <TouchableOpacity
                                      onPress={() => handleCall(contact.phone)}
                                      className="p-2"
                                    >
                                      <MaterialIcons
                                        name="phone"
                                        size={18}
                                        color="#67082F"
                                      />
                                    </TouchableOpacity>
                                  </View>
                                ),
                              )}
                            </View>
                          ) : (
                            <View className="p-4">
                              <Text className="text-gray-500 text-center italic">
                                No emergency contacts configured
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })
                )
              ) : // User View: Display their own trusted contacts
              filterTrustedContacts().length === 0 ? (
                <View className="bg-white p-6 rounded-lg shadow-sm items-center mb-6">
                  <Text className="text-gray-600 mt-2 text-center">
                    {searchQuery
                      ? "No contacts match your search."
                      : "No trusted contacts yet. Add your first contact!"}
                  </Text>
                </View>
              ) : (
                filterTrustedContacts().map((contact) => (
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
                        <Text className="text-xs text-gray-500">
                          {contact.email}
                        </Text>
                      )}
                    </View>

                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => handleCall(contact.phone)}
                        className="p-2 mr-2"
                      >
                        <MaterialIcons name="phone" size={20} color="#67082F" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => startEditContact(contact)}
                        className="p-2 mr-2"
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
            </>
          )}

          {/* All Responders Section - Shows when viewMode is "all" */}
          {viewMode === "all" && (
            <>
              <Text className="text-lg font-bold text-[#67082F] mb-4">
                All Responders
              </Text>

              {isLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#67082F" />
                </View>
              ) : filterResponders().length === 0 ? (
                <View className="bg-white p-6 rounded-lg shadow-sm items-center">
                  <MaterialIcons name="security" size={48} color="#9CA3AF" />
                  <Text className="text-gray-600 mt-2 text-center">
                    {searchQuery
                      ? "No responders match your search."
                      : "No responders available."}
                  </Text>
                </View>
              ) : (
                filterResponders().map((responder, index) => (
                  <View
                    key={responder.id || index}
                    className="bg-white rounded-lg mb-3 shadow-sm"
                  >
                    <View className="p-4">
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                          <MaterialIcons
                            name="security"
                            size={24}
                            color="#2563EB"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-gray-800 text-lg">
                            {responder.fullName || "Unknown Responder"}
                          </Text>
                          <Text className="text-blue-600 font-medium text-sm">
                            🏷️ Badge: {responder.badgeNumber || "N/A"}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            🏢 {responder.branch || "No branch"}
                          </Text>
                          {responder.phone && (
                            <Text className="text-gray-600 text-sm">
                              📞 {responder.phone}
                            </Text>
                          )}
                          {responder.email && (
                            <Text className="text-gray-500 text-xs">
                              📧 {responder.email}
                            </Text>
                          )}
                        </View>
                        {responder.phone && (
                          <TouchableOpacity
                            onPress={() => handleCall(responder.phone!)}
                            className="p-2"
                          >
                            <MaterialIcons
                              name="phone"
                              size={24}
                              color="#2563EB"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
