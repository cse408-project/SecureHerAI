# Testing Google OAuth Authentication

## Backend Testing

You can test the backend OAuth implementation using the `auth_test.http` file in the `endpoints` directory. However, this will only test the backend endpoints and not the full OAuth flow which requires user interaction with Google's authentication pages.

## Frontend Implementation

### Using a Mobile App (React Native/Expo)

To test the complete OAuth flow, you need a frontend application. Here's how to implement it in your React Native/Expo app:

1. **Install Required Packages**:

```bash
npm install expo-auth-session expo-web-browser expo-linking expo-constants
```

2. **Configure App.json for Deep Linking**:

```json
{
  "expo": {
    "scheme": "secureherai",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

3. **Create a Google Auth Component**:

```javascript
import React, { useState } from "react";
import { Button, View, Text, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuthScreen({ navigation }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = "http://YOUR_SERVER_IP:8080"; // Replace with your actual API URL

  // Handle deep link redirects
  useEffect(() => {
    const handleRedirect = (event) => {
      // Parse the URL and extract the token
      let data = Linking.parse(event.url);
      if (data.queryParams && data.queryParams.token) {
        setToken(data.queryParams.token);

        // Check if profile is complete
        checkProfileStatus(data.queryParams.token);
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener("url", handleRedirect);

    return () => {
      // Clean up the event listener when component unmounts
      subscription.remove();
    };
  }, []);

  // Function to start Google authentication
  const startGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the auth URL from your API
      const response = await fetch(`${API_URL}/api/auth/google/login`);
      const data = await response.json();

      if (data.success && data.url) {
        // Open the Google auth page in a web browser
        const result = await WebBrowser.openAuthSessionAsync(
          `${API_URL}${data.url}`,
          "secureherai://auth"
        );

        if (result.type === "cancel") {
          setError("Authentication was cancelled");
        }
      } else {
        setError("Failed to start authentication");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to check if profile needs to be completed
  const checkProfileStatus = async (authToken) => {
    try {
      // You can decode the JWT token to check the profileComplete claim
      // For production, you should verify this on the server side
      const tokenPayload = JSON.parse(atob(authToken.split(".")[1]));

      if (tokenPayload.profileComplete === false) {
        // Navigate to complete profile screen
        navigation.navigate("CompleteProfile", { token: authToken });
      } else {
        // User is fully authenticated, proceed to home screen
        navigation.replace("Home", { token: authToken });
      }
    } catch (err) {
      setError("Error processing authentication: " + err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in with Google</Text>

      <Button
        title={loading ? "Loading..." : "Sign in with Google"}
        onPress={startGoogleAuth}
        disabled={loading}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      {token && <Text style={styles.success}>Authentication successful!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  error: {
    color: "red",
    marginTop: 20,
  },
  success: {
    color: "green",
    marginTop: 20,
  },
});
```

4. **Create Complete Profile Screen**:

```javascript
import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";

export default function CompleteProfileScreen({ route, navigation }) {
  const { token } = route.params;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_URL = "http://YOUR_SERVER_IP:8080"; // Replace with your actual API URL

  const completeProfile = async () => {
    if (!phoneNumber) {
      setError("Phone number is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/user/complete-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          dateOfBirth: format(dateOfBirth, "yyyy-MM-dd"),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Navigate to home screen with the new token
        navigation.replace("Home", { token: data.token });
      } else {
        setError(data.error || "Failed to complete profile");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>
        Please provide the following information to complete your registration.
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Date of Birth</Text>
        <DateTimePicker
          value={dateOfBirth}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) setDateOfBirth(selectedDate);
          }}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title={loading ? "Submitting..." : "Complete Profile"}
        onPress={completeProfile}
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  error: {
    color: "red",
    marginBottom: 20,
  },
});
```

## Using a Web Browser for Testing

If you don't have a mobile app yet, you can test the OAuth flow using a web browser by:

1. Start the API server using Docker Compose:

   ```bash
   docker-compose -f docker-compose-dev.yml up
   ```

2. Navigate to `http://localhost:8080/api/auth/mobile/test-redirect` in your browser.

3. You should see a page with a link to test the deep linking. This simulates what would happen after OAuth authentication.

4. If you have the mobile app installed with proper deep link handling, clicking the link should open your app.

## Verifying the Google OAuth Flow

1. **Check Logs**: Docker logs should show OAuth-related activities.

   ```bash
   docker logs secureherai_api
   ```

2. **Database Check**: Verify that a user was created in the database with the Google OAuth provider set.

   ```sql
   SELECT * FROM users WHERE oauth_provider = 'GOOGLE';
   ```

3. **Complete Profile Test**: After OAuth login, test the complete-profile endpoint using:

   ```
   ### 14. Complete Profile after OAuth Login
   POST http://localhost:8080/api/user/complete-profile
   Authorization: Bearer YOUR_TOKEN_HERE
   Content-Type: application/json

   {
     "phoneNumber": "+8801712345678",
     "dateOfBirth": "1990-01-01"
   }
   ```
