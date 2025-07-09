# Testing ContactForm Component

## Testing Approach

The ContactForm component is tested using two complementary approaches:

1. **Logic-only Tests**: These tests focus on the business logic of the component without rendering the UI. They test state changes, callbacks, and the behavior of the component functions. These tests are faster and more isolated.

2. **UI Tests**: These tests render the component using React Native Testing Library and test both the rendering and interaction behavior. They are more comprehensive but also more complex.

## Test Files

- `__tests__/logic/components/ContactForm.test.tsx`: Logic-only tests for the ContactForm component.
- `__tests__/components/ContactForm.test.tsx`: UI tests for the ContactForm component.
- `__tests__/ContactForm.test.js`: Original logic-only tests for the ContactForm component.
- `__tests__/ContactFormExtended.test.js`: Extended logic tests covering edge cases.

## Running Tests

- To run logic-only tests: `npm run test:logic -- -t "ContactForm"`
- To run UI tests: `npm run test:ui -- -t "ContactForm"`

## Known Issues

The UI tests might encounter React version mismatch issues:
```
Incompatible React versions: The "react" and "react-dom" packages must have the exact same version.
```

This was fixed by ensuring both react and react-dom have the same version (19.1.0).

## Testing Patterns

### Logic Tests

- Test state changes
- Test callbacks
- Test conditional rendering logic
- Test business validation rules

### UI Tests

- Test component rendering
- Test user interactions
- Test visual state changes
- Test accessibility

## Adding New Tests

When adding new tests, consider:

1. Is this a pure logic test? Add it to the logic tests.
2. Is this testing UI rendering or interaction? Add it to the UI tests.
3. For complex edge cases, add them to the extended tests.
