/**
 * Real Doctor Discovery Service — Section 12.3
 *
 * Connects doctor discovery, search, detail, and availability to the real backend.
 * Backend endpoints (all public):
 *   GET /api/v1/doctors/                    — paginated list with filters
 *   GET /api/v1/doctors/{id}/               — doctor detail
 *   GET /api/v1/doctors/{id}/availability/  — slot availability for date
 *   GET /api/v1/doctors/{id}/reviews/       — public reviews
 *
 * Maps backend snake_case to the existing frontend Doctor type.
 */

import apiClient from './api/apiClient';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';
import type { PaginatedResponse } from './api/types';
import { Doctor } from '../types';

// ─── Backend Doctor Shape ─────────────────────────────────────────────────────

interface BackendDoctor {
  id: string;
  name: string;
  name_ar?: string;
  photo?: string;
  specialty: string;
  special_interests?: string[];
  experience_years?: number;
  experience_text?: string;
  experience_text_ar?: string;
  rating?: number;
  review_count?: number;
  location?: string;
  consultation_fee?: number | null;
  status?: string;
  hospital_id?: string | null;
  hospital_name?: string | null;
  hospital_name_ar?: string | null;
  clinic_id?: string | null;
  clinic_name?: string | null;
  about?: string;
  about_ar?: string;
  education?: string;
  available_days?: string[];
  available_slots?: string[];
  schedule?: {
    available_days?: string[];
    standard_slots?: string[];
    slot_duration_minutes?: number;
  } | null;
  facility_details?: {
    type?: string;
    id?: string;
    name?: string;
    location?: string;
  } | null;
}

export interface AvailabilityResponse {
  doctor_id: string;
  doctor_name: string;
  date: string;
  day: string;
  available: boolean;
  total_slots: number;
  slots: string[];          // Available (unbooked) slots
  booked_slots: string[];   // Already booked slots
}

// ─── Mapping helper ───────────────────────────────────────────────────────────

function mapDoctor(b: BackendDoctor): Doctor {
  // Build experience string from years + text
  let experience = b.experience_text || '';
  if (!experience && b.experience_years) {
    experience = `${b.experience_years} years`;
  }

  // Determine hospitalId / clinicId from facility hierarchy
  const hospitalId = b.hospital_id || undefined;
  const clinicId = b.clinic_id || undefined;
  const hospitalName = b.hospital_name || undefined;
  const clinicName = b.clinic_name || undefined;

  return {
    id: String(b.id),
    name: b.name,
    nameAr: b.name_ar,
    photo: b.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    specialty: b.specialty || '',
    specialInterest: b.special_interests || [],
    experience,
    experienceAr: b.experience_text_ar,
    rating: Number(b.rating || 0),
    reviewCount: Number(b.review_count || 0),
    location: b.location || '',
    consultationFee: b.consultation_fee ? Number(b.consultation_fee) : undefined,
    status: b.status === 'active' ? 'Active' : b.status === 'deactivated' ? 'Deactivated' : 'Active',
    hospitalId,
    hospitalName,
    hospitalNameAr: b.hospital_name_ar,
    clinicId,
    clinicName,
    about: b.about || '',
    aboutAr: b.about_ar,
    education: b.education || '',
    availableDays: b.available_days || b.schedule?.available_days || [],
    availableSlots: b.available_slots || b.schedule?.standard_slots || [],
  };
}

// ─── Doctor Filter Parameters ─────────────────────────────────────────────────

export interface DoctorFilters {
  specialty?: string;
  location?: string;
  hospital_id?: string;
  clinic_id?: string;
  min_rating?: number;
  day?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// ─── Real Doctor Service ──────────────────────────────────────────────────────

export const realDoctorService = {
  /**
   * Retrieve paginated doctor list with optional filters.
   * GET /api/v1/doctors/
   */
  async getAllDoctors(filters?: DoctorFilters): Promise<Doctor[]> {
    const params: Record<string, string | number | boolean | undefined | null> = {};

    if (filters) {
      if (filters.specialty && filters.specialty !== 'All') params.specialty = filters.specialty;
      if (filters.location && filters.location !== 'All') params.location = filters.location;
      if (filters.hospital_id && filters.hospital_id !== 'All') params.hospital_id = filters.hospital_id;
      if (filters.clinic_id && filters.clinic_id !== 'All') params.clinic_id = filters.clinic_id;
      if (filters.min_rating) params.min_rating = filters.min_rating;
      if (filters.day && filters.day !== 'All') params.day = filters.day;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.page_size) params.page_size = filters.page_size;
    }

    const response = await apiClient.get<PaginatedResponse<BackendDoctor>>(
      API_ENDPOINTS.DOCTORS.LIST,
      { params, requiresAuth: false }
    );

    if (Array.isArray(response)) {
      return (response as BackendDoctor[]).map(mapDoctor);
    }

    return (response.results || []).map(mapDoctor);
  },

  /**
   * Retrieve a single doctor by UUID.
   * GET /api/v1/doctors/{id}/
   */
  async getDoctorById(id: string): Promise<Doctor | null> {
    try {
      const data = await apiClient.get<BackendDoctor>(
        API_ENDPOINTS.DOCTORS.DETAIL(id),
        { requiresAuth: false }
      );
      return mapDoctor(data);
    } catch {
      return null;
    }
  },

  /**
   * Retrieve doctor slot availability for a specific date.
   * GET /api/v1/doctors/{id}/availability/?date=YYYY-MM-DD
   */
  async getAvailability(doctorId: string, date: string): Promise<AvailabilityResponse> {
    const data = await apiClient.get<AvailabilityResponse>(
      API_ENDPOINTS.DOCTORS.AVAILABILITY(doctorId),
      { params: { date }, requiresAuth: false }
    );
    return data;
  },

  /**
   * Search doctors with free-text and optional filters.
   * Delegates to getAllDoctors with search param.
   */
  async searchDoctors(query: string, specialty?: string, location?: string): Promise<Doctor[]> {
    return this.getAllDoctors({
      search: query || undefined,
      specialty,
      location,
    });
  },
};
