import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function SettingsScreen() {
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(false);

  return (
    <View className="flex-1 bg-[#FFE4D6]">
      <View className="bg-[#67082F] px-4 py-6 flex-row justify-between items-center pt-12">
        <Text className="text-white text-xl font-bold">Settings</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Profile Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 bg-[#67082F]/10 rounded-full items-center justify-center">
              <MaterialIcons name="person" size={32} color="#67082F" />
            </View>
            <View className="ml-4">
              <Text className="font-bold text-lg">Jane Doe</Text>
              <Text className="text-gray-600">jane.doe@example.com</Text>
            </View>
          </View>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-[#67082F]">Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>
        </View>

        {/* Settings Options */}
        <View className="bg-white rounded-lg shadow-sm">
          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100">
            <View className="flex-row items-center">
              <MaterialIcons name="location-on" size={24} color="#67082F" className="mr-3" />
              <Text className="text-gray-800 ml-3">Location Services</Text>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#767577', true: '#67082F' }}
            />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100">
            <View className="flex-row items-center">
              <MaterialIcons name="notifications" size={24} color="#67082F" className="mr-3" />
              <Text className="text-gray-800 ml-3">Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#767577', true: '#67082F' }}
            />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialIcons name="mic" size={24} color="#67082F" className="mr-3" />
              <Text className="text-gray-800 ml-3">Auto Record on SOS</Text>
            </View>
            <Switch
              value={autoRecordEnabled}
              onValueChange={setAutoRecordEnabled}
              trackColor={{ false: '#767577', true: '#67082F' }}
            />
          </TouchableOpacity>
        </View>

        {/* Additional Options */}
        <View className="bg-white rounded-lg mt-4 shadow-sm">
          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100">
            <View className="flex-row items-center">
              <MaterialIcons name="security" size={24} color="#67082F" />
              <Text className="text-gray-800 ml-3">Privacy Policy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center justify-between border-b border-gray-100">
            <View className="flex-row items-center">
              <MaterialIcons name="help-outline" size={24} color="#67082F" />
              <Text className="text-gray-800 ml-3">Help & Support</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>

          <TouchableOpacity className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <MaterialIcons name="logout" size={24} color="#67082F" />
              <Text className="text-gray-800 ml-3">Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
