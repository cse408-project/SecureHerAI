import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ReactNode } from "react";

interface QuickActionProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress?: () => void;
  color?: string;
}

export default function QuickAction({ icon, label, onPress, color = "#67082F" }: QuickActionProps) {
  return (
    <TouchableOpacity style={{ alignItems: 'center' }} onPress={onPress}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: color + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text style={{ color, fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );
}
