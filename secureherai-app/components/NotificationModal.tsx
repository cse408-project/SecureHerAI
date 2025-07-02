import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";

interface NotificationModalProps {
  visible: boolean;
  notifications: { id: number; message: string }[];
  onClose: () => void;
}

export default function NotificationModal({ visible, notifications, onClose }: NotificationModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 16, width: '85%', maxHeight: '70%', padding: 20, elevation: 8 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16, color: '#67082F' }}>Notifications</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {notifications.length === 0 ? (
              <Text style={{ color: '#888', textAlign: 'center' }}>No notifications</Text>
            ) : (
              notifications.map((n) => (
                <View key={n.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                  <Text style={{ color: '#333' }}>{n.message}</Text>
                </View>
              ))
            )}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 18, alignSelf: 'center' }}>
            <Text style={{ color: '#67082F', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
