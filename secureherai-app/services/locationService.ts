import * as Location from "expo-location";

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
}

export default LocationService.getInstance();
