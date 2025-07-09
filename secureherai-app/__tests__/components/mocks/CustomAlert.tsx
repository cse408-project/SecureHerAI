/**
 * Mock implementation of the CustomAlert component for testing
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

// Simple mock implementation of CustomAlert to use in tests
export default function MockCustomAlert({
  visible,
  title,
  message,
  type = "info",
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancel",
  showCancel = false,
}: CustomAlertProps) {
  if (!visible) return null;
  
  return (
    <View testID="custom-alert-modal">
      <View>
        <Text testID="alert-title">{title}</Text>
        <Text testID="alert-message">{message}</Text>
        <Text testID="alert-type">{type}</Text>
      </View>
      <View>
        <TouchableOpacity testID="confirm-button" onPress={onConfirm}>
          <Text>{confirmText}</Text>
        </TouchableOpacity>
        
        {showCancel && (
          <TouchableOpacity testID="cancel-button" onPress={onCancel}>
            <Text>{cancelText}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
