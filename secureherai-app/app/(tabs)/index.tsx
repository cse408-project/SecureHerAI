import { View, Animated, Easing, Text, TouchableOpacity } from "react-native";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAlert } from "../../context/AlertContext";
import Header from "../../components/Header";
import QuickAction from "../../components/QuickAction";
import NotificationModal from "../../components/NotificationModal";

export default function Home() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [pulseAnimation, setPulseAnimation] =
    useState<Animated.CompositeAnimation | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const { showAlert, showConfirmAlert } = useAlert();

  const notifications = [
    { id: 1, message: "SOS Alert sent successfully!" },
    { id: 2, message: "Location shared with trusted contacts." },
    { id: 3, message: "Test notification." },
  ];

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    setPulseAnimation(anim);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [pulseAnim]);

  const handlePressIn = () => {
    if (pulseAnimation) pulseAnimation.stop();
    setIsPressed(true);
    pressTimer.current = setTimeout(() => {
      triggerSOS();
    }, 3000); // 3 seconds press
  };

  const handlePressOut = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
    setIsPressed(false);
    // Restart animation if SOS was not triggered
    if (pulseAnimation) pulseAnimation.start();
  };

  const triggerSOS = async () => {
    try {
      setSosTriggered(true);
      setIsPressed(false);

      // Show confirmation alert first
      showConfirmAlert(
        "Emergency SOS",
        "This will send emergency alerts to your trusted contacts and emergency services. Continue?",
        async () => {
          // Simulate SOS sending
          showAlert(
            "SOS Sent!",
            "Emergency alert has been sent to your trusted contacts and emergency services.",
            "success"
          );

          // Navigate to SOS management page to show details
          setTimeout(() => {
            router.push("/(tabs)/sos" as any);
          }, 1500);
        },
        () => {
          setSosTriggered(false);
          // Restart pulse animation
          if (pulseAnimation) pulseAnimation.start();
        },
        "warning"
      );
    } catch (error) {
      console.error("Error triggering SOS:", error);
      showAlert(
        "Error",
        "Failed to send SOS alert. Please try again.",
        "error"
      );
      setSosTriggered(false);
      if (pulseAnimation) pulseAnimation.start();
    }
  };

  const handleQuickLocationShare = () => {
    showAlert(
      "Location Shared",
      "Your current location has been shared with trusted contacts.",
      "success"
    );
  };

  const handleQuickAudioRecord = () => {
    showAlert(
      "Audio Recording",
      "Audio recording feature will be available soon.",
      "info"
    );
  };

  const handleQuickEmergencyCall = () => {
    showConfirmAlert(
      "Emergency Call",
      "This will dial emergency services (911). Continue?",
      () => {
        showAlert("Calling", "Dialing emergency services...", "info");
      },
      undefined,
      "error"
    );
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <StatusBar style="light" />
      <Header
        title="SecureHer AI"
        onNotificationPress={() => setShowNotifications(true)}
        showNotificationDot={notifications.length > 0}
      />
      <View className="flex-1 items-center justify-center p-6 pb-28">
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          disabled={sosTriggered}
        >
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
            }}
            className={`w-52 h-52 rounded-full items-center justify-center shadow-2xl mb-6 border-4 ${
              isPressed
                ? "bg-red-800 border-red-900"
                : sosTriggered
                ? "bg-green-600 border-green-700"
                : "bg-red-700 border-red-800"
            }`}
          >
            {/* Outer ring effect */}
            <View className="absolute inset-2 rounded-full bg-white/5" />

            {/* Inner button */}
            <View
              className={`w-44 h-44 rounded-full items-center justify-center ${
                isPressed
                  ? "bg-red-600"
                  : sosTriggered
                  ? "bg-green-500"
                  : "bg-red-600"
              }`}
            >
              {sosTriggered ? (
                <View className="items-center">
                  <MaterialIcons name="check-circle" size={72} color="white" />
                  <Text className="text-white text-xl font-bold tracking-wider mt-2">
                    SENT
                  </Text>
                </View>
              ) : (
                <View className="items-center">
                  {/* Hand icon in black for better contrast */}
                  <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-2">
                    <MaterialIcons name="back-hand" size={52} color="#000000" />
                  </View>
                  <Text className="text-white text-2xl font-bold tracking-wider">
                    {isPressed ? "SENDING" : "SOS"}
                  </Text>
                  {!isPressed && (
                    <Text className="text-white text-sm mt-1 opacity-90">
                      Hold 3 seconds
                    </Text>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        </TouchableOpacity>

        <Text className="text-gray-700 text-center text-lg mb-4 px-4 font-medium">
          {sosTriggered
            ? "🎉 Emergency alert sent successfully!"
            : isPressed
            ? "⏳ Keep holding to send emergency alert..."
            : "🚨 Press and hold the SOS button for immediate help"}
        </Text>

        {isPressed && (
          <View className="mb-6 p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl w-full border-2 border-orange-300">
            <Text className="text-orange-800 text-center font-bold text-lg">
              ⚠️ Keep holding to trigger SOS alert...
            </Text>
            <Text className="text-orange-700 text-center text-sm mt-1">
              Emergency services will be contacted
            </Text>
          </View>
        )}

        {sosTriggered && (
          <View className="mb-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl w-full border-2 border-green-300">
            <Text className="text-green-800 text-center font-bold text-lg">
              ✅ Emergency Alert Sent Successfully!
            </Text>
            <Text className="text-green-700 text-center text-sm mt-1">
              Trusted contacts and emergency services have been notified
            </Text>
          </View>
        )}

        <View className="w-full mt-8 px-4">
          <View className="flex-row justify-around mb-4">
            <QuickAction
              icon="location-on"
              label="Share Location"
              onPress={handleQuickLocationShare}
            />
            <QuickAction
              icon="record-voice-over"
              label="Record Audio"
              onPress={handleQuickAudioRecord}
            />
            <QuickAction
              icon="phone"
              label="Emergency Call"
              onPress={handleQuickEmergencyCall}
            />
          </View>
          
          <View className="flex-row justify-center">
            <QuickAction
              icon="description"
              label="Report Incident"
              onPress={() => router.push("/reports/submit" as any)}
            />
          </View>
        </View>
      </View>
      <NotificationModal
        visible={showNotifications}
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
