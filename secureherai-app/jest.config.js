/**
 * Unified Jest configuration for all frontend tests
 * Combines all test types: components, context, logic, screens, services, and integration
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/__tests__/components/ui-testing-setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|expo|@expo|unimodules|native-base|sentry-expo|@sentry|react-native-vector-icons|@react-native-community|@react-native-async-storage|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-webview|react-native-calendar-picker|react-native-otp-entry|react-native-crypto-js|react-native-reanimated))'
  ],
  testMatch: [
    // Component tests (UI components)
    '**/__tests__/components/**/*.test.{js,ts,tsx}',
    // Context provider tests
    '**/__tests__/context/**/*.test.{js,ts,tsx}',
    // Logic-only tests
    '**/__tests__/logic/**/*.test.{js,ts,tsx}',
    // Screen tests
    '**/__tests__/screens/**/*.test.{js,ts,tsx}',
    // Service tests
    '**/__tests__/services/**/*.test.{js,ts,tsx}',
    // Integration tests
    '**/__tests__/integration/**/*.test.{js,ts,tsx}',
    // Utils tests
    '**/__tests__/utils/**/*.test.{js,ts,tsx}',
    // Root level tests (backward compatibility)
    '**/__tests__/*.test.{js,ts,tsx}',
    // Legacy test files
    '**/__tests__/QuickActionMock.test.js',
    '**/__tests__/QuickActionIntegration.test.js',
    '**/__tests__/contacts-logic.test.js',
    '**/__tests__/ContactForm.test.js',
    '**/__tests__/ContactFormExtended.test.js',
    '**/__tests__/contacts.test.js',
    '**/__tests__/simple.test.js'
  ],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle expo modules
    '^expo-notifications$': '<rootDir>/__tests__/__mocks__/expo-notifications.js',
    '^expo-location$': '<rootDir>/__tests__/__mocks__/expo-location.js',
    '^expo-image-picker$': '<rootDir>/__tests__/__mocks__/expo-image-picker.js',
    // Handle React Native modules
    '^react-native$': 'react-native-web',
    '^react-native-vector-icons/(.*)$': '<rootDir>/__tests__/__mocks__/react-native-vector-icons.js',
    // Handle async storage
    '^@react-native-async-storage/async-storage$': '<rootDir>/__tests__/__mocks__/async-storage.js'
  },
  collectCoverageFrom: [
    'components/**/*.{js,ts,tsx}',
    'context/**/*.{js,ts,tsx}',
    'services/**/*.{js,ts,tsx}',
    'utils/**/*.{js,ts,tsx}',
    'app/**/*.{js,ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/*.d.ts',
    '!**/app-example/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  maxWorkers: 4,
  // Handle different test environments with projects
  projects: [
    {
      displayName: 'UI Components & Context',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect',
        '<rootDir>/__tests__/components/ui-testing-setup.js'
      ],
      testMatch: [
        '**/__tests__/components/**/*.test.{js,ts,tsx}',
        '**/__tests__/context/**/*.test.{js,ts,tsx}'
      ],
      transformIgnorePatterns: [
        'node_modules/(?!(@react-native|react-native|expo|@expo|unimodules|native-base|sentry-expo|@sentry|react-native-vector-icons|@react-native-community|@react-native-async-storage|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-webview|react-native-calendar-picker|react-native-otp-entry|react-native-crypto-js|react-native-reanimated))'
      ],
      moduleNameMapper: {
        '^expo-notifications$': '<rootDir>/__tests__/__mocks__/expo-notifications.js',
        '^expo-location$': '<rootDir>/__tests__/__mocks__/expo-location.js',
        '^expo-image-picker$': '<rootDir>/__tests__/__mocks__/expo-image-picker.js',
        '^react-native$': 'react-native-web',
        '^react-native-vector-icons/(.*)$': '<rootDir>/__tests__/__mocks__/react-native-vector-icons.js',
        '^@react-native-async-storage/async-storage$': '<rootDir>/__tests__/__mocks__/async-storage.js'
      }
    },
    {
      displayName: 'Logic & Utils',
      testMatch: [
        '**/__tests__/logic/**/*.test.{js,ts,tsx}',
        '**/__tests__/utils/**/*.test.{js,ts,tsx}',
        '**/__tests__/ContactForm.test.js',
        '**/__tests__/ContactFormExtended.test.js',
        '**/__tests__/contacts-logic.test.js',
        '**/__tests__/simple.test.js'
      ],
      testEnvironment: 'node',
      transformIgnorePatterns: [
        '/node_modules/',
        '\\.pnp\\.[^\\/]+$'
      ]
    },
    {
      displayName: 'Screens',
      testMatch: [
        '**/__tests__/screens/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      transformIgnorePatterns: [
        '/node_modules/'
      ]
    },
    {
      displayName: 'Services',
      testMatch: [
        '**/__tests__/services/**/*.test.{js,ts,tsx}'
      ],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^expo-notifications$': '<rootDir>/__tests__/__mocks__/expo-notifications.js'
      },
      transformIgnorePatterns: [
        '/node_modules/',
        '\\.pnp\\.[^\\/]+$'
      ]
    },
    {
      displayName: 'Integration',
      testMatch: [
        '**/__tests__/integration/**/*.test.{js,ts,tsx}',
        '**/__tests__/QuickActionMock.test.js',
        '**/__tests__/QuickActionIntegration.test.js',
        '**/__tests__/contacts.test.js'
      ],
      testEnvironment: 'node',
      transformIgnorePatterns: [
        '/node_modules/',
        '\\.pnp\\.[^\\/]+$'
      ]
    }
  ],
  // Group tests by type for better organization
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
    '<rootDir>/app-example/'
  ]
};