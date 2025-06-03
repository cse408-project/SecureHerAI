// frontend/src/screens/Home.tsx
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// 1️⃣ Import the same types you used in Login
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList }  from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function Home({ navigation }: Props) {
  const handleSOS = () => {
    Alert.alert('SOS Triggered!');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => navigation.navigate('ReportSubmission')}
        >
          <Text style={styles.reportText}>Report ✏️</Text>
        </TouchableOpacity>

        <View style={styles.notificationIcon}>
          <Icon name="notifications-outline" size={24} color="#4d0000" />
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>5</Text>
          </View>
        </View>
      </View>

      {/* SOS Button */}
      <View style={styles.sosContainer}>
        <TouchableOpacity style={styles.sosButton} onLongPress={handleSOS}>
          <Text style={styles.sosText}>SOS</Text>
          <Text style={styles.sosSubtext}>Press 3 second</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Icon name="person-circle-outline" size={28} color="#fff" />
        <Icon name="location-outline" size={28} color="#fff" />
        <View style={styles.navCenterCircle}>
          <Text style={styles.navCenterText}>SOS</Text>
        </View>
        <Icon name="chatbubble-ellipses-outline" size={28} color="#fff" />
        <Icon name="settings-outline" size={28} color="#fff" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffecd1',
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportButton: {
    backgroundColor: '#4d0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notificationIcon: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#ff5c5c',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
  },
  sosContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#7f2b1c',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 10,
    borderColor: '#f0e6e6',
  },
  sosText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  sosSubtext: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#4d0000',
    paddingVertical: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  navCenterCircle: {
    backgroundColor: '#ffecd1',
    padding: 8,
    borderRadius: 20,
  },
  navCenterText: {
    color: '#7f2b1c',
    fontWeight: 'bold',
  },
});
