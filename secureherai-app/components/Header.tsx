import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext";
import { useLocation } from "../context/LocationContext";
import { useAlert } from "../context/AlertContext";

interface HeaderProps {
  title: string;
  onNotificationPress?: () => void;
  showNotificationDot?: boolean;
  showLogo?: boolean;
  useRealNotificationCount?: boolean;
  showLocationReload?: boolean;
}

export default function Header({
  title,
  onNotificationPress,
  showNotificationDot = true,
  showLogo = true,
  useRealNotificationCount = true,
  showLocationReload = true,
}: HeaderProps) {
  const { unreadCount } = useNotifications();
  const { manualLocationReload, isManuallyUpdating, isLocationTrackingActive } = useLocation();
  const { showAlert } = useAlert();

  // Use real notification count if enabled, otherwise fall back to prop
  const shouldShowDot = useRealNotificationCount
    ? unreadCount > 0
    : showNotificationDot;
  const notificationCount = useRealNotificationCount ? unreadCount : 0;

  const handleLocationReload = async () => {
    try {
      await manualLocationReload();
      showAlert('Location updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to update location:', error);
      showAlert('Failed to update location', 'error');
    }
  };

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
      {/* Right Section - Location Reload and Notification */}
      <View className="flex-row items-center">
        {showLocationReload && (
          <TouchableOpacity
            className="w-8 h-8 bg-red-700/30 rounded-full items-center justify-center mr-2"
            onPress={handleLocationReload}
            disabled={isManuallyUpdating}
          >
            {isManuallyUpdating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons
                name="my-location"
                size={18}
                color={isLocationTrackingActive ? "white" : "#999"}
              />
            )}
          </TouchableOpacity>
        )}
        
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
    </View>
  );
}
