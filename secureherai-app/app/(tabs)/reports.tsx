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
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";
import { ReportSummary } from "../../types/report";
import Header from "../../src/components/Header";

const { width } = Dimensions.get('window');

export default function ReportsTabScreen() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        const errorMessage = response.error || 'Failed to load reports';
        setError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Load reports error:', error);
      const errorMessage = 'Network error occurred. Please check your connection.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case 'harassment':
        return 'warning';
      case 'theft':
        return 'remove-circle';
      case 'assault':
        return 'dangerous';
      default:
        return 'help';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return '#3B82F6';
      case 'under_review':
        return '#F59E0B';
      case 'resolved':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'public';
      case 'officials_only':
        return 'admin-panel-settings';
      case 'private':
        return 'lock';
      default:
        return 'visibility';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigateToDetails = (reportId: string) => {
    router.push(`/report-details?id=${reportId}` as any);
  };

  const navigateToSubmit = () => {
    router.push(`/report-submit` as any);
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
          <View className="w-10 h-10 bg-[#67082F]/10 rounded-full items-center justify-center mr-3">
            <MaterialIcons
              name={getIncidentTypeIcon(report.incidentType) as any}
              size={20}
              color="#67082F"
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
              {report.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text className="text-gray-700 text-sm mb-3 leading-relaxed" numberOfLines={2}>
        {report.description}
      </Text>

      {/* Location and dates */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center flex-1">
          <MaterialIcons name="location-on" size={14} color="#6B7280" />
          <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
            {report.location.address || `${report.location.latitude}, ${report.location.longitude}`}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
        <Text className="text-xs text-gray-500">
          Incident: {formatDate(report.incidentTime)}
        </Text>
        <Text className="text-xs text-gray-500">
          Submitted: {formatDate(report.createdAt)}
        </Text>
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
            <Text className="text-gray-600 mt-4 font-medium">Loading your reports...</Text>
            <Text className="text-gray-400 text-sm mt-2">Please wait a moment</Text>
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
                <Text className="text-white font-bold text-base">Submit New Report</Text>
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
                onPress={() => {/* TODO: Add filter functionality */}}
              >
                <View className="items-center">
                  <MaterialIcons name="filter-list" size={20} color="#67082F" />
                  <Text className="text-[#67082F] text-xs font-medium mt-1">Filter</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 mx-1 p-3 bg-gray-50 rounded-lg border border-gray-200"
                onPress={() => {/* TODO: Add search functionality */}}
              >
                <View className="items-center">
                  <MaterialIcons name="search" size={20} color="#67082F" />
                  <Text className="text-[#67082F] text-xs font-medium mt-1">Search</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 ml-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                onPress={handleRefresh}
              >
                <View className="items-center">
                  <MaterialIcons name="refresh" size={20} color="#67082F" />
                  <Text className="text-[#67082F] text-xs font-medium mt-1">Refresh</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {reports.length === 0 ? (
            <View className="bg-white rounded-lg p-8 shadow-sm items-center">
              <View className="w-20 h-20 bg-[#67082F]/10 rounded-full items-center justify-center mb-4">
                <MaterialIcons name="assignment" size={40} color="#67082F" />
              </View>
              <Text className="text-gray-800 text-xl font-bold mt-2">No Reports Yet</Text>
              <Text className="text-gray-500 text-center mt-3 leading-relaxed">
                You haven't submitted any incident reports. Your safety matters - start by creating your first report.
              </Text>
              
              {/* Feature highlights */}
              <View className="w-full mt-6 space-y-3">
                <View className="flex-row items-center">
                  <MaterialIcons name="security" size={16} color="#67082F" />
                  <Text className="text-gray-600 text-sm ml-2">Secure and confidential reporting</Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="location-on" size={16} color="#67082F" />
                  <Text className="text-gray-600 text-sm ml-2">GPS location tracking</Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialIcons name="cloud-upload" size={16} color="#67082F" />
                  <Text className="text-gray-600 text-sm ml-2">Evidence upload support</Text>
                </View>
              </View>
              
              <TouchableOpacity
                className="bg-[#67082F] rounded-lg px-8 py-4 mt-8 w-full shadow-sm"
                onPress={navigateToSubmit}
              >
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="add-circle" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">Submit First Report</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Reports List Header */}
              <Text className="text-lg font-bold text-[#67082F] mb-4">
                Your Reports ({reports.length})
              </Text>
              
              {/* Quick Add Button */}
              <TouchableOpacity
                className="flex-row items-center justify-between p-3 bg-white rounded-lg mb-4 shadow-sm border border-gray-200"
                onPress={navigateToSubmit}
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="add" size={20} color="#67082F" />
                  <Text className="text-[#67082F] font-semibold ml-3">Add New Report</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#67082F" />
              </TouchableOpacity>

              {/* Reports List */}
              {reports.map(renderReportCard)}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
