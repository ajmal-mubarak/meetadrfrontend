import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Coordinates,
  DetectedLocationResult,
  UAE_EMIRATES,
  calculateDistanceKm,
  detectBrowserLocation,
  detectIpLocation,
  getCachedLocation,
  setCachedLocation,
} from '../services/locationService';

export type LocationStatus = 'idle' | 'detecting' | 'detected' | 'denied' | 'error';

interface LocationContextType {
  location: DetectedLocationResult | null;
  status: LocationStatus;
  errorMessage: string | null;
  detectLocation: (forceGps?: boolean) => Promise<DetectedLocationResult | null>;
  setManualLocation: (emirateCode: string) => void;
  distanceTo: (lat?: number, lng?: number) => number | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<DetectedLocationResult | null>(() => getCachedLocation());
  const [status, setStatus] = useState<LocationStatus>(() => (location ? 'detected' : 'idle'));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize: if not cached, try silent IP detection once
  useEffect(() => {
    if (!location) {
      detectIpLocation()
        .then((res) => {
          if (res) {
            setLocation(res);
            setStatus('detected');
          }
        })
        .catch(() => {
          // Silent failure, remain idle
        });
    }
  }, []);

  const detectLocation = useCallback(async (forceGps = true): Promise<DetectedLocationResult | null> => {
    setStatus('detecting');
    setErrorMessage(null);

    if (forceGps) {
      try {
        const gpsResult = await detectBrowserLocation();
        setLocation(gpsResult);
        setStatus('detected');
        return gpsResult;
      } catch (err: any) {
        // Fallback to IP detection if GPS fails or is denied
        try {
          const ipResult = await detectIpLocation();
          if (ipResult) {
            setLocation(ipResult);
            setStatus('detected');
            return ipResult;
          }
        } catch {
          // Ignore
        }

        const msg = err.message || 'Unable to detect your location.';
        setErrorMessage(msg);
        setStatus(err.message?.includes('denied') ? 'denied' : 'error');
        return null;
      }
    } else {
      // Non-GPS silent detection
      try {
        const ipResult = await detectIpLocation();
        if (ipResult) {
          setLocation(ipResult);
          setStatus('detected');
          return ipResult;
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Location detection failed.');
        setStatus('error');
      }
      return null;
    }
  }, []);

  const setManualLocation = useCallback((emirateCode: string) => {
    const found = UAE_EMIRATES.find((e) => e.code === emirateCode);
    if (!found) return;

    const manualResult: DetectedLocationResult = {
      emirateCode: found.code,
      emirateName: found.name,
      emirateNameAr: found.nameAr,
      coordinates: { latitude: found.lat, longitude: found.lng },
      source: 'default',
    };

    setLocation(manualResult);
    setStatus('detected');
    setCachedLocation(manualResult);
  }, []);

  const distanceTo = useCallback(
    (targetLat?: number, targetLng?: number): number | null => {
      if (
        !location?.coordinates ||
        typeof targetLat !== 'number' ||
        typeof targetLng !== 'number'
      ) {
        return null;
      }
      return calculateDistanceKm(
        location.coordinates.latitude,
        location.coordinates.longitude,
        targetLat,
        targetLng
      );
    },
    [location]
  );

  return (
    <LocationContext.Provider
      value={{
        location,
        status,
        errorMessage,
        detectLocation,
        setManualLocation,
        distanceTo,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useUserLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a LocationProvider');
  }
  return context;
};
