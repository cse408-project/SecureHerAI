/**
 * Simplified UI test for the SplashScreenController component
 * Following the React 19 compatible testing approach
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { SplashScreenController } from '../../components/SplashScreenController';
import { useAuth } from '../../context/AuthContext';
import { SplashScreen } from 'expo-router';

// Mock the dependencies
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('expo-router', () => ({
  SplashScreen: {
    hideAsync: jest.fn()
  }
}));

describe('SplashScreenController UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Basic rendering test
  test('renders without crashing', () => {
    // Mock the auth context to return loading state
    (useAuth as jest.Mock).mockReturnValue({ isLoading: true });
    
    render(<SplashScreenController />);
    // Component renders nothing, so this just checks it doesn't throw
    expect(true).toBeTruthy();
  });
  
  // Test splash screen hiding when loading completes
  test('hides splash screen when not loading', () => {
    // Mock the auth context to return not loading state
    (useAuth as jest.Mock).mockReturnValue({ isLoading: false });
    
    render(<SplashScreenController />);
    
    // Should call hideAsync when not loading
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });
  
  // Test splash screen not hiding when still loading
  test('does not hide splash screen when still loading', () => {
    // Mock the auth context to return loading state
    (useAuth as jest.Mock).mockReturnValue({ isLoading: true });
    
    render(<SplashScreenController />);
    
    // Should not call hideAsync when still loading
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });
  
  // Test splash screen hides when loading state changes
  test('hides splash screen when loading state changes', () => {
    // Initial loading state
    let isLoadingValue = true;
    
    // Create a function to update the mock's return value
    const updateLoadingState = (newValue: boolean) => {
      isLoadingValue = newValue;
      (useAuth as jest.Mock).mockReturnValue({ isLoading: isLoadingValue });
    };
    
    // Start with loading true
    updateLoadingState(true);
    
    // Set up our render with the current mock value
    const { rerender } = render(<SplashScreenController />);
    
    // Splash screen should not be hidden yet
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
    
    // Update loading state to false
    updateLoadingState(false);
    
    // Re-render with the new state
    rerender(<SplashScreenController />);
    
    // Now hideAsync should be called
    expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
  });
});
