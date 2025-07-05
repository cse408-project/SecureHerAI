import { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from 'expo-audio';
import audioRecordingService, { AudioUploadResult } from '../services/audioRecordingService';

export interface UseAudioRecordingOptions {
  maxDuration?: number; // in seconds
  onProgress?: (duration: number) => void;
  onComplete?: (result: AudioUploadResult) => void;
  onError?: (error: string) => void;
}

export interface UseAudioRecordingReturn {
  // State
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration: number;
  recordingUri: string | null;
  hasPermission: boolean;
  
  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  uploadRecording: () => Promise<AudioUploadResult | null>;
  requestPermissions: () => Promise<boolean>;
  resetRecording: () => void;
  
  // Utils
  formatDuration: (seconds: number) => string;
}

/**
 * Custom hook for audio recording using expo-audio
 * Provides a complete interface for recording, stopping, and uploading audio
 */
export function useAudioRecording(options: UseAudioRecordingOptions = {}): UseAudioRecordingReturn {
  const {
    maxDuration = 10,
    onProgress,
    onComplete,
    onError
  } = options;

  // Initialize the audio recorder with recording options
  const recorder = useAudioRecorder(audioRecordingService.getRecordingOptions());
  
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  
  // Refs for timers
  const durationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
    return () => {
      // Cleanup timers on unmount
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
      }
      if (maxDurationTimer.current) {
        clearTimeout(maxDurationTimer.current);
      }
    };
  }, []);

  // Check if we have recording permissions
  const checkPermissions = async () => {
    try {
      const granted = await audioRecordingService.getPermissions();
      setHasPermission(granted);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    }
  };

  // Request recording permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const granted = await audioRecordingService.requestPermissions();
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      onError?.('Failed to request permissions');
      setHasPermission(false);
      return false;
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      if (isRecording) {
        console.warn('Recording is already in progress');
        return;
      }

      // Check permissions
      if (!hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
          onError?.('Microphone permission denied');
          return;
        }
      }

      console.log('🎙️ Starting recording...');
      setIsProcessing(true);

      // Start the recording using the service
      const result = await audioRecordingService.startRecording(recorder);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start recording');
      }

      setIsRecording(true);
      setRecordingDuration(0);
      setRecordingUri(null);
      setIsProcessing(false);

      // Start duration timer
      durationTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          onProgress?.(newDuration);
          return newDuration;
        });
      }, 1000);

      // Set max duration auto-stop
      maxDurationTimer.current = setTimeout(async () => {
        console.log(`⏰ Auto-stopping recording after ${maxDuration} seconds`);
        await stopRecording();
      }, maxDuration * 1000);

      console.log('✅ Recording started successfully');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setIsProcessing(false);
      setIsRecording(false);
      onError?.(error instanceof Error ? error.message : 'Failed to start recording');
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      if (!isRecording) {
        console.warn('No recording in progress');
        return;
      }

      console.log('🛑 Stopping recording...');
      setIsProcessing(true);

      // Clear timers
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }
      if (maxDurationTimer.current) {
        clearTimeout(maxDurationTimer.current);
        maxDurationTimer.current = null;
      }

      // Stop the recording using the service
      const result = await audioRecordingService.stopRecording(recorder);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to stop recording');
      }

      setIsRecording(false);
      setIsProcessing(false);
      setRecordingUri(result.uri || null);

      console.log('✅ Recording stopped successfully');
      console.log(`📁 Recording saved to: ${result.uri}`);
      
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      setIsProcessing(false);
      setIsRecording(false);
      onError?.(error instanceof Error ? error.message : 'Failed to stop recording');
    }
  };

  // Upload the recorded audio
  const uploadRecording = async (): Promise<AudioUploadResult | null> => {
    try {
      if (!recordingUri) {
        throw new Error('No recording to upload');
      }

      console.log('☁️ Uploading recording...');
      setIsProcessing(true);

      const result = await audioRecordingService.uploadRecording(recordingUri);
      
      setIsProcessing(false);
      
      if (result.success) {
        onComplete?.(result);
      } else {
        onError?.(result.error || 'Upload failed');
      }

      return result;
    } catch (error) {
      console.error('❌ Error uploading recording:', error);
      setIsProcessing(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload recording';
      onError?.(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Reset recording state
  const resetRecording = () => {
    // Clear timers
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
    if (maxDurationTimer.current) {
      clearTimeout(maxDurationTimer.current);
      maxDurationTimer.current = null;
    }

    setIsRecording(false);
    setIsProcessing(false);
    setRecordingDuration(0);
    setRecordingUri(null);
  };

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    // State
    isRecording,
    isProcessing,
    recordingDuration,
    recordingUri,
    hasPermission,
    
    // Actions
    startRecording,
    stopRecording,
    uploadRecording,
    requestPermissions,
    resetRecording,
    
    // Utils
    formatDuration
  };
}
