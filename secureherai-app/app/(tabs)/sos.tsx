import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function SOSScreen() {
  return (
    <View className="flex-1 bg-[#FFE4D6]">
      <View className="bg-[#67082F] px-4 py-6 flex-row justify-between items-center pt-12">
        <Text className="text-white text-xl font-bold">Emergency Help</Text>
      </View>
      
      <View className="flex-1 p-4">
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-[#67082F] mb-2">Recent SOS Alerts</Text>
          <Text className="text-gray-600">No recent alerts</Text>
        </View>

        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-bold text-[#67082F] mb-4">Quick Actions</Text>
          
          <TouchableOpacity className="flex-row items-center p-3 bg-[#67082F]/10 rounded-lg mb-3">
            <MaterialIcons name="phone" size={24} color="#67082F" />
            <Text className="ml-3 text-[#67082F] font-semibold">Call Emergency Services</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-3 bg-[#67082F]/10 rounded-lg mb-3">
            <MaterialIcons name="share-location" size={24} color="#67082F" />
            <Text className="ml-3 text-[#67082F] font-semibold">Share Current Location</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-3 bg-[#67082F]/10 rounded-lg">
            <MaterialIcons name="record-voice-over" size={24} color="#67082F" />
            <Text className="ml-3 text-[#67082F] font-semibold">Start Voice Recording</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
