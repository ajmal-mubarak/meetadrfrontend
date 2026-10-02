import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { ProviderRequest } from '../types';

export interface JoinRequestInput {
  providerType: 'hospital' | 'clinic' | 'doctor';
  name: string;
  contactPerson?: string;
  contactNumber: string;
  email: string;
  country: string;
  location: string;
}

interface BackendProviderRequestResponse {
  id: string;
  provider_type: string;
  name: string;
  contact_person?: string;
  contact_number?: string;
  email: string;
  country?: string;
  location: string;
  status: string;
  submitted_at: string;
}

function mapBackendRequest(b: BackendProviderRequestResponse): ProviderRequest {
  const pType = (b.provider_type?.toLowerCase() === 'clinic' ? 'clinic' : 'hospital') as ProviderRequest['providerType'];
  const pStatus = (b.status?.toLowerCase() === 'approved' ? 'approved' : b.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending') as ProviderRequest['status'];
  return {
    id: String(b.id),
    name: b.name,
    providerType: pType,
    contactNumber: b.contact_number || '',
    email: b.email,
    country: b.country || 'United Arab Emirates',
    location: b.location || 'Dubai',
    status: pStatus,
    submittedAt: b.submitted_at,
    createdAt: b.submitted_at,
  };
}

export const providerService = {
  /**
   * Submit public partnership application for Hospital or Clinic.
   * POST /api/v1/provider-requests/
   */
  async submitJoinRequest(input: JoinRequestInput): Promise<ProviderRequest> {
    const payload = {
      provider_type: input.providerType === 'clinic' ? 'clinic' : 'hospital',
      name: input.name,
      contact_person: input.contactPerson || input.name,
      contact_number: input.contactNumber,
      email: input.email.trim().toLowerCase(),
      country: input.country || 'United Arab Emirates',
      location: input.location,
    };

    const res = await apiClient.post<BackendProviderRequestResponse>(
      API_ENDPOINTS.ADMIN.PROVIDER_REQUESTS,
      payload,
      { requiresAuth: false }
    );
    return mapBackendRequest(res);
  },
};
