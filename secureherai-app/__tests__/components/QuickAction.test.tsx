/**
 * UI tests for the QuickAction component
 * Using React 19 compatible testing approach
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import QuickAction from '../../components/QuickAction';

describe('QuickAction UI Tests', () => {
  // Mock function for the onPress callback
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic rendering test
  test('renders without crashing', () => {
    render(<QuickAction icon="home" label="Home" />);
    expect(true).toBeTruthy();
  });

  // Test label display
  test('displays the correct label', () => {
    const { getByText } = render(<QuickAction icon="home" label="Home" />);    
    expect(getByText('Home')).toBeTruthy();
  });

  // Test onPress callback
  test('calls onPress when button is pressed', () => {
    const { getByText } = render(
      <QuickAction icon="home" label="Home" onPress={mockOnPress} />
    );
    const button = getByText('Home').parent;
    fireEvent.press(button);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  // Test custom color
  test('accepts custom color prop', () => {
    // This is a simple test to ensure the component accepts the color prop    
    // We can't test actual styling due to the simplified mocking approach     
    render(<QuickAction icon="home" label="Home" color="#FF0000" />);
    // If it renders without errors, the test passes
    expect(true).toBeTruthy();
  });

  // Test different icons
  test('renders with different icons', () => {
    const icons = ['home', 'person', 'settings', 'help'];
    for (const icon of icons) {
      const { unmount } = render(
        <QuickAction icon={icon as any} label={`${icon} action`} />
      );
      // If it renders without errors, the test passes
      expect(true).toBeTruthy();
      unmount();
    }
  });
});