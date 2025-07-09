# Testing Structure for SecureHerAI App

This directory contains all the tests for the SecureHerAI application. The structure is organized to separate different types of tests and promote clear organization.

## Directory Structure

```
__tests__/
├── __mocks__/               # Mock implementations for dependencies
│   ├── AlertContext.js      # Mock for the AlertContext
│   ├── ApiService.js        # Mock for the ApiService
│   └── ... other mocks
├── components/              # Tests for UI components with rendering
│   ├── ContactForm.test.tsx # UI tests for ContactForm
│   ├── Header.test.tsx      # UI tests for Header
│   └── ... other component tests
├── context/                 # Tests for context providers
│   ├── AlertContext.test.tsx
│   ├── AuthContext.test.tsx
│   └── ... other context tests
├── screens/                 # Tests for screen components with rendering
│   ├── HomeScreen.test.tsx
│   ├── LoginScreen.test.tsx
│   └── ... other screen tests
├── services/                # Tests for service functions
│   ├── api.test.ts
│   └── ... other service tests
├── utils/                   # Tests for utility functions
│   ├── utils.test.js        # Tests for utility functions
│   └── testUtils.js         # Utility functions for tests
├── logic/                   # Logic-only tests that avoid React Native rendering
│   ├── components/          # Component logic tests
│   │   ├── ContactForm.test.js
│   │   ├── ContactFormExtended.test.js
│   │   └── QuickActionMock.test.js
│   └── screens/             # Screen logic tests
│       └── contacts-logic.test.js
└── integration/             # Integration tests
    └── QuickActionIntegration.test.js
```

## Test Types

### UI Component Tests
Located in `components/`, `screens/`, and the root directory.
These tests may include rendering React Native components and can be more prone to environmental issues.

### Logic-Only Tests
Located in `logic/` directory. These tests focus on the business logic of components without rendering the UI.
These are more stable and run in a Node.js environment instead of a DOM/React Native environment.

### Integration Tests
Located in `integration/` directory. These tests verify the interaction between multiple components.

### Utility Tests
Located in `utils/` directory. These are pure JavaScript function tests with no React Native dependencies.

## Running Tests

### Logic-Only Tests
```bash
npm run test:logic
```

### All Tests
```bash
npm test
```

## Adding New Tests

When adding new tests:

1. Place them in the appropriate directory based on the test type
2. Use the correct naming convention:
   - `*.test.js` or `*.test.tsx` for standard tests
   - Add to the appropriate subdirectory based on what you're testing

## Mock Implementations

The `__mocks__` directory contains mock implementations for external dependencies. Use these to isolate the component under test from its dependencies.

## Configuration Files

- `jest.config.js`: Standard configuration for all tests
- `jest.node.config.js`: Node-based configuration for logic-only tests
- `jest.simple.config.js`: Simplified configuration for basic tests
- `jest.quickaction.config.js`: Specialized configuration for QuickAction component tests
