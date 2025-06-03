import React, {useState} from 'react';
import {
  SafeAreaView, Text, TextInput, Button,
  StyleSheet, Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { register } from '../services/AuthService';
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Signup({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState('');
  const [dob,      setDob]      = useState('');

  const handleSignup = async () => {
    try {
      await register({ fullName, email, password, phoneNumber: phone, dateOfBirth: dob });
      Alert.alert('Success','Account created!');
      navigation.replace('Login');
    } catch (err:any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput style={styles.input} placeholder="Full Name"    value={fullName} onChangeText={setFullName}/>
      <TextInput style={styles.input} placeholder="Email"        value={email}    onChangeText={setEmail} keyboardType="email-address"/>
      <TextInput style={styles.input} placeholder="Password"     value={password} onChangeText={setPassword} secureTextEntry/>
      <TextInput style={styles.input} placeholder="Phone Number" value={phone}    onChangeText={setPhone} keyboardType="phone-pad"/>
      <TextInput style={styles.input} placeholder="Date of Birth"value={dob}      onChangeText={setDob}/>
      <Button title="Sign Up" onPress={handleSignup}/>
      <Button title="Back to Login" onPress={()=>navigation.goBack()}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:24, justifyContent:'center' },
  title:    { fontSize:28, textAlign:'center', marginBottom:24 },
  input:    { borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:12, marginBottom:16 },
});
