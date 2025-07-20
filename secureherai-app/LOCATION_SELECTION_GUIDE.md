# Location Selection Components

This document describes the location selection components created for the SecureHerAI app. These components provide a consistent way to select locations across the application using an interactive map interface.

## Components

### 1. LocationSelectionModal

A full-screen modal that displays an interactive map for location selection with search functionality.

**File:** `components/LocationSelectionModal.tsx`

**Features:**

- Interactive map with tap-to-select functionality
- Search functionality for finding locations
- Current location detection
- Built-in React Native Maps features (POI, map types, etc.)
- Customizable title and button text
- Initial location support

**Props:**

```typescript
interface LocationSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: SelectedLocation) => void;
  initialLocation?: SelectedLocation;
  title?: string;
  showCurrentLocationButton?: boolean;
  searchPlaceholder?: string;
  confirmButtonText?: string;
  enableSearch?: boolean;
}
```

**Usage:**

```tsx
import LocationSelectionModal, {
  SelectedLocation,
} from "../../components/LocationSelectionModal";

const [showModal, setShowModal] = useState(false);
const [selectedLocation, setSelectedLocation] =
  useState<SelectedLocation | null>(null);

const handleLocationSelect = (location: SelectedLocation) => {
  setSelectedLocation(location);
  setShowModal(false);
};

<LocationSelectionModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onLocationSelect={handleLocationSelect}
  title="Select Location"
  enableSearch={true}
  showCurrentLocationButton={true}
/>;
```

### 2. LocationInput

A reusable form input component that opens the LocationSelectionModal when tapped.

**File:** `components/LocationInput.tsx`

**Features:**

- Form-friendly interface
- Displays selected location details
- Clear location functionality
- Validation support (required field indication)
- Disabled state support
- Coordinate display for debugging

**Props:**

```typescript
interface LocationInputProps {
  label: string;
  value?: SelectedLocation;
  onLocationChange: (location: SelectedLocation | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}
```

**Usage:**

```tsx
import LocationInput from "../../components/LocationInput";
import { SelectedLocation } from "../../components/LocationSelectionModal";

const [location, setLocation] = useState<SelectedLocation | null>(null);

<LocationInput
  label="Select Location"
  value={location}
  onLocationChange={setLocation}
  required={true}
  placeholder="Choose location on map"
/>;
```

## Types

### SelectedLocation

```typescript
interface SelectedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}
```

## Implementation Examples

### 1. Report Submission (app/reports/submit.tsx)

The report submission form now includes a "Select location on map" button that opens the LocationSelectionModal. When a location is selected, it updates both the coordinates and address fields.

**Key features:**

- Integration with existing location detection
- Pre-filled location from emergency alerts
- Disabled state when location is set from SOS

### 2. Places Management (app/places/manage.tsx)

The places management form replaces the separate latitude/longitude text inputs with a single location selection button that opens the map modal.

**Key features:**

- Replaces manual coordinate entry
- Shows selected location details
- Integrates with existing form validation
- Pre-fills location when editing existing places

## Integration Guide

To add location selection to a new form:

1. **Import the components:**

```tsx
import LocationSelectionModal, {
  SelectedLocation,
} from "../../components/LocationSelectionModal";
// OR for simpler integration:
import LocationInput from "../../components/LocationInput";
```

2. **Add state management:**

```tsx
const [selectedLocation, setSelectedLocation] =
  useState<SelectedLocation | null>(null);
// For modal approach, also add:
const [showLocationModal, setShowLocationModal] = useState(false);
```

3. **Add the UI component:**

**Option A: Using LocationInput (Recommended)**

```tsx
<LocationInput
  label="Location"
  value={selectedLocation}
  onLocationChange={setSelectedLocation}
  required={true}
/>
```

**Option B: Using LocationSelectionModal directly**

```tsx
<TouchableOpacity onPress={() => setShowLocationModal(true)}>
  <Text>Select Location</Text>
</TouchableOpacity>

<LocationSelectionModal
  visible={showLocationModal}
  onClose={() => setShowLocationModal(false)}
  onLocationSelect={(location) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
  }}
/>
```

4. **Handle form submission:**

```tsx
const handleSubmit = () => {
  if (selectedLocation) {
    const data = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      address: selectedLocation.address,
      // ... other form data
    };
    // Submit data
  }
};
```

## Map Features

The LocationSelectionModal uses the existing MapComponent and includes:

- **Interactive Selection:** Tap anywhere on the map to select that location
- **Search Functionality:** Search for places by name (currently shows mock results)
- **Current Location:** Button to use device's current location
- **Map Controls:**
  - Points of Interest toggle
  - Map type switching (standard/satellite/hybrid)
  - Zoom and pan controls
  - Compass (on supported platforms)

## Search Integration

The search functionality is currently implemented with mock data. To integrate with a real search service:

1. Replace the mock search in `handleSearch` function in `LocationSelectionModal.tsx`
2. Integrate with Google Places API or similar service
3. Update the `SearchResult` interface if needed

Example integration:

```tsx
const handleSearch = async (query: string) => {
  try {
    const results = await googlePlacesService.searchPlaces(query);
    setSearchResults(
      results.map((place) => ({
        id: place.id,
        name: place.name,
        address: place.address,
        location: {
          latitude: place.latitude,
          longitude: place.longitude,
        },
        type: place.type,
      }))
    );
    setShowSearchResults(true);
  } catch (error) {
    console.error("Search error:", error);
  }
};
```

## Styling

The components use Tailwind CSS classes for styling and follow the app's design system:

- **Primary Color:** `#67082F` (app brand color)
- **Success Color:** `#10B981` (for selected states)
- **Background:** `#FFE4D6` (app background color)
- **Border Radius:** `rounded-lg` for consistent styling

## Accessibility

The components include:

- Proper button roles and labels
- Color contrast compliance
- Touch target sizing (minimum 44px)
- Screen reader friendly text

## Testing

To test the location selection components:

1. **Manual Testing:**

   - Open forms with location selection
   - Test tap-to-select on map
   - Test search functionality
   - Test current location button
   - Test form submission with selected location

2. **Edge Cases:**
   - No location selected
   - Invalid coordinates
   - Search with no results
   - Permission denied for current location

## Future Enhancements

1. **Real Search Integration:** Replace mock search with Google Places API
2. **Offline Support:** Cache recent locations for offline use
3. **Favorites:** Allow users to save frequently used locations
4. **Validation:** Add coordinate bounds validation
5. **Custom Markers:** Allow custom map markers for different contexts
6. **Batch Selection:** Select multiple locations for certain use cases

## Performance Considerations

- Map loading is lazy (only loads when modal opens)
- Search debouncing to avoid excessive API calls
- Component cleanup on modal close
- Optimized re-renders with proper dependency arrays
