# 🐛 SecureHer AI Debugging Guide

## 📱 Frontend Debugging (Expo App)

### **1. Start Development Server**

```bash
cd secureherai-app
npm start
```

**Debug Options Available:**

- Press `j` to open debugger
- Press `r` to reload app
- Press `m` to toggle menu
- Press `d` to show developer menu

### **2. Enable Remote Debugging**

#### **Method 1: Expo Go App**

1. Shake device or press Ctrl+M (Android) / Cmd+D (iOS)
2. Select "Debug remote JS"
3. Opens Chrome DevTools automatically

#### **Method 2: Browser DevTools**

```bash
# Start with tunnel for remote debugging
npx expo start --tunnel --dev-client
```

### **3. Console Debugging**

Add debug logs throughout your app:

```typescript
// In any component
console.log("Debug: User login attempt", { email, timestamp: new Date() });
console.warn("Warning: Invalid form data");
console.error("Error: API call failed", error);

// Network debugging
fetch(url)
  .then((response) => {
    console.log("API Response:", response.status, response.headers);
    return response.json();
  })
  .catch((error) => {
    console.error("Network Error:", error);
  });
```

### **4. React DevTools**

Install React DevTools browser extension:

```bash
# Install standalone React DevTools
npm install -g react-devtools
react-devtools
```

### **5. Network Debugging**

#### **API Call Debugging:**

```typescript
// Add to AuthService.ts
export async function login(payload: LoginPayload) {
  console.log("🔐 Login attempt:", payload.email);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📡 Response status:", res.status);
    console.log("📡 Response headers:", res.headers);

    const json = await res.json();
    console.log("📦 Response data:", json);

    if (res.ok && json.success) {
      await AsyncStorage.setItem("token", json.token);
      console.log("✅ Login successful");
      return json;
    }
    throw new Error(json.error || "Login failed");
  } catch (error) {
    console.error("❌ Login error:", error);
    throw error;
  }
}
```

### **6. Navigation Debugging**

```typescript
// Add to any screen
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  console.log("🧭 Current route:", route.name);
  console.log("🧭 Route params:", route.params);

  // Debug navigation actions
  const handleNavigate = () => {
    console.log("🧭 Navigating to report-submission");
    router.push("/report-submission");
  };
}
```

### **7. State Debugging**

```typescript
// Add to components with state
const [email, setEmail] = useState("");

useEffect(() => {
  console.log("📊 Email state changed:", email);
}, [email]);

// Debug AsyncStorage
const debugStorage = async () => {
  const token = await AsyncStorage.getItem("token");
  console.log("🗄️ Stored token:", token);

  const allKeys = await AsyncStorage.getAllKeys();
  console.log("🗄️ All storage keys:", allKeys);
};
```

---

## 🖥️ Backend Debugging (Spring Boot API)

### **1. Start API in Debug Mode**

```bash
cd secureherai-api

# Method 1: Maven debug mode
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

# Method 2: IDE debug configuration
./mvnw spring-boot:run --debug
```

### **2. Enable Debug Logging**

Add to `application.properties`:

```properties
# Enable debug logging
logging.level.com.secureherai=DEBUG
logging.level.org.springframework.web=DEBUG
logging.level.org.springframework.security=DEBUG

# SQL debugging
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

### **3. Add Debug Logs to Controllers**

```java
// In AuthController.java
@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        log.debug("🔐 Login attempt for email: {}", request.getEmail());

        try {
            // Your login logic here
            log.debug("✅ Login successful for: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Login failed for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
```

### **4. Database Debugging**

```java
// Add to Repository classes
@Repository
@Slf4j
public class UserRepository {

    public User findByEmail(String email) {
        log.debug("🔍 Searching for user with email: {}", email);
        User user = // your query logic
        log.debug("📦 Found user: {}", user != null ? user.getId() : "null");
        return user;
    }
}
```

### **5. API Testing with Debug**

```bash
# Test login endpoint with debug info
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -v  # Verbose output for debugging

# Test with authentication
curl -X GET http://localhost:8080/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -v
```

---

## 🔗 End-to-End Debugging

### **1. Check Network Connectivity**

```typescript
// Add to app config
const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:8080/api" // Android emulator
  : "https://your-production-api.com/api";

// Test connectivity
const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    console.log("🌐 API connectivity:", response.status);
  } catch (error) {
    console.error("🌐 API connection failed:", error);
  }
};
```

### **2. Debug API Communication**

```typescript
// Enhanced API debugging wrapper
const debugFetch = async (url: string, options: RequestInit = {}) => {
  console.log("📡 API Request:", {
    url,
    method: options.method || "GET",
    headers: options.headers,
    body: options.body,
  });

  const startTime = Date.now();

  try {
    const response = await fetch(url, options);
    const endTime = Date.now();

    console.log("📡 API Response:", {
      status: response.status,
      statusText: response.statusText,
      duration: `${endTime - startTime}ms`,
      headers: Object.fromEntries(response.headers.entries()),
    });

    return response;
  } catch (error) {
    console.error("📡 API Error:", error);
    throw error;
  }
};
```

---

## 🛠️ Common Debug Scenarios

### **1. Login Issues**

```typescript
// Debug login flow
const handleLogin = async () => {
  console.log("🔐 Starting login process");
  console.log("📧 Email:", email);
  console.log("🔒 Password length:", password.length);

  try {
    console.log("📡 Calling login API...");
    const result = await login({ email, password });
    console.log("✅ Login result:", result);

    console.log("🧭 Navigating to home...");
    router.replace("/(tabs)");
  } catch (error) {
    console.error("❌ Login failed:", error);
    Alert.alert("Login Error", error.message);
  }
};
```

### **2. Navigation Issues**

```typescript
// Debug navigation
console.log("🧭 Available routes:", Object.keys(router));
console.log("🧭 Current pathname:", router.pathname);

// Test navigation
const testNavigation = () => {
  console.log("🧭 Testing navigation to report-submission");
  try {
    router.push("/report-submission");
    console.log("✅ Navigation successful");
  } catch (error) {
    console.error("❌ Navigation failed:", error);
  }
};
```

### **3. State Management Issues**

```typescript
// Debug component state
useEffect(() => {
  console.log("📊 Component state updated:", {
    email,
    password: password ? "***" : "empty",
    isAuthenticated,
  });
}, [email, password, isAuthenticated]);
```

---

## 🔧 Debug Tools & Commands

### **Essential Debug Commands**

```bash
# Frontend debugging
cd secureherai-app
npm start                    # Start with debug server
npm run android             # Run on Android emulator
npm run ios                 # Run on iOS simulator
npx expo start --clear      # Start with cleared cache

# Backend debugging
cd secureherai-api
./mvnw spring-boot:run --debug
./mvnw test                 # Run tests
./mvnw clean compile        # Clean build

# Database debugging
docker-compose -f docker-compose-dev.yml up -d  # Start database
docker-compose logs postgres                    # Check DB logs
```

### **Debug Environment Setup**

```bash
# Install debugging tools
npm install -g react-devtools
npm install -g flipper
```

---

## 📋 Debug Checklist

### **Before Debugging:**

- [ ] API server is running (`http://localhost:8080`)
- [ ] Database is accessible
- [ ] Expo development server is running
- [ ] Device/emulator is connected
- [ ] Network connectivity is working

### **Common Issues:**

- [ ] Check API base URL configuration
- [ ] Verify authentication tokens
- [ ] Check network permissions
- [ ] Validate request/response formats
- [ ] Review console logs for errors
- [ ] Test API endpoints with Postman/curl

---

## 🚀 Quick Debug Commands

```bash
# Terminal 1: Start API
cd secureherai-api && ./mvnw spring-boot:run

# Terminal 2: Start Frontend
cd secureherai-app && npm start

# Terminal 3: Monitor logs
tail -f secureherai-api/logs/application.log

# Test API health
curl http://localhost:8080/api/health
```

This debugging setup will help you identify and fix issues quickly in your SecureHer AI application! 🎯
