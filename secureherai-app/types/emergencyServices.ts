export interface EmergencyService {
  id: string;
  name: string;
  type: "police" | "hospital" | "fire" | "medical" | "general";
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  phone?: string;
  is24Hours?: boolean;
  distance?: number; // Distance from user in meters
  rating?: number;
  website?: string;
}

export interface EmergencyServicesResponse {
  success: boolean;
  services?: EmergencyService[];
  error?: string;
}

export interface SafePlace {
  id: string;
  placeName: string; // Changed from 'name' to match backend
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  img_url?: string; // Added to match backend
  created_at?: string; // Added to match backend (ISO string)
  // Legacy fields for compatibility (can be removed later)
  name?: string; // For backward compatibility
  type?:
    | "hospital"
    | "police_station"
    | "fire_station"
    | "safe_zone"
    | "government_building";
  phone?: string;
  hours?: string;
  distance?: number;
  verified?: boolean;
}

export interface SafePlacesResponse {
  success: boolean;
  places?: SafePlace[];
  error?: string;
}
