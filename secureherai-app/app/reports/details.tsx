import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";
import { ReportDetails, UpdateReportRequest } from "../../types/report";

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (id) {
      loadReportDetails();
    }
  }, [id]);

  const loadReportDetails = async () => {
    if (!id) return;
    
    try {
      const response = await apiService.getReportDetails(id);
      if (response.success && response.report) {
        setReport(response.report);
      } else {
        Alert.alert('Error', response.error || 'Failed to load report details');
        router.back();
      }
    } catch (error) {
      console.error('Load report details error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!report || !editingField || !editValue.trim()) return;

    try {
      const updateData: UpdateReportRequest = {
        reportId: report.reportId,
        [editingField]: editValue.trim(),
      };

      const response = await apiService.updateReport(updateData);
      if (response.success) {
        setReport({
          ...report,
          [editingField]: editValue.trim(),
        });
        setShowEditModal(false);
        Alert.alert('Success', 'Report updated successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to update report');
      }
    } catch (error) {
      console.error('Update report error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleChangeVisibility = (newVisibility: 'public' | 'officials_only' | 'private') => {
    Alert.alert(
      'Change Visibility',
      `Are you sure you want to change visibility to ${newVisibility.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            if (!report) return;
            
            try {
              const updateData: UpdateReportRequest = {
                reportId: report.reportId,
                visibility: newVisibility,
              };

              const response = await apiService.updateReport(updateData);
              if (response.success) {
                setReport({ ...report, visibility: newVisibility });
                Alert.alert('Success', 'Visibility updated successfully');
              } else {
                Alert.alert('Error', response.error || 'Failed to update visibility');
              }
            } catch (error) {
              console.error('Update visibility error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
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

  const getIncidentTypeIcon = (type: string) => {
    switch (type) {
      case 'harassment':
        return 'person-off';
      case 'theft':
        return 'money-off';
      case 'assault':
        return 'pan-tool';
      default:
        return 'category';
    }
  };

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case 'harassment':
        return '#DC2626'; // Red
      case 'theft':
        return '#7C2D12'; // Brown
      case 'assault':
        return '#B91C1C'; // Dark Red
      default:
        return '#6B7280'; // Gray
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: 'public' },
    { value: 'officials_only', label: 'Officials Only', icon: 'admin-panel-settings' },
    { value: 'private', label: 'Private', icon: 'lock' },
  ] as const;

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500">Loading report details...</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500">Report not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#67082F" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#67082F]">Report Details</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Status and Basic Info */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center flex-1">
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-3 shadow-sm"
                style={{ backgroundColor: `${getIncidentTypeColor(report.incidentType)}15` }}
              >
                <MaterialIcons
                  name={getIncidentTypeIcon(report.incidentType) as any}
                  size={24}
                  color={getIncidentTypeColor(report.incidentType)}
                />
              </View>
              <Text className="text-xl font-bold text-gray-800 capitalize flex-1">
                {report.incidentType}
              </Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${getStatusColor(report.status)}20` }}
            >
              <Text
                className="text-sm font-medium capitalize"
                style={{ color: getStatusColor(report.status) }}
              >
                {report.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text className="text-gray-600 text-xs mb-2">
            Report ID: {report.reportId}
          </Text>

          {report.alertId && (
            <Text className="text-gray-600 text-xs mb-2">
              Alert ID: {report.alertId}
            </Text>
          )}

          <View className="flex-row items-center">
            <MaterialIcons name="schedule" size={16} color="#6B7280" />
            <Text className="text-gray-600 text-sm ml-1">
              Incident: {formatDate(report.incidentTime)}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">Description</Text>
            <TouchableOpacity
              onPress={() => handleEdit('description', report.description)}
            >
              <MaterialIcons name="edit" size={20} color="#67082F" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-700 leading-relaxed">{report.description}</Text>
        </View>

        {/* Location */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Location</Text>
          <View className="flex-row items-start">
            <MaterialIcons name="location-on" size={20} color="#67082F" />
            <View className="ml-2 flex-1">
              {report.address && (
                <Text className="text-gray-700 font-medium mb-1">{report.address}</Text>
              )}
              <Text className="text-gray-600 text-sm">
                {report.location.latitude}, {report.location.longitude}
              </Text>
            </View>
          </View>
        </View>

        {/* Visibility Settings */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Visibility</Text>
          <View className="space-y-2">
            {visibilityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`flex-row items-center p-3 rounded-lg ${
                  report.visibility === option.value
                    ? 'bg-[#67082F]/10 border border-[#67082F]'
                    : 'bg-gray-50 border border-transparent'
                }`}
                onPress={() => {
                  if (report.visibility !== option.value) {
                    handleChangeVisibility(option.value);
                  }
                }}
              >
                <MaterialIcons
                  name={option.icon as any}
                  size={20}
                  color={report.visibility === option.value ? '#67082F' : '#6B7280'}
                />
                <Text
                  className={`ml-3 text-sm font-medium ${
                    report.visibility === option.value ? 'text-[#67082F]' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </Text>
                {report.visibility === option.value && (
                  <MaterialIcons
                    name="check"
                    size={16}
                    color="#67082F"
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {report.anonymous && (
            <View className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <View className="flex-row items-center">
                <MaterialIcons name="visibility-off" size={16} color="#F59E0B" />
                <Text className="text-yellow-700 text-sm font-medium ml-2">
                  Anonymous Report
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Taken */}
        {report.actionTaken && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-gray-800">Action Taken</Text>
              <TouchableOpacity
                onPress={() => handleEdit('actionTaken', report.actionTaken || '')}
              >
                <MaterialIcons name="edit" size={20} color="#67082F" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-700">{report.actionTaken}</Text>
          </View>
        )}

        {/* Involved Parties */}
        {report.involvedParties && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-gray-800">Involved Parties</Text>
              <TouchableOpacity
                onPress={() => handleEdit('involvedParties', report.involvedParties || '')}
              >
                <MaterialIcons name="edit" size={20} color="#67082F" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-700">{report.involvedParties}</Text>
          </View>
        )}

        {/* Timestamps */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Timeline</Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <MaterialIcons name="schedule" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">
                Submitted: {formatDate(report.createdAt)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="update" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2">
                Last updated: {formatDate(report.updatedAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="bg-white rounded-lg p-4 mb-8 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Actions</Text>
          <TouchableOpacity
            className="flex-row items-center p-3 bg-[#67082F] rounded-lg"
            onPress={() => router.push(`/reports/evidence?reportId=${report.reportId}` as any)}
          >
            <MaterialIcons name="cloud-upload" size={20} color="white" />
            <Text className="text-white font-medium ml-2">Upload Evidence</Text>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color="white"
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-white">
          <View className="px-4 pt-12 pb-4 border-b border-gray-200">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text className="text-[#67082F] text-base">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold">Edit {editingField}</Text>
              <TouchableOpacity onPress={handleSaveEdit}>
                <Text className="text-[#67082F] text-base font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="flex-1 p-4">
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-gray-800 min-h-32"
              placeholder={`Enter ${editingField}...`}
              value={editValue}
              onChangeText={setEditValue}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
