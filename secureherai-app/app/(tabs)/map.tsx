import { View, Text } from 'react-native';

export default function MapScreen() {
  return (
    <View className="flex-1 bg-[#FFE4D6]">
      <View className="bg-[#67082F] px-4 py-6 flex-row justify-between items-center pt-12">
        <Text className="text-white text-xl font-bold">Safety Map</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-600">Map View Coming Soon</Text>
      </View>
    </View>
  );
}
