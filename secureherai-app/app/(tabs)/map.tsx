import { View, Text } from "react-native";
import Header from "../../src/components/Header";

export default function MapScreen() {
  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <Header
        title="Safety Map"
        onNotificationPress={() => {}}
        showNotificationDot={false}
      />
      <View className="flex-1 items-center justify-center pb-28">
        <Text className="text-gray-600">Map View Coming Soon</Text>
      </View>
    </View>
  );
}
