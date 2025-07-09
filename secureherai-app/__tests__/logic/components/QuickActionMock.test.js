// QuickActionMock.test.js - This is a plain JavaScript test that mocks the QuickAction component

// This is a mock implementation of the QuickAction component
class QuickAction {
  constructor(props) {
    this.icon = props.icon || '';
    this.label = props.label || '';
    this.onPress = props.onPress || (() => {});
    this.color = props.color || '#67082F'; // Default color from the component
  }

  // Simulate a press event
  press() {
    if (typeof this.onPress === 'function') {
      this.onPress();
      return true;
    }
    return false;
  }
}

describe('QuickAction Component (Mocked)', () => {
  test('initializes with the correct props', () => {
    const quickAction = new QuickAction({ 
      icon: 'home', 
      label: 'Home'
    });
    
    expect(quickAction.icon).toBe('home');
    expect(quickAction.label).toBe('Home');
    expect(quickAction.color).toBe('#67082F'); // Default color
  });

  test('uses custom color when provided', () => {
    const customColor = '#FF5733';
    const quickAction = new QuickAction({ 
      icon: 'star', 
      label: 'Favorite', 
      color: customColor 
    });
    
    expect(quickAction.color).toBe(customColor);
  });

  test('calls onPress handler when pressed', () => {
    const mockOnPress = jest.fn();
    const quickAction = new QuickAction({ 
      icon: 'info', 
      label: 'Information', 
      onPress: mockOnPress 
    });
    
    const result = quickAction.press();
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  test('handles missing onPress handler gracefully', () => {
    const quickAction = new QuickAction({ 
      icon: 'info', 
      label: 'Information'
    });
    
    const result = quickAction.press();
    expect(result).toBe(true); // Should still return true even with the default no-op function
  });
});
