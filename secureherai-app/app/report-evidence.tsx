import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import apiService from "../services/api";
import { UploadEvidenceRequest } from "../types/report";

export default function EvidenceUploadScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);

  const handleUpload = async () => {
    if (!reportId) {
      Alert.alert('Error', 'Report ID is required');
      return;
    }

    if (evidenceFiles.length === 0) {
      Alert.alert('Error', 'Please select at least one evidence file');
      return;
    }

    setLoading(true);

    try {
      const evidenceData: UploadEvidenceRequest = {
        reportId,
        evidence: evidenceFiles,
        description: description.trim() || undefined,
      };

      const response = await apiService.uploadEvidence(evidenceData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Evidence uploaded successfully',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to upload evidence');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidence = () => {
    // For demo purposes, simulate adding evidence
    Alert.alert(
      'Add Evidence',
      'In production, this would open camera or file picker',
      [
        {
          text: 'Camera',
          onPress: () => {
            // Simulate adding camera evidence
            setEvidenceFiles([...evidenceFiles, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...']);
            Alert.alert('Success', 'Photo added from camera (simulated)');
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            // Simulate adding gallery evidence
            setEvidenceFiles([...evidenceFiles, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...']);
            Alert.alert('Success', 'Photo added from gallery (simulated)');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50 max-w-screen-md mx-auto w-full">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
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
          >
            <MaterialIcons name="add-photo-alternate" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 text-center mt-2">
              Tap to add photos or documents
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
                    <MaterialIcons name="image" size={20} color="#67082F" />
                    <Text className="text-gray-700 ml-2 flex-1" numberOfLines={1}>
                      Evidence {index + 1} (Image)
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const newFiles = evidenceFiles.filter((_, i) => i !== index);
                      setEvidenceFiles(newFiles);
                    }}
                  >
                    <MaterialIcons name="close" size={20} color="#EF4444" />
                  </TouchableOpacity>
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
            • Documents should be in PDF or image format{"\n"}
            • Do not include personal identification of others without consent{"\n"}
            • All evidence will be securely stored and shared only with authorized personnel
          </Text>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          className={`bg-[#67082F] rounded-lg p-4 mb-8 ${
            loading || evidenceFiles.length === 0 ? 'opacity-50' : ''
          }`}
          onPress={handleUpload}
          disabled={loading || evidenceFiles.length === 0}
        >
          <Text className="text-white text-center font-semibold text-base">
            {loading ? 'Uploading...' : 'Upload Evidence'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
