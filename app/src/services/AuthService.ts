import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

interface LoginPayload { email: string; password: string; }
interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export async function login(payload: LoginPayload) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (res.ok && json.success) {
    await AsyncStorage.setItem('token', json.token);
    return json;
  }
  throw new Error(json.error || 'Login failed');
}

export async function register(payload: RegisterPayload) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (res.status === 201 && json.success) {
    return json;
  }
  throw new Error(json.error || 'Registration failed');
}

export async function logout() {
  await AsyncStorage.removeItem('token');
}
