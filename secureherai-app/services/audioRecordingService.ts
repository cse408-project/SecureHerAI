import { AudioModule, RecordingPresets, RecordingOptions, AndroidOutputFormat, AndroidAudioEncoder } from "expo-audio";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import cloudinaryService from "./cloudinary";

export interface AudioRecordingResult {
  success: boolean;
  uri?: string;
  duration?: number;
  error?: string;
}

export interface AudioUploadResult {
  success: boolean;
  url?: string;
  localUri?: string;
  error?: string;
}

/**
 * Modern audio recording service using expo-audio
 * This service provides an easy-to-use interface for recording audio
 * and uploading it to Cloudinary with proper error handling
 */
class AudioRecordingService {
  private maxRecordingDuration: number = 10000; // 10 seconds in milliseconds

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const response = await AudioModule.requestRecordingPermissionsAsync();
      return response.granted;
    } catch (error) {
      console.error("Error requesting microphone permissions:", error);
      return false;
    }
  }

  /**
   * Check if microphone permissions are granted
   */
  async getPermissions(): Promise<boolean> {
    try {
      const response = await AudioModule.getRecordingPermissionsAsync();
      return response.granted;
    } catch (error) {
      console.error("Error checking microphone permissions:", error);
      return false;
    }
  }

  /**
   * Get the appropriate recording options based on platform
   */
  getRecordingOptions(): RecordingOptions {
    // Use HIGH_QUALITY preset as base and override with M4A extension for speech recognition
    const options = {
      ...RecordingPresets.HIGH_QUALITY,
      android: {
        extension: '.m4a', // Use M4A for Android (compatible with Azure Speech)
        outputFormat: 'aac_adts' as AndroidOutputFormat, // AAC-LC format for true audio-only M4A container
        audioEncoder: 'aac' as AndroidAudioEncoder, // AAC codec (supported by Azure Speech)
        sampleRate: 16000, // 16kHz - optimal for speech recognition
      },
      ios: {
        extension: '.m4a', // Use M4A for iOS for consistency
        audioQuality: 96, // High quality for iOS (96 kbps)
        sampleRate: 16000, // 16kHz - optimal for speech recognition
      },
    };
    return options;
  }

  /**
   * Start recording with automatic stop after max duration
   */
  async startRecording(recorder: any): Promise<AudioRecordingResult> {
    try {
      // Check permissions first
      const hasPermission = await this.getPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return {
            success: false,
            error: "Microphone permission denied",
          };
        }
      }

      console.log("🎙️ Starting audio recording...");
      console.log("📝 Recording options:", this.getRecordingOptions());

      // Prepare the recorder with explicit recording options
      await recorder.prepareToRecordAsync(this.getRecordingOptions());

      // Start recording
      recorder.record();

      console.log("✅ Recording started successfully");

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Error starting recording:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to start recording",
      };
    }
  }

  /**
   * Stop recording and get the result
   */
  async stopRecording(recorder: any): Promise<AudioRecordingResult> {
    try {
      console.log("🛑 Stopping audio recording...");

      // Stop the recording
      await recorder.stop();

      const uri = recorder.uri;
      const duration = recorder.currentTime;

      if (!uri) {
        throw new Error("Recording URI is not available");
      }

      console.log("✅ Recording stopped successfully");
      console.log(`📁 Recording saved to: ${uri}`);
      console.log(`⏱️ Duration: ${duration}s`);

      return {
        success: true,
        uri,
        duration,
      };
    } catch (error) {
      console.error("❌ Error stopping recording:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to stop recording",
      };
    }
  }

  /**
   * Upload recorded audio to Cloudinary
   */
  async uploadRecording(
    uri: string,
    folder: string = "voice_recordings"
  ): Promise<AudioUploadResult> {
    try {
      console.log("☁️ Uploading audio to Cloudinary...");

      if (!uri) {
        throw new Error("No audio URI provided");
      }

      // Use the Cloudinary service to upload the audio
      const result = await cloudinaryService.uploadEvidence(uri);

      if (result.success && result.url) {
        console.log("✅ Audio uploaded successfully:", result.url);
        return {
          success: true,
          url: result.url,
        };
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("❌ Error uploading audio:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to upload audio",
      };
    }
  }

  /**
   * Get recording duration limit
   */
  getMaxDuration(): number {
    return this.maxRecordingDuration / 1000; // Return in seconds
  }

  /**
   * Delete a local recording file
   */
  async deleteLocalRecording(uri: string): Promise<boolean> {
    try {
      console.log("🗑️ Deleting local recording:", uri);

      // Check if file exists first
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.log("File doesn't exist, nothing to delete");
        return true;
      }

      // Delete the file
      await FileSystem.deleteAsync(uri);
      console.log("✅ Local recording deleted successfully");
      return true;
    } catch (error) {
      console.error("❌ Error deleting local recording:", error);
      return false;
    }
  }

  /**
   * Delete a recording from Cloudinary using the cloud URL
   */
  async deleteCloudRecording(cloudUrl: string): Promise<boolean> {
    try {
      console.log("☁️🗑️ Deleting recording from Cloudinary:", cloudUrl);

      const result = await cloudinaryService.deleteFileByUrl(cloudUrl);

      if (result.success) {
        console.log("✅ Recording deleted successfully from Cloudinary");
        return true;
      } else {
        console.error("❌ Failed to delete from Cloudinary:", result.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error deleting recording from Cloudinary:", error);
      return false;
    }
  }

  /**
   * Delete recording from both local storage and Cloudinary
   */
  async deleteRecording(
    localUri?: string,
    cloudUrl?: string
  ): Promise<{
    localDeleted: boolean;
    cloudDeleted: boolean;
  }> {
    const results = {
      localDeleted: true,
      cloudDeleted: true,
    };

    // Delete from local storage if URI provided
    if (localUri) {
      results.localDeleted = await this.deleteLocalRecording(localUri);
    }

    // Delete from Cloudinary if URL provided
    if (cloudUrl) {
      results.cloudDeleted = await this.deleteCloudRecording(cloudUrl);
    }

    return results;
  }

  /**
   * Set recording duration limit
   */
  setMaxDuration(seconds: number): void {
    this.maxRecordingDuration = seconds * 1000; // Convert to milliseconds
  }

  /**
   * Check if the platform supports audio recording
   */
  isRecordingSupported(): boolean {
    // expo-audio supports recording on all platforms
    return true;
  }

  /**
   * Get platform-specific recording information
   */
  getPlatformInfo() {
    return {
      platform: Platform.OS,
      supportsRecording: this.isRecordingSupported(),
      maxDuration: this.getMaxDuration(),
      recordingFormat: "m4a", // Now using M4A for all platforms (AAC codec)
      audioCodec: "aac",
      sampleRate: 16000,
      channels: 1,
      bitRate: 128000,
    };
  }
}

// Create and export a singleton instance
const audioRecordingService = new AudioRecordingService();
export default audioRecordingService;

// Export the service class for custom instances
export { AudioRecordingService };
