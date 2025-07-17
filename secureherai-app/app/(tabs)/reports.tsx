import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";
import { ReportSummary, UserReportsResponse } from "../../types/report";
import Header from "../../components/Header";
import DatePicker from "../../components/DatePicker";
import { useAlert } from "../../context/AlertContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface Time {
  start: string;
  end: string;
}

// Simple Contact Form Component - moved outside to prevent re-creation
const TimeForm = ({
  onSubmit,
  timeFilter,
  setTimeFilter,
  isSubmitting,
}: {
  onSubmit: () => void;
  timeFilter: Time;
  setTimeFilter: (time: Time) => void;
  isSubmitting: boolean;
}) => (
  <View className="bg-white rounded p-4 m-4 w-full max-w-sm">
    <Text className="text-lg font-bold text-[#67082F] mb-4 text-center">
      Time Filter
    </Text>
    {/* Start */}
    <DatePicker
      label="Start Date"
      value={timeFilter.start}
      onDateChange={(date) => setTimeFilter({ ...timeFilter, start: date })}
      placeholder="Select start date"
    />

    {/* Start */}
    <DatePicker
      label="End Date"
      value={timeFilter.end}
      onDateChange={(date) => setTimeFilter({ ...timeFilter, end: date })}
      placeholder="Select end date"
    />

    {/* Action Buttons */}
    <View className="flex-row">
      <TouchableOpacity
        className={`flex-1 rounded py-3 px-3 ${
          isSubmitting ? "bg-[#67082F]/60" : "bg-[#67082F]"
        }`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-center text-white font-medium">Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

export default function ReportsTabScreen() {
  const { user } = useAuth();
  const { showAlert, showConfirmAlert } = useAlert();

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [allReports, setAllReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeFilter, setTimeFilter] = useState<Time>({
    start: "",
    end: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isTimeSubmitting, setIsTimeSubmitting] = useState(false);

  // Filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showTimeFilterModal, setShowTimeFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    incidentType?: string;
    visibility?: string;
    status?: string;
  }>({});

  // Reload reports when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    try {
      setError(null);
      const response = await apiService.getUserReports();
      if (response.success && response.reports) {
        setReports(response.reports);
        setAllReports(response.reports); // Keep original for filtering
      } else {
        const errorMessage = response.error || "Failed to load reports";
        setError(errorMessage);
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Load reports error:", error);
      const errorMessage =
        "Network error occurred. Please check your connection.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  // Filter functionality
  const handleFilter = async (filters: {
    incidentType?: string;
    visibility?: string;
    status?: string;
  }) => {
    setLoading(true);
    try {
      if (Object.keys(filters).length === 0) {
        setReports(allReports);
        setActiveFilters({});
        setLoading(false);
        return;
      }

      // Try API filter first
      const response = await apiService.filterReports(filters);
      if (response.success && response.reports) {
        setReports(response.reports);
      } else {
        // Fallback to local filtering with case-insensitive comparison
        console.log("Using local filtering");
        console.log(
          "All reports status values:",
          allReports.map((r) => r.status)
        );
        console.log("Filter status:", filters.status);

        let filteredReports = [...allReports];

        if (filters.incidentType) {
          filteredReports = filteredReports.filter(
            (report) =>
              report.incidentType.toLowerCase() ===
              filters.incidentType!.toLowerCase()
          );
        }

        if (filters.visibility) {
          filteredReports = filteredReports.filter(
            (report) =>
              report.visibility.toLowerCase() ===
              filters.visibility!.toLowerCase()
          );
        }

        if (filters.status) {
          filteredReports = filteredReports.filter(
            (report) =>
              report.status.toLowerCase() === filters.status!.toLowerCase()
          );
          console.log("Filtered reports count:", filteredReports.length);
        }

        setReports(filteredReports);
      }

      setActiveFilters(filters);
    } catch (error) {
      console.error("Filter error:", error);
      Alert.alert("Error", "Failed to apply filters");
    } finally {
      setLoading(false);
    }
  };

  const handleTimeFilter = async () => {
    setIsTimeSubmitting(true);
    try {
      if (
        !timeFilter.start ||
        !timeFilter.end ||
        new Date(timeFilter.start) > new Date(timeFilter.end)
      ) {
        showAlert("Validation Error", "Please enter valid time", "error");
        return;
      }

      const start = new Date(timeFilter.start).toISOString();
      const endDate = new Date(timeFilter.end);
      endDate.setHours(23, 59, 59, 999);
      const end = endDate.toISOString();

      const response = await apiService.getUserReportsByTime(start, end);

      if (response.success && response.reports) {
        setReports(response.reports);
      } else {
        showAlert(
          "Validation Error",
          response.error || "Failed to apply time filter",
          "error"
        );
      }
    } catch (error) {
      console.error("Time filter error:", error);
      showAlert("Validation Error", "Failed to apply time filter", "error");
    } finally {
      setIsTimeSubmitting(false);
      setShowTimeFilterModal(false);
    }
  };

  const clearFilters = () => {
    setActiveFilters({});
    setReports(allReports);
  };

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case "harassment":
        return "person-off";
      case "theft":
        return "money-off";
      case "assault":
        return "pan-tool";
      default:
        return "category";
    }
  };

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case "harassment":
        return "#DC2626"; // Red
      case "theft":
        return "#7C2D12"; // Brown
      case "assault":
        return "#B91C1C"; // Dark Red
      default:
        return "#6B7280"; // Gray
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "#3B82F6";
      case "under_review":
        return "#F59E0B";
      case "resolved":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "public";
      case "officials_only":
        return "admin-panel-settings";
      case "private":
        return "lock";
      default:
        return "visibility";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const navigateToDetails = (reportId: string) => {
    router.push(`/reports/details?id=${reportId}` as any);
  };

  const navigateToSubmit = () => {
    router.push(`/reports/submit` as any);
  };

  const renderReportCard = (report: ReportSummary) => (
    <TouchableOpacity
      key={report.reportId}
      className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100"
      onPress={() => navigateToDetails(report.reportId)}
      activeOpacity={0.7}
    >
      {/* Header with incident type and status */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-3 shadow-sm"
            style={{
              backgroundColor: `${getIncidentTypeColor(report.incidentType)}15`,
            }}
          >
            <MaterialIcons
              name={getIncidentTypeIcon(report.incidentType) as any}
              size={24}
              color={getIncidentTypeColor(report.incidentType)}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-800 capitalize">
              {report.incidentType}
            </Text>
            <Text className="text-xs text-gray-500 mt-1">
              ID: {report.reportId.slice(-8)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center space-x-2">
          {report.anonymous && (
            <MaterialIcons name="visibility-off" size={16} color="#F59E0B" />
          )}
          <MaterialIcons
            name={getVisibilityIcon(report.visibility) as any}
            size={16}
            color="#6B7280"
          />
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${getStatusColor(report.status)}20` }}
          >
            <Text
              className="text-xs font-bold capitalize"
              style={{ color: getStatusColor(report.status) }}
            >
              {report.status.replace("_", " ")}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text
        className="text-gray-700 text-sm mb-3 leading-relaxed"
        numberOfLines={2}
      >
        {report.description}
      </Text>

      {/* Location and dates */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <MaterialIcons name="location-on" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
            {report.location.address ||
              `${report.location.latitude}, ${report.location.longitude}`}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
        <View className="flex-1">
          <Text className="text-xs text-gray-500">
            Incident: {formatDate(report.incidentTime)}
          </Text>
          <Text className="text-xs text-gray-500">
            Submitted: {formatDate(report.createdAt)}
          </Text>
        </View>

        {/* Quick action for evidence upload */}
        <TouchableOpacity
          className="flex-row items-center px-3 py-1 bg-[#67082F]/10 rounded-full"
          onPress={(e) => {
            e.stopPropagation(); // Prevent navigating to details
            router.push(`/reports/evidence?reportId=${report.reportId}` as any);
          }}
        >
          <MaterialIcons name="add-photo-alternate" size={14} color="#67082F" />
          <Text className="text-[#67082F] text-xs font-medium ml-1">
            Evidence
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      <Header
        title="My Reports"
        onNotificationPress={() => {}}
        showNotificationDot={false}
      />

      {loading ? (
        <View className="flex-1 justify-center items-center py-20">
          <View className="bg-white rounded-lg p-8 shadow-sm items-center">
            <ActivityIndicator size="large" color="#67082F" />
            <Text className="text-gray-600 mt-4 font-medium">
              Loading your reports...
            </Text>
            <Text className="text-gray-400 text-sm mt-2">
              Please wait a moment
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-[#67082F] mb-4">
              Report Management
            </Text>

            {/* Primary Action */}
            <TouchableOpacity
              className="flex-row items-center p-4 bg-[#67082F] rounded-lg mb-3 shadow-sm"
              onPress={navigateToSubmit}
            >
              <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                <MaterialIcons name="add-circle" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">
                  Submit New Report
                </Text>
                <Text className="text-white/90 text-sm mt-1">
                  Report incidents, safety concerns, or suspicious activities
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

            {/* Secondary Actions */}
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 mr-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                onPress={() => setShowFilterModal(true)}
              >
                <View className="items-center">
                  <MaterialIcons name="filter-list" size={20} color="#67082F" />
                  <Text className="text-[#67082F] text-xs font-medium mt-1">
                    Filter
                  </Text>
                  {Object.keys(activeFilters).length > 0 && (
                    <View className="w-2 h-2 bg-red-500 rounded-full absolute top-0 right-2" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 ml-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                onPress={handleRefresh}
              >
                <View className="items-center">
                  <MaterialIcons name="refresh" size={20} color="#67082F" />
                  <Text className="text-[#67082F] text-xs font-medium mt-1">
                    Refresh
                  </Text>
                </View>
              </TouchableOpacity>

              {/* start end field*/}
              <TouchableOpacity
                className="flex-1 ml-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                onPress={() => setShowTimeFilterModal(true)}
              >
                <View className="items-center">
                  <MaterialIcons name="date-range" size={20} color="#67082F" />
                  <Text className="text-[#67082F] text-xs font-medium mt-1">
                    Time Filter
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {reports.length === 0 ? (
            <>
              {Object.keys(activeFilters).length > 0 ? (
                // Filtered empty state
                <View className="bg-white rounded-lg p-8 shadow-sm items-center">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <MaterialIcons
                      name="filter-list-off"
                      size={32}
                      color="#6B7280"
                    />
                  </View>
                  <Text className="text-gray-800 text-lg font-bold mb-2">
                    No Reports Found
                  </Text>
                  <Text className="text-gray-500 text-center leading-relaxed">
                    No report of this type
                  </Text>
                  <TouchableOpacity
                    className="bg-gray-100 rounded-lg px-6 py-3 mt-4"
                    onPress={() => {
                      clearFilters();
                    }}
                  >
                    <Text className="text-gray-700 font-medium">
                      Clear Filters
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Default empty state when no filters applied
                <View className="bg-white rounded-lg p-8 shadow-sm items-center">
                  <View className="w-20 h-20 bg-[#67082F]/10 rounded-full items-center justify-center mb-4">
                    <MaterialIcons
                      name="assignment"
                      size={40}
                      color="#67082F"
                    />
                  </View>
                  <Text className="text-gray-800 text-xl font-bold mt-2">
                    No Reports Yet
                  </Text>
                  <Text className="text-gray-500 text-center mt-3 leading-relaxed">
                    You haven&apos;t submitted any incident reports. Your safety
                    matters - start by creating your first report.
                  </Text>

                  {/* Feature highlights */}
                  <View className="w-full mt-6 space-y-3">
                    <View className="flex-row items-center">
                      <MaterialIcons
                        name="security"
                        size={16}
                        color="#67082F"
                      />
                      <Text className="text-gray-600 text-sm ml-2">
                        Secure and confidential reporting
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color="#67082F"
                      />
                      <Text className="text-gray-600 text-sm ml-2">
                        GPS location tracking
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialIcons
                        name="cloud-upload"
                        size={16}
                        color="#67082F"
                      />
                      <Text className="text-gray-600 text-sm ml-2">
                        Evidence upload support
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    className="bg-[#67082F] rounded-lg px-8 py-4 mt-8 w-full shadow-sm"
                    onPress={navigateToSubmit}
                  >
                    <View className="flex-row items-center justify-center">
                      <MaterialIcons
                        name="add-circle"
                        size={20}
                        color="white"
                      />
                      <Text className="text-white font-bold text-base ml-2">
                        Submit First Report
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Reports List Header */}
              <Text className="text-lg font-bold text-[#67082F] mb-4">
                Your Reports ({reports.length})
              </Text>

              {/* Reports List */}
              {reports.map(renderReportCard)}
            </>
          )}
        </ScrollView>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-lg p-6 m-4 w-11/12 max-w-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#67082F]">
                Filter Reports
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                className="p-1 rounded-full"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Incident Type Filter */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Incident Type
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {["harassment", "theft", "assault", "other"].map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`flex-row items-center px-3 py-2 rounded-lg mr-2 mb-2 border ${
                    activeFilters.incidentType === type
                      ? "border-2"
                      : "bg-gray-100 border-gray-200"
                  }`}
                  style={
                    activeFilters.incidentType === type
                      ? {
                          backgroundColor: `${getIncidentTypeColor(type)}15`,
                          borderColor: getIncidentTypeColor(type),
                        }
                      : {}
                  }
                  onPress={() => {
                    const newFilters = { ...activeFilters };
                    if (newFilters.incidentType === type) {
                      delete newFilters.incidentType;
                    } else {
                      newFilters.incidentType = type;
                    }
                    setActiveFilters(newFilters);
                  }}
                >
                  <MaterialIcons
                    name={getIncidentTypeIcon(type) as any}
                    size={16}
                    color={
                      activeFilters.incidentType === type
                        ? getIncidentTypeColor(type)
                        : "#6B7280"
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`capitalize text-sm font-medium`}
                    style={{
                      color:
                        activeFilters.incidentType === type
                          ? getIncidentTypeColor(type)
                          : "#374151",
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Visibility Filter */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Visibility
            </Text>
            <View className="flex-row flex-wrap mb-4">
              {["public", "officials_only", "private"].map((visibility) => (
                <TouchableOpacity
                  key={visibility}
                  className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                    activeFilters.visibility === visibility
                      ? "bg-[#67082F]"
                      : "bg-gray-200"
                  }`}
                  onPress={() => {
                    const newFilters = { ...activeFilters };
                    if (newFilters.visibility === visibility) {
                      delete newFilters.visibility;
                    } else {
                      newFilters.visibility = visibility;
                    }
                    setActiveFilters(newFilters);
                  }}
                >
                  <Text
                    className={`capitalize ${
                      activeFilters.visibility === visibility
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {visibility.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Filter */}
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Status
            </Text>
            <View className="flex-row flex-wrap mb-6">
              {["submitted", "under_review", "resolved"].map((status) => (
                <TouchableOpacity
                  key={status}
                  className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                    activeFilters.status === status
                      ? "bg-[#67082F]"
                      : "bg-gray-200"
                  }`}
                  onPress={() => {
                    const newFilters = { ...activeFilters };
                    if (newFilters.status === status) {
                      delete newFilters.status;
                    } else {
                      newFilters.status = status;
                    }
                    setActiveFilters(newFilters);
                  }}
                >
                  <Text
                    className={`capitalize ${
                      activeFilters.status === status
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-4 py-2 bg-gray-200 rounded-lg mr-3"
                onPress={() => {
                  clearFilters();
                  setShowFilterModal(false);
                }}
              >
                <Text className="text-gray-700">Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-4 py-2 bg-[#67082F] rounded-lg"
                onPress={() => {
                  handleFilter(activeFilters);
                  setShowFilterModal(false);
                }}
              >
                <Text className="text-white font-semibold">Apply Filter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal */}
      <Modal
        visible={showTimeFilterModal}
        transparent={true}
        onRequestClose={() => setShowTimeFilterModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <TimeForm
            onSubmit={handleTimeFilter}
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            isSubmitting={isTimeSubmitting}
          />
        </View>
      </Modal>
    </View>
  );
}
