# Location Update Implementation Analysis & Recommendations

## Current Implementation Issues

### What You Have Now:

1. **HTTP polling every 30 seconds** via `PUT /api/user/location`
2. **WebSocket infrastructure exists but unused** - `sendLocationUpdate()` in websocketService.ts
3. **Smart throttling** - skips updates if movement < 10m or time < 5 min
4. **Backend supports both** - HTTP endpoint + WebSocket `/app/emergency/location`

### Problems:

- ❌ Inconsistent: WebSocket for alerts, HTTP for location
- ❌ Battery inefficient: 30s HTTP polling drains battery
- ❌ Latency: 30s intervals too slow for active emergencies
- ❌ WebSocket endpoint built but not used
- ❌ No differentiation between "idle" vs "active emergency" states

---

## Recommended Solution: Hybrid Approach

### Strategy: Use WebSocket for active emergencies, HTTP for background

This is the **industry standard** used by Uber, emergency apps, and delivery services.

### When to Use Each:

| Scenario               | Method    | Frequency    | Reason                      |
| ---------------------- | --------- | ------------ | --------------------------- |
| **Active SOS Alert**   | WebSocket | 5-10 seconds | Real-time tracking critical |
| **Responder en route** | WebSocket | 5-10 seconds | Victim needs to see ETA     |
| **Background (idle)**  | HTTP      | 2-5 minutes  | Battery conservation        |
| **User logged in**     | HTTP      | 1-2 minutes  | Moderate tracking           |

---

## Implementation Plan

### 1. Modify locationService.ts

```typescript
class LocationService {
  private httpUpdateInterval: NodeJS.Timeout | null = null;
  private websocketUpdateInterval: NodeJS.Timeout | null = null;
  private isTracking = false;
  private trackingMode: "idle" | "normal" | "active" = "idle";

  // Different intervals for different modes
  private readonly INTERVALS = {
    idle: 300000, // 5 minutes - user logged in but inactive
    normal: 60000, // 1 minute - normal usage
    active: 5000, // 5 seconds - active emergency
  };

  /**
   * Set tracking mode based on user activity
   */
  setTrackingMode(mode: "idle" | "normal" | "active"): void {
    if (this.trackingMode === mode) return;

    console.log(`📍 Switching tracking mode: ${this.trackingMode} → ${mode}`);
    this.trackingMode = mode;

    // Restart tracking with new mode
    if (this.isTracking) {
      this.stopLocationTracking();
      this.startLocationTracking();
    }
  }

  /**
   * Start location tracking based on mode
   */
  async startLocationTracking(): Promise<void> {
    if (this.isTracking) return;
    this.isTracking = true;

    const interval = this.INTERVALS[this.trackingMode];

    if (this.trackingMode === "active") {
      // Use WebSocket for active emergencies
      await this.startWebSocketTracking();
    } else {
      // Use HTTP for idle/normal modes
      await this.startHttpTracking(interval);
    }
  }

  /**
   * HTTP-based tracking for background updates
   */
  private async startHttpTracking(interval: number): Promise<void> {
    console.log(`📍 Starting HTTP tracking (interval: ${interval}ms)`);

    await this.updateLocationViaHttp();

    this.httpUpdateInterval = setInterval(async () => {
      await this.updateLocationViaHttp();
    }, interval) as any;
  }

  /**
   * WebSocket-based tracking for active emergencies
   */
  private async startWebSocketTracking(): Promise<void> {
    console.log("📍 Starting WebSocket tracking (5 second updates)");

    // Import WebSocket service
    const websocketService = (await import("./websocketService")).default;

    // Update immediately
    await this.updateLocationViaWebSocket();

    // Then update every 5 seconds
    this.websocketUpdateInterval = setInterval(async () => {
      await this.updateLocationViaWebSocket();
    }, 5000) as any;
  }

  /**
   * Update location via HTTP (existing method - renamed)
   */
  private async updateLocationViaHttp(): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Your existing updateLocationToServer() logic here
    // ... (keep all your throttling logic)
  }

  /**
   * Update location via WebSocket (for active emergencies)
   */
  private async updateLocationViaWebSocket(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const websocketService = (await import("./websocketService")).default;

      // Use the alertId from context if available
      const alertId = await this.getActiveAlertId();

      if (alertId && websocketService.isConnected()) {
        websocketService.sendLocationUpdate(
          alertId,
          location.coords.latitude,
          location.coords.longitude
        );
        console.log("📍 Location sent via WebSocket");
      } else {
        // Fallback to HTTP if no alert or not connected
        await this.updateLocationViaHttp();
      }
    } catch (error) {
      console.error("WebSocket location update failed:", error);
    }
  }

  /**
   * Get active alert ID from AsyncStorage or context
   */
  private async getActiveAlertId(): Promise<number | null> {
    try {
      const alertIdStr = await AsyncStorage.getItem("active_alert_id");
      return alertIdStr ? parseInt(alertIdStr) : null;
    } catch {
      return null;
    }
  }

  stopLocationTracking(): void {
    if (this.httpUpdateInterval) {
      clearInterval(this.httpUpdateInterval);
      this.httpUpdateInterval = null;
    }
    if (this.websocketUpdateInterval) {
      clearInterval(this.websocketUpdateInterval);
      this.websocketUpdateInterval = null;
    }
    this.isTracking = false;
    console.log("Location tracking stopped");
  }
}
```

### 2. Update Context to Switch Modes

```typescript
// In SOSContext or AlertContext
export function SOSProvider({ children }: { children: ReactNode }) {
  const triggerEmergency = async () => {
    // When SOS is triggered
    locationService.setTrackingMode("active"); // Switch to WebSocket
    // ... rest of SOS logic
  };

  const cancelEmergency = async () => {
    // When SOS is cancelled/resolved
    locationService.setTrackingMode("normal"); // Switch back to HTTP
    // ... rest of cancel logic
  };
}

// In ResponderHomepage
const handleAcceptAlert = async (alertId: string) => {
  await apiService.acceptAlert(alertId);
  locationService.setTrackingMode("active"); // Switch to WebSocket for navigation
  await AsyncStorage.setItem("active_alert_id", alertId);
};

const handleResolveAlert = async () => {
  locationService.setTrackingMode("normal"); // Switch back to HTTP
  await AsyncStorage.removeItem("active_alert_id");
};
```

---

## Alternative Options

### Option 2: WebSocket Only (Simpler but Higher Overhead)

- Use WebSocket for all location updates
- Adjust frequency based on mode (5s active, 60s normal, 5min idle)
- Pros: Consistent approach, real-time capability
- Cons: More server load, battery drain, WebSocket connection always needed

### Option 3: HTTP Only with Adaptive Intervals (Current + Minor Tweaks)

- Keep HTTP but adjust intervals dynamically
- 5s for active, 60s for normal, 5min for idle
- Pros: Simple, works without WebSocket
- Cons: Not truly real-time, more network overhead than WebSocket for high-frequency

---

## Battery Optimization Best Practices

Regardless of approach chosen:

1. **Use significant location changes** (already implemented ✅)

   - Skip updates if moved < 10m
   - Skip if time < threshold

2. **Adjust GPS accuracy by mode**

   ```typescript
   const accuracy =
     mode === "active" ? Location.Accuracy.High : Location.Accuracy.Balanced;
   ```

3. **Background location (for production apps)**

   - Request background location permissions
   - Use `expo-task-manager` for background updates
   - Reduce frequency when app is backgrounded

4. **Batch updates in idle mode**
   - Collect multiple location points
   - Send batch updates every 5 minutes

---

## Recommendation Summary

### ✅ Use Hybrid Approach (Option 1)

**Implementation Steps:**

1. Keep your existing HTTP polling for background
2. Add WebSocket updates for active emergencies
3. Switch modes based on user state:
   - `idle`: 5 min HTTP (user logged in, not doing anything)
   - `normal`: 1-2 min HTTP (browsing app)
   - `active`: 5-10s WebSocket (SOS triggered or responding to alert)

**Why This is Best:**

- ✅ Industry standard (Uber, emergency apps use this)
- ✅ Battery efficient (HTTP for background, WebSocket only when needed)
- ✅ Real-time when critical (5s updates during emergencies)
- ✅ You already have all infrastructure (just need to wire it up)
- ✅ Graceful degradation (falls back to HTTP if WebSocket fails)

**Estimated Implementation Time:** 2-3 hours

---

## Quick Win: Minimal Changes

If you want to keep it simple for now, just adjust the intervals:

```typescript
private readonly UPDATE_INTERVALS = {
  default: 120000,  // 2 minutes instead of 30s (save battery)
  active: 10000,    // 10 seconds when emergency active
};
```

This alone will:

- Reduce battery drain by 75% in normal usage
- Still provide reasonably timely updates
- No architectural changes needed
