import {
  View,
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../context/AlertContext";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import QuickAction from "../../components/QuickAction";
import NotificationModal from "../../components/NotificationModal";
import SOSModalModern from "../../components/SOSModalModern";
import ReportModal from "../../components/ReportModal";
import ResponderHomepage from "../../components/ResponderHomepage";
import ActiveAlertCard from "../../components/ActiveAlertCard";
import { AlertResponse, Alert as AlertType } from "../../types/sos";
import { AlertStatus } from "../../types/AlertStatus";
import ApiService from "../../services/api";

export default function Home() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [pulseAnimation, setPulseAnimation] =
    useState<Animated.CompositeAnimation | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const { showAlert, showConfirmAlert } = useAlert();
  const { refreshNotificationCount } = useNotifications();
  const { user } = useAuth(); // Get user from auth context

  // Added states for SOS flow
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [alertResponse, setAlertResponse] = useState<AlertResponse | null>(
    null,
  );

  // Responder detection
  const [isResponder, setIsResponder] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // Active alert state
  const [activeAlert, setActiveAlert] = useState<AlertType | null>(null);
  const [isLoadingActiveAlert, setIsLoadingActiveAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check for active alert (WAITING or ACTIVE)
  const checkActiveAlert = useCallback(async () => {
    if (isResponder) return; // Responders don't need this check

    try {
      setIsLoadingActiveAlert(true);
      const response = await ApiService.getUserAlerts();
      if (response.success && response.alerts) {
        // Find any WAITING or ACTIVE alert
        const active = response.alerts.find(
          (alert: AlertType) =>
            alert.status === AlertStatus.WAITING ||
            alert.status === AlertStatus.ACTIVE,
        );
        setActiveAlert(active || null);
      } else {
        setActiveAlert(null);
      }
    } catch (error) {
      console.error("Error checking active alert:", error);
      setActiveAlert(null);
    } finally {
      setIsLoadingActiveAlert(false);
    }
  }, [isResponder]);

  const handleCancelActiveAlert = async (alertId: string) => {
    try {
      const response = await ApiService.cancelAlert(alertId);
      if (response.success) {
        showAlert("Success", "Alert cancelled successfully", "success");
        setActiveAlert(null);
        checkActiveAlert(); // Refresh
      } else {
        showAlert("Error", response.error || "Failed to cancel alert", "error");
      }
    } catch (error) {
      console.error("Error canceling alert:", error);
      showAlert("Error", "Failed to cancel alert", "error");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkActiveAlert();
    setRefreshing(false);
  }, [checkActiveAlert]);

  // Check if user is a responder
  const checkUserRole = async () => {
    try {
      setIsCheckingRole(true);

      // First try to get role from auth context user
      if (user?.role) {
        const isResponderUser = user.role === "RESPONDER";
        console.log(
          "Home: User role from context:",
          user.role,
          "Is responder:",
          isResponderUser,
        );
        setIsResponder(isResponderUser);
        setIsCheckingRole(false);
        return;
      }

      // Fallback to AsyncStorage if auth context doesn't have user data yet
      const userDataStr = await AsyncStorage.getItem("user_data");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        console.log("Home: User data from storage:", userData);
        // Check the role property (not roles array)
        const userRole = userData.role;
        const isResponderUser = userRole === "RESPONDER";
        console.log(
          "Home: User role from storage:",
          userRole,
          "Is responder:",
          isResponderUser,
        );
        setIsResponder(isResponderUser);
      } else {
        // No user data found, default to regular user
        setIsResponder(false);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setIsResponder(false);
    } finally {
      setIsCheckingRole(false);
    }
  };

  // All useEffect hooks must be called before any conditional returns
  useEffect(() => {
    checkUserRole();
  }, [user]); // Re-run when user changes

  // Re-check user role and active alert when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkUserRole();
      if (!isResponder) {
        checkActiveAlert();
      }
    }, [user, isResponder, checkActiveAlert]),
  );

  // Animation useEffect
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
      ]),
    );
    setPulseAnimation(anim);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [pulseAnim]);

  // If still checking role, show loading
  if (isCheckingRole) {
    return (
      <View className="flex-1 bg-[#FFE4D6] items-center justify-center">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  // If user is a responder, show responder homepage
  if (isResponder) {
    return <ResponderHomepage />;
  }

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
    // Check if there's already an active alert
    if (activeAlert) {
      showAlert(
        "Active Alert Exists",
        "You already have an active alert. Please cancel or wait for it to be resolved before creating a new one.",
        "warning",
      );
      setIsPressed(false);
      if (pulseAnimation) pulseAnimation.start();
      return;
    }

    try {
      setSosTriggered(true);
      setIsPressed(false);

      // Show SOS modal directly without confirmation
      setShowSOSModal(true);
    } catch (error) {
      console.error("Error triggering SOS:", error);
      showAlert(
        "Error",
        "Failed to send SOS alert. Please try again.",
        "error",
      );
      setSosTriggered(false);
      if (pulseAnimation) pulseAnimation.start();
    }
  };

  // Handle successful SOS alert submission
  const handleSOSSuccess = (response: AlertResponse) => {
    setShowSOSModal(false);

    // Refresh notifications since emergency notifications have been sent
    refreshNotificationCount();

    // Refresh active alert state
    checkActiveAlert();

    // Show confirmation and inform user about auto-generated report
    showConfirmAlert(
      "SOS Alert Sent",
      "Your SOS alert has been sent successfully! An incident report has been automatically generated. Would you like to view and update it with additional details?",
      async () => {
        // Navigate directly to the auto-generated report using the alert ID
        resetSOSState();
        // get the report from the alert
        if (response.alertId) {
          const data = await ApiService.getReportByAlertId(response.alertId);
          if (data.report && data.report.reportId) {
            // Navigate to report details with alertId
            router.push(
              `/reports/details?id=${data.report.reportId}&mode=update&fromAlert=true` as any,
            );
          }
        }
      },
      () => {
        // Reset SOS trigger state if user declines
        resetSOSState();
      },
      "success",
    );
  };

  // Reset SOS state after completion or cancellation
  const resetSOSState = () => {
    setSosTriggered(false);
    if (pulseAnimation) pulseAnimation.start();
  };

  const handleQuickLocationShare = () => {
    showAlert(
      "Location Shared",
      "Your current location has been shared with trusted contacts.",
      "success",
    );
  };

  const handleQuickAudioRecord = () => {
    showAlert(
      "Audio Recording",
      "Audio recording feature will be available soon.",
      "info",
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
      "error",
    );
  };

  const handleViewAlertHistory = () => {
    router.push("/sos" as any);
  };

  // Check if SOS button should be disabled
  const isSosDisabled = sosTriggered || !!activeAlert;

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <StatusBar style="light" />
      <Header
        title="SecureHer AI"
        onNotificationPress={() => setShowNotifications(true)}
        useRealNotificationCount={true}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Alert Card - Shown above SOS button */}
        {activeAlert && (
          <View className="pt-4">
            <ActiveAlertCard
              alert={activeAlert}
              onRefresh={checkActiveAlert}
              onCancel={handleCancelActiveAlert}
            />
          </View>
        )}

        <View
          className={`flex-1 items-center ${activeAlert ? "justify-start pt-4" : "justify-center"} p-6 pb-28`}
        >
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
            disabled={isSosDisabled}
          >
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
              className={`w-52 h-52 rounded-full items-center justify-center shadow-2xl mb-6 border-4 ${
                activeAlert
                  ? "bg-gray-400 border-gray-500"
                  : isPressed
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
                  activeAlert
                    ? "bg-gray-500"
                    : isPressed
                      ? "bg-red-600"
                      : sosTriggered
                        ? "bg-green-500"
                        : "bg-red-600"
                }`}
              >
                {sosTriggered ? (
                  <View className="items-center">
                    <MaterialIcons
                      name="check-circle"
                      size={72}
                      color="white"
                    />
                    <Text className="text-white text-xl font-bold tracking-wider mt-2">
                      SENT
                    </Text>
                  </View>
                ) : activeAlert ? (
                  <View className="items-center">
                    <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-2">
                      <MaterialIcons
                        name="hourglass-top"
                        size={52}
                        color="#000000"
                      />
                    </View>
                    <Text className="text-white text-lg font-bold tracking-wider">
                      ACTIVE
                    </Text>
                    <Text className="text-white text-xs mt-1 opacity-90">
                      Alert in progress
                    </Text>
                  </View>
                ) : (
                  <View className="items-center">
                    {/* Hand icon in black for better contrast */}
                    <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-2">
                      <MaterialIcons
                        name="back-hand"
                        size={52}
                        color="#000000"
                      />
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
              : activeAlert
                ? "⚠️ You have an active alert. Manage it using the card above."
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

            <View className="flex-row justify-around">
              <QuickAction
                icon="description"
                label="Report Incident"
                onPress={() => router.push("/reports/submit" as any)}
              />
              <QuickAction
                icon="history"
                label="Alert History"
                onPress={handleViewAlertHistory}
              />
              <QuickAction
                icon="notifications"
                label="Test Notifications"
                onPress={() => router.push("/notification-test" as any)}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* SOS Modal for voice/text selection */}
      <SOSModalModern
        visible={showSOSModal}
        onClose={() => {
          setShowSOSModal(false);
          resetSOSState();
        }}
        onSuccess={handleSOSSuccess}
      />

      <NotificationModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}
