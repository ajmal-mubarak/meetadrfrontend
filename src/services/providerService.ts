import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { ProviderRequest } from '../types';

export interface JoinRequestInput {
  providerType: 'hospital' | 'clinic' | 'doctor';
  name: string;
  name_ar?: string;
  specialty?: string;
  contactPerson?: string;
  contactNumber: string;
  email: string;
  country: string;
  location: string;
  googleMapsUrl?: string;
  google_maps_url?: string;
}

interface BackendProviderRequestResponse {
  id: string;
  provider_type: string;
  name: string;
  name_ar?: string;
  specialty?: string;
  contact_person?: string;
  contact_number?: string;
  email: string;
  country?: string;
  location: string;
  status: string;
  submitted_at: string;
  google_maps_url?: string;
}

function mapBackendRequest(b: BackendProviderRequestResponse): ProviderRequest {
  const rawType = (b.provider_type || '').toLowerCase();
  const pType = (rawType === 'doctor' ? 'doctor' : rawType === 'clinic' ? 'clinic' : 'hospital') as ProviderRequest['providerType'];
  const pStatus = (b.status?.toLowerCase() === 'approved' ? 'approved' : b.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending') as ProviderRequest['status'];
  return {
    id: String(b.id),
    name: b.name,
    providerType: pType,
    specialty: b.specialty || '',
    contactNumber: b.contact_number || '',
    email: b.email,
    country: b.country || 'United Arab Emirates',
    location: b.location || 'Dubai',
    googleMapsUrl: b.google_maps_url || '',
    status: pStatus,
    submittedAt: b.submitted_at,
    createdAt: b.submitted_at,
  };
}

export const providerService = {
  /**
   * Submit public partnership application for Hospital, Clinic, or Individual Doctor.
   * POST /api/v1/provider-requests/
   */
  async submitJoinRequest(input: JoinRequestInput): Promise<ProviderRequest> {
    const payload = {
      provider_type: input.providerType,
      name: input.name,
      name_ar: input.name_ar || '',
      specialty: input.specialty || '',
      contact_person: input.contactPerson || input.name,
      contact_number: input.contactNumber,
      email: input.email.trim().toLowerCase(),
      country: input.country || 'United Arab Emirates',
      location: input.location,
      google_maps_url: input.googleMapsUrl || input.google_maps_url || '',
    };

    const res = await apiClient.post<BackendProviderRequestResponse>(
      API_ENDPOINTS.ADMIN.PROVIDER_REQUESTS,
      payload,
      { requiresAuth: false }
    );
    return mapBackendRequest(res);
  },
};
