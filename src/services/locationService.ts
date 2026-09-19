/**
 * MeetAdr Location Service
 * Comprehensive location detection for UAE healthcare providers.
 * Supports:
 * - GPS Geolocation via Browser API (navigator.geolocation)
 * - Centroid matching to the 7 UAE Emirates using the Haversine distance formula
 * - Silent IP-based geolocation fallback
 * - LocalStorage persistence of user location preferences
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface EmirateCentroid {
  code: string;       // Matches value used in select options: 'Dxb', 'Abu Dhabi', 'Sharjah', etc.
  name: string;       // English display name
  nameAr: string;     // Arabic display name
  iata: string;       // Airport code
  lat: number;
  lng: number;
}

export interface DetectedLocationResult {
  emirateCode: string;
  emirateName: string;
  emirateNameAr: string;
  coordinates: Coordinates | null;
  source: 'gps' | 'ip' | 'cache' | 'default';
  accuracy?: number;
  distanceToCentroidKm?: number;
}

export const UAE_EMIRATES: EmirateCentroid[] = [
  {
    code: 'Dxb',
    name: 'Dubai',
    nameAr: 'دبي',
    iata: 'DXB',
    lat: 25.2048,
    lng: 55.2708,
  },
  {
    code: 'Abu Dhabi',
    name: 'Abu Dhabi',
    nameAr: 'أبوظبي',
    iata: 'AUH',
    lat: 24.4539,
    lng: 54.3773,
  },
  {
    code: 'Sharjah',
    name: 'Sharjah',
    nameAr: 'الشارقة',
    iata: 'SHJ',
    lat: 25.3463,
    lng: 55.4209,
  },
  {
    code: 'Ajman',
    name: 'Ajman',
    nameAr: 'عجمان',
    iata: 'AJM',
    lat: 25.4052,
    lng: 55.5136,
  },
  {
    code: 'Ras Al Khaimah',
    name: 'Ras Al Khaimah',
    nameAr: 'رأس الخيمة',
    iata: 'RAK',
    lat: 25.6741,
    lng: 55.9804,
  },
  {
    code: 'Fujairah',
    name: 'Fujairah',
    nameAr: 'الفجيرة',
    iata: 'FUJ',
    lat: 25.1288,
    lng: 56.3265,
  },
  {
    code: 'Umm Al Quwain',
    name: 'Umm Al Quwain',
    nameAr: 'أم القيوين',
    iata: 'UAQ',
    lat: 25.5647,
    lng: 55.5552,
  },
];

const CACHE_KEY = 'meetadr_user_location';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Calculates Great-Circle distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistanceKm(
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
  return Math.round(R * c * 10) / 10;
}

/**
 * Matches coordinates to the nearest UAE Emirate centroid
 */
export function matchNearestEmirate(lat: number, lng: number): {
  emirate: EmirateCentroid;
  distanceKm: number;
} {
  let nearest = UAE_EMIRATES[0];
  let minDistance = calculateDistanceKm(lat, lng, nearest.lat, nearest.lng);

  for (let i = 1; i < UAE_EMIRATES.length; i++) {
    const d = calculateDistanceKm(lat, lng, UAE_EMIRATES[i].lat, UAE_EMIRATES[i].lng);
    if (d < minDistance) {
      minDistance = d;
      nearest = UAE_EMIRATES[i];
    }
  }

  return { emirate: nearest, distanceKm: minDistance };
}

/**
 * Retrieves cached location preference from localStorage
 */
export function getCachedLocation(): DetectedLocationResult | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return {
      ...parsed.data,
      source: 'cache',
    };
  } catch {
    return null;
  }
}

/**
 * Persists detected or selected location to localStorage
 */
export function setCachedLocation(data: Omit<DetectedLocationResult, 'source'>) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Requests high-accuracy GPS coordinates via browser Geolocation API
 */
export function detectBrowserLocation(): Promise<DetectedLocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const match = matchNearestEmirate(latitude, longitude);

        const result: DetectedLocationResult = {
          emirateCode: match.emirate.code,
          emirateName: match.emirate.name,
          emirateNameAr: match.emirate.nameAr,
          coordinates: { latitude, longitude },
          source: 'gps',
          accuracy,
          distanceToCentroidKm: match.distanceKm,
        };

        setCachedLocation(result);
        resolve(result);
      },
      (error) => {
        let msg = 'Unable to retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission was denied.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Silent fallback: Detects rough location via IP geolocation (no permission dialog required)
 */
export async function detectIpLocation(): Promise<DetectedLocationResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const lat = data.latitude;
    const lng = data.longitude;
    const city = (data.city || '').toLowerCase();
    const region = (data.region || '').toLowerCase();

    // Check if within UAE or matches known city
    let matchedEmirate: EmirateCentroid | undefined;

    if (city.includes('dubai') || region.includes('dubai')) {
      matchedEmirate = UAE_EMIRATES.find((e) => e.code === 'Dxb');
    } else if (city.includes('abu dhabi') || region.includes('abu dhabi')) {
      matchedEmirate = UAE_EMIRATES.find((e) => e.code === 'Abu Dhabi');
    } else if (city.includes('sharjah') || region.includes('sharjah')) {
      matchedEmirate = UAE_EMIRATES.find((e) => e.code === 'Sharjah');
    } else if (city.includes('ajman') || region.includes('ajman')) {
      matchedEmirate = UAE_EMIRATES.find((e) => e.code === 'Ajman');
    } else if (city.includes('ras al') || region.includes('ras al')) {
      matchedEmirate = UAE_EMIRATES.find((e) => e.code === 'Ras Al Khaimah');
    } else if (city.includes('fujairah') || region.includes('fujairah')) {
      matchedEmirate = UAE_EMIRATES.find((e) => e.code === 'Fujairah');
    } else if (city.includes('umm al') || region.includes('umm al')) {
      matchedEmirate = UAE_EMIRATES.find((e) => e.code === 'Umm Al Quwain');
    } else if (typeof lat === 'number' && typeof lng === 'number') {
      matchedEmirate = matchNearestEmirate(lat, lng).emirate;
    }

    if (!matchedEmirate) {
      matchedEmirate = UAE_EMIRATES[0]; // Default to Dubai
    }

    const result: DetectedLocationResult = {
      emirateCode: matchedEmirate.code,
      emirateName: matchedEmirate.name,
      emirateNameAr: matchedEmirate.nameAr,
      coordinates: typeof lat === 'number' && typeof lng === 'number' ? { latitude: lat, longitude: lng } : null,
      source: 'ip',
    };

    setCachedLocation(result);
    return result;
  } catch {
    return null;
  }
}
