import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Alert as AlertType } from "../types/sos";
import { AlertStatus } from "../types/AlertStatus";
import apiService from "../services/api";

interface AlertDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  alert: AlertType | null;
  alertDetails: any;
  isResponder: boolean;
  isAcceptedResponder?: boolean; // New prop to check if responder has accepted this alert
  onStatusUpdate?: () => void;
  loadingDetails: boolean;
}

const AlertDetailsModal = ({
  visible,
  onClose,
  alert,
  alertDetails,
  isResponder,
  isAcceptedResponder = false,
  onStatusUpdate,
  loadingDetails,
}: AlertDetailsModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "active":
        return "text-red-600 bg-red-50 border-red-200";
      case "RESPONDED":
      case "responded":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "EN_ROUTE":
      case "en_route":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "ARRIVED":
      case "arrived":
        return "text-indigo-600 bg-indigo-50 border-indigo-200";
      case "CANCELED":
      case "canceled":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "RESOLVED":
      case "resolved":
        return "text-green-600 bg-green-50 border-green-200";
      case "VERIFIED":
      case "verified":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleUpdateStatus = async () => {
    if (!alert?.id || !selectedStatus) return;

    try {
      setUpdatingStatus(true);
      const response = await apiService.updateAlertStatus(
        alert.id,
        selectedStatus
      );

      if (response.success) {
        // Call onStatusUpdate callback to refresh the alert list
        if (onStatusUpdate) {
          onStatusUpdate();
        }
        // Close the modal
        onClose();
      } else {
        console.error("Failed to update alert status:", response.error);
      }
    } catch (error) {
      console.error("Error updating alert status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Status options for responders - only allow meaningful alert status updates
  const statusOptions = [
    AlertStatus.RESOLVED,
    AlertStatus.CRITICAL,
    AlertStatus.FALSE_ALARM,
    AlertStatus.REJECTED,
  ];

  if (!alert) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white rounded-xl p-6 mx-6 w-220 max-h-[80%]">
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
            <Text className="text-xl font-bold text-[#67082F]">
              Alert Details
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#67082F" />
            </TouchableOpacity>
          </View>

          {loadingDetails ? (
            <View className="p-8 items-center">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="mt-4 text-gray-600">
                Loading alert details...
              </Text>
            </View>
          ) : !alert ? (
            <View className="p-8 items-center">
              <MaterialIcons name="error" size={48} color="#EF4444" />
              <Text className="mt-4 text-gray-600 text-center">
                No alert data available
              </Text>
            </View>
          ) : (
            <ScrollView className="p-4">
              {/* Alert Basic Info */}
              <View className="bg-gray-50 p-4 rounded-lg mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-800 font-semibold">Alert ID</Text>
                  <Text className="text-gray-600">
                    {alert?.id ? `${alert.id.substring(0, 8)}...` : "N/A"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-800 font-semibold">Status</Text>
                  <View
                    className={`px-3 py-1 rounded-full border ${getStatusColor(
                      alert?.status || ""
                    )}`}
                  >
                    <Text className="text-xs font-medium">
                      {alert?.status || "Unknown"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-800 font-semibold">Created</Text>
                  <Text className="text-gray-600">
                    {formatDate(alert?.triggeredAt || null)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-800 font-semibold">Type</Text>
                  <Text className="text-gray-600">
                    {alert?.triggerMethod || "Unknown"} Alert
                  </Text>
                </View>

                {alert?.resolvedAt && (
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-800 font-semibold">
                      Resolved
                    </Text>
                    <Text className="text-gray-600">
                      {formatDate(alert?.resolvedAt || null)}
                    </Text>
                  </View>
                )}

                {alert?.canceledAt && (
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-gray-800 font-semibold">
                      Canceled
                    </Text>
                    <Text className="text-gray-600">
                      {formatDate(alert?.canceledAt || null)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Alert Location */}
              {alert?.address && (
                <View className="bg-blue-50 p-4 rounded-lg mb-4">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons
                      name="location-on"
                      size={20}
                      color="#1E40AF"
                    />
                    <Text className="text-blue-700 font-semibold ml-1">
                      Alert Location
                    </Text>
                  </View>
                  <Text className="text-gray-700 mt-1">{alert?.address}</Text>
                  {alert?.latitude && alert?.longitude && (
                    <Text className="text-gray-500 text-xs mt-1">
                      Coordinates: {alert.latitude.toFixed(6)},{" "}
                      {alert.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>
              )}

              {/* Alert Message */}
              {alert?.alertMessage && (
                <View className="bg-purple-50 p-4 rounded-lg mb-4">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="message" size={20} color="#7E22CE" />
                    <Text className="text-purple-700 font-semibold ml-1">
                      Alert Message
                    </Text>
                  </View>
                  <Text className="text-gray-700 mt-1">
                    &ldquo;{alert?.alertMessage}&rdquo;
                  </Text>
                </View>
              )}

              {/* Responder Information */}
              {alertDetails?.responders &&
                alertDetails.responders.length > 0 && (
                  <View className="bg-green-50 p-4 rounded-lg mb-4">
                    <View className="flex-row items-center mb-2">
                      <MaterialIcons name="people" size={20} color="#059669" />
                      <Text className="text-green-700 font-semibold ml-1">
                        Assigned Responders
                      </Text>
                    </View>

                    {alertDetails.responders.map(
                      (responder: any, index: number) => (
                        <View
                          key={index}
                          className="bg-white p-3 rounded-md mb-2 border border-green-100"
                        >
                          <Text className="text-gray-800 font-semibold">
                            {responder.name}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            {responder.responderType}
                          </Text>

                          {responder.phone && (
                            <View className="flex-row items-center mt-2">
                              <MaterialIcons
                                name="phone"
                                size={16}
                                color="#059669"
                              />
                              <Text className="text-gray-600 text-sm ml-1">
                                {responder.phone}
                              </Text>
                            </View>
                          )}

                          {responder.email && (
                            <View className="flex-row items-center mt-1">
                              <MaterialIcons
                                name="email"
                                size={16}
                                color="#059669"
                              />
                              <Text className="text-gray-600 text-sm ml-1">
                                {responder.email}
                              </Text>
                            </View>
                          )}

                          {responder.badgeNumber && (
                            <View className="flex-row items-center mt-1">
                              <MaterialIcons
                                name="badge"
                                size={16}
                                color="#059669"
                              />
                              <Text className="text-gray-600 text-sm ml-1">
                                Badge: {responder.badgeNumber}
                              </Text>
                            </View>
                          )}

                          {responder.status && (
                            <View className="flex-row items-center mt-1">
                              <MaterialIcons
                                name="info"
                                size={16}
                                color="#059669"
                              />
                              <Text className="text-gray-600 text-sm ml-1">
                                Status: {responder.status}
                              </Text>
                            </View>
                          )}

                          {responder.notes && (
                            <View className="mt-2 p-2 bg-gray-50 rounded-md">
                              <Text className="text-gray-500 text-sm">
                                {responder.notes}
                              </Text>
                            </View>
                          )}
                        </View>
                      )
                    )}
                  </View>
                )}

              {/* Status Update Section - Only for Accepted Responders */}
              {isResponder && isAcceptedResponder && (
                <View className="bg-yellow-50 p-4 rounded-lg mb-4">
                  <View className="flex-row items-center mb-3">
                    <MaterialIcons name="edit" size={20} color="#D97706" />
                    <Text className="text-yellow-700 font-semibold ml-1">
                      Update Alert Status
                    </Text>
                  </View>

                  <View className="flex-row flex-wrap">
                    {statusOptions.map((status) => (
                      <TouchableOpacity
                        key={status}
                        className={`px-3 py-2 rounded-md mr-2 mb-2 border ${
                          selectedStatus === status
                            ? "bg-blue-100 border-blue-500"
                            : "bg-white border-gray-300"
                        }`}
                        onPress={() => setSelectedStatus(status)}
                      >
                        <Text
                          className={`text-sm ${
                            selectedStatus === status
                              ? "text-blue-700 font-medium"
                              : "text-gray-600"
                          }`}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    className={`mt-3 p-3 rounded-md flex-row justify-center items-center ${
                      selectedStatus ? "bg-blue-500" : "bg-gray-300"
                    }`}
                    onPress={handleUpdateStatus}
                    disabled={!selectedStatus || updatingStatus}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <MaterialIcons name="save" size={18} color="white" />
                        <Text className="text-white font-medium ml-2">
                          Update Status
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Read-only message for non-accepted responders */}
              {isResponder && !isAcceptedResponder && (
                <View className="bg-gray-50 p-4 rounded-lg mb-4">
                  <View className="flex-row items-center mb-2">
                    <MaterialIcons name="info" size={20} color="#6B7280" />
                    <Text className="text-gray-600 font-semibold ml-1">
                      View Only
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    Only responders who have accepted this alert can update its
                    status.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AlertDetailsModal;
