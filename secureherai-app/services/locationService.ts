import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "./api";
import websocketService from "./websocketService";

export interface LocationCoords {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface LocationData {
  coords: LocationCoords;
  timestamp: number;
}

/**
 * Location tracking modes for different scenarios
 * - idle: User logged in but not actively using app (minimal battery usage)
 * - normal: Regular app usage (moderate tracking)
 * - active: During active SOS/emergency or responder navigation (real-time tracking)
 */
export type TrackingMode = "idle" | "normal" | "active";

/**
 * LocationService - Battery-optimized location tracking service
 *
 * Uses adaptive tracking with different update intervals based on mode:
 * - idle: 5 minutes (background, battery conservation)
 * - normal: 2 minutes (standard app usage)
 * - active: 10 seconds (emergency situations, real-time tracking)
 *
 * Best practices implemented:
 * 1. Adaptive tracking intervals based on user context
 * 2. Smart throttling (skip updates if minimal movement)
 * 3. GPS accuracy adjustment based on mode
 * 4. Distance-based filtering to reduce redundant updates
 */
class LocationService {
  private static instance: LocationService;
  private updateInterval: NodeJS.Timeout | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private trackingMode: TrackingMode = "idle";
  private isVictim: boolean = false; // Track if user is victim (true) or responder (false)

  // Adaptive intervals for different modes (in milliseconds)
  private readonly INTERVALS: Record<TrackingMode, number> = {
    idle: 300000, // 5 minutes - minimal battery usage
    normal: 120000, // 2 minutes - standard tracking
    active: 10000, // 10 seconds - real-time emergency tracking
  };

  // GPS accuracy settings for different modes
  private readonly ACCURACY: Record<TrackingMode, Location.Accuracy> = {
    idle: Location.Accuracy.Balanced, // ~100m accuracy, saves battery
    normal: Location.Accuracy.Balanced, // ~100m accuracy
    active: Location.Accuracy.High, // ~10m accuracy for emergencies
  };

  // Minimum distance change (meters) to trigger update
  private readonly MIN_DISTANCE: Record<TrackingMode, number> = {
    idle: 100, // 100m movement required
    normal: 50, // 50m movement required
    active: 10, // 10m movement required (real-time tracking)
  };

  private readonly LOCATION_STORAGE_KEY = "last_location_update";
  private readonly ACTIVE_ALERT_KEY = "active_alert_id";
  private readonly IS_VICTIM_KEY = "is_victim_in_emergency";

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions from the user
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  }

  /**
   * Get current location of the user
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error("Location permission not granted");
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: this.ACCURACY[this.trackingMode],
      });

      return {
        coords: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  }

  /**
   * Watch location changes (uses adaptive settings based on tracking mode)
   */
  async watchLocation(
    callback: (location: LocationData) => void,
    errorCallback?: (error: Error) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        throw new Error("Location permission not granted");
      }

      return await Location.watchPositionAsync(
        {
          accuracy: this.ACCURACY[this.trackingMode],
          timeInterval: this.INTERVALS[this.trackingMode],
          distanceInterval: this.MIN_DISTANCE[this.trackingMode],
        },
        (location) => {
          const locationData: LocationData = {
            coords: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            timestamp: location.timestamp,
          };
          callback(locationData);
        }
      );
    } catch (error) {
      console.error("Error watching location:", error);
      if (errorCallback) {
        errorCallback(error as Error);
      }
      return null;
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        return `${address.street || ""} ${address.city || ""} ${
          address.region || ""
        } ${address.country || ""}`.trim();
      }
      return null;
    } catch (error) {
      console.error("Error getting address from coordinates:", error);
      return null;
    }
  }

  /**
   * Get coordinates from address (geocoding)
   */
  async getCoordinatesFromAddress(
    address: string
  ): Promise<LocationCoords | null> {
    try {
      const locations = await Location.geocodeAsync(address);

      if (locations.length > 0) {
        const location = locations[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting coordinates from address:", error);
      return null;
    }
  }

  /**
   * Set tracking mode based on user activity
   * Call this when user state changes (e.g., SOS triggered, alert accepted)
   */
  setTrackingMode(mode: TrackingMode): void {
    if (this.trackingMode === mode) return;

    const previousMode = this.trackingMode;
    this.trackingMode = mode;

    console.log(`📍 Location tracking mode changed: ${previousMode} → ${mode}`);
    console.log(
      `   Interval: ${this.INTERVALS[mode]}ms, MinDistance: ${this.MIN_DISTANCE[mode]}m`
    );

    // Restart tracking with new settings if already tracking
    if (this.isTracking) {
      this.stopLocationTracking();
      this.startLocationTracking();
    }
  }

  /**
   * Get current tracking mode
   */
  getTrackingMode(): TrackingMode {
    return this.trackingMode;
  }

  /**
   * Start automatic location tracking and updates
   * Uses adaptive intervals based on current tracking mode
   */
  async startLocationTracking(): Promise<void> {
    if (this.isTracking) {
      console.log("📍 Location tracking already started");
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("📍 Location permission not granted");
        return;
      }

      this.isTracking = true;
      const mode = this.trackingMode;
      const interval = this.INTERVALS[mode];

      console.log(
        `📍 Starting location tracking (mode: ${mode}, interval: ${interval}ms)`
      );

      // For active mode, use watchPosition for more responsive updates
      if (mode === "active") {
        await this.startActiveTracking();
      } else {
        // For idle/normal modes, use interval-based updates
        await this.startIntervalTracking(interval);
      }
    } catch (error) {
      console.error("📍 Failed to start location tracking:", error);
      this.isTracking = false;
    }
  }

  /**
   * Active mode tracking using watchPosition for real-time updates
   */
  private async startActiveTracking(): Promise<void> {
    console.log("📍 Starting active (real-time) location tracking");

    // Update immediately
    await this.updateLocationToServer();

    // Use watchPosition for responsive updates during emergencies
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Max 10 seconds between updates
        distanceInterval: 10, // Or when moved 10 meters
      },
      async (location) => {
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: Date.now(),
        };

        // Check if significant movement
        const shouldUpdate = await this.shouldUpdateLocation(locationData);
        if (shouldUpdate) {
          await this.sendLocationToServer(locationData);
        }
      }
    );
  }

  /**
   * Interval-based tracking for idle/normal modes
   */
  private async startIntervalTracking(interval: number): Promise<void> {
    console.log(`📍 Starting interval-based tracking (${interval}ms)`);

    // Update immediately
    await this.updateLocationToServer();

    // Set up periodic updates
    this.updateInterval = setInterval(async () => {
      await this.updateLocationToServer();
    }, interval) as any;
  }

  /**
   * Stop automatic location tracking
   */
  stopLocationTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }

    this.isTracking = false;
    console.log("📍 Location tracking stopped");
  }

  /**
   * Manually update location (for the reload button)
   */
  async manualLocationUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return {
          success: false,
          message: "Location permission is required to update your location.",
        };
      }

      const result = await this.updateLocationToServer();
      if (result.success) {
        return {
          success: true,
          message: "Location updated successfully!",
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to update location",
        };
      }
    } catch (error) {
      console.error("Manual location update failed:", error);
      return {
        success: false,
        message:
          "Failed to get current location. Please check your GPS settings.",
      };
    }
  }

  /**
   * Core location update function that sends to server
   */
  private async updateLocationToServer(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get current position with accuracy based on tracking mode
      const location = await Location.getCurrentPositionAsync({
        accuracy: this.ACCURACY[this.trackingMode],
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      // Check if we should skip this update (location hasn't changed much)
      const shouldUpdate = await this.shouldUpdateLocation(locationData);
      if (!shouldUpdate) {
        console.log("📍 Location update skipped - minimal change detected");
        return { success: true };
      }

      return await this.sendLocationToServer(locationData);
    } catch (error) {
      console.error("📍 Location update error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send location data to server
   * - Active mode: Uses WebSocket for real-time updates during emergencies
   *   - Victims send to /app/emergency/victim-location (broadcasts to responders)
   *   - Responders send to /app/emergency/location (sends to victim)
   * - Idle/Normal mode: Uses HTTP for background updates
   */
  private async sendLocationToServer(locationData: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // During active emergencies, use WebSocket for real-time location streaming
      if (this.trackingMode === "active" && websocketService.isConnected()) {
        const alertId = await this.getActiveAlertId();

        if (alertId) {
          // Send to appropriate endpoint based on role
          if (this.isVictim) {
            // Victim sends location to all accepted responders
            websocketService.sendVictimLocationUpdate(
              parseInt(alertId),
              locationData.latitude,
              locationData.longitude
            );
            console.log("📍 Victim location sent via WebSocket:", {
              lat: locationData.latitude.toFixed(6),
              lng: locationData.longitude.toFixed(6),
              alertId,
              role: "victim",
            });
          } else {
            // Responder sends location to victim
            websocketService.sendLocationUpdate(
              parseInt(alertId),
              locationData.latitude,
              locationData.longitude
            );
            console.log("📍 Responder location sent via WebSocket:", {
              lat: locationData.latitude.toFixed(6),
              lng: locationData.longitude.toFixed(6),
              alertId,
              role: "responder",
            });
          }

          // Store last successful update
          await AsyncStorage.setItem(
            this.LOCATION_STORAGE_KEY,
            JSON.stringify(locationData)
          );

          return { success: true };
        }
      }

      // Fallback to HTTP for idle/normal modes or if WebSocket unavailable
      const response = await ApiService.updateLocation({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });

      if (response.success) {
        // Store last successful update
        await AsyncStorage.setItem(
          this.LOCATION_STORAGE_KEY,
          JSON.stringify(locationData)
        );

        console.log("📍 Location updated via HTTP:", {
          lat: locationData.latitude.toFixed(6),
          lng: locationData.longitude.toFixed(6),
          mode: this.trackingMode,
        });

        return { success: true };
      } else {
        console.warn("📍 HTTP location update failed:", response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("📍 Location send error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if location has changed significantly to warrant an update
   * Uses different thresholds based on tracking mode
   */
  private async shouldUpdateLocation(newLocation: {
    latitude: number;
    longitude: number;
    timestamp: number;
  }): Promise<boolean> {
    try {
      const lastLocationStr = await AsyncStorage.getItem(
        this.LOCATION_STORAGE_KEY
      );
      if (!lastLocationStr) {
        return true; // First time, always update
      }

      const lastLocation = JSON.parse(lastLocationStr);

      // Calculate distance between locations
      const distance = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      // Use mode-specific thresholds
      const minDistanceKm = this.MIN_DISTANCE[this.trackingMode] / 1000; // Convert meters to km
      const maxTime = this.getMaxTimeBetweenUpdates();

      // Update if moved more than threshold OR if enough time has passed
      const significantDistance = distance >= minDistanceKm;
      const significantTime =
        newLocation.timestamp - lastLocation.timestamp > maxTime;

      return significantDistance || significantTime;
    } catch (error) {
      console.warn("📍 Error checking location update necessity:", error);
      return true; // When in doubt, update
    }
  }

  /**
   * Get maximum time between forced updates (even if no movement)
   */
  private getMaxTimeBetweenUpdates(): number {
    switch (this.trackingMode) {
      case "active":
        return 30000; // 30 seconds - ensure regular updates during emergencies
      case "normal":
        return 300000; // 5 minutes
      case "idle":
        return 600000; // 10 minutes
      default:
        return 300000;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Set active alert ID for context
   */
  async setActiveAlert(alertId: string | null): Promise<void> {
    if (alertId) {
      await AsyncStorage.setItem(this.ACTIVE_ALERT_KEY, alertId);
    } else {
      await AsyncStorage.removeItem(this.ACTIVE_ALERT_KEY);
    }
  }

  /**
   * Get active alert ID
   */
  async getActiveAlertId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.ACTIVE_ALERT_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Get current tracking status
   */
  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Check if current user is a victim in active emergency
   */
  isVictimInEmergency(): boolean {
    return this.isVictim;
  }

  /**
   * Enable emergency tracking mode for SOS or accepted alerts
   * This switches to high-frequency, high-accuracy GPS tracking
   * @param alertId - The ID of the active alert
   * @param asVictim - true if user triggered SOS (victim), false if responder accepted
   */
  async enableEmergencyTracking(
    alertId: string,
    asVictim: boolean = false
  ): Promise<void> {
    console.log(
      `🚨 Enabling emergency tracking for alert: ${alertId} (as ${
        asVictim ? "victim" : "responder"
      })`
    );
    this.isVictim = asVictim;
    await AsyncStorage.setItem(this.IS_VICTIM_KEY, asVictim ? "true" : "false");
    await this.setActiveAlert(alertId);
    await this.setTrackingMode("active");
    console.log("🚨 Emergency tracking enabled - high frequency mode active");
  }

  /**
   * Disable emergency tracking and return to normal mode
   * Call this when an emergency is resolved
   */
  async disableEmergencyTracking(): Promise<void> {
    console.log("✅ Disabling emergency tracking");
    this.isVictim = false;
    await AsyncStorage.removeItem(this.IS_VICTIM_KEY);
    await this.setActiveAlert(null);
    await this.setTrackingMode("normal");
    console.log("✅ Emergency tracking disabled - returning to normal mode");
  }

  /**
   * Set tracking to idle mode (minimal battery usage)
   * Use when app is in background with no active situations
   */
  async enableIdleTracking(): Promise<void> {
    console.log("😴 Enabling idle tracking mode");
    await this.setTrackingMode("idle");
  }

  /**
   * Get last known location from storage
   */
  async getLastKnownLocation(): Promise<{
    latitude: number;
    longitude: number;
    timestamp: number;
  } | null> {
    try {
      const lastLocationStr = await AsyncStorage.getItem(
        this.LOCATION_STORAGE_KEY
      );
      return lastLocationStr ? JSON.parse(lastLocationStr) : null;
    } catch (error) {
      console.error("Error getting last known location:", error);
      return null;
    }
  }
}

export default LocationService.getInstance();
