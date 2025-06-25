import React from "react";
import { View, Text } from "react-native";
import { OtpInput } from "react-native-otp-entry";

interface OTPInputProps {
  onTextChange: (text: string) => void;
  numberOfDigits?: number;
  autoFocus?: boolean;
  label?: string;
  disabled?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({
  onTextChange,
  numberOfDigits = 6,
  autoFocus = true,
  label,
  disabled = false,
}) => {
  return (
    <View className="mb-6">
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-3 text-center">
          {label}
        </Text>
      )}

      <OtpInput
        numberOfDigits={numberOfDigits}
        focusColor="#67082F"
        onTextChange={onTextChange}
        autoFocus={autoFocus}
        disabled={disabled}
        theme={{
          containerStyle: {
            alignItems: "center",
            justifyContent: "center",
            marginVertical: 8,
          },
          pinCodeContainerStyle: {
            backgroundColor: "#FFFFFF",
            borderColor: "#E5E7EB",
            borderWidth: 2,
            borderRadius: 12,
            width: 48,
            height: 56,
            marginHorizontal: 6,
          },
          focusedPinCodeContainerStyle: {
            borderColor: "#67082F",
            backgroundColor: "#FFF7F5",
            shadowColor: "#67082F",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          pinCodeTextStyle: {
            fontSize: 24,
            fontWeight: "600",
            color: "#1F2937",
          },
          focusStickStyle: {
            backgroundColor: "#67082F",
            width: 2,
            height: 32,
          },
        }}
      />

      <Text className="text-xs text-gray-500 mt-3 text-center">
        Enter the {numberOfDigits}-digit code sent to your email
      </Text>
    </View>
  );
};

export default OTPInput;
