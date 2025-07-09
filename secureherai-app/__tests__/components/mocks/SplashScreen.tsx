/**
 * Mock implementation of the SplashScreen component for testing
 */
import React from 'react';
import { View, Text } from 'react-native';

interface SplashScreenProps {
  onFinish?: () => void;
}

// Simple mock implementation that calls onFinish after a delay
export default function MockSplashScreen({ onFinish }: SplashScreenProps) {
  React.useEffect(() => {
    // Call onFinish after a short delay to simulate the animation completing
    if (onFinish) {
      const timer = setTimeout(onFinish, 4000);
      return () => clearTimeout(timer);
    }
  }, [onFinish]);

  return (
    <View>
      <Text>SecureHer AI</Text>
      <Text>Your Safety Companion</Text>
      <Text>Loading...</Text>
    </View>
  );
}
