import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import Header from "../../src/components/Header";

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

  const handleAddContact = () => {
    if (newContact.name && newContact.phone && newContact.relation) {
      setContacts([...contacts, newContact]);
      setNewContact({ name: "", phone: "", icon: "person", relation: "" });
      setShowAddContact(false);
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

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDelete = () => {
    setContacts(contacts.filter((_, idx) => !selected.includes(idx)));
    setSelected([]);
    setSelectionMode(false);
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <Header
        title="Emergency Contacts"
        onNotificationPress={() => {}}
        showNotificationDot={false}
      />
      <TouchableOpacity
        className="absolute top-20 right-4 z-10 w-10 h-10 bg-[#67082F] rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowAddContact(true)}
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
      {showAddContact && (
        <View
          style={{
            backgroundColor: "white",
            margin: 16,
            padding: 16,
            borderRadius: 12,
            elevation: 4,
          }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
            Add Trusted Contact
          </Text>
          <View
            style={{
              flexDirection: "row",
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <MaterialIcons
              name="person"
              size={24}
              color="#67082F"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#67082F",
                borderRadius: 6,
                padding: 6,
              }}
              placeholder="Name"
              value={newContact.name}
              onChangeText={(text) =>
                setNewContact({ ...newContact, name: text })
              }
              placeholderTextColor="#aaa"
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <MaterialIcons
              name="phone"
              size={24}
              color="#67082F"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#67082F",
                borderRadius: 6,
                padding: 6,
              }}
              placeholder="Phone"
              value={newContact.phone}
              onChangeText={(text) =>
                setNewContact({ ...newContact, phone: text })
              }
              keyboardType="phone-pad"
              placeholderTextColor="#aaa"
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <MaterialIcons
              name="group"
              size={24}
              color="#67082F"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#67082F",
                borderRadius: 6,
                padding: 6,
              }}
              placeholder="Relation (e.g. Friend, Mother)"
              value={newContact.relation}
              onChangeText={(text) =>
                setNewContact({ ...newContact, relation: text })
              }
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
            <TouchableOpacity
              onPress={() => setShowAddContact(false)}
              style={{ marginRight: 12 }}
            >
              <Text style={{ color: "#67082F", fontWeight: "bold" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddContact}>
              <Text style={{ color: "#67082F", fontWeight: "bold" }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {selected.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: 24,
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              backgroundColor: "#dc2626",
              borderRadius: 8,
              paddingVertical: 6,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Delete ({selected.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        className="flex-1 p-4"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text className="text-lg font-bold text-[#67082F] mb-4">
          Emergency Services
        </Text>
        {emergencyContacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center bg-white p-4 rounded-lg mb-3 shadow-sm"
            activeOpacity={1}
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
        <Text className="text-lg font-bold text-[#67082F] mb-4 mt-6">
          Trusted Contacts
        </Text>
        {contacts.map((contact, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center bg-white p-4 rounded-lg mb-3 shadow-sm"
            style={
              selected.includes(index)
                ? { borderColor: "#dc2626", borderWidth: 2 }
                : undefined
            }
            onPress={() => handleSelect(index)}
            onLongPress={() => handleLongPress(index)}
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 bg-[#67082F]/10 rounded-full items-center justify-center mr-4">
              <MaterialIcons name={contact.icon} size={24} color="#67082F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="font-semibold text-gray-800">
                {contact.name}
              </Text>
              <Text className="text-gray-600">{contact.phone}</Text>
              <Text className="text-xs text-[#67082F]">{contact.relation}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCall(contact.phone)}
              style={{ marginLeft: 8 }}
            >
              <MaterialIcons name="phone" size={24} color="#67082F" />
            </TouchableOpacity>
            <View>
              {selected.includes(index) ? (
                <MaterialIcons name="check-circle" size={24} color="#dc2626" />
              ) : selectionMode ? (
                <MaterialIcons
                  name="radio-button-unchecked"
                  size={24}
                  color="#67082F"
                />
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
