import { Tabs, Redirect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { user, token, isLoading } = useAuth();

  // If user becomes unauthenticated while in this group, redirect to auth
  if (!isLoading && (!user || !token)) {
    return <Redirect href="/(auth)" />;
  }
  // Add extra margin for Android to avoid overlap with back button
  const extraMargin = Platform.OS === "android" ? 24 : 0;
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#67082F",
          height: isWeb ? 70 : 60 + extraMargin,
          paddingBottom: isWeb ? 12 : 8 + extraMargin,
          paddingTop: isWeb ? 12 : 8,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          marginBottom: isWeb ? 0 : extraMargin,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          ...(isWeb && {
            maxWidth: 768, // md breakpoint
            alignSelf: "center",
            borderRadius: 20,
            marginLeft: "auto",
            marginRight: "auto",
          }),
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: isWeb ? 14 : 12,
        },
        tabBarIconStyle: {
          marginTop: isWeb ? 4 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: "Emergency",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="emergency" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="contacts" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
