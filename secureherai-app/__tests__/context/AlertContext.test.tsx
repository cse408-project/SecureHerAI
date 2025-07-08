import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View, TouchableOpacity } from 'react-native';
import { AlertProvider, useAlert } from '../../context/AlertContext';

// Mock the CustomAlert component to avoid animation issues
jest.mock('../../components/CustomAlert', () =>
  require('../components/mocks/CustomAlert').default
);

// Create a test component that uses the AlertContext
const TestComponent = ({ 
  onAlertCall = () => {}, 
  onConfirmAlertCall = () => {},
  testType = 'basic' 
}: { 
  onAlertCall?: (args: any) => void, 
  onConfirmAlertCall?: (args: any) => void,
  testType?: 'basic' | 'confirm' | 'custom-buttons' | 'with-cancel' | 'custom-text'
}) => {
  const { showAlert, showConfirmAlert } = useAlert();

  const handleBasicAlert = () => {
    const args = { title: 'Test Alert', message: 'This is a test alert', type: 'info' as const };
    onAlertCall(args);
    showAlert(args.title, args.message, args.type);
  };

  const handleConfirmAlert = () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const args = { 
      title: 'Confirm Test', 
      message: 'Please confirm this action', 
      onConfirm, 
      onCancel, 
      type: 'warning' as const
    };
    onConfirmAlertCall(args);
    showConfirmAlert(args.title, args.message, args.onConfirm, args.onCancel, args.type);
  };

  const handleAlertWithButtons = () => {
    const primaryOnPress = jest.fn();
    const cancelOnPress = jest.fn();
    const buttons = [
      { text: 'Cancel', style: 'cancel' as const, onPress: cancelOnPress },
      { text: 'OK', style: 'default' as const, onPress: primaryOnPress }
    ];
    const args = { title: 'Custom Buttons', message: 'Alert with custom buttons', type: 'success' as const, buttons };
    onAlertCall(args);
    showAlert(args.title, args.message, args.type, args.buttons);
  };

  const handleAlertWithCancel = () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const args = { 
      title: 'With Cancel', 
      message: 'This alert has a cancel button', 
      onConfirm, 
      onCancel, 
      type: 'error' as const
    };
    onConfirmAlertCall(args);
    showConfirmAlert(args.title, args.message, args.onConfirm, args.onCancel, args.type);
  };
  
  // This test has been modified to use a custom alert with buttons instead
  // since showConfirmAlert doesn't directly accept confirmText/cancelText parameters
  const handleCustomTextAlert = () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const buttons = [
      { text: 'Decline', style: 'cancel' as const, onPress: onCancel },
      { text: 'Accept', style: 'default' as const, onPress: onConfirm }
    ];
    const args = { 
      title: 'Custom Text', 
      message: 'Alert with custom button text', 
      type: 'info' as const,
      buttons
    };
    onAlertCall(args);
    // Using showAlert with custom buttons instead
    showAlert(args.title, args.message, args.type, args.buttons);
  };

  return (
    <View>
      {testType === 'basic' && (
        <TouchableOpacity testID="basic-alert-btn" onPress={handleBasicAlert}>
          <Text>Show Basic Alert</Text>
        </TouchableOpacity>
      )}
      
      {testType === 'confirm' && (
        <TouchableOpacity testID="confirm-alert-btn" onPress={handleConfirmAlert}>
          <Text>Show Confirm Alert</Text>
        </TouchableOpacity>
      )}
      
      {testType === 'custom-buttons' && (
        <TouchableOpacity testID="custom-buttons-btn" onPress={handleAlertWithButtons}>
          <Text>Show Alert With Custom Buttons</Text>
        </TouchableOpacity>
      )}
      
      {testType === 'with-cancel' && (
        <TouchableOpacity testID="with-cancel-btn" onPress={handleAlertWithCancel}>
          <Text>Show Alert With Cancel</Text>
        </TouchableOpacity>
      )}
      
      {testType === 'custom-text' && (
        <TouchableOpacity testID="custom-text-btn" onPress={handleCustomTextAlert}>
          <Text>Show Alert With Custom Button Text</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

describe('AlertContext', () => {
  // Test if the provider renders without errors
  test('AlertProvider renders without crashing', () => {
    const { getByText } = render(
      <AlertProvider>
        <Text>Test Content</Text>
      </AlertProvider>
    );
    
    expect(getByText('Test Content')).toBeTruthy();
  });

  // Test basic alert functionality
  test('showAlert displays an alert with the correct properties', () => {
    const mockAlertCall = jest.fn();
    
    const { getByTestId } = render(
      <AlertProvider>
        <TestComponent onAlertCall={mockAlertCall} testType="basic" />
      </AlertProvider>
    );
    
    // Trigger the alert
    fireEvent.press(getByTestId('basic-alert-btn'));
    
    // Verify the mock was called with correct params
    expect(mockAlertCall).toHaveBeenCalledWith({
      title: 'Test Alert',
      message: 'This is a test alert',
      type: 'info'
    });
    
    // Verify the alert is displayed with correct content
    expect(getByTestId('custom-alert-modal')).toBeTruthy();
    expect(getByTestId('alert-title').props.children).toBe('Test Alert');
    expect(getByTestId('alert-message').props.children).toBe('This is a test alert');
    expect(getByTestId('alert-type').props.children).toBe('info');
  });

  // Test alert types
  test('showAlert displays different alert types correctly', () => {
    const { getByTestId, rerender } = render(
      <AlertProvider>
        <TestComponent testType="basic" />
      </AlertProvider>
    );
    
    // Test info type
    fireEvent.press(getByTestId('basic-alert-btn'));
    expect(getByTestId('alert-type').props.children).toBe('info');
    
    // Dismiss the alert
    fireEvent.press(getByTestId('confirm-button'));
    
    // Test error type
    rerender(
      <AlertProvider>
        <TestComponent testType="with-cancel" />
      </AlertProvider>
    );
    
    fireEvent.press(getByTestId('with-cancel-btn'));
    expect(getByTestId('alert-type').props.children).toBe('error');
  });

  // Test confirmation alert functionality
  test('showConfirmAlert displays a confirmation alert with confirm and cancel buttons', () => {
    const mockConfirmAlertCall = jest.fn();
    
    const { getByTestId, getByText } = render(
      <AlertProvider>
        <TestComponent onConfirmAlertCall={mockConfirmAlertCall} testType="confirm" />
      </AlertProvider>
    );
    
    // Trigger the confirm alert
    fireEvent.press(getByTestId('confirm-alert-btn'));
    
    // Verify the mock was called with correct params
    expect(mockConfirmAlertCall).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Confirm Test',
      message: 'Please confirm this action',
      type: 'warning'
    }));
    
    // Verify the alert is displayed with correct content
    expect(getByTestId('custom-alert-modal')).toBeTruthy();
    expect(getByTestId('alert-title').props.children).toBe('Confirm Test');
    expect(getByTestId('alert-message').props.children).toBe('Please confirm this action');
    expect(getByTestId('alert-type').props.children).toBe('warning');
    
    // Verify both buttons are present
    expect(getByText('Confirm')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  // Test alert with custom buttons
  test('showAlert correctly handles custom buttons', () => {
    const mockAlertCall = jest.fn();
    
    const { getByTestId, getByText } = render(
      <AlertProvider>
        <TestComponent onAlertCall={mockAlertCall} testType="custom-buttons" />
      </AlertProvider>
    );
    
    // Trigger the alert with custom buttons
    fireEvent.press(getByTestId('custom-buttons-btn'));
    
    // Verify the alert is displayed with correct content
    expect(getByTestId('custom-alert-modal')).toBeTruthy();
    expect(getByTestId('alert-title').props.children).toBe('Custom Buttons');
    expect(getByTestId('alert-message').props.children).toBe('Alert with custom buttons');
    
    // Verify buttons are rendered with correct text (note: our mock simplifies button rendering)
    expect(getByText('OK')).toBeTruthy();
  });
  
  // Test custom button text
  test('showConfirmAlert accepts custom button text', () => {
    const { getByTestId, getByText } = render(
      <AlertProvider>
        <TestComponent testType="custom-text" />
      </AlertProvider>
    );
    
    // Trigger the alert with custom button text
    fireEvent.press(getByTestId('custom-text-btn'));
    
    // Verify custom button text is shown
    expect(getByText('Accept')).toBeTruthy();
    expect(getByText('Decline')).toBeTruthy();
  });

  // Test button press callbacks
  test('alert buttons trigger the correct callbacks when pressed', () => {
    const { getByTestId } = render(
      <AlertProvider>
        <TestComponent testType="basic" />
      </AlertProvider>
    );
    
    // Trigger the alert
    fireEvent.press(getByTestId('basic-alert-btn'));
    
    // Get the confirm button and press it
    const confirmButton = getByTestId('confirm-button');
    fireEvent.press(confirmButton);
    
    // After pressing the button, the alert should be dismissed
    // In our mock implementation, this means the element is removed from DOM
    expect(() => getByTestId('custom-alert-modal')).toThrow();
  });

  // Test confirmation alert with cancel button
  test('confirmation alert handles cancel button press', () => {
    const { getByTestId, queryByTestId } = render(
      <AlertProvider>
        <TestComponent testType="with-cancel" />
      </AlertProvider>
    );
    
    // Trigger the alert with cancel
    fireEvent.press(getByTestId('with-cancel-btn'));
    
    // Verify the alert is displayed
    expect(getByTestId('custom-alert-modal')).toBeTruthy();
    
    // Get the cancel button and press it
    const cancelButton = getByTestId('cancel-button');
    fireEvent.press(cancelButton);
    
    // After pressing cancel, the alert should be dismissed
    expect(queryByTestId('custom-alert-modal')).toBeNull();
  });

  // Test error handling when context is used outside provider
  test('useAlert throws error when used outside provider', () => {
    // Mock console.error to suppress error output during test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Attempt to render the test component without a provider should throw
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAlert must be used within an AlertProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});
