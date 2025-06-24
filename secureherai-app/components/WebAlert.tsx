import React from "react";
import { Modal, View, Text, TouchableOpacity, Platform } from "react-native";

interface WebAlertButton {
  text: string;
  onPress?: () => void;
  style?: "cancel" | "destructive" | "default";
}

interface WebAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: WebAlertButton[];
  onClose: () => void;
}

export function WebAlert({
  visible,
  title,
  message,
  buttons,
  onClose,
}: WebAlertProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-black/50 items-center justify-center p-4"
        style={{ backdropFilter: Platform.OS === "web" ? "blur(3px)" : "none" }}
      >
        <View className="bg-white rounded-lg p-6 w-full max-w-sm">
          <Text className="text-lg font-bold mb-2">{title}</Text>
          <Text className="text-gray-600 mb-6">{message}</Text>

          <View className="flex-row space-x-2">
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-1 p-3 rounded-lg ${
                  button.style === "destructive"
                    ? "bg-red-500"
                    : button.style === "cancel"
                    ? "bg-gray-200"
                    : "bg-[#67082F]"
                }`}
                onPress={() => {
                  if (button.onPress) {
                    button.onPress();
                  }
                  onClose();
                }}
              >
                <Text
                  className={`text-center ${
                    button.style === "destructive" || button.style === "default"
                      ? "text-white"
                      : "text-gray-700"
                  }`}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Note: The platformAlert system has been replaced by the alertManager.tsx utility
// See utils/alertManager.tsx for the complete implementation
