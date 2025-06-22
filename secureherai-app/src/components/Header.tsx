import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface HeaderProps {
  title: string;
  onNotificationPress?: () => void;
  showNotificationDot?: boolean;
}

export default function Header({ title, onNotificationPress, showNotificationDot = true }: HeaderProps) {
  return (
    <View style={{ backgroundColor: '#67082F', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{title}</Text>
      <TouchableOpacity
        style={{ width: 40, height: 40, backgroundColor: 'rgba(185, 28, 28, 0.3)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        onPress={onNotificationPress}
      >
        <MaterialIcons name="notifications" size={24} color="white" />
        {showNotificationDot && (
          <View style={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, backgroundColor: '#ef4444', borderRadius: 6 }} />
        )}
      </TouchableOpacity>
    </View>
  );
}
