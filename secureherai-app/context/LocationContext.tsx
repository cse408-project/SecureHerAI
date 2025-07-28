import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import locationService from '../services/locationService';
import { useAuth } from './AuthContext';

interface LocationContextType {
  isLocationTrackingActive: boolean;
  lastLocationUpdate: Date | null;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  manualLocationReload: () => Promise<{ success: boolean; message: string }>;
  isManuallyUpdating: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [isLocationTrackingActive, setIsLocationTrackingActive] = useState(false);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);
  const [isManuallyUpdating, setIsManuallyUpdating] = useState(false);
  const { user, token } = useAuth();

  // Auto-start location tracking when user is authenticated
  useEffect(() => {
    const initializeLocationTracking = async () => {
      if (user && token && !isLocationTrackingActive) {
        console.log('User authenticated, starting location tracking...');
        await startLocationTracking();
      } else if (!user && isLocationTrackingActive) {
        console.log('User logged out, stopping location tracking...');
        stopLocationTracking();
      }
    };

    initializeLocationTracking();
  }, [user, token, isLocationTrackingActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isLocationTrackingActive) {
        locationService.stopLocationTracking();
      }
    };
  }, [isLocationTrackingActive]);

  const startLocationTracking = async (): Promise<void> => {
    try {
      await locationService.startLocationTracking();
      setIsLocationTrackingActive(true);
      setLastLocationUpdate(new Date());
      console.log('Location tracking started successfully');
    } catch (error) {
      console.error('Failed to start location tracking:', error);
    }
  };

  const stopLocationTracking = (): void => {
    locationService.stopLocationTracking();
    setIsLocationTrackingActive(false);
    console.log('Location tracking stopped');
  };

  const manualLocationReload = async (): Promise<{ success: boolean; message: string }> => {
    setIsManuallyUpdating(true);
    try {
      const result = await locationService.manualLocationUpdate();
      if (result.success) {
        setLastLocationUpdate(new Date());
      }
      return result;
    } finally {
      setIsManuallyUpdating(false);
    }
  };

  const value: LocationContextType = {
    isLocationTrackingActive,
    lastLocationUpdate,
    startLocationTracking,
    stopLocationTracking,
    manualLocationReload,
    isManuallyUpdating,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
