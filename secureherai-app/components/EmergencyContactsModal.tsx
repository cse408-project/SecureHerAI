import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// Static emergency contacts
const emergencyContacts = [
  {
    name: "Police",
    phone: "911",
    icon: "local-police" as const,
    desc: "Immediate Emergency",
  },
  {
    name: "Ambulance",
    phone: "111",
    icon: "medical-services" as const,
    desc: "Medical Emergency",
  },
  {
    name: "Fire Department",
    phone: "999",
    icon: "local-fire-department" as const,
    desc: "Fire & Rescue",
  },
  {
    name: "Women's Helpline",
    phone: "109",
    icon: "contact-support" as const,
    desc: "24/7 Support Line",
  },
];

interface EmergencyContactsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmergencyContactsModal({
  visible,
  onClose,
}: EmergencyContactsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState(emergencyContacts);

  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setFilteredContacts(emergencyContacts);
    }
  }, [visible]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredContacts(emergencyContacts);
    } else {
      const query = text.toLowerCase();
      setFilteredContacts(
        emergencyContacts.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(query) ||
            c.desc.toLowerCase().includes(query),
        ),
      );
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const renderContactItem = ({
    item,
  }: {
    item: (typeof emergencyContacts)[0];
  }) => {
    return (
      <TouchableOpacity
        className="flex-row items-center p-3 mx-2 my-1.5 rounded-lg border border-red-100 bg-red-50/50"
        onPress={() => handleCall(item.phone)}
        activeOpacity={0.7}
      >
        <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3 border border-red-200">
          <MaterialIcons name={item.icon} size={22} color="#DC2626" />
        </View>

        <View className="flex-1">
          <Text className="font-bold text-gray-800 text-lg">{item.name}</Text>
          <Text className="text-gray-500 text-sm">{item.desc}</Text>
        </View>

        <View className="flex-row items-center bg-red-600 px-3 py-1.5 rounded-full shadow-sm">
          <MaterialIcons name="phone" size={16} color="white" />
          <Text className="text-white font-bold ml-1.5 text-sm">
            {item.phone}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl w-full max-w-sm max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 bg-red-50 rounded-t-2xl">
            <TouchableOpacity onPress={onClose} className="p-1">
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <View className="flex-row items-center">
              <MaterialIcons name="campaign" size={24} color="#DC2626" />
              <Text className="text-lg font-bold text-red-700 ml-2">
                Emergency Contacts
              </Text>
            </View>
            <View style={{ width: 32 }} />
          </View>

          {/* Search Bar */}
          <View className="px-4 py-3 border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
              <MaterialIcons name="search" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search emergency services..."
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearchChange("")}>
                  <MaterialIcons name="clear" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Contacts List */}
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.name}
            renderItem={renderContactItem}
            contentContainerStyle={{ paddingVertical: 8 }}
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 400 }}
            ListEmptyComponent={
              <View className="py-8 items-center">
                <Text className="text-gray-500">No contacts found</Text>
              </View>
            }
          />

          {/* Footer - Quick Call 911 */}
          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity
              className="w-full bg-red-600 rounded-xl py-3.5 flex-row items-center justify-center shadow-lg shadow-red-200"
              onPress={() => handleCall("911")}
            >
              <View className="bg-white/20 p-1 rounded-full mr-2">
                <MaterialIcons name="priority-high" size={18} color="white" />
              </View>
              <Text className="text-white font-bold text-lg">Call 911 Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
