# Navigation Logic Improvement

## Overview
This document outlines improvements made to the navigation logic in the SecureHerAI application, specifically focusing on the "go back" functionality in the report submission and evidence upload screens.

## Background
The previous implementation used simple `router.back()` calls for navigation, which could potentially lead to issues in certain edge cases:

1. If a user accessed a screen through a deep link or the navigation stack was modified
2. If there was no previous screen in the navigation stack to go back to
3. Potential for redundant navigation in some scenarios

## Implemented Changes

### 1. Improved "Go Back" Logic in Header Buttons
In both `submit.tsx` and `evidence.tsx`, the back button logic has been enhanced to include a fallback option:

```tsx
<TouchableOpacity onPress={() => {
  // Check if we can go back, otherwise navigate to reports screen
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/reports');
  }
}}>
  <MaterialIcons name="arrow-back" size={24} color="#67082F" />
</TouchableOpacity>
```

This ensures that users always have a way to navigate out of these screens, even if there's no previous screen in the navigation stack.

### 2. Consistent Navigation After Success
In `evidence.tsx`, after successfully uploading evidence, the navigation has been updated to use `router.replace('/(tabs)/reports')` instead of `router.back()`. This provides a more consistent experience by always returning to the reports list after a successful upload.

### Benefits
1. **Improved Reliability**: The app will handle edge cases better by checking if a previous screen exists
2. **Consistent Experience**: Users will always be taken to a known, logical screen
3. **Prevents Navigation Errors**: Reduces the chance of navigation-related crashes or unexpected behaviors

## Future Considerations
1. Consider adding transition animations to improve the user experience during navigation
2. Monitor user feedback for any navigation-related issues
3. Consider implementing deeper navigation state management if the app's navigation complexity increases

## Related Files
- `app/reports/submit.tsx`
- `app/reports/evidence.tsx`
