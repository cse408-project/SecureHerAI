// You'll need to get this from Google Cloud Console
const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || "YOUR_GOOGLE_PLACES_API_KEY";

export interface PlaceDetails {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  types: string[];
  opening_hours?: {
    open_now: boolean;
  };
  photos?: {
    photo_reference: string;
  }[];
}

export interface EmergencyServiceFromGoogle {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  type: "hospital" | "police" | "fire_station" | "pharmacy";
  rating?: number;
  isOpen?: boolean;
  distance?: number;
}

class GooglePlacesService {
  private async makeRequest(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Google Places API Error:", error);
      return {
        success: false,
        error: "Failed to fetch data from Google Places API",
      };
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 1000); // Convert to meters
  }

  private transformToEmergencyService(
    place: PlaceDetails,
    userLat: number,
    userLng: number,
    serviceType: "hospital" | "police" | "fire_station" | "pharmacy"
  ): EmergencyServiceFromGoogle {
    const distance = this.calculateDistance(
      userLat,
      userLng,
      place.geometry.location.lat,
      place.geometry.location.lng
    );

    return {
      id: place.place_id,
      name: place.name,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      address: place.vicinity,
      type: serviceType,
      rating: place.rating,
      isOpen: place.opening_hours?.open_now,
      distance: distance,
    };
  }

  async getNearbyHospitals(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<{
    success: boolean;
    data?: EmergencyServiceFromGoogle[];
    error?: string;
  }> {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=hospital&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await this.makeRequest(url);
    if (!response.success) return response;

    const hospitals = response.data.results.map((place: PlaceDetails) =>
      this.transformToEmergencyService(place, latitude, longitude, "hospital")
    );

    return { success: true, data: hospitals };
  }

  async getNearbyPoliceStations(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<{
    success: boolean;
    data?: EmergencyServiceFromGoogle[];
    error?: string;
  }> {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=police&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await this.makeRequest(url);
    if (!response.success) return response;

    const policeStations = response.data.results.map((place: PlaceDetails) =>
      this.transformToEmergencyService(place, latitude, longitude, "police")
    );

    return { success: true, data: policeStations };
  }

  async getNearbyFireStations(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<{
    success: boolean;
    data?: EmergencyServiceFromGoogle[];
    error?: string;
  }> {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=fire_station&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await this.makeRequest(url);
    if (!response.success) return response;

    const fireStations = response.data.results.map((place: PlaceDetails) =>
      this.transformToEmergencyService(
        place,
        latitude,
        longitude,
        "fire_station"
      )
    );

    return { success: true, data: fireStations };
  }

  async getNearbyPharmacies(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<{
    success: boolean;
    data?: EmergencyServiceFromGoogle[];
    error?: string;
  }> {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=pharmacy&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await this.makeRequest(url);
    if (!response.success) return response;

    const pharmacies = response.data.results.map((place: PlaceDetails) =>
      this.transformToEmergencyService(place, latitude, longitude, "pharmacy")
    );

    return { success: true, data: pharmacies };
  }

  async getAllNearbyEmergencyServices(
    latitude: number,
    longitude: number,
    radius: number = 5000
  ): Promise<{
    success: boolean;
    data?: EmergencyServiceFromGoogle[];
    error?: string;
  }> {
    try {
      const [hospitalsRes, policeRes, fireRes, pharmaciesRes] =
        await Promise.all([
          this.getNearbyHospitals(latitude, longitude, radius),
          this.getNearbyPoliceStations(latitude, longitude, radius),
          this.getNearbyFireStations(latitude, longitude, radius),
          this.getNearbyPharmacies(latitude, longitude, radius),
        ]);

      let allServices: EmergencyServiceFromGoogle[] = [];

      if (hospitalsRes.success && hospitalsRes.data) {
        allServices = [...allServices, ...hospitalsRes.data];
      }
      if (policeRes.success && policeRes.data) {
        allServices = [...allServices, ...policeRes.data];
      }
      if (fireRes.success && fireRes.data) {
        allServices = [...allServices, ...fireRes.data];
      }
      if (pharmaciesRes.success && pharmaciesRes.data) {
        allServices = [...allServices, ...pharmaciesRes.data];
      }

      // Sort by distance
      allServices.sort((a, b) => (a.distance || 0) - (b.distance || 0));

      return { success: true, data: allServices };
    } catch (error) {
      console.error("Error fetching all emergency services:", error);
      return { success: false, error: "Failed to fetch emergency services" };
    }
  }
}

export default new GooglePlacesService();
