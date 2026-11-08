'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy?: number | null;
  address_line: string;
  landmark?: string;
  locality: string;
  city: string;
  state: string;
  postal_code: string;
  formatted_address: string;
}

interface LocationContextType {
  location: LocationData;
  isDetecting: boolean;
  error: string | null;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  detectLocation: () => Promise<LocationData>;
  setLocationManually: (data: Partial<LocationData>) => void;
}

const DEFAULT_PRAYAGRAJ_LOCATION: LocationData = {
  latitude: 25.4519,
  longitude: 81.8340,
  accuracy: 10,
  address_line: 'Civil Lines',
  landmark: 'Subhash Chauraha',
  locality: 'Civil Lines',
  city: 'Prayagraj',
  state: 'Uttar Pradesh',
  postal_code: '211001',
  formatted_address: 'Civil Lines, Prayagraj, Uttar Pradesh 211001',
};

const LocationContext = createContext<LocationContextType>({} as LocationContextType);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationData>(DEFAULT_PRAYAGRAJ_LOCATION);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('localhelp_user_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.latitude && parsed.longitude) {
            setLocation(parsed);
          }
        }
      } catch (err) {
        console.error('Failed to parse cached location', err);
      }
    }
  }, []);

  const saveLocation = (data: LocationData) => {
    setLocation(data);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('localhelp_user_location', JSON.stringify(data));
      } catch (err) {
        console.error('Failed to cache location', err);
      }
    }
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<LocationData> => {
    try {
      // First try our Next.js geocode proxy route which handles caching and User-Agent compliance
      let res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
      
      // Fallback to direct Nominatim if the local API route is unreachable
      if (!res.ok) {
        res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en-IN,en;q=0.9',
            },
          }
        );
      }

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || 'Civil Lines';
        const landmark = addr.amenity || addr.building || addr.neighbourhood || addr.suburb || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || 'Civil Lines';
        const city = addr.city || addr.town || addr.state_district || 'Prayagraj';
        const state = addr.state || 'Uttar Pradesh';
        const postcode = addr.postcode || '211001';

        const line = [addr.house_number, road].filter(Boolean).join(' ');
        const full = data.display_name || `${line}, ${suburb}, ${city}, ${postcode}`;

        return {
          latitude: lat,
          longitude: lon,
          address_line: line || road,
          landmark: landmark || suburb,
          locality: suburb,
          city: city,
          state: state,
          postal_code: postcode,
          formatted_address: full,
        };
      }
    } catch (e) {
      console.warn('Reverse geocode network issue, using coordinates fallback:', e);
    }

    return {
      latitude: lat,
      longitude: lon,
      address_line: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
      landmark: 'Prayagraj Area',
      locality: 'Prayagraj',
      city: 'Prayagraj',
      state: 'Uttar Pradesh',
      postal_code: '211001',
      formatted_address: `Coordinates ${lat.toFixed(4)}, ${lon.toFixed(4)}, Prayagraj`,
    };
  };

  const detectLocation = async (): Promise<LocationData> => {
    setIsDetecting(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const err = 'Geolocation is not supported by your browser';
        setError(err);
        setIsDetecting(false);
        reject(new Error(err));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const acc = position.coords.accuracy;

          try {
            const geocoded = await reverseGeocode(lat, lon);
            const finalData: LocationData = {
              ...geocoded,
              accuracy: acc,
            };
            saveLocation(finalData);
            setIsDetecting(false);
            resolve(finalData);
          } catch (err: any) {
            setIsDetecting(false);
            setError(err.message || 'Failed to resolve address');
            reject(err);
          }
        },
        (geoError) => {
          setIsDetecting(false);
          let message = 'Unable to retrieve location';
          if (geoError.code === geoError.PERMISSION_DENIED) {
            message = 'Location permission denied. Please allow location access in your browser settings.';
          } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
            message = 'Position unavailable. Please check your device location settings.';
          } else if (geoError.code === geoError.TIMEOUT) {
            message = 'Location request timed out. Retrying...';
          }
          setError(message);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });
  };

  const setLocationManually = (partial: Partial<LocationData>) => {
    const merged: LocationData = {
      ...location,
      ...partial,
      formatted_address:
        partial.formatted_address ||
        [partial.address_line || location.address_line, partial.locality || location.locality, partial.city || location.city, partial.postal_code || location.postal_code]
          .filter(Boolean)
          .join(', '),
    };
    saveLocation(merged);
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        isDetecting,
        error,
        isModalOpen,
        setIsModalOpen,
        detectLocation,
        setLocationManually,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);

