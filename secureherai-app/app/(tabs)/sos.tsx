import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useAlert } from "../../context/AlertContext";
import Header from "../../src/components/Header";

interface EmergencyAlert {
  id: number;
  timestamp: string;
  type: "SOS" | "Location" | "Audio" | "Call";
  status: "Sent" | "Delivered" | "Acknowledged" | "Resolved";
  location?: string;
  respondersNotified?: number;
}

export default function SOSScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [emergencyAlerts] = useState<EmergencyAlert[]>([
    {
      id: 1,
      timestamp: "2024-12-25 14:30:00",
      type: "SOS",
      status: "Resolved",
      location: "Downtown Mall, Building A",
      respondersNotified: 3,
    },
    {
      id: 2,
      timestamp: "2024-12-20 09:15:00",
      type: "Location",
      status: "Delivered",
      location: "University Campus",
      respondersNotified: 2,
    },
  ]);
  const { showAlert, showConfirmAlert } = useAlert();

  useEffect(() => {
    // Load emergency alerts history
    loadEmergencyHistory();
  }, []);

  const loadEmergencyHistory = async () => {
    // TODO: Implement API call to load emergency history
    console.log("Loading emergency history...");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEmergencyHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sent":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Delivered":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Acknowledged":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "Resolved":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SOS":
        return "emergency";
      case "Location":
        return "location-on";
      case "Audio":
        return "record-voice-over";
      case "Call":
        return "phone";
      default:
        return "info";
    }
  };

  const handleTestAlert = () => {
    showConfirmAlert(
      "Test Emergency Alert",
      "This will send a test emergency alert to your trusted contacts. They will be notified that this is a test.",
      () => {
        showAlert(
          "Test Alert Sent",
          "Test emergency alert has been sent to your trusted contacts.",
          "success"
        );
      },
      undefined,
      "info"
    );
  };

  const handleManageContacts = () => {
    showAlert("Info", "Redirecting to trusted contacts management...", "info");
    // TODO: Navigate to contacts management
  };

  const handleEmergencySettings = () => {
    showAlert("Info", "Emergency settings will be available soon.", "info");
  };

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <Header
        title="Emergency Management"
        onNotificationPress={() => {}}
        showNotificationDot={false}
      />

      <ScrollView
        className="flex-1 p-4 pb-10"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quick Emergency Actions */}
        <View className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <Text className="text-lg font-bold text-[#67082F] mb-4">
            Emergency Actions
          </Text>

          <TouchableOpacity
            className="flex-row items-center p-3 bg-red-50 rounded-lg mb-3 border border-red-200"
            onPress={handleTestAlert}
          >
            <View className="w-10 h-10 bg-red-600 rounded-full items-center justify-center mr-3">
              <MaterialIcons name="bug-report" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-red-700 font-semibold">
                Send Test Alert
              </Text>
              <Text className="text-red-600 text-sm">
                Test your emergency system
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-3 bg-blue-50 rounded-lg mb-3 border border-blue-200"
            onPress={handleManageContacts}
          >
            <View className="w-10 h-10 bg-blue-600 rounded-full items-center justify-center mr-3">
              <MaterialIcons name="people" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-blue-700 font-semibold">
                Manage Trusted Contacts
              </Text>
              <Text className="text-blue-600 text-sm">
                Add or edit emergency contacts
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-3 bg-purple-50 rounded-lg border border-purple-200"
            onPress={handleEmergencySettings}
          >
            <View className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center mr-3">
              <MaterialIcons name="settings" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-purple-700 font-semibold">
                Emergency Settings
              </Text>
              <Text className="text-purple-600 text-sm">
                Configure alert preferences
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#67082F" />
          </TouchableOpacity>
        </View>

        {/* Emergency History */}
        <View className="bg-white rounded-lg p-4 shadow-sm">
          <Text className="text-lg font-bold text-[#67082F] mb-4">
            Emergency History
          </Text>

          {emergencyAlerts.length === 0 ? (
            <View className="items-center py-8">
              <MaterialIcons name="history" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2 text-center">
                No emergency alerts yet
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                Your emergency alert history will appear here
              </Text>
            </View>
          ) : (
            emergencyAlerts.map((alert) => (
              <View
                key={alert.id}
                className="border-b border-gray-100 py-4 last:border-b-0"
              >
                <View className="flex-row items-start">
                  <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                    <MaterialIcons
                      name={getTypeIcon(alert.type) as any}
                      size={20}
                      color="#67082F"
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="font-semibold text-gray-900">
                        {alert.type} Alert
                      </Text>
                      <View
                        className={`px-2 py-1 rounded-full border ${getStatusColor(
                          alert.status
                        )}`}
                      >
                        <Text className="text-xs font-medium">
                          {alert.status}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-gray-600 text-sm mb-1">
                      {new Date(alert.timestamp).toLocaleDateString()} at{" "}
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </Text>

                    {alert.location && (
                      <Text className="text-gray-500 text-sm mb-1">
                        📍 {alert.location}
                      </Text>
                    )}

                    {alert.respondersNotified && (
                      <Text className="text-blue-600 text-sm">
                        👥 {alert.respondersNotified} responders notified
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Help Section */}
        <View className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mt-4 border border-blue-200">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="info" size={20} color="#3B82F6" />
            <Text className="text-blue-700 font-semibold ml-2">
              How to Use Emergency Features
            </Text>
          </View>
          <Text className="text-blue-600 text-sm leading-relaxed">
            • Go to the <Text className="font-semibold">Home</Text> tab to
            access the main SOS button{"\n"}• Press and hold the SOS button for
            3 seconds to trigger an emergency alert{"\n"}• Use quick actions on
            the home page for specific emergency needs{"\n"}• Manage your
            trusted contacts to ensure alerts reach the right people
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
