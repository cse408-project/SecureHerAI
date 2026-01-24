import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface PageControlBarProps {
  // Layer 1: View Mode Toggle
  viewMode: "my" | "all";
  onViewModeChange: (mode: "my" | "all") => void;
  myLabel?: string;
  allLabel?: string;

  // Layer 2: Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Layer 3: Filter and Add buttons
  onFilterPress?: () => void;
  onAddPress?: () => void;
  filterLabel?: string;
  addLabel?: string;
  showFilter?: boolean;
  showAdd?: boolean;
  hasActiveFilter?: boolean;

  // Custom buttons for Layer 3
  extraButtons?: React.ReactNode;
}

export default function PageControlBar({
  viewMode,
  onViewModeChange,
  myLabel = "My Items",
  allLabel = "All Items",
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  onFilterPress,
  onAddPress,
  filterLabel = "Filter",
  addLabel = "Add",
  showFilter = true,
  showAdd = true,
  hasActiveFilter = false,
  extraButtons,
}: PageControlBarProps) {
  return (
    <View className="px-4 pt-2 pb-3 bg-white rounded-lg shadow-sm mx-4 mb-3 mt-4 web:mt-8">
      {/* Layer 1: View Mode Toggle */}
      <View className="flex-row mb-3">
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-l-lg border ${
            viewMode === "my"
              ? "bg-[#67082F] border-[#67082F]"
              : "bg-white border-gray-300"
          }`}
          onPress={() => onViewModeChange("my")}
        >
          <Text
            className={`text-center font-medium text-sm ${
              viewMode === "my" ? "text-white" : "text-gray-700"
            }`}
          >
            {myLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2.5 rounded-r-lg border-l-0 border ${
            viewMode === "all"
              ? "bg-[#67082F] border-[#67082F]"
              : "bg-white border-gray-300"
          }`}
          onPress={() => onViewModeChange("all")}
        >
          <Text
            className={`text-center font-medium text-sm ${
              viewMode === "all" ? "text-white" : "text-gray-700"
            }`}
          >
            {allLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Layer 2: Search Bar */}
      <View className="flex-row items-center bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 mb-3">
        <MaterialIcons name="search" size={18} color="#6B7280" />
        <TextInput
          className="flex-1 ml-2 text-gray-800 text-sm"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")}>
            <MaterialIcons name="clear" size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Layer 3: Filter, Add, and Extra Buttons */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row gap-2">
          {showFilter && onFilterPress && (
            <TouchableOpacity
              className={`flex-row items-center px-3 py-2 rounded-lg border ${
                hasActiveFilter
                  ? "bg-[#67082F]/10 border-[#67082F]"
                  : "bg-gray-50 border-gray-200"
              }`}
              onPress={onFilterPress}
            >
              <MaterialIcons
                name="filter-list"
                size={16}
                color={hasActiveFilter ? "#67082F" : "#6B7280"}
              />
              <Text
                className={`text-xs font-medium ml-1 ${
                  hasActiveFilter ? "text-[#67082F]" : "text-gray-600"
                }`}
              >
                {filterLabel}
              </Text>
              {hasActiveFilter && (
                <View className="ml-1 w-2 h-2 rounded-full bg-[#67082F]" />
              )}
            </TouchableOpacity>
          )}

          {extraButtons}
        </View>

        {showAdd && onAddPress && (
          <TouchableOpacity
            className="flex-row items-center px-3 py-2 rounded-lg bg-[#67082F]"
            onPress={onAddPress}
          >
            <MaterialIcons name="add" size={16} color="white" />
            <Text className="text-xs font-medium ml-1 text-white">
              {addLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
