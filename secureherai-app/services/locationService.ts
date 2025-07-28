import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "./api";

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

class LocationService {
  private static instance: LocationService;
  private updateInterval: NodeJS.Timeout | null = null;
  private isTracking = false;
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds
  private readonly LOCATION_STORAGE_KEY = "last_location_update";

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
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
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
   * Watch location changes
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
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
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
   * Start automatic location tracking and updates
   */
  async startLocationTracking(): Promise<void> {
    if (this.isTracking) {
      console.log("Location tracking already started");
      return;
    }

    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Location permission not granted");
        return;
      }

      this.isTracking = true;
      console.log("Starting automatic location tracking...");

      // Update location immediately
      await this.updateLocationToServer();

      // Set up periodic updates
      this.updateInterval = setInterval(async () => {
        await this.updateLocationToServer();
      }, this.UPDATE_INTERVAL) as any;
    } catch (error) {
      console.error("Failed to start location tracking:", error);
      this.isTracking = false;
    }
  }

  /**
   * Stop automatic location tracking
   */
  stopLocationTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isTracking = false;
    console.log("Location tracking stopped");
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
      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      console.log("📍 Attempting to update location to server:", {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
      });

      // Check if we should skip this update (location hasn't changed much)
      const shouldUpdate = await this.shouldUpdateLocation(locationData);
      if (!shouldUpdate) {
        console.log("Location update skipped - minimal change detected");
        return { success: true };
      }

      // Update location via API
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

        console.log("📍 Location updated successfully on server:", {
          lat: locationData.latitude.toFixed(6),
          lng: locationData.longitude.toFixed(6),
        });

        return { success: true };
      } else {
        console.warn("📍 API location update failed:", response.error);
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error("📍 Location update error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if location has changed significantly to warrant an update
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

      // Calculate distance between locations (simple distance check)
      const distance = this.calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      // Update if moved more than 10 meters or if it's been more than 5 minutes
      const significantDistance = distance > 0.01; // ~10 meters
      const significantTime =
        newLocation.timestamp - lastLocation.timestamp > 300000; // 5 minutes

      return significantDistance || significantTime;
    } catch (error) {
      console.warn("Error checking location update necessity:", error);
      return true; // When in doubt, update
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
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
   * Get current tracking status
   */
  isLocationTrackingActive(): boolean {
    return this.isTracking;
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
