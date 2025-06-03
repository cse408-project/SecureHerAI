import React, {useState} from 'react';
import {
  SafeAreaView, Text, TextInput, Button,
  StyleSheet, Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { login } from '../services/AuthService';
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login({ email, password });
      navigation.replace('Home');
    } catch (err:any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button
        title="New here? Sign Up"
        onPress={() => navigation.navigate('Signup')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:24, justifyContent:'center' },
  title:    { fontSize:28, textAlign:'center', marginBottom:24 },
  input:    { borderWidth:1, borderColor:'#ccc', borderRadius:6, padding:12, marginBottom:16 },
});
