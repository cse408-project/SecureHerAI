// frontend/src/screens/ReportSubmission.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config';

export default function ReportSubmission() {
  const nav = useNavigation();

  // form state
  const [title, setTitle]             = useState('');
  const [incidentType, setIncidentType] = useState('harassment');
  const [incidentTime, setIncidentTime] = useState('');
  const [latitude, setLatitude]       = useState('');
  const [longitude, setLongitude]     = useState('');
  const [address, setAddress]         = useState('');
  const [visibility, setVisibility]   = useState('public');
  const [anonymous, setAnonymous]     = useState(false);
  const [description, setDescription] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');

  const handleSubmit = async () => {
    // basic validation
    if (!title || !incidentTime || !latitude || !longitude || !address) {
      return Alert.alert('Missing fields', 'Please fill in all required fields.');
    }

    let lat = parseFloat(latitude);
    let lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return Alert.alert('Invalid coordinates', 'Latitude and Longitude must be numbers.');
    }

    // build payload
    const body = {
      incidentType,              // e.g. "harassment", "theft", "assault", "other"
      description,
      location: { latitude: lat, longitude: lng, address },
      incidentTime,              // e.g. "2025-05-12T18:30:00Z"
      visibility,                // "public", "officials_only", or "private"
      anonymous,
      evidenceFiles: evidenceUrls
        .split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0),
    };

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/reports/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Submission failed');
      Alert.alert('Success', json.message || 'Report submitted!');
      nav.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  // helper to render option buttons
  const OptionGroup = ({ label, options, selected, onSelect }) => (
    <View style={{ marginVertical: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionBtn,
              selected === opt.value && styles.optionBtnSelected
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[
                styles.optionText,
                selected === opt.value && styles.optionTextSelected
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Report Submission</Text>

        <TextInput
          style={styles.input}
          placeholder="Report Title"
          value={title}
          onChangeText={setTitle}
        />

        <OptionGroup
          label="Incident Type"
          selected={incidentType}
          onSelect={setIncidentType}
          options={[
            { label: 'Harassment', value: 'harassment' },
            { label: 'Theft',       value: 'theft' },
            { label: 'Assault',     value: 'assault' },
            { label: 'Other',       value: 'other' },
          ]}
        />

        <TextInput
          style={styles.input}
          placeholder="Incident Time (e.g. 2025-05-12T18:30:00Z)"
          value={incidentTime}
          onChangeText={setIncidentTime}
        />

        <Text style={styles.label}>Location Coordinates</Text>
        <View style={styles.coordRow}>
          <TextInput
            style={[styles.input, styles.coordInput]}
            placeholder="Latitude"
            keyboardType="numeric"
            value={latitude}
            onChangeText={setLatitude}
          />
          <TextInput
            style={[styles.input, styles.coordInput]}
            placeholder="Longitude"
            keyboardType="numeric"
            value={longitude}
            onChangeText={setLongitude}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Address"
          value={address}
          onChangeText={setAddress}
        />

        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Description (optional)"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <OptionGroup
          label="Visibility"
          selected={visibility}
          onSelect={setVisibility}
          options={[
            { label: 'Public',          value: 'public' },
            { label: 'Officials Only',  value: 'officials_only' },
            { label: 'Private',         value: 'private' },
          ]}
        />

        <View style={styles.switchRow}>
          <Text>Submit Anonymously</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} />
        </View>

        <TextInput
          style={styles.input}
          placeholder="Evidence URLs (comma-separated)"
          value={evidenceUrls}
          onChangeText={setEvidenceUrls}
        />

        <View style={styles.submitBtn}>
          <Button title="Submit Report" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  heading:   { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label:     { marginTop: 12, fontWeight: '600' },
  input:     {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 8, marginTop: 8
  },
  optionRow:    { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  optionBtn:    {
    borderWidth: 1, borderColor: '#888',
    borderRadius: 4, paddingVertical: 6, paddingHorizontal: 12,
    marginRight: 8, marginBottom: 8
  },
  optionBtnSelected: { backgroundColor: '#4d0000', borderColor: '#4d0000' },
  optionText:       { color: '#000' },
  optionTextSelected:{ color: '#fff' },
  coordRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  coordInput:{ flex: 0.48 },
  switchRow:  {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginVertical: 12
  },
  submitBtn: { marginTop: 24 },
});
