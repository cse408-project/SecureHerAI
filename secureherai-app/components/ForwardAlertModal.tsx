import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import apiService from "../services/api";
import { ResponderSearchResult } from "../types/alertResponder";

interface ForwardAlertModalProps {
  visible: boolean;
  onClose: () => void;
  onForward: (responderIds: string[]) => Promise<void>;
  isLoading: boolean;
}

export default function ForwardAlertModal({
  visible,
  onClose,
  onForward,
  isLoading,
}: ForwardAlertModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [responders, setResponders] = useState<ResponderSearchResult[]>([]);
  const [selectedResponders, setSelectedResponders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Load all responders when modal opens
  useEffect(() => {
    if (visible) {
      loadResponders("");
      setSelectedResponders([]);
      setSearchQuery("");
    }
  }, [visible]);

  const loadResponders = async (query: string) => {
    try {
      setLoading(true);
      const response = await apiService.searchResponders(query);
      if (response.success && response.data) {
        setResponders(response.data);
      } else {
        setResponders([]);
      }
    } catch (error) {
      console.error("Failed to load responders:", error);
      setResponders([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      loadResponders(text);
    }, 300);

    setSearchTimeout(timeout);
  };

  const toggleResponderSelection = (responderId: string) => {
    setSelectedResponders((prev) =>
      prev.includes(responderId)
        ? prev.filter((id) => id !== responderId)
        : [...prev, responderId],
    );
  };

  const handleForward = async () => {
    if (selectedResponders.length === 0) return;
    await onForward(selectedResponders);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "AVAILABLE":
        return "bg-green-100 text-green-700";
      case "BUSY":
        return "bg-amber-100 text-amber-700";
      case "OFF_DUTY":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const renderResponderItem = ({ item }: { item: ResponderSearchResult }) => {
    const isSelected = selectedResponders.includes(item.id);

    return (
      <TouchableOpacity
        className={`flex-row items-center p-3 mx-2 my-1 rounded-lg border ${
          isSelected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
        }`}
        onPress={() => toggleResponderSelection(item.id)}
        activeOpacity={0.7}
      >
        {/* Selection checkbox */}
        <View
          className={`w-6 h-6 rounded-full mr-3 items-center justify-center ${
            isSelected ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          {isSelected && <MaterialIcons name="check" size={16} color="white" />}
        </View>

        {/* Responder info */}
        <View className="flex-1">
          <Text className="font-semibold text-gray-800">{item.fullName}</Text>
          <View className="flex-row items-center mt-1">
            <MaterialIcons name="badge" size={14} color="#6B7280" />
            <Text className="text-gray-600 text-sm ml-1">
              {item.badgeNumber}
            </Text>
            {item.branch && (
              <>
                <Text className="text-gray-400 mx-2">•</Text>
                <MaterialIcons name="location-city" size={14} color="#6B7280" />
                <Text className="text-gray-600 text-sm ml-1">
                  {item.branch}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Status badge */}
        <View
          className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}
        >
          <Text className="text-xs font-medium">{item.status}</Text>
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
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-800">
              Forward Alert
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search Bar */}
          <View className="px-4 py-3 border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
              <MaterialIcons name="search" size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search by name, badge, or branch..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearchChange("")}>
                  <MaterialIcons name="clear" size={20} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Selected count */}
          {selectedResponders.length > 0 && (
            <View className="px-4 py-2 bg-blue-50">
              <Text className="text-blue-700 font-medium">
                {selectedResponders.length} responder
                {selectedResponders.length > 1 ? "s" : ""} selected
              </Text>
            </View>
          )}

          {/* Responders List */}
          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-gray-500 mt-2">Loading responders...</Text>
            </View>
          ) : responders.length === 0 ? (
            <View className="py-8 items-center">
              <MaterialIcons name="person-search" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">
                {searchQuery
                  ? "No responders found"
                  : "No other responders available"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={responders}
              keyExtractor={(item) => item.id}
              renderItem={renderResponderItem}
              contentContainerStyle={{ paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 350 }}
            />
          )}

          {/* Footer with action buttons */}
          <View className="flex-row px-4 py-4 border-t border-gray-200 gap-3">
            <TouchableOpacity
              className="flex-1 bg-gray-200 rounded-lg py-3"
              onPress={onClose}
            >
              <Text className="text-gray-700 font-semibold text-center">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 rounded-lg py-3 ${
                selectedResponders.length > 0 && !isLoading
                  ? "bg-blue-600"
                  : "bg-blue-300"
              }`}
              onPress={handleForward}
              disabled={selectedResponders.length === 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-center">
                  Forward ({selectedResponders.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
