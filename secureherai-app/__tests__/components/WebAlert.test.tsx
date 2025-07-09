/**
 * Simplified UI test for the WebAlert component
 * Using React 19 compatible testing approach
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WebAlert } from '../../components/WebAlert';

describe('WebAlert UI Tests', () => {
  // Mock functions
  const mockOnClose = jest.fn();
  const mockButtonPress = jest.fn();
  
  // Test data
  const testButtons = [
    { text: 'Cancel', onPress: mockButtonPress, style: 'cancel' as const },
    { text: 'OK', onPress: mockButtonPress, style: 'default' as const },
    { text: 'Delete', onPress: mockButtonPress, style: 'destructive' as const }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Rendering tests
  test('renders nothing when not visible', () => {
    const { queryByText } = render(
      <WebAlert
        visible={false}
        title="Test Alert"
        message="This is a test alert"
        buttons={testButtons}
        onClose={mockOnClose}
      />
    );
    
    // With visible=false, we expect no elements to be rendered
    // Use queryByText instead of getByText because getByText throws if element is not found
    expect(queryByText('Test Alert')).toBeNull();
    expect(queryByText('This is a test alert')).toBeNull();
  });
  
  test('renders correctly when visible', () => {
    const { getByText } = render(
      <WebAlert
        visible={true}
        title="Test Alert"
        message="This is a test alert"
        buttons={testButtons}
        onClose={mockOnClose}
      />
    );
    
    // Check title and message
    expect(getByText('Test Alert')).toBeTruthy();
    expect(getByText('This is a test alert')).toBeTruthy();
    
    // Check buttons
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
  });
  
  // Button interaction tests
  test('calls onPress and onClose when a button is pressed', () => {
    const { getByText } = render(
      <WebAlert
        visible={true}
        title="Test Alert"
        message="This is a test alert"
        buttons={testButtons}
        onClose={mockOnClose}
      />
    );
    
    // Press the OK button
    const okButton = getByText('OK');
    fireEvent.press(okButton);
    
    // Check if callbacks were called
    expect(mockButtonPress).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  test('calls only onClose when a button has no onPress callback', () => {
    const buttonsWithoutCallback = [
      { text: 'Close', style: 'cancel' as const }
    ];
    
    const { getByText } = render(
      <WebAlert
        visible={true}
        title="Test Alert"
        message="This is a test alert"
        buttons={buttonsWithoutCallback}
        onClose={mockOnClose}
      />
    );
    
    // Press the Close button
    const closeButton = getByText('Close');
    fireEvent.press(closeButton);
    
    // Check if only onClose was called
    expect(mockButtonPress).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  // Style variations tests
  test('supports different button styles', () => {
    const { getByText } = render(
      <WebAlert
        visible={true}
        title="Test Alert"
        message="This is a test alert"
        buttons={testButtons}
        onClose={mockOnClose}
      />
    );
    
    // Check that all buttons with different styles are rendered
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('OK')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
  });
});
