/**
 * Real Facility Discovery Services — Section 12.3
 *
 * Connects hospital and clinic discovery to the real backend.
 * Backend endpoints (public):
 *   GET /api/v1/hospitals/           — paginated hospital list
 *   GET /api/v1/hospitals/{id}/      — hospital detail
 *   GET /api/v1/clinics/             — paginated clinic list
 *   GET /api/v1/clinics/{id}/        — clinic detail
 *
 * Maps backend snake_case to existing frontend Hospital/Clinic types.
 */

import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { PaginatedResponse } from './api/types';
import { Hospital, Clinic } from '../types';

// ─── Backend Shapes ───────────────────────────────────────────────────────────

interface BackendHospital {
  id: string;
  name: string;
  name_ar?: string;
  photo?: string;
  location?: string;
  address?: string;
  address_ar?: string;
  phone?: string;
  operating_hours?: string;
  operating_hours_ar?: string;
  about?: string;
  about_ar?: string;
  emergency_available?: boolean;
  status?: string;
  doctor_count?: number;
  specialties?: string[];
  avg_rating?: number | null;
  total_reviews?: number;
  insurance_plans?: string;
}

interface BackendClinic {
  id: string;
  name: string;
  name_ar?: string;
  photo?: string;
  location?: string;
  address?: string;
  address_ar?: string;
  primary_specialty?: string;
  phone?: string;
  operating_hours?: string;
  operating_hours_ar?: string;
  about?: string;
  about_ar?: string;
  status?: string;
  doctor_count?: number;
  avg_rating?: number | null;
  total_reviews?: number;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapHospital(b: BackendHospital): Hospital {
  return {
    id: String(b.id),
    name: b.name,
    nameAr: b.name_ar,
    photo: b.photo || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    location: b.location || '',
    address: b.address || '',
    addressAr: b.address_ar,
    specialties: b.specialties || [],
    doctorIds: [],
    doctorCount: b.doctor_count || 0,
    rating: b.avg_rating != null ? Number(b.avg_rating) : 0,
    reviewCount: b.total_reviews || 0,
    emergencyAvailable: Boolean(b.emergency_available),
    phone: b.phone || '',
    operatingHours: b.operating_hours || '',
    operatingHoursAr: b.operating_hours_ar,
    about: b.about || '',
    aboutAr: b.about_ar,
    insurancePlans: b.insurance_plans || '',
    status: b.status === 'deactivated' ? 'Deactivated' : 'Active',
  };
}

function mapClinic(b: BackendClinic): Clinic {
  return {
    id: String(b.id),
    name: b.name,
    photo: b.photo || 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&q=80&w=600',
    location: b.location || '',
    address: b.address || '',
    specialty: b.primary_specialty || '',
    doctorIds: [],
    doctorCount: b.doctor_count || 0,
    rating: b.avg_rating != null ? Number(b.avg_rating) : 0,
    reviewCount: b.total_reviews || 0,
    phone: b.phone || '',
    operatingHours: b.operating_hours || '',
    about: b.about || '',
    status: b.status === 'deactivated' ? 'Deactivated' : 'Active',
  };
}

function extractList<T>(response: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  if ((response as PaginatedResponse<T>).results) return (response as PaginatedResponse<T>).results;
  return [];
}

// ─── Real Hospital Service ────────────────────────────────────────────────────

export interface FacilityFilters {
  search?: string;
  specialty?: string;
  location?: string;
  page?: number;
}

export const realHospitalService = {
  async getAllHospitals(filters?: FacilityFilters): Promise<Hospital[]> {
    const params: Record<string, string | number | undefined | null> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.location && filters.location !== 'All') params.location = filters.location;
    if (filters?.page) params.page = filters.page;

    const response = await apiClient.get<BackendHospital[] | PaginatedResponse<BackendHospital>>(
      API_ENDPOINTS.FACILITIES.LIST.replace('/facilities/', '/hospitals/'),
      { params, requiresAuth: false }
    );
    return extractList(response).map(mapHospital);
  },

  async getHospitalById(id: string): Promise<Hospital | null> {
    try {
      const data = await apiClient.get<BackendHospital>(
        `/hospitals/${id}/`,
        { requiresAuth: false }
      );
      return mapHospital(data);
    } catch {
      return null;
    }
  },

  async searchHospitals(query: string, specialty?: string, location?: string): Promise<Hospital[]> {
    const params: Record<string, string | undefined> = {};
    if (query) params.search = query;
    if (specialty && specialty !== 'All') params.specialty = specialty;
    if (location && location !== 'All') params.location = location;

    const response = await apiClient.get<BackendHospital[] | PaginatedResponse<BackendHospital>>(
      '/hospitals/',
      { params, requiresAuth: false }
    );
    return extractList(response).map(mapHospital);
  },
};

// ─── Real Clinic Service ──────────────────────────────────────────────────────

export const realClinicService = {
  async getAllClinics(filters?: FacilityFilters): Promise<Clinic[]> {
    const params: Record<string, string | number | undefined | null> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.location && filters.location !== 'All') params.location = filters.location;
    if (filters?.page) params.page = filters.page;

    const response = await apiClient.get<BackendClinic[] | PaginatedResponse<BackendClinic>>(
      '/clinics/',
      { params, requiresAuth: false }
    );
    return extractList(response).map(mapClinic);
  },

  async getClinicById(id: string): Promise<Clinic | null> {
    try {
      const data = await apiClient.get<BackendClinic>(
        `/clinics/${id}/`,
        { requiresAuth: false }
      );
      return mapClinic(data);
    } catch {
      return null;
    }
  },

  async searchClinics(query: string, specialty?: string, location?: string): Promise<Clinic[]> {
    const params: Record<string, string | undefined> = {};
    if (query) params.search = query;
    if (specialty && specialty !== 'All') params.specialty = specialty;
    if (location && location !== 'All') params.location = location;

    const response = await apiClient.get<BackendClinic[] | PaginatedResponse<BackendClinic>>(
      '/clinics/',
      { params, requiresAuth: false }
    );
    return extractList(response).map(mapClinic);
  },
};

// ─── Real Health Conditions Service ──────────────────────────────────────────

export interface BackendCondition {
  id: string;
  letter: string;
  name: string;
  specialist: string;
  specialty?: string;
  specialtyQuery?: string;
  description: string;
  symptoms?: string[];
  causes?: string[];
  riskFactors?: string[];
  prevention?: string[];
  management?: string[];
}

export const realConditionService = {
  async getConditions(
    letter?: string,
    search?: string
  ): Promise<{ letters: string[]; count: number; results: BackendCondition[] }> {
    const params: Record<string, string | undefined> = {};
    if (letter && letter !== 'All') params.letter = letter;
    if (search) params.search = search;

    return await apiClient.get<{ letters: string[]; count: number; results: BackendCondition[] }>(
      '/conditions/',
      { params, requiresAuth: false }
    );
  },

  async getConditionById(id: string): Promise<BackendCondition | null> {
    try {
      return await apiClient.get<BackendCondition>(
        `/conditions/${id}/`,
        { requiresAuth: false }
      );
    } catch {
      return null;
    }
  },
};

