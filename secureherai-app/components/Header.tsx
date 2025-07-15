import { View, Text, TouchableOpacity, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";

interface HeaderProps {
  title: string;
  onNotificationPress?: () => void;
  showNotificationDot?: boolean;
  showLogo?: boolean;
  useRealNotificationCount?: boolean;
}

export default function Header({
  title,
  onNotificationPress,
  showNotificationDot = true,
  showLogo = true,
  useRealNotificationCount = true,
}: HeaderProps) {
  const { unreadCount } = useNotifications();

  // Use real notification count if enabled, otherwise fall back to prop
  const shouldShowDot = useRealNotificationCount
    ? unreadCount > 0
    : showNotificationDot;
  const notificationCount = useRealNotificationCount ? unreadCount : 0;

  return (
    <View className="bg-[#67082F] px-4 pt-12 pb-6 flex-row justify-between items-center max-w-screen-md mx-auto w-full">
      <View className="flex-row items-center flex-1">
        {showLogo && (
          <Image
            source={require("../assets/images/secureherai_logo.png")}
            style={{
              width: 32,
              height: 32,
              resizeMode: "contain",
            }}
            className="mr-3"
          />
        )}
        <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <TouchableOpacity
        className="w-10 h-10 bg-red-700/30 rounded-full items-center justify-center relative"
        onPress={onNotificationPress}
      >
        <MaterialIcons name="notifications" size={24} color="white" />
        {shouldShowDot && (
          <View className="absolute top-1 right-1 min-w-[12px] h-3 bg-red-500 rounded-full items-center justify-center">
            {useRealNotificationCount &&
              notificationCount > 0 &&
              notificationCount <= 99 && (
                <Text className="text-white text-[8px] font-bold leading-none">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Text>
              )}
            {(!useRealNotificationCount || notificationCount === 0) && (
              <View className="w-2 h-2 bg-red-500 rounded-full" />
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
