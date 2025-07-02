import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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

export default function CustomAlert({
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
  console.log('🎭 CustomAlert rendered with:', { visible, title, message, type, showCancel });

  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when hidden
      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, scaleAnim, fadeAnim, slideAnim]);

  const getIconAndColors = () => {
    switch (type) {
      case "success":
        return {
          icon: "check-circle",
          iconColor: "#10B981",
          bgColor: "#ECFDF5",
          borderColor: "#A7F3D0",
          buttonColor: "#10B981",
        };
      case "error":
        return {
          icon: "error",
          iconColor: "#EF4444",
          bgColor: "#FEF2F2",
          borderColor: "#FECACA",
          buttonColor: "#EF4444",
        };
      case "warning":
        return {
          icon: "warning",
          iconColor: "#F59E0B",
          bgColor: "#FFFBEB",
          borderColor: "#FDE68A",
          buttonColor: "#F59E0B",
        };
      default:
        return {
          icon: "info",
          iconColor: "#3B82F6",
          bgColor: "#EFF6FF",
          borderColor: "#BFDBFE",
          buttonColor: "#3B82F6",
        };
    }
  };

  const { icon, iconColor, bgColor, borderColor, buttonColor } =
    getIconAndColors();
  const screenWidth = Dimensions.get("window").width;
  const modalWidth = Math.min(screenWidth - 48, 400);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel || onConfirm}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            opacity: fadeAnim,
            width: modalWidth,
          }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header with colored background */}
          <View
            style={{ backgroundColor: bgColor }}
            className="px-6 pt-8 pb-4 border-b-2"
            // @ts-ignore - Tailwind doesn't recognize dynamic border colors
            borderColor={borderColor}
          >
            {/* Icon */}
            <View className="items-center mb-4">
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{
                  backgroundColor: bgColor,
                  borderWidth: 3,
                  borderColor: iconColor,
                }}
              >
                <MaterialIcons name={icon as any} size={40} color={iconColor} />
              </View>
            </View>

            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 text-center">
              {title}
            </Text>
          </View>

          {/* Content */}
          <View className="px-6 py-6">
            {/* Message */}
            <Text className="text-base text-gray-600 text-center leading-relaxed mb-6">
              {message}
            </Text>

            {/* Buttons */}
            <View className={`${showCancel ? "flex-row space-x-3" : ""}`}>
              {showCancel && (
                <TouchableOpacity
                  className="flex-1 py-4 px-6 bg-gray-100 rounded-2xl border border-gray-200"
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-700 font-semibold text-center text-base">
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className={`${
                  showCancel ? "flex-1" : "w-full"
                } py-4 px-6 rounded-2xl shadow-lg`}
                style={{ backgroundColor: buttonColor }}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-center text-base">
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
