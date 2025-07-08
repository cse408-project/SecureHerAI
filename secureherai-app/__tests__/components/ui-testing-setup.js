/**
 * Unified setup file for React 19 compatible UI tests
 * Combines all setup logic from previous setup files for comprehensive testing support
 * 
 * This file provides mocks for:
 * - React Native core components
 * - Expo modules and components
 * - Third-party libraries
 * - React Native APIs and utilities
 * - Authentication and navigation
 */
import '@testing-library/jest-native/extend-expect';

// Handle the window property issue more carefully to prevent React Native setup conflicts
// Don't set window if it already exists to avoid "Cannot redefine property" errors
if (!global.hasOwnProperty('window')) {
  global.window = global;
}
if (!global.window.navigator) {
  global.window.navigator = {};
}

// Mock react-native components directly
jest.mock('react-native', () => {
  // Create a clean mock without referencing external variables
  const mockRN = {
    // Mock components as strings for React 19 compatibility
    Text: 'Text',
    TextInput: 'TextInput',
    View: 'View',
    TouchableOpacity: 'TouchableOpacity', 
    Switch: 'Switch',
    ActivityIndicator: 'ActivityIndicator',
    Modal: 'Modal',
    ScrollView: 'ScrollView',
    Image: 'Image',
    FlatList: 'FlatList',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Pressable: 'Pressable',
    TouchableWithoutFeedback: 'TouchableWithoutFeedback',
    SafeAreaView: 'SafeAreaView',
    RefreshControl: 'RefreshControl',
    StatusBar: 'StatusBar',
    Alert: {
      alert: jest.fn(),
    },
    
    // Keep original StyleSheet, Platform, etc.
    StyleSheet: {
      create: jest.fn(styles => styles),
      hairlineWidth: 1,
      absoluteFill: {},
      flatten: jest.fn(arr => arr)
    },
    
    Platform: {
      OS: 'ios',
      select: jest.fn(obj => obj.ios || obj.default)
    },

    // Mock Animated API
    Animated: {
      View: 'Animated.View',
      Text: 'Animated.Text',
      Image: 'Animated.Image',
      ScrollView: 'Animated.ScrollView',
      createAnimatedComponent: jest.fn((component) => `Animated.${component}`),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(),
      })),
      parallel: jest.fn((animations) => ({
        start: jest.fn(),
      })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({
          interpolate: jest.fn(),
        })),
      })),
    },
    
    // Mock Dimensions API
    Dimensions: {
      get: jest.fn((dim) => ({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 2,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },

    // Mock Linking module
    Linking: {
      openURL: jest.fn(() => Promise.resolve(true)),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
    },

    // Mock NativeModules
    NativeModules: {},
  };
  
  return mockRN;
});

// Mock Expo vector icons with comprehensive coverage
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
  FontAwesome: 'FontAwesome',
  FontAwesome5: 'FontAwesome5',
  Feather: 'Feather',
  AntDesign: 'AntDesign',
  Entypo: 'Entypo'
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  openURL: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({}),
  Link: ({ children, href }) => children,
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(),
  cancelNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 0, longitude: 0 }
  })),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock SafeAreaContext
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: jest.fn().mockImplementation(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
  SafeAreaInsetsContext: {
    Consumer: ({ children }) => children({ top: 0, right: 0, bottom: 0, left: 0 }),
    Provider: ({ children }) => children,
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock React Native Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock React Native Screens
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

// Mock React Native WebView
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Mock the calendar picker component
jest.mock('react-native-calendar-picker', () => 'CalendarPicker');

// Mock React Native OTP Entry
jest.mock('react-native-otp-entry', () => ({
  OtpInput: 'OtpInput',
}));

// Mock React Native Picker
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  return {
    Picker: (props) => {
      return React.createElement('select', {
        'data-testid': 'picker',
        value: props.selectedValue,
        onChange: (e) => props.onValueChange && props.onValueChange(e.target.value),
        children: props.children
      });
    },
    Item: (props) => {
      return React.createElement('option', {
        value: props.value
      }, props.label);
    }
  };
});

// Mock crypto-js
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  enc: {
    Utf8: {
      parse: jest.fn(),
      stringify: jest.fn(),
    },
  },
}));

// Mock custom DatePicker component
jest.mock('../../components/DatePicker', () => {
  const React = require('react');
  return function MockDatePicker(props) {
    // Helper function to format date
    const formatDate = (dateString) => {
      if (!dateString) return null;
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
      } catch {
        return dateString;
      }
    };

    // Build the display text based on props
    const getDisplayText = () => {
      if (props.value) {
        const formattedDate = formatDate(props.value);
        return formattedDate || props.value;
      }
      return props.placeholder || 'Select Date';
    };

    // Build label with required marker
    const getLabelText = () => {
      let labelText = props.label || '';
      if (props.required) {
        labelText += ' *';
      }
      return labelText;
    };

    return React.createElement('div', {
      'data-testid': 'date-picker',
      children: [
        // Label
        props.label && React.createElement('span', { key: 'label' }, getLabelText()),
        // Display text or button
        React.createElement(
          'button',
          {
            key: 'display',
            'data-testid': 'date-picker-select',
            onClick: () => props.onDateChange && props.onDateChange('2025-01-01')
          },
          getDisplayText()
        )
      ].filter(Boolean)
    });
  };
});

// Silence the warning about AsyncStorage
jest.mock('react-native/Libraries/LogBox/LogBox', () => ({
  ignoreLogs: jest.fn(),
}));
