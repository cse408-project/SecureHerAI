import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";
import { SubmitReportRequest } from "../types/report";

interface LocationData {
  latitude: string;
  longitude: string;
}

export default function SubmitReportScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form state
  const [incidentType, setIncidentType] = useState<'harassment' | 'theft' | 'assault' | 'other'>('harassment');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'officials_only' | 'private'>('public');
  const [anonymous, setAnonymous] = useState(false);
  const [involvedParties, setInvolvedParties] = useState('');

  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Set default date and time to current
    const now = new Date();
    setIncidentDate(now.toISOString().split('T')[0]);
    setIncidentTime(now.toTimeString().slice(0, 5));
  }, []);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      // Set fixed location
      setCurrentLocation({
        latitude: '23.8103',
        longitude: '90.4125',
      });
      setAddress('Dhaka, Bangladesh');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!description.trim() || description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    if (!incidentDate) {
      newErrors.incidentDate = 'Incident date is required';
    }

    if (!incidentTime) {
      newErrors.incidentTime = 'Incident time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into ISO string
      const incidentDateTime = new Date(`${incidentDate}T${incidentTime}`).toISOString();

      const reportData: SubmitReportRequest = {
        incidentType,
        description: description.trim(),
        ...(currentLocation && { location: currentLocation }),
        address: address.trim() || undefined,
        incidentTime: incidentDateTime,
        visibility,
        anonymous,
        involvedParties: involvedParties.trim() || undefined,
      };

      const response = await apiService.submitReport(reportData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Incident report submitted successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const incidentTypes = [
    { value: 'harassment', label: 'Harassment', icon: 'warning' },
    { value: 'theft', label: 'Theft', icon: 'remove-circle' },
    { value: 'assault', label: 'Assault', icon: 'dangerous' },
    { value: 'other', label: 'Other', icon: 'help' },
  ] as const;

  const visibilityOptions = [
    { value: 'public', label: 'Public', description: 'Visible to all users and officials' },
    { value: 'officials_only', label: 'Officials Only', description: 'Visible to authorities only' },
    { value: 'private', label: 'Private', description: 'Visible only to you' },
  ] as const;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#67082F" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#67082F]">Submit Report</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Incident Type */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Incident Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  incidentType === type.value
                    ? 'bg-[#67082F] border-[#67082F]'
                    : 'bg-gray-100 border-gray-300'
                }`}
                onPress={() => setIncidentType(type.value)}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={16}
                  color={incidentType === type.value ? 'white' : '#6B7280'}
                />
                <Text
                  className={`ml-2 text-sm font-medium ${
                    incidentType === type.value ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Description</Text>
          <TextInput
            className={`border border-gray-300 rounded-lg p-3 text-gray-800 min-h-24 ${
              errors.description ? 'border-red-500' : ''
            }`}
            placeholder="Describe what happened... (minimum 10 characters)"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
          {errors.description && (
            <Text className="text-red-500 text-sm mt-1">{errors.description}</Text>
          )}
          <Text className="text-gray-500 text-xs mt-2">
            {description.length}/2000 characters
          </Text>
        </View>

        {/* Location */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Location (Optional)</Text>
          
          <TouchableOpacity
            className="flex-row items-center justify-between p-3 bg-gray-100 rounded-lg mb-3"
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            <View className="flex-row items-center flex-1">
              <MaterialIcons 
                name="my-location" 
                size={20} 
                color={gettingLocation ? '#9CA3AF' : '#67082F'} 
              />
              <Text className={`ml-2 text-sm ${gettingLocation ? 'text-gray-500' : 'text-gray-800'}`}>
                {gettingLocation ? 'Getting location...' : 'Use current location'}
              </Text>
            </View>
            {currentLocation && (
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
            )}
          </TouchableOpacity>

          {currentLocation && (
            <View className="p-3 bg-green-50 rounded-lg">
              <Text className="text-sm text-green-700">
                📍 {currentLocation.latitude}, {currentLocation.longitude}
              </Text>
            </View>
          )}

          {errors.location && (
            <Text className="text-red-500 text-sm mt-1">{errors.location}</Text>
          )}
          
          {!currentLocation && (
            <Text className="text-gray-500 text-xs mt-2">
              💡 Location helps authorities respond faster, but you can submit without it if needed.
            </Text>
          )}
        </View>

        {/* Address */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Address (Optional)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800"
            placeholder="Enter specific address or landmark"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Incident Time */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">When did this happen?</Text>
          
          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-2">Date</Text>
              <TextInput
                className={`border border-gray-300 rounded-lg p-3 text-gray-800 ${
                  errors.incidentDate ? 'border-red-500' : ''
                }`}
                placeholder="YYYY-MM-DD"
                value={incidentDate}
                onChangeText={setIncidentDate}
                placeholderTextColor="#9CA3AF"
              />
              {errors.incidentDate && (
                <Text className="text-red-500 text-xs mt-1">{errors.incidentDate}</Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-2">Time</Text>
              <TextInput
                className={`border border-gray-300 rounded-lg p-3 text-gray-800 ${
                  errors.incidentTime ? 'border-red-500' : ''
                }`}
                placeholder="HH:MM"
                value={incidentTime}
                onChangeText={setIncidentTime}
                placeholderTextColor="#9CA3AF"
              />
              {errors.incidentTime && (
                <Text className="text-red-500 text-xs mt-1">{errors.incidentTime}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Visibility */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Who can see this report?</Text>
          {visibilityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`flex-row items-center p-3 rounded-lg mb-2 border ${
                visibility === option.value
                  ? 'bg-[#67082F]/10 border-[#67082F]'
                  : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => setVisibility(option.value)}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 ${
                  visibility === option.value
                    ? 'border-[#67082F] bg-[#67082F]'
                    : 'border-gray-400'
                }`}
              >
                {visibility === option.value && (
                  <View className="flex-1 items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-white" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-medium ${
                    visibility === option.value ? 'text-[#67082F]' : 'text-gray-800'
                  }`}
                >
                  {option.label}
                </Text>
                <Text className="text-xs text-gray-500">{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Anonymous Option */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <TouchableOpacity
            className="flex-row items-center justify-between"
            onPress={() => setAnonymous(!anonymous)}
          >
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">Submit Anonymously</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Your identity will be hidden in the report
              </Text>
            </View>
            <View
              className={`w-12 h-6 rounded-full ${
                anonymous ? 'bg-[#67082F]' : 'bg-gray-300'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-all ${
                  anonymous ? 'ml-6' : 'ml-0.5'
                }`}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Involved Parties */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Involved Parties (Optional)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800 min-h-20"
            placeholder="Describe suspects, witnesses, or other involved parties..."
            value={involvedParties}
            onChangeText={setInvolvedParties}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`bg-[#67082F] rounded-lg p-4 mb-8 ${
            loading ? 'opacity-50' : ''
          }`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
