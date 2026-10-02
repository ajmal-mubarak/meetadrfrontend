/**
 * Real Patient API Service — Section 12.3
 *
 * Connects patient profile and dependents to the real backend.
 * Backend endpoints:
 *   GET/PUT/PATCH  /api/v1/patient/profile/
 *   GET/POST       /api/v1/patient/dependents/
 *   GET/PUT/PATCH/DELETE /api/v1/patient/dependents/{id}/
 *
 * Identity is ALWAYS derived from the authenticated JWT — never passed by frontend.
 */

import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';

// ─── Backend Response Types ───────────────────────────────────────────────────

export interface BackendDependent {
  id: string;
  name: string;
  relation: string;
  gender: string;
  dob: string;
  blood_group: string;
  allergies?: string;
  medical_notes?: string;
  emergency_contact?: string;
  insurance_provider?: string;
  insurance_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BackendPatientProfile {
  id: string;
  gender: string;
  dob: string;
  blood_group: string;
  emergency_contact?: string;
  allergies?: string;
  insurance_provider?: string;
  insurance_number?: string;
  dependents?: BackendDependent[];
  created_at?: string;
  updated_at?: string;
}

// ─── Frontend-compatible Dependent Type ──────────────────────────────────────
// Matches what PatientProfile.tsx expects

export interface FrontendDependent {
  id: string;
  name: string;
  relation: string;
  dob: string;
  bloodGroup: string;
  gender?: string;
  allergies?: string;
  emergencyContact?: string;
}

export interface FrontendPatientProfile {
  gender: string;
  dob: string;
  bloodGroup: string;
  emergencyContact: string;
  allergies: string;
  insuranceProvider: string;
  insuranceNumber: string;
  dependents: FrontendDependent[];
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapDependent(d: BackendDependent): FrontendDependent {
  return {
    id: String(d.id),
    name: d.name,
    relation: d.relation,
    dob: d.dob || '',
    bloodGroup: d.blood_group || '',
    gender: d.gender || '',
    allergies: d.allergies || '',
    emergencyContact: d.emergency_contact || '',
  };
}

function mapProfile(p: BackendPatientProfile): FrontendPatientProfile {
  return {
    gender: p.gender || '',
    dob: p.dob || '',
    bloodGroup: p.blood_group || '',
    emergencyContact: p.emergency_contact || '',
    allergies: p.allergies || '',
    insuranceProvider: p.insurance_provider || '',
    insuranceNumber: p.insurance_number || '',
    dependents: (p.dependents || []).map(mapDependent),
  };
}

// ─── Patient Service ──────────────────────────────────────────────────────────

export const patientService = {
  /**
   * Retrieve authenticated patient's clinical profile.
   * GET /api/v1/patient/profile/
   */
  async getProfile(): Promise<FrontendPatientProfile> {
    const data = await apiClient.get<BackendPatientProfile>(API_ENDPOINTS.PATIENTS.PROFILE);
    return mapProfile(data);
  },

  /**
   * Update authenticated patient's clinical profile.
   * PUT/PATCH /api/v1/patient/profile/
   */
  async updateProfile(updates: Partial<{
    gender: string;
    dob: string;
    blood_group: string;
    emergency_contact: string;
    allergies: string;
    insurance_provider: string;
    insurance_number: string;
  }>): Promise<FrontendPatientProfile> {
    const data = await apiClient.patch<BackendPatientProfile>(
      API_ENDPOINTS.PATIENTS.PROFILE,
      updates
    );
    return mapProfile(data);
  },

  /**
   * List authenticated patient's dependents.
   * GET /api/v1/patient/dependents/
   */
  async getDependents(): Promise<FrontendDependent[]> {
    const data = await apiClient.get<BackendDependent[]>(API_ENDPOINTS.PATIENTS.DEPENDENTS);
    // Could be paginated or flat — handle both
    if (Array.isArray(data)) {
      return data.map(mapDependent);
    }
    const paginated = data as any;
    if (paginated && Array.isArray(paginated.results)) {
      return paginated.results.map(mapDependent);
    }
    return [];
  },

  /**
   * Create a new dependent for the authenticated patient.
   * POST /api/v1/patient/dependents/
   */
  async createDependent(input: {
    name: string;
    relation: string;
    gender: string;
    dob: string;
    blood_group?: string;
    allergies?: string;
    emergency_contact?: string;
  }): Promise<FrontendDependent> {
    const data = await apiClient.post<BackendDependent>(
      API_ENDPOINTS.PATIENTS.DEPENDENTS,
      input
    );
    return mapDependent(data);
  },

  /**
   * Update an existing dependent.
   * PATCH /api/v1/patient/dependents/{id}/
   */
  async updateDependent(id: string, updates: Partial<{
    name: string;
    relation: string;
    gender: string;
    dob: string;
    blood_group: string;
    allergies: string;
    emergency_contact: string;
  }>): Promise<FrontendDependent> {
    const data = await apiClient.patch<BackendDependent>(
      API_ENDPOINTS.PATIENTS.DEPENDENT_DETAIL(id),
      updates
    );
    return mapDependent(data);
  },

  /**
   * Delete a dependent.
   * DELETE /api/v1/patient/dependents/{id}/
   */
  async deleteDependent(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PATIENTS.DEPENDENT_DETAIL(id));
  },
};
