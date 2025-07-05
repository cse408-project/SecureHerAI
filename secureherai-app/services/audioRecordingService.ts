import { AudioModule, RecordingPresets, RecordingOptions } from 'expo-audio';
import { Platform } from 'react-native';
import cloudinaryService from './cloudinary';

export interface AudioRecordingResult {
  success: boolean;
  uri?: string;
  duration?: number;
  error?: string;
}

export interface AudioUploadResult {
  success: boolean;
  url?: string;
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
      console.error('Error requesting microphone permissions:', error);
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
      console.error('Error checking microphone permissions:', error);
      return false;
    }
  }

  /**
   * Get the appropriate recording options based on platform
   */
  getRecordingOptions(): RecordingOptions {
    // Use HIGH_QUALITY preset for best audio quality
    return RecordingPresets.HIGH_QUALITY;
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
            error: 'Microphone permission denied'
          };
        }
      }

      console.log('🎙️ Starting audio recording...');
      
      // Prepare the recorder
      await recorder.prepareToRecordAsync();
      
      // Start recording
      recorder.record();
      
      console.log('✅ Recording started successfully');
      
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      };
    }
  }

  /**
   * Stop recording and get the result
   */
  async stopRecording(recorder: any): Promise<AudioRecordingResult> {
    try {
      console.log('🛑 Stopping audio recording...');
      
      // Stop the recording
      await recorder.stop();
      
      const uri = recorder.uri;
      const duration = recorder.currentTime;
      
      if (!uri) {
        throw new Error('Recording URI is not available');
      }
      
      console.log('✅ Recording stopped successfully');
      console.log(`📁 Recording saved to: ${uri}`);
      console.log(`⏱️ Duration: ${duration}s`);
      
      return {
        success: true,
        uri,
        duration
      };
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop recording'
      };
    }
  }

  /**
   * Upload recorded audio to Cloudinary
   */
  async uploadRecording(uri: string, folder: string = 'voice_recordings'): Promise<AudioUploadResult> {
    try {
      console.log('☁️ Uploading audio to Cloudinary...');
      
      if (!uri) {
        throw new Error('No audio URI provided');
      }

      // Use the Cloudinary service to upload the audio
      const result = await cloudinaryService.uploadEvidence(uri);
      
      if (result.success && result.url) {
        console.log('✅ Audio uploaded successfully:', result.url);
        return {
          success: true,
          url: result.url
        };
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Error uploading audio:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload audio'
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
      recordingFormat: Platform.OS === 'web' ? 'webm' : 'wav'
    };
  }
}

// Create and export a singleton instance
const audioRecordingService = new AudioRecordingService();
export default audioRecordingService;

// Export the service class for custom instances
export { AudioRecordingService };
