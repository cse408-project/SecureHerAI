import { useEffect } from 'react';
import { SplashScreen } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export function SplashScreenController() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return null;
}
