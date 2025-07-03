import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import apiService from "../../services/api";
import cloudinaryService from "../../services/cloudinary";
import { UploadEvidenceRequest } from "../../types/report";
import { useAlert } from "../../context/AlertContext";

interface EvidenceFile {
  uri: string;
  cloudinaryUrl?: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  uploading?: boolean;
}

export default function EvidenceUploadScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);
  
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

  // Helper function to get file extension based on type
  const getFileExtension = (type: 'image' | 'video' | 'audio' | 'document'): string => {
    switch (type) {
      case 'image': return 'jpg';
      case 'video': return 'mp4';
      case 'audio': return 'mp3';
      case 'document': return 'pdf';
      default: return 'jpg';
    }
  };

  const handleUpload = async () => {
    if (!reportId) {
      showAlert('Error', 'Report ID is required', 'error');
      return;
    }

    if (evidenceFiles.length === 0) {
      showAlert('Error', 'Please select at least one evidence file', 'error');
      return;
    }

    // Check if all files have been uploaded to Cloudinary
    const unuploadedFiles = evidenceFiles.filter(file => !file.cloudinaryUrl);
    if (unuploadedFiles.length > 0) {
      showAlert('Error', 'Please wait for all files to finish uploading to cloud storage', 'error');
      return;
    }

    setLoading(true);

    try {
      const evidenceUrls = evidenceFiles
        .map(file => file.cloudinaryUrl)
        .filter((url): url is string => !!url);

      const evidenceData: UploadEvidenceRequest = {
        reportId,
        evidence: evidenceUrls,
        description: description.trim() || undefined,
      };

      const response = await apiService.uploadEvidence(evidenceData);

      if (response.success) {
        showAlert(
          'Success',
          'Evidence uploaded successfully',
          'success'
        );
        router.replace('/(tabs)/reports');
      } else {
        showAlert('Error', response.error || 'Failed to upload evidence', 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showAlert('Error', 'An unexpected error occurred', 'error');
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
          name: `Evidence_${Date.now()}.${getFileExtension(fileType)}`,
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
          <Text className="text-lg font-bold text-[#67082F]">Upload Evidence</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Description */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">
            Evidence Description (Optional)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800 min-h-20"
            placeholder="Describe the evidence you're uploading..."
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Evidence Files */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-800 mb-3">Evidence Files</Text>
          
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
        </View>

        {/* Guidelines */}
        <View className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-200">
          <View className="flex-row items-center mb-2">
            <MaterialIcons name="info" size={20} color="#3B82F6" />
            <Text className="text-blue-700 font-semibold ml-2">Evidence Guidelines</Text>
          </View>
          <Text className="text-blue-600 text-sm leading-relaxed">
            • Photos should be clear and show relevant details{"\n"}
            • Videos should be under 50MB{"\n"}
            • Audio files supported: MP3, WAV, AAC, OGG, FLAC, M4A{"\n"}
            • Documents should be in PDF or image format{"\n"}
            • Do not include personal identification of others without consent{"\n"}
            • All evidence will be securely stored and shared only with authorized personnel
          </Text>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          className={`bg-[#67082F] rounded-lg p-4 mb-8 ${
            loading || evidenceFiles.length === 0 || isUploadingToCloud ? 'opacity-50' : ''
          }`}
          onPress={handleUpload}
          disabled={loading || evidenceFiles.length === 0 || isUploadingToCloud}
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
              Upload Evidence to Report
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
