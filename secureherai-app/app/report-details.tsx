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
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
import apiService from "../services/api";
import { ReportDetails, UpdateReportRequest } from "../types/report";

export default function ReportDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { showAlert, showConfirmAlert } = useAlert();
  const [report, setReport] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string>('');
  const [editValue, setEditValue] = useState('');

  // Extract ID from params, handle both single string and array cases
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Debug log the ID parameter
  console.log('Report Details Screen - Raw params:', params);
  console.log('Report Details Screen - Extracted ID:', id);
  console.log('Report Details Screen - ID type:', typeof id);

  useEffect(() => {
    if (id && id.trim()) {
      loadReportDetails();
    } else {
      console.error('No valid ID provided to ReportDetailsScreen');
      setLoading(false);
    }
  }, [id]);

  const loadReportDetails = async () => {
    if (!id || !id.trim()) {
      console.error('No report ID provided');
      showAlert('Error', 'No report ID provided', 'error', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }
    
    console.log('Loading report details for ID:', id);
    
    try {
      const response = await apiService.getReportDetails(id.trim());
      console.log('Report details response:', response);
      
      if (response.success && response.report) {
        setReport(response.report);
        console.log('Report loaded successfully');
      } else {
        console.error('Failed to load report:', response.error);
        showAlert('Error', response.error || 'Failed to load report details', 'error', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Load report details error:', error);
      
      // Check if it's a network error
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        showAlert('Error', 'Network connection failed. Please check your internet connection.', 'error', [
          { text: 'Retry', onPress: () => loadReportDetails() },
          { text: 'Go Back', onPress: () => router.back() }
        ]);
      } else {
        showAlert('Error', 'An unexpected error occurred while loading the report', 'error', [
          { text: 'Retry', onPress: () => loadReportDetails() },
          { text: 'Go Back', onPress: () => router.back() }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: string, currentValue: string) => {
    if (field === 'incidentTime') {
      // For now, treat as text input - could be enhanced with date picker later
      setEditingField(field);
      setEditValue(currentValue);
      setShowEditModal(true);
    } else if (field === 'location') {
      // Show location coordinates as "latitude,longitude"
      const locationValue = `${report?.location.latitude || ''},${report?.location.longitude || ''}`;
      setEditingField(field);
      setEditValue(locationValue);
      setShowEditModal(true);
    } else {
      setEditingField(field);
      setEditValue(currentValue);
      setShowEditModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!report || !editingField || !editValue.trim()) return;

    try {
      let updateData: UpdateReportRequest = {
        reportId: report.reportId,
      };

      // Handle different field types
      if (editingField === 'address') {
        updateData.address = editValue.trim();
      } else if (editingField === 'incidentTime') {
        updateData.incidentTime = editValue.trim();
      } else if (editingField === 'location') {
        // Parse "latitude,longitude" format
        const [lat, lng] = editValue.trim().split(',');
        if (lat && lng) {
          updateData.location = {
            latitude: lat.trim(),
            longitude: lng.trim(),
          };
        } else {
          showAlert('Error', 'Please enter location in format: latitude,longitude', 'error');
          return;
        }
      } else if (editingField === 'description') {
        updateData.description = editValue.trim();
      } else if (editingField === 'actionTaken') {
        updateData.actionTaken = editValue.trim();
      } else if (editingField === 'involvedParties') {
        updateData.involvedParties = editValue.trim();
      }

      const response = await apiService.updateReport(updateData);
      if (response.success) {
        // Update local state
        if (editingField === 'address') {
          setReport({
            ...report,
            address: editValue.trim(),
          });
        } else if (editingField === 'incidentTime') {
          setReport({
            ...report,
            incidentTime: editValue.trim(),
          });
        } else if (editingField === 'location') {
          const [lat, lng] = editValue.trim().split(',');
          setReport({
            ...report,
            location: {
              ...report.location,
              latitude: parseFloat(lat.trim()),
              longitude: parseFloat(lng.trim()),
            },
          });
        } else if (editingField === 'description') {
          setReport({
            ...report,
            description: editValue.trim(),
          });
        } else if (editingField === 'actionTaken') {
          setReport({
            ...report,
            actionTaken: editValue.trim(),
          });
        } else if (editingField === 'involvedParties') {
          setReport({
            ...report,
            involvedParties: editValue.trim(),
          });
        }
        setShowEditModal(false);
        showAlert('Success', 'Report updated successfully', 'success');
      } else {
        showAlert('Error', response.error || 'Failed to update report', 'error');
      }
    } catch (error) {
      console.error('Update report error:', error);
      showAlert('Error', 'An unexpected error occurred', 'error');
    }
  };

  const handleChangeVisibility = (newVisibility: 'public' | 'officials_only' | 'private') => {
    showConfirmAlert(
      'Change Visibility',
      `Are you sure you want to change visibility to ${newVisibility.replace('_', ' ')}?`,
      async () => {
        if (!report) return;
        
        try {
          const updateData: UpdateReportRequest = {
            reportId: report.reportId,
            visibility: newVisibility,
          };

          const response = await apiService.updateReport(updateData);
          if (response.success) {
            setReport({ ...report, visibility: newVisibility });
            showAlert('Success', 'Visibility updated successfully', 'success');
          } else {
            showAlert('Error', response.error || 'Failed to update visibility', 'error');
          }
        } catch (error) {
          console.error('Update visibility error:', error);
          showAlert('Error', 'An unexpected error occurred', 'error');
        }
      },
      undefined,
      'warning'
    );
  };

  const handleDeleteReport = async () => {
    if (!report) return;

    console.log('🗑️ Delete button pressed!');
    console.log('🗑️ Delete button clicked for report:', report.reportId);
    
    console.log('🗑️ Showing custom confirmation alert...');
    showConfirmAlert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      async () => {
        console.log('🗑️ User confirmed deletion');
        try {
          const response = await apiService.deleteReport(report.reportId);
          if (response.success) {
            showAlert(
              'Success',
              'Report deleted successfully',
              'success',
              [{ text: 'OK', onPress: () => router.back() }]
            );
          } else {
            showAlert('Error', response.error || 'Failed to delete report', 'error');
          }
        } catch (error) {
          console.error('Delete report error:', error);
          showAlert('Error', 'An unexpected error occurred', 'error');
        }
      },
      () => {
        console.log('🗑️ User cancelled deletion');
      },
      'error'
    );
  };

  const handleChangeStatus = (newStatus: 'submitted' | 'under_review' | 'resolved') => {
    showConfirmAlert(
      'Change Report Status',
      `Are you sure you want to change the status to "${newStatus.replace('_', ' ')}"?`,
      async () => {
        if (!report) return;
        
        try {
          const updateData: UpdateReportRequest = {
            reportId: report.reportId,
            status: newStatus,
          };

          const response = await apiService.updateReport(updateData);
          if (response.success) {
            setReport({ ...report, status: newStatus });
            showAlert('Success', 'Report status updated successfully', 'success');
          } else {
            showAlert('Error', response.error || 'Failed to update status', 'error');
          }
        } catch (error) {
          console.error('Update status error:', error);
          showAlert('Error', 'An unexpected error occurred', 'error');
        }
      },
      undefined,
      'warning'
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

  if (!report) {
    if (loading) {
      return (
        <View className="flex-1 bg-gray-50 justify-center items-center max-w-screen-md mx-auto w-full">
          <Text className="text-gray-500 mb-2">Loading report details...</Text>
          {id && (
            <Text className="text-gray-400 text-xs">Report ID: {id}</Text>
          )}
        </View>
      );
    }

    return (
      <View className="flex-1 bg-gray-50 justify-center items-center max-w-screen-md mx-auto w-full">
        <MaterialIcons name="error-outline" size={48} color="#6B7280" />
        <Text className="text-gray-500 text-lg font-medium mt-4 mb-2">Report not found</Text>
        {id && (
          <Text className="text-gray-400 text-sm mb-4">Report ID: {id}</Text>
        )}
        <TouchableOpacity
          className="bg-[#67082F] px-6 py-3 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 max-w-screen-md mx-auto w-full">
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

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <MaterialIcons name="schedule" size={16} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-1">
                Incident: {formatDate(report.incidentTime)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleEdit('incidentTime', report.incidentTime)}
            >
              <MaterialIcons name="edit" size={16} color="#67082F" />
            </TouchableOpacity>
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
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">Location</Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => handleEdit('address', report.address || '')}
              >
                <MaterialIcons name="edit-location" size={20} color="#67082F" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleEdit('location', '')}
              >
                <MaterialIcons name="gps-fixed" size={20} color="#67082F" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-row items-start">
            <MaterialIcons name="location-on" size={20} color="#67082F" />
            <View className="ml-2 flex-1">
              {report.address && (
                <Text className="text-gray-700 font-medium mb-1">{report.address}</Text>
              )}
              <Text className="text-gray-600 text-sm">
                Coordinates: {report.location.latitude}, {report.location.longitude}
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
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">Action Taken</Text>
            <TouchableOpacity
              onPress={() => handleEdit('actionTaken', report.actionTaken || '')}
            >
              <MaterialIcons name="edit" size={20} color="#67082F" />
            </TouchableOpacity>
          </View>
          {report.actionTaken ? (
            <Text className="text-gray-700">{report.actionTaken}</Text>
          ) : (
            <Text className="text-gray-500 italic">No action taken yet. Click edit to add information.</Text>
          )}
        </View>

        {/* Involved Parties */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-800">Involved Parties</Text>
            <TouchableOpacity
              onPress={() => handleEdit('involvedParties', report.involvedParties || '')}
            >
              <MaterialIcons name="edit" size={20} color="#67082F" />
            </TouchableOpacity>
          </View>
          {report.involvedParties ? (
            <Text className="text-gray-700">{report.involvedParties}</Text>
          ) : (
            <Text className="text-gray-500 italic">No involved parties information. Click edit to add details.</Text>
          )}
        </View>

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

        {/* Responder Actions (Only visible to responders) */}
        {user?.role === 'RESPONDER' && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="security" size={20} color="#67082F" />
              <Text className="text-base font-semibold text-gray-800 ml-2">Responder Actions</Text>
            </View>
            
            {/* Current Status */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Current Status</Text>
              <View className="flex-row items-center">
                <View
                  className="px-3 py-1 rounded-full mr-2"
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
            </View>

            {/* Status Change Options */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-3">Update Status</Text>
              <View className="space-y-2">
                {report.status !== 'under_review' && (
                  <TouchableOpacity
                    className="flex-row items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    onPress={() => handleChangeStatus('under_review')}
                  >
                    <MaterialIcons name="hourglass-empty" size={20} color="#F59E0B" />
                    <Text className="text-yellow-700 font-medium ml-3">Mark as Under Review</Text>
                    <Text className="text-yellow-600 text-xs ml-auto">Taking Action</Text>
                  </TouchableOpacity>
                )}
                
                {report.status !== 'resolved' && (
                  <TouchableOpacity
                    className="flex-row items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                    onPress={() => handleChangeStatus('resolved')}
                  >
                    <MaterialIcons name="check-circle" size={20} color="#10B981" />
                    <Text className="text-green-700 font-medium ml-3">Mark as Resolved</Text>
                    <Text className="text-green-600 text-xs ml-auto">Case Solved</Text>
                  </TouchableOpacity>
                )}

                {report.status !== 'submitted' && (
                  <TouchableOpacity
                    className="flex-row items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    onPress={() => handleChangeStatus('submitted')}
                  >
                    <MaterialIcons name="assignment" size={20} color="#3B82F6" />
                    <Text className="text-blue-700 font-medium ml-3">Revert to Submitted</Text>
                    <Text className="text-blue-600 text-xs ml-auto">Needs Review</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Info note */}
              <View className="mt-3 p-3 bg-gray-50 rounded-lg">
                <View className="flex-row items-start">
                  <MaterialIcons name="info" size={16} color="#6B7280" />
                  <Text className="text-gray-600 text-xs ml-2 flex-1">
                    Status updates help track case progress. Use "Under Review" when taking action, and "Resolved" when the case is complete.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="bg-white rounded-lg p-4 mb-8 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Actions</Text>
          
          <TouchableOpacity
            className="flex-row items-center p-3 bg-[#67082F] rounded-lg mb-3"
            onPress={() => router.push(`/report-evidence?reportId=${report.reportId}` as any)}
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

          <TouchableOpacity
            className="flex-row items-center p-3 bg-red-600 rounded-lg"
            onPress={handleDeleteReport}
          >
            <MaterialIcons name="delete" size={20} color="white" />
            <Text className="text-white font-medium ml-2">Delete Report</Text>
            <MaterialIcons
              name="arrow-forward"
              size={16}
              color="white"
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
        </View>

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
              {editingField === 'location' ? (
                <View>
                  <Text className="text-sm text-gray-600 mb-2">
                    Enter coordinates in format: latitude,longitude
                  </Text>
                  <Text className="text-xs text-gray-500 mb-3">
                    Example: 23.8103,90.4125
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 text-gray-800"
                    placeholder="23.8103,90.4125"
                    value={editValue}
                    onChangeText={setEditValue}
                    autoFocus
                    keyboardType="numeric"
                  />
                </View>
              ) : editingField === 'incidentTime' ? (
                <View>
                  <Text className="text-sm text-gray-600 mb-2">
                    Enter date and time in ISO format
                  </Text>
                  <Text className="text-xs text-gray-500 mb-3">
                    Example: 2023-10-01T14:20:00
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg p-3 text-gray-800"
                    placeholder="2023-10-01T14:20:00"
                    value={editValue}
                    onChangeText={setEditValue}
                    autoFocus
                  />
                </View>
              ) : (
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 text-gray-800 min-h-32"
                  placeholder={`Enter ${editingField}...`}
                  value={editValue}
                  onChangeText={setEditValue}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
