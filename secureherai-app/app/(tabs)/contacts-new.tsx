import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import ApiService from "../../services/api";

// Use the correct type for MaterialIcons icon names
const emergencyContacts: {
  name: string;
  phone: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
}[] = [
  { name: "Police", phone: "911", icon: "local-police" },
  { name: "Ambulance", phone: "911", icon: "medical-services" },
  { name: "Fire Department", phone: "911", icon: "local-fire-department" },
];

const trustedContacts: {
  name: string;
  phone: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  relation: string;
}[] = [
  { name: "Mom", phone: "+1234567890", icon: "person", relation: "Mother" },
  { name: "Dad", phone: "+1234567890", icon: "person", relation: "Father" },
  { name: "Sister", phone: "+1234567890", icon: "person", relation: "Sister" },
];

interface Responder {
  userId: string;
  fullName: string;
  responderInfo: {
    responderType: string;
    badgeNumber: string;
    status: string;
    active: boolean;
  };
  phoneNumber?: string;
}

export default function ContactsScreen() {
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    icon: "person" as React.ComponentProps<typeof MaterialIcons>["name"],
    relation: "",
  });
  const [contacts, setContacts] = useState(trustedContacts);
  const [selected, setSelected] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loadingResponders, setLoadingResponders] = useState(true);

  useEffect(() => {
    loadAvailableResponders();
  }, []);

  const loadAvailableResponders = async () => {
    try {
      setLoadingResponders(true);
      const response = await ApiService.getAvailableResponders();
      if (response.success && response.data) {
        setResponders(response.data);
      }
    } catch (error) {
      console.error("Failed to load responders:", error);
      // Don't show error alert, just keep the list empty
    } finally {
      setLoadingResponders(false);
    }
  };

  const getResponderIcon = (
    type: string
  ): React.ComponentProps<typeof MaterialIcons>["name"] => {
    switch (type?.toUpperCase()) {
      case "POLICE":
        return "local-police";
      case "MEDICAL":
        return "medical-services";
      case "FIRE":
        return "local-fire-department";
      default:
        return "security";
    }
  };

  const handleAddContact = () => {
    if (newContact.name && newContact.phone && newContact.relation) {
      setContacts([...contacts, newContact]);
      setNewContact({ name: "", phone: "", icon: "person", relation: "" });
      setShowAddContact(false);
    } else {
      Alert.alert("Error", "Please fill in all fields");
    }
  };

  const handleLongPress = (index: number) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelected([index]);
    }
  };

  const handleSelect = (index: number) => {
    if (selectionMode) {
      setSelected((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    }
  };

  const deleteSelected = () => {
    setContacts(contacts.filter((_, idx) => !selected.includes(idx)));
    setSelected([]);
    setSelectionMode(false);
  };

  const callContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View className="flex-1 bg-[#FFE4D6]">
      {/* Header */}
      <View className="bg-[#67082F] px-4 py-6 flex-row justify-between items-center pt-12">
        <Text className="text-white text-xl font-bold">Emergency Contacts</Text>
        {selectionMode ? (
          <TouchableOpacity
            onPress={() => {
              setSelectionMode(false);
              setSelected([]);
            }}
          >
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowAddContact(true)}>
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Emergency Contacts */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold mb-3 text-[#67082F]">
            Emergency Services
          </Text>
          {emergencyContacts.map((contact, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              onPress={() => callContact(contact.phone)}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
                  <MaterialIcons
                    name={contact.icon}
                    size={20}
                    color="#ef4444"
                  />
                </View>
                <Text className="text-gray-800 font-medium">
                  {contact.name}
                </Text>
              </View>
              <TouchableOpacity
                className="bg-red-500 px-4 py-2 rounded-lg"
                onPress={() => callContact(contact.phone)}
              >
                <Text className="text-white font-medium">Call</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* Available Responders */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold mb-3 text-[#67082F]">
            Available Responders
          </Text>
          {loadingResponders ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#67082F" />
              <Text className="text-gray-500 mt-2">Loading responders...</Text>
            </View>
          ) : responders.length > 0 ? (
            responders.map((responder, index) => (
              <TouchableOpacity
                key={responder.userId}
                className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                onPress={() =>
                  responder.phoneNumber && callContact(responder.phoneNumber)
                }
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-[#67082F]/10 rounded-full items-center justify-center mr-3">
                    <MaterialIcons
                      name={getResponderIcon(
                        responder.responderInfo.responderType
                      )}
                      size={20}
                      color="#67082F"
                    />
                  </View>
                  <View>
                    <Text className="text-gray-800 font-medium">
                      {responder.fullName}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {responder.responderInfo.responderType} -{" "}
                      {responder.responderInfo.badgeNumber}
                    </Text>
                    <Text className="text-green-600 text-xs">
                      Status: {responder.responderInfo.status}
                    </Text>
                  </View>
                </View>
                {responder.phoneNumber && (
                  <TouchableOpacity
                    className="bg-[#67082F] px-4 py-2 rounded-lg"
                    onPress={() => callContact(responder.phoneNumber!)}
                  >
                    <Text className="text-white font-medium">Call</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <Text className="text-gray-500 text-center py-4">
              No responders available
            </Text>
          )}
        </View>

        {/* Trusted Contacts */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-[#67082F]">
              Trusted Contacts
            </Text>
            {selectionMode && selected.length > 0 && (
              <TouchableOpacity onPress={deleteSelected}>
                <MaterialIcons name="delete" size={24} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
          {contacts.map((contact, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0 ${
                selected.includes(index) ? "bg-blue-50" : ""
              }`}
              onPress={() =>
                selectionMode ? handleSelect(index) : callContact(contact.phone)
              }
              onLongPress={() => handleLongPress(index)}
            >
              <View className="flex-row items-center">
                {selectionMode && (
                  <View className="mr-3">
                    <MaterialIcons
                      name={
                        selected.includes(index)
                          ? "check-circle"
                          : "radio-button-unchecked"
                      }
                      size={20}
                      color={selected.includes(index) ? "#3b82f6" : "#6b7280"}
                    />
                  </View>
                )}
                <View className="w-10 h-10 bg-[#67082F]/10 rounded-full items-center justify-center mr-3">
                  <MaterialIcons
                    name={contact.icon}
                    size={20}
                    color="#67082F"
                  />
                </View>
                <View>
                  <Text className="text-gray-800 font-medium">
                    {contact.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {contact.relation}
                  </Text>
                </View>
              </View>
              {!selectionMode && (
                <TouchableOpacity
                  className="bg-[#67082F] px-4 py-2 rounded-lg"
                  onPress={() => callContact(contact.phone)}
                >
                  <Text className="text-white font-medium">Call</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Add Contact Modal */}
      {showAddContact && (
        <View className="absolute inset-0 bg-black/50 flex-1 justify-center items-center">
          <View className="bg-white rounded-lg p-6 m-4 w-4/5">
            <Text className="text-lg font-bold mb-4">Add Trusted Contact</Text>

            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              placeholder="Name"
              value={newContact.name}
              onChangeText={(text) =>
                setNewContact({ ...newContact, name: text })
              }
            />

            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              placeholder="Phone Number"
              value={newContact.phone}
              onChangeText={(text) =>
                setNewContact({ ...newContact, phone: text })
              }
              keyboardType="phone-pad"
            />

            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="Relation (e.g., Mother, Father, Friend)"
              value={newContact.relation}
              onChangeText={(text) =>
                setNewContact({ ...newContact, relation: text })
              }
            />

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                onPress={() => setShowAddContact(false)}
              >
                <Text className="text-gray-600">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#67082F] px-4 py-2 rounded-lg"
                onPress={handleAddContact}
              >
                <Text className="text-white">Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
