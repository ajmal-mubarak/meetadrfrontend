/**
 * MeetAdr API Configuration & Canonical Backend Route Definitions.
 *
 * All endpoints match the Django REST backend routes (Phases 1-11).
 * Base URL normalization guarantees canonical `/api/v1` prefix without duplicate segments.
 */

/**
 * Normalizes the raw API base URL from environment variables.
 * Handles inputs with or without trailing slashes, `/api`, or `/api/v1`.
 *
 * Examples:
 * - "http://localhost:8000/api"    -> "http://localhost:8000/api/v1"
 * - "http://localhost:8000/api/"   -> "http://localhost:8000/api/v1"
 * - "http://localhost:8000/api/v1" -> "http://localhost:8000/api/v1"
 * - "http://localhost:8000"        -> "http://localhost:8000/api/v1"
 * - undefined or ""                -> "http://localhost:8000/api/v1"
 */
export function normalizeApiBaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return 'http://localhost:8000/api/v1';
  }

  // Strip all trailing slashes
  const trimmed = rawUrl.trim().replace(/\/+$/, '');

  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }
  if (trimmed.endsWith('/api')) {
    return `${trimmed}/v1`;
  }
  return `${trimmed}/api/v1`;
}

// Canonical API Base URL derived from Vite environment
const rawEnvUrl = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env?.VITE_API_BASE_URL;
export const API_BASE_URL: string = normalizeApiBaseUrl(rawEnvUrl);

/**
 * Builds a fully-qualified URL for a given relative endpoint and optional query params.
 */
export function buildApiUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseWithEndpoint = `${API_BASE_URL}${cleanEndpoint}`;

  if (!params) {
    return baseWithEndpoint;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${baseWithEndpoint}?${queryString}` : baseWithEndpoint;
}

/**
 * Canonical Backend Endpoints (matching Django REST Framework routes).
 */
export const API_ENDPOINTS = {
  // Authentication & Session
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    REFRESH: '/auth/token/refresh/',
    LOGOUT: '/auth/logout/',
    ME: '/auth/me/',
    PROVIDER_SETUP_VALIDATE: '/auth/provider-setup/validate/',
    PROVIDER_SETUP_COMPLETE: '/auth/provider-setup/complete/',
  },

  // Health
  HEALTH: '/health/',

  // Patients & Dependents
  PATIENTS: {
    PROFILE: '/patient/profile/',
    DEPENDENTS: '/patient/dependents/',
    DEPENDENT_DETAIL: (id: string) => `/patient/dependents/${id}/`,
  },

  // Doctors & Doctor Portal
  DOCTORS: {
    LIST: '/doctors/',
    DETAIL: (id: string) => `/doctors/${id}/`,
    AVAILABILITY: (id: string) => `/doctors/${id}/availability/`,
    REVIEWS: (id: string) => `/doctors/${id}/reviews/`,
    DASHBOARD: '/doctor/dashboard/',
    SCHEDULE: '/doctor/schedule/',
    PATIENTS: '/doctor/patients/',
    PATIENT_PROFILE: (patientId: string) => `/doctor/patients/${patientId}/profile/`,
    MY_APPOINTMENTS: '/doctor/appointments/',
    APPOINTMENT_STATUS: (id: string) => `/doctor/appointments/${id}/status/`,
  },

  // Facilities (Hospitals & Clinics) & Facility Admin Portal
  FACILITIES: {
    LIST: '/facilities/',
    DETAIL: (id: string) => `/facilities/${id}/`,
    HOSPITALS: '/hospitals/',
    CLINICS: '/clinics/',
    SETTINGS: '/facility/settings/',
    DASHBOARD: '/facility/dashboard/',
    DOCTORS: '/facility/doctors/',
    DOCTOR_DETAIL: (id: string) => `/facility/doctors/${id}/`,
    DOCTOR_STATUS: (id: string) => `/facility/doctors/${id}/status/`,
    DEPARTMENTS: '/facility/departments/',
    DEPARTMENT_DETAIL: (id: string) => `/facility/departments/${id}/`,
    MY_APPOINTMENTS: '/hospital/appointments/',
    APPOINTMENT_CANCEL: (id: string) => `/hospital/appointments/${id}/cancel/`,
    APPOINTMENT_STATUS: (id: string) => `/hospital/appointments/${id}/status/`,
  },

  // Appointments
  APPOINTMENTS: {
    LIST: '/appointments/',
    MY: '/appointments/my/',
    CREATE: '/appointments/',
    BOOK: '/appointments/',
    DETAIL: (id: string) => `/appointments/${id}/`,
    CANCEL: (id: string) => `/appointments/${id}/cancel/`,
    RESCHEDULE: (id: string) => `/appointments/${id}/reschedule/`,
    REVIEW: (id: string) => `/appointments/${id}/review/`,
    FACILITY_REVIEW: (id: string) => `/appointments/${id}/facility-review/`,
    COMPLETE: (id: string) => `/appointments/${id}/complete/`,
  },

  // Prescriptions
  PRESCRIPTIONS: {
    LIST: '/prescriptions/',
    MY: '/prescriptions/my/',
    CREATE: '/prescriptions/',
    DETAIL: (id: string) => `/prescriptions/${id}/`,
    CANCEL: (id: string) => `/prescriptions/${id}/cancel/`,
    BY_APPOINTMENT: (appointmentId: string) => `/prescriptions/appointment/${appointmentId}/`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications/',
    UNREAD_COUNT: '/notifications/unread-count/',
    MARK_READ: (id: string) => `/notifications/${id}/read/`,
    MARK_ALL_READ: '/notifications/read-all/',
    DELETE: (id: string) => `/notifications/${id}/`,
    CLEAR_ALL: '/notifications/clear-all/',
  },

  // Platform Admin (Phase 11 endpoints)
  ADMIN: {
    DOCTORS: '/admin/doctors/',
    DOCTOR_STATUS: (id: string) => `/admin/doctors/${id}/status/`,
    BOOKINGS: '/admin/bookings/',
    BOOKING_CANCEL: (id: string) => `/admin/bookings/${id}/cancel/`,
    REPORTS: '/admin/reports/',
    DASHBOARD: '/admin/dashboard/',
    REQUESTS: '/admin/requests/',
    REQUEST_DETAIL: (id: string) => `/admin/requests/${id}/`,
    REQUEST_STATUS: (id: string) => `/admin/requests/${id}/status/`,
    REQUEST_RESEND_INVITATION: (id: string) => `/admin/requests/${id}/resend-invitation/`,
    PROVIDERS: '/admin/providers/',
    PROVIDER_DETAIL: (id: string) => `/admin/providers/${id}/`,
    PROVIDER_STATUS: (id: string) => `/admin/providers/${id}/status/`,
    PROVIDER_REQUESTS: '/provider-requests/',
    PROVIDER_REQUEST_STATUS: (id: string) => `/provider-requests/${id}/`,
  },
} as const;
