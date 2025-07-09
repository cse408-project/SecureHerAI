import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import apiService from "../../services/api";
import cloudinaryService from "../../services/cloudinary";
import { SubmitReportRequest } from "../../types/report";
import { useAlert } from "../../context/AlertContext";

interface LocationData {
  latitude: string;
  longitude: string;
}

interface EvidenceFile {
  uri: string;
  cloudinaryUrl?: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  uploading?: boolean;
}

export default function SubmitReportScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Form state
  const [incidentType, setIncidentType] = useState<'harassment' | 'theft' | 'assault' | 'other'>('harassment');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'officials_only' | 'private'>('public');
  const [anonymous, setAnonymous] = useState(false);
  const [involvedParties, setInvolvedParties] = useState('');

  // Evidence state
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);

  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Alert context
  const { showAlert, showConfirmAlert } = useAlert();

  // Helper function to determine file type from URI
  const determineFileType = (uri: string): 'image' | 'video' | 'audio' | 'document' => {
    const lowerUri = uri.toLowerCase();
    
    // Check for audio files
    if (lowerUri.includes('audio') || 
        lowerUri.includes('.mp3') || 
        lowerUri.includes('.wav') || 
        lowerUri.includes('.aac') || 
        lowerUri.includes('.ogg') || 
        lowerUri.includes('.flac') || 
        lowerUri.includes('.m4a')) {
      return 'audio';
    }
    
    // Check for video files
    if (lowerUri.includes('video') || 
        lowerUri.includes('.mp4') || 
        lowerUri.includes('.mov') || 
        lowerUri.includes('.avi') || 
        lowerUri.includes('.webm') || 
        lowerUri.includes('.flv') || 
        lowerUri.includes('.wmv')) {
      return 'video';
    }
    
    // Check for document files
    if (lowerUri.includes('.pdf') || 
        lowerUri.includes('.doc') || 
        lowerUri.includes('.docx') || 
        lowerUri.includes('.txt')) {
      return 'document';
    }
    
    // Default to image
    return 'image';
  };

  useEffect(() => {
    // Set default date and time to current
    const now = new Date();
    setIncidentDate(now.toISOString().split('T')[0]);
    setIncidentTime(now.toTimeString().slice(0, 5));
    
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      // For demo purposes, immediately set default location without requiring user interaction
      setCurrentLocation({
        latitude: '23.8103',
        longitude: '90.4125',
      });
      setAddress('Dhaka, Bangladesh');
      
      // Show a toast or alert to inform the user (optional)
      // showAlert(
      //   'Location Set',
      //   'Using default location (Dhaka, Bangladesh) for demo purposes.',
      //   'info'
      // );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get current location');
    } finally {
      setGettingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!description.trim() || description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }

    if (!currentLocation) {
      newErrors.location = 'Location is required';
    }

    if (!incidentDate) {
      newErrors.incidentDate = 'Incident date is required';
    }

    if (!incidentTime) {
      newErrors.incidentTime = 'Incident time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentLocation) {
      Alert.alert('Error', 'Location is required to submit a report');
      return;
    }

    // Check if any evidence files are still uploading
    const uploadingFiles = evidenceFiles.filter(file => file.uploading);
    if (uploadingFiles.length > 0) {
      showAlert('Warning', 'Please wait for all evidence files to finish uploading', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into ISO string
      const incidentDateTime = new Date(`${incidentDate}T${incidentTime}`).toISOString();

      // Get successfully uploaded evidence URLs
      const evidenceUrls = evidenceFiles
        .map(file => file.cloudinaryUrl)
        .filter((url): url is string => !!url);

      const reportData: SubmitReportRequest = {
        incidentType,
        description: description.trim(),
        location: currentLocation,
        address: address.trim() || undefined,
        incidentTime: incidentDateTime,
        visibility,
        anonymous,
        involvedParties: involvedParties.trim() || undefined,
        evidence: evidenceUrls.length > 0 ? evidenceUrls : undefined, // Include evidence if available
      };

      const response = await apiService.submitReport(reportData);

      if (response.success) {
        showAlert(
          'Success',
          evidenceUrls.length > 0 
            ? `Your incident report has been submitted with ${evidenceUrls.length} evidence file${evidenceUrls.length > 1 ? 's' : ''}.`
            : 'Your incident report has been submitted successfully.',
          'success'
        );
        
        // Automatically navigate to reports page after successful submission
        router.replace("/(tabs)/reports" as any);
      } else {
        // Check for duplicate report error
        if (response.error && response.error.includes('similar report already exists')) {
          Alert.alert(
            'Similar Report Detected',
            'Our system detected a very similar report that was recently submitted. To proceed:\n\n• Wait 15 minutes before submitting again, or\n• Add more specific details to differentiate this incident',
            [
              { text: 'Edit Report', style: 'default' },
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: () => console.log('User canceled report submission')
              }
            ]
          );
        } else {
          // Handle other errors
          Alert.alert('Error', response.error || 'Failed to submit report');
        }
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      
      // Check if the error response contains a message about duplicate reports
      if (error?.response?.data?.error && typeof error.response.data.error === 'string' && 
          error.response.data.error.includes('similar report already exists')) {
        Alert.alert(
          'Duplicate Report Detected',
          `${error.response.data.error}\n\nYou can:\n• Add more specific details to your description\n• Wait 15 minutes before submitting again\n• Change the incident type or location if this is a different incident`,
          [
            {
              text: 'Edit Report',
              onPress: () => {
                // Provide more specific guidance for the user
                showAlert('Tip', 'Try adding unique details such as specific time, exact location, or unique identifiers about the incident', 'info');
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      } else {
        // Show more specific error message if available
        const errorMessage = error?.response?.data?.error || error?.message || 'An unexpected error occurred';
        
        // Show a more user-friendly message with possible solutions
        Alert.alert(
          'Error Submitting Report', 
          `${errorMessage}\n\nPossible solutions:\n• Check your internet connection\n• Try again in a few moments\n• Verify all required fields are filled`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCameraUpload = async () => {
    try {
      setShowImagePickerModal(false);
      setIsUploadingToCloud(true);
      showAlert("Info", "Opening camera...", "info");
      
      const result = await cloudinaryService.takeEvidencePhotoWithCamera();
      
      if (result && !result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const fileType = determineFileType(asset.uri);
        
        const newFile: EvidenceFile = {
          uri: asset.uri,
          type: fileType,
          name: `Evidence_${Date.now()}.${asset.uri.split('.').pop()?.toLowerCase() || 'jpg'}`,
          uploading: true,
        };
        
        setEvidenceFiles(prev => [...prev, newFile]);
        
        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadEvidence(asset.uri);

        if (uploadResult.success && uploadResult.url) {
          setEvidenceFiles(prev => 
            prev.map(file => 
              file.uri === asset.uri 
                ? { ...file, cloudinaryUrl: uploadResult.url, uploading: false }
                : file
            )
          );
          showAlert("Success", "Evidence uploaded to cloud storage successfully!", "success");
        } else {
          showAlert("Error", uploadResult.error || "Failed to upload to cloud storage", "error");
          // Remove the failed file
          setEvidenceFiles(prev => prev.filter(file => file.uri !== asset.uri));
        }
      } else {
        showAlert("Info", "Photo capture was cancelled", "info");
      }
    } catch (error) {
      console.error("Camera upload error:", error);
      showAlert("Error", "Failed to take photo. Please try again.", "error");
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      setShowImagePickerModal(false);
      setIsUploadingToCloud(true);
      showAlert("Info", "Opening gallery...", "info");
      
      const result = await cloudinaryService.pickMultipleImagesFromGallery();
      
      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const newFiles: EvidenceFile[] = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: determineFileType(asset.uri),
          name: `Evidence_${Date.now()}_${index + 1}.${asset.uri.split('.').pop()?.toLowerCase() || 'jpg'}`,
          uploading: true,
        }));
        
        setEvidenceFiles(prev => [...prev, ...newFiles]);
        
        // Upload all files to Cloudinary
        const uploadPromises = result.assets.map(async (asset) => {
          try {
            const uploadResult = await cloudinaryService.uploadEvidence(asset.uri);
            
            if (uploadResult.success && uploadResult.url) {
              setEvidenceFiles(prev => 
                prev.map(file => 
                  file.uri === asset.uri 
                    ? { ...file, cloudinaryUrl: uploadResult.url, uploading: false }
                    : file
                )
              );
              return { success: true, uri: asset.uri, url: uploadResult.url };
            } else {
              // Remove failed file
              setEvidenceFiles(prev => prev.filter(file => file.uri !== asset.uri));
              return { success: false, uri: asset.uri, error: uploadResult.error };
            }
          } catch (error) {
            setEvidenceFiles(prev => prev.filter(file => file.uri !== asset.uri));
            return { success: false, uri: asset.uri, error: 'Upload failed' };
          }
        });

        const results = await Promise.all(uploadPromises);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        if (successful > 0) {
          showAlert("Success", `${successful} file(s) uploaded successfully!`, "success");
        }
        if (failed > 0) {
          showAlert("Warning", `${failed} file(s) failed to upload`, "warning");
        }
      } else {
        showAlert("Info", "File selection was cancelled", "info");
      }
    } catch (error) {
      console.error("Gallery upload error:", error);
      showAlert("Error", "Failed to pick files from gallery. Please try again.", "error");
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  const handleAddEvidence = () => {
    setShowImagePickerModal(true);
  };

  const removeEvidenceFile = (index: number) => {
    showConfirmAlert(
      "Remove Evidence",
      "Are you sure you want to remove this evidence file?",
      () => {
        setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
        showAlert("Info", "Evidence file removed", "info");
      },
      undefined,
      "warning"
    );
  };

  const getFileIcon = (type: 'image' | 'video' | 'audio' | 'document') => {
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'videocam';
      case 'audio': return 'audiotrack';
      case 'document': return 'description';
      default: return 'attachment';
    }
  };

  const getFileIconColor = (type: 'image' | 'video' | 'audio' | 'document') => {
    switch (type) {
      case 'image': return '#10B981';
      case 'video': return '#3B82F6';
      case 'audio': return '#8B5CF6';
      case 'document': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const incidentTypes = [
    { value: 'harassment', label: 'Harassment', icon: 'person-off', color: '#DC2626' },
    { value: 'theft', label: 'Theft', icon: 'money-off', color: '#7C2D12' },
    { value: 'assault', label: 'Assault', icon: 'pan-tool', color: '#B91C1C' },
    { value: 'other', label: 'Other', icon: 'category', color: '#6B7280' },
  ] as const;

  const visibilityOptions = [
    { value: 'public', label: 'Public', description: 'Visible to all users and officials' },
    { value: 'officials_only', label: 'Officials Only', description: 'Visible to authorities only' },
    { value: 'private', label: 'Private', description: 'Visible only to you' },
  ] as const;

  return (
    <View className="flex-1 bg-[#FFE4D6] max-w-screen-md mx-auto w-full">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => {
            // Check if we can go back, otherwise navigate to reports screen
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/reports');
            }
          }}>
            <MaterialIcons name="arrow-back" size={24} color="#67082F" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-[#67082F]">Submit Report</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Incident Type */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Incident Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {incidentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                  incidentType === type.value
                    ? 'border-2'
                    : 'bg-gray-50 border-gray-200'
                }`}
                style={incidentType === type.value ? {
                  backgroundColor: `${type.color}15`,
                  borderColor: type.color
                } : {}}
                onPress={() => setIncidentType(type.value)}
              >
                <View 
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: incidentType === type.value ? type.color : `${type.color}20` }}
                >
                  <MaterialIcons
                    name={type.icon as any}
                    size={18}
                    color={incidentType === type.value ? 'white' : type.color}
                  />
                </View>
                <Text
                  className={`text-sm font-semibold ${
                    incidentType === type.value ? 'text-gray-800' : 'text-gray-600'
                  }`}
                  style={incidentType === type.value ? { color: type.color } : {}}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Description</Text>
          <TextInput
            className={`border border-gray-300 rounded-lg p-3 text-gray-800 min-h-24 ${
              errors.description ? 'border-red-500' : ''
            }`}
            placeholder="Describe what happened... (minimum 10 characters)"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
          {errors.description && (
            <Text className="text-red-500 text-sm mt-1">{errors.description}</Text>
          )}
          <Text className="text-gray-500 text-xs mt-2">
            {description.length}/2000 characters
          </Text>
        </View>

        {/* Location */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Location</Text>
          
          <TouchableOpacity
            className="flex-row items-center justify-between p-3 bg-gray-100 rounded-lg mb-3"
            onPress={getCurrentLocation}
            disabled={gettingLocation}
          >
            <View className="flex-row items-center flex-1">
              <MaterialIcons 
                name="my-location" 
                size={20} 
                color={gettingLocation ? '#9CA3AF' : '#67082F'} 
              />
              <Text className={`ml-2 text-sm ${gettingLocation ? 'text-gray-500' : 'text-gray-800'}`}>
                {gettingLocation ? 'Getting location...' : 'Use current location'}
              </Text>
            </View>
            {currentLocation && (
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
            )}
          </TouchableOpacity>

          {currentLocation && (
            <View className="p-3 bg-green-50 rounded-lg">
              <Text className="text-sm text-green-700">
                📍 {currentLocation.latitude}, {currentLocation.longitude}
              </Text>
            </View>
          )}

          {errors.location && (
            <Text className="text-red-500 text-sm mt-1">{errors.location}</Text>
          )}
        </View>

        {/* Address */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Address (Optional)</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800"
            placeholder="Enter specific address or landmark"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Incident Time */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">When did this happen?</Text>
          
          <View className="flex-row space-x-3">
            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-2">Date</Text>
              <TextInput
                className={`border border-gray-300 rounded-lg p-3 text-gray-800 ${
                  errors.incidentDate ? 'border-red-500' : ''
                }`}
                placeholder="YYYY-MM-DD"
                value={incidentDate}
                onChangeText={setIncidentDate}
                placeholderTextColor="#9CA3AF"
              />
              {errors.incidentDate && (
                <Text className="text-red-500 text-xs mt-1">{errors.incidentDate}</Text>
              )}
            </View>
            
            <View className="flex-1">
              <Text className="text-sm text-gray-600 mb-2">Time</Text>
              <TextInput
                className={`border border-gray-300 rounded-lg p-3 text-gray-800 ${
                  errors.incidentTime ? 'border-red-500' : ''
                }`}
                placeholder="HH:MM"
                value={incidentTime}
                onChangeText={setIncidentTime}
                placeholderTextColor="#9CA3AF"
              />
              {errors.incidentTime && (
                <Text className="text-red-500 text-xs mt-1">{errors.incidentTime}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Visibility */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Who can see this report?</Text>
          {visibilityOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`flex-row items-center p-3 rounded-lg mb-2 border ${
                visibility === option.value
                  ? 'bg-[#67082F]/10 border-[#67082F]'
                  : 'bg-gray-50 border-gray-200'
              }`}
              onPress={() => setVisibility(option.value)}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 ${
                  visibility === option.value
                    ? 'border-[#67082F] bg-[#67082F]'
                    : 'border-gray-400'
                }`}
              >
                {visibility === option.value && (
                  <View className="flex-1 items-center justify-center">
                    <View className="w-2 h-2 rounded-full bg-white" />
                  </View>
                )}
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-medium ${
                    visibility === option.value ? 'text-[#67082F]' : 'text-gray-800'
                  }`}
                >
                  {option.label}
                </Text>
                <Text className="text-xs text-gray-500">{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Anonymous Option */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <TouchableOpacity
            className="flex-row items-center justify-between"
            onPress={() => setAnonymous(!anonymous)}
          >
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-800">Submit Anonymously</Text>
              <Text className="text-sm text-gray-600 mt-1">
                Your identity will be hidden in the report
              </Text>
            </View>
            <View
              className={`w-12 h-6 rounded-full ${
                anonymous ? 'bg-[#67082F]' : 'bg-gray-300'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-all ${
                  anonymous ? 'ml-6' : 'ml-0.5'
                }`}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Involved Parties */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Involved Parties (Optional)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800 min-h-20"
            placeholder="Describe suspects, witnesses, or other involved parties..."
            value={involvedParties}
            onChangeText={setInvolvedParties}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Evidence Upload Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Evidence (Optional)</Text>
          
          <TouchableOpacity
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center mb-4"
            onPress={handleAddEvidence}
            disabled={isUploadingToCloud}
          >
            <MaterialIcons 
              name="add-photo-alternate" 
              size={48} 
              color={isUploadingToCloud ? "#9CA3AF" : "#67082F"} 
            />
            <Text className={`text-center mt-2 ${isUploadingToCloud ? 'text-gray-400' : 'text-gray-700'}`}>
              {isUploadingToCloud ? 'Uploading...' : 'Tap to add photos, videos or documents'}
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Camera, Gallery, or Files
            </Text>
          </TouchableOpacity>

          {evidenceFiles.length > 0 && (
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                {evidenceFiles.length} file(s) selected
              </Text>
              {evidenceFiles.map((file, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
                >
                  <View className="flex-row items-center flex-1">
                    {file.type === 'image' && file.uri ? (
                      <Image 
                        source={{ uri: file.uri }} 
                        className="w-10 h-10 rounded"
                        resizeMode="cover"
                      />
                    ) : (
                      <MaterialIcons 
                        name={getFileIcon(file.type) as any} 
                        size={20} 
                        color={getFileIconColor(file.type)} 
                      />
                    )}
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-700 font-medium" numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text className="text-gray-500 text-xs capitalize">
                        {file.type} • {file.uploading ? 'Uploading...' : file.cloudinaryUrl ? 'Uploaded' : 'Ready'}
                      </Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    {file.uploading && (
                      <ActivityIndicator size="small" color="#67082F" className="mr-2" />
                    )}
                    {file.cloudinaryUrl && !file.uploading && (
                      <MaterialIcons name="cloud-done" size={20} color="#10B981" className="mr-2" />
                    )}
                    <TouchableOpacity
                      onPress={() => removeEvidenceFile(index)}
                      disabled={file.uploading}
                    >
                      <MaterialIcons 
                        name="close" 
                        size={20} 
                        color={file.uploading ? "#9CA3AF" : "#EF4444"} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Evidence Guidelines */}
          <View className="bg-blue-50 rounded-lg p-3 mt-3 border border-blue-200">
            <View className="flex-row items-center mb-2">
              <MaterialIcons name="info" size={16} color="#3B82F6" />
              <Text className="text-blue-700 font-medium ml-2 text-sm">Evidence Guidelines</Text>
            </View>
            <Text className="text-blue-600 text-xs leading-relaxed">
              • Photos should be clear and show relevant details{"\n"}
              • Videos should be under 50MB{"\n"}
              • Evidence will be securely stored and shared only with authorized personnel
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`bg-[#67082F] rounded-lg p-4 mb-8 ${
            loading || isUploadingToCloud ? 'opacity-50' : ''
          }`}
          onPress={handleSubmit}
          disabled={loading || isUploadingToCloud}
        >
          {loading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-white text-center font-semibold text-base ml-2">
                Submitting...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              Submit Report
              {evidenceFiles.length > 0 && ` (${evidenceFiles.length} evidence file${evidenceFiles.length > 1 ? 's' : ''})`}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
              Select Evidence Source
            </Text>
            
            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-3"
              onPress={handleCameraUpload}
            >
              <MaterialIcons name="camera-alt" size={24} color="#67082F" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-medium">Camera</Text>
                <Text className="text-gray-500 text-sm">Take a photo or video</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-lg mb-4"
              onPress={handleGalleryUpload}
            >
              <MaterialIcons name="photo-library" size={24} color="#67082F" />
              <View className="ml-3 flex-1">
                <Text className="text-gray-800 font-medium">Gallery</Text>
                <Text className="text-gray-500 text-sm">Choose from gallery</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="p-3 bg-gray-200 rounded-lg"
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text className="text-gray-700 text-center font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Loading Overlay */}
      {isUploadingToCloud && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
        >
          <View className="flex-1 bg-black/70 items-center justify-center">
            <View className="bg-white rounded-lg p-6 items-center min-w-48">
              <ActivityIndicator size="large" color="#67082F" />
              <Text className="text-gray-800 font-medium mt-4">Uploading to Cloud</Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Please wait while we securely upload your evidence...
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
