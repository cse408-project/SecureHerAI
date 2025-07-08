/**
 * UI tests for the OTPInput component
 * Using React 19 compatible testing approach
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import OTPInput from '../../components/OTPInput';

// Mock the react-native-otp-entry package
jest.mock('react-native-otp-entry', () => ({
  OtpInput: (props: any) => {
    // Return a mock implementation that will be rendered as a string
    return 'OtpInput';
  }
}));

describe('OTPInput UI Tests', () => {
  // Mock functions
  const mockOnTextChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Basic rendering test
  test('renders without crashing', () => {
    render(<OTPInput onTextChange={mockOnTextChange} />);
    expect(true).toBeTruthy();
  });
  
  // Test rendering with label
  test('renders with label when provided', () => {
    const { getByText } = render(
      <OTPInput 
        onTextChange={mockOnTextChange}
        label="Enter OTP"
      />
    );
    
    expect(getByText('Enter OTP')).toBeTruthy();
  });
  
  // Test default help text
  test('renders help text with correct number of digits', () => {
    const { getByText } = render(
      <OTPInput 
        onTextChange={mockOnTextChange}
        numberOfDigits={4}
      />
    );
    
    expect(getByText('Enter the 4-digit code sent to your email')).toBeTruthy();
  });
  
  // Test different number of digits
  test('displays correct help text for different number of digits', () => {
    const { getByText, unmount } = render(
      <OTPInput 
        onTextChange={mockOnTextChange}
        numberOfDigits={6}
      />
    );
    
    expect(getByText('Enter the 6-digit code sent to your email')).toBeTruthy();
    unmount();
    
    const { getByText: getByText2 } = render(
      <OTPInput 
        onTextChange={mockOnTextChange}
        numberOfDigits={8}
      />
    );
    
    expect(getByText2('Enter the 8-digit code sent to your email')).toBeTruthy();
  });
});
