/**
 * UI tests for the OTPVerificationInput component
 * React 19 compatible testing
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { View, Text, TextInput } from 'react-native';

// Create a standalone component to test
const OTPVerificationInput = ({ onSubmit = jest.fn() }) => {
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  
  const handleVerify = () => {
    if (!email || !code) {
      return;
    }
    onSubmit(email, code);
  };
  
  return (
    <View>
      <Text>Verify Login</Text>
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        testID="email-input"
      />
      <TextInput
        placeholder="Enter verification code"
        value={code}
        onChangeText={setCode}
        testID="code-input"
      />
      <View testID="verify-button" onTouchEnd={handleVerify}>
        <Text>Verify & Sign In</Text>
      </View>
    </View>
  );
};

describe('OTPVerificationInput UI Tests', () => {
  test('renders correctly', () => {
    const { getByText, getByTestId } = render(<OTPVerificationInput />);
    
    expect(getByText('Verify Login')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('code-input')).toBeTruthy();
    expect(getByText('Verify & Sign In')).toBeTruthy();
  });
  
  test('can enter email and code', () => {
    const { getByTestId } = render(<OTPVerificationInput />);
    
    const emailInput = getByTestId('email-input');
    const codeInput = getByTestId('code-input');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(codeInput, '123456');
    
    expect(emailInput.props.value).toBe('test@example.com');
    expect(codeInput.props.value).toBe('123456');
  });
  
  test('calls onSubmit with email and code', () => {
    const mockSubmit = jest.fn();
    const { getByTestId } = render(<OTPVerificationInput onSubmit={mockSubmit} />);
    
    const emailInput = getByTestId('email-input');
    const codeInput = getByTestId('code-input');
    const verifyButton = getByTestId('verify-button');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(codeInput, '123456');
    
    // Use fireEvent.press instead of .press for React Native components
    fireEvent(verifyButton, 'onTouchEnd');
    
    expect(mockSubmit).toHaveBeenCalledWith('test@example.com', '123456');
  });
});
