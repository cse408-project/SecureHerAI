import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import type { CreateContactRequest } from "../types/contacts";

interface ContactFormProps {
  isEdit?: boolean;
  contact: CreateContactRequest;
  onContactChange: (contact: CreateContactRequest) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function ContactForm({
  isEdit = false,
  contact,
  onContactChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: ContactFormProps) {
  const updateContact = (field: keyof CreateContactRequest, value: any) => {
    onContactChange({ ...contact, [field]: value });
  };

  return (
    <View className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full">
      <Text className="text-xl font-bold text-[#67082F] mb-6 text-center">
        {isEdit ? "Edit Contact" : "Add New Contact"}
      </Text>

      {/* Name Field */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Full Name <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 focus-within:border-[#67082F] focus-within:bg-white">
          <MaterialIcons
            name="person"
            size={22}
            color="#67082F"
            style={{ marginRight: 12 }}
          />
          <TextInput
            className="flex-1 text-gray-900 text-base"
            placeholder="Enter full name"
            placeholderTextColor="#9CA3AF"
            value={contact.name}
            onChangeText={(text) => updateContact("name", text)}
            autoCapitalize="words"
            blurOnSubmit={false}
          />
        </View>
      </View>

      {/* Phone Field */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Phone Number <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 focus-within:border-[#67082F] focus-within:bg-white">
          <MaterialIcons
            name="phone"
            size={22}
            color="#67082F"
            style={{ marginRight: 12 }}
          />
          <TextInput
            className="flex-1 text-gray-900 text-base"
            placeholder="+880 1712 345678"
            placeholderTextColor="#9CA3AF"
            value={contact.phone}
            onChangeText={(text) => updateContact("phone", text)}
            keyboardType="phone-pad"
            blurOnSubmit={false}
          />
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          Include country code (e.g., +880 for Bangladesh)
        </Text>
      </View>

      {/* Email Field */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Email Address
        </Text>
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 focus-within:border-[#67082F] focus-within:bg-white">
          <MaterialIcons
            name="email"
            size={22}
            color="#67082F"
            style={{ marginRight: 12 }}
          />
          <TextInput
            className="flex-1 text-gray-900 text-base"
            placeholder="example@email.com"
            placeholderTextColor="#9CA3AF"
            value={contact.email}
            onChangeText={(text) => updateContact("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            blurOnSubmit={false}
          />
        </View>
      </View>

      {/* Relationship Field */}
      <View className="mb-5">
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          Relationship <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 focus-within:border-[#67082F] focus-within:bg-white">
          <MaterialIcons
            name="group"
            size={22}
            color="#67082F"
            style={{ marginRight: 12 }}
          />
          <TextInput
            className="flex-1 text-gray-900 text-base"
            placeholder="Family, Friend, Colleague, etc."
            placeholderTextColor="#9CA3AF"
            value={contact.relationship}
            onChangeText={(text) => updateContact("relationship", text)}
            autoCapitalize="words"
            blurOnSubmit={false}
          />
        </View>

        {/* Quick relationship buttons */}
        <View className="flex-row flex-wrap mt-3 gap-2">
          {["Family", "Friend", "Colleague", "Neighbor"].map((rel) => (
            <TouchableOpacity
              key={rel}
              className={`px-3 py-2 rounded-lg border ${
                contact.relationship === rel
                  ? "bg-[#67082F] border-[#67082F]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => updateContact("relationship", rel)}
            >
              <Text
                className={`text-sm ${
                  contact.relationship === rel ? "text-white" : "text-gray-700"
                }`}
              >
                {rel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Share Location Toggle */}
      <View className="bg-gray-50 rounded-xl p-4 mb-6">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-1">
              <MaterialIcons
                name="location-on"
                size={20}
                color="#67082F"
                style={{ marginRight: 8 }}
              />
              <Text className="text-sm font-semibold text-gray-700">
                Share Location
              </Text>
            </View>
            <Text className="text-xs text-gray-600 leading-4">
              Allow this contact to see your location during emergencies
            </Text>
          </View>
          <Switch
            value={contact.shareLocation}
            onValueChange={(value) => updateContact("shareLocation", value)}
            trackColor={{ false: "#E5E7EB", true: "#67082F" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 bg-gray-100 rounded-xl py-4 px-4 border border-gray-200"
          onPress={onCancel}
        >
          <Text className="text-center text-gray-700 font-semibold text-base">
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 rounded-xl py-4 px-4 ${
            isSubmitting ? "bg-[#67082F]/60" : "bg-[#67082F]"
          }`}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-semibold ml-2 text-base">
                {isEdit ? "Updating..." : "Adding..."}
              </Text>
            </View>
          ) : (
            <Text className="text-center text-white font-semibold text-base">
              {isEdit ? "Update Contact" : "Add Contact"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
