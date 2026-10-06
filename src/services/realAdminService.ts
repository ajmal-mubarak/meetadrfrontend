/**
 * Real Platform Administrator API Service — Section 12.7
 *
 * Connects the Platform Admin Portal to real Django backend endpoints (Phase 11):
 *   GET    /api/v1/admin/dashboard/                  — Global KPI metrics & operational reports
 *   GET    /api/v1/admin/reports/                    — Platform reports
 *   GET    /api/v1/admin/doctors/                    — Platform-wide doctor management directory
 *   PATCH  /api/v1/admin/doctors/{id}/status/        — Doctor approval / status update
 *   GET    /api/v1/admin/providers/                  — Platform-wide facilities oversight
 *   PATCH  /api/v1/admin/providers/{id}/status/      — Facility status update
 *   GET    /api/v1/admin/bookings/                   — Global bookings list
 *   POST   /api/v1/admin/bookings/{id}/cancel/       — Administrative booking cancellation
 *   GET    /api/v1/admin/requests/                   — Provider onboarding requests
 *   PATCH  /api/v1/admin/requests/{id}/status/       — Provider request approval / rejection
 *
 * Security:
 * Strictly guarded by IsPlatformAdmin on backend.
 */

import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { PaginatedResponse } from './api/types';
import { Appointment, Doctor, Hospital, Clinic, ProviderRequest } from '../types';

export interface AdminAnalyticsReport {
  totalUsers: number;
  totalDoctors: number;
  totalHospitals: number;
  totalClinics: number;
  totalAppointments: number;
  totalBookings: number;
  appointmentsByStatus: Array<{ status: string; count: number }>;
  providerRequestsCount: number;
  waitlistCount: number;
  grossConsultationRevenue: string;
  summary: {
    daily: number;
    weekly: number;
    monthly: number;
    total: number;
  };
  bySpecialty: Array<{ specialty: string; count: number }>;
  byDoctor: Array<{ name: string; count: number }>;
  byHospital: Array<{ facility: string; count: number }>;
  recentActivity: Array<{
    id: string;
    text: string;
    time: string;
    type: string;
  }>;
}

interface BackendAdminDoctor {
  id: string;
  name: string;
  photo?: string;
  specialty: string;
  special_interests?: string[];
  experience_years?: number;
  experience_text?: string;
  education?: string;
  about?: string;
  rating?: number;
  review_count?: number;
  status: string;
  facility_id?: string;
  facility_name?: string;
  facility_type?: string;
  location?: string;
  available_days?: string[];
  standard_slots?: string[];
}

function mapDoctor(d: BackendAdminDoctor): Doctor {
  const rawAny = d as any;
  const rawStatus = String(rawAny.status || 'Active').toLowerCase();
  return {
    id: String(d.id),
    name: d.name,
    photo: d.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    specialty: d.specialty,
    specialInterest: d.special_interests || rawAny.specialInterest || ['General Practice'],
    experience: d.experience_text || rawAny.experience || `${d.experience_years || 5} years`,
    education: d.education || 'MD, Board Certified',
    about: d.about || '',
    rating: Number(d.rating) || 0,
    reviewCount: Number(d.review_count || rawAny.reviewCount) || 0,
    hospitalId: rawAny.hospitalId || rawAny.hospital_id || rawAny.clinicId || rawAny.clinic_id || d.facility_id || '',
    hospitalName: rawAny.hospitalName || rawAny.hospital_name || rawAny.clinicName || rawAny.clinic_name || d.facility_name || 'Medical Facility',
    location: d.location || 'United Arab Emirates',
    availableDays: d.available_days || rawAny.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
    availableSlots: d.standard_slots || rawAny.availableSlots || ['09:00 - 09:30', '10:00 - 10:30', '11:00 - 11:30'],
    status: (rawStatus === 'deactivated' || rawStatus === 'inactive') ? 'Deactivated' : 'Active',
  };
}

interface BackendAdminBooking {
  id: string;
  date: string;
  status: string;
  notes?: string;
  patient_name_snapshot?: string;
  patient_phone_snapshot?: string;
  specialty_snapshot?: string;
  time_slot?: string;
  cancel_reason?: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  patientMobile?: string;
  doctorId?: string;
  doctorName?: string;
  hospitalName?: string;
  specialty?: string;
  time?: string;
  timeSlot?: string;
  cancelReason?: string;
}

function mapBooking(b: BackendAdminBooking): Appointment {
  const rawAny = b as any;
  const status = (b.status || 'confirmed').toLowerCase() as Appointment['status'];
  const hospId = rawAny.hospitalId || rawAny.hospital_id || rawAny.clinicId || rawAny.clinic_id || '';
  const hospName = b.hospitalName || rawAny.facilityName || rawAny.providerName || rawAny.hospital_name || '';
  const docId = b.doctorId || rawAny.doctor_id || '';
  const docName = b.doctorName || rawAny.doctor_name || 'Doctor';

  return {
    id: String(b.id),
    doctorId: docId,
    doctorName: docName,
    patientId: b.patientId || rawAny.patient_id || '',
    patientName: b.patientName || b.patient_name_snapshot || 'Patient',
    patientMobile: b.patientMobile || b.patientPhone || b.patient_phone_snapshot || '',
    patientPhone: b.patientPhone || b.patientMobile || b.patient_phone_snapshot || '',
    hospitalId: hospId,
    hospitalName: hospName,
    providerName: hospName || 'Medical Facility',
    specialty: b.specialty || b.specialty_snapshot || '',
    location: rawAny.location || 'Dubai, UAE',
    date: b.date,
    time: b.timeSlot || b.time || b.time_slot || '',
    timeSlot: b.timeSlot || b.time || b.time_slot || '',
    status: ['pending', 'confirmed', 'completed', 'cancelled'].includes(status) ? status : 'confirmed',
    notes: b.notes || undefined,
    cancelReason: b.cancelReason || b.cancel_reason || undefined,
    createdAt: rawAny.created_at || rawAny.createdAt || new Date().toISOString(),
  };
}

interface BackendProviderFacility {
  id: string;
  name: string;
  name_ar?: string;
  type?: 'hospital' | 'clinic';
  facility_type?: 'hospital' | 'clinic';
  city?: string;
  location?: string;
  status: string;
  address?: string;
  phone?: string;
  email?: string;
  departments?: string[];
  total_doctors?: number;
  doctorCount?: number;
  created_at?: string;
  avg_rating?: number | null;
  total_reviews?: number;
  photo?: string;
}

export type ProviderItem = (Hospital | Clinic) & {
  providerCategory: 'Hospital' | 'Clinic';
};

function mapProvider(p: BackendProviderFacility): ProviderItem {
  const isClinic = (p.type || p.facility_type)?.toLowerCase() === 'clinic';
  const status = (p.status?.toLowerCase() === 'active' ? 'Active' : 'Deactivated') as 'Active' | 'Deactivated';
  const common = {
    id: String(p.id),
    name: p.name,
    nameAr: p.name_ar,
    photo: p.photo || (isClinic 
      ? 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600'
      : 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600'),
    location: p.city || p.location || 'Dubai',
    address: p.address || 'Dubai Healthcare City, UAE',
    doctorIds: [],
    doctorCount: p.total_doctors || p.doctorCount || 0,
    rating: p.avg_rating != null ? Number(p.avg_rating) : 0,
    reviewCount: p.total_reviews || 0,
    phone: p.phone || '+971 4 000 0000',
    operatingHours: '08:00 - 20:00',
    about: 'Accredited medical facility providing specialized healthcare in the UAE.',
    status,
    providerCategory: isClinic ? ('Clinic' as const) : ('Hospital' as const),
  };

  if (isClinic) {
    return {
      ...common,
      specialty: p.departments?.[0] || 'General Practice',
    } as Clinic & { providerCategory: 'Clinic' };
  } else {
    return {
      ...common,
      specialties: p.departments || ['Cardiology', 'General Practice'],
      emergencyAvailable: true,
    } as Hospital & { providerCategory: 'Hospital' };
  }
}

interface BackendProviderRequest {
  id: string;
  facility_name: string;
  facility_type: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

function mapRequest(r: BackendProviderRequest): ProviderRequest {
  const pType = (r.facility_type?.toLowerCase() === 'clinic' ? 'clinic' : 'hospital') as ProviderRequest['providerType'];
  const pStatus = (r.status?.toLowerCase() === 'approved' ? 'approved' : r.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending') as ProviderRequest['status'];
  return {
    id: String(r.id),
    name: r.contact_person || r.facility_name,
    providerType: pType,
    contactNumber: r.phone || '',
    email: r.email,
    country: 'United Arab Emirates',
    location: r.city || 'Dubai',
    status: pStatus,
    submittedAt: r.created_at,
    createdAt: r.created_at,
  };
}

export const realAdminService = {
  /**
   * Retrieves aggregated platform dashboard KPIs and analytics.
   * GET /api/v1/admin/dashboard/
   */
  async getDashboard(): Promise<AdminAnalyticsReport> {
    return await apiClient.get<AdminAnalyticsReport>(API_ENDPOINTS.ADMIN.DASHBOARD);
  },

  /**
   * Retrieves operational and analytical reports.
   * GET /api/v1/admin/reports/
   */
  async getReports(): Promise<AdminAnalyticsReport> {
    return await apiClient.get<AdminAnalyticsReport>(API_ENDPOINTS.ADMIN.REPORTS);
  },

  /**
   * Retrieves platform-wide doctors roster.
   * GET /api/v1/admin/doctors/
   */
  async getDoctors(params?: { status?: string; specialty?: string; search?: string }): Promise<Doctor[]> {
    const response = await apiClient.get<BackendAdminDoctor[] | PaginatedResponse<BackendAdminDoctor>>(
      API_ENDPOINTS.ADMIN.DOCTORS,
      { params }
    );
    const list = Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
    return list.map(mapDoctor);
  },

  /**
   * Update doctor status (Active, Pending_Approval, Deactivated).
   * PATCH /api/v1/admin/doctors/{id}/status/
   */
  async updateDoctorStatus(id: string, statusVal: string, reason?: string): Promise<void> {
    await apiClient.patch(
      API_ENDPOINTS.ADMIN.DOCTOR_STATUS(id),
      { status: statusVal, reason }
    );
  },

  /**
   * Retrieves platform-wide provider facilities (Hospitals & Clinics).
   * GET /api/v1/admin/providers/
   */
  async getProviders(params?: { status?: string; search?: string }): Promise<ProviderItem[]> {
    const response = await apiClient.get<BackendProviderFacility[] | PaginatedResponse<BackendProviderFacility>>(
      API_ENDPOINTS.ADMIN.PROVIDERS,
      { params }
    );
    const list = Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
    return list.map(mapProvider);
  },

  /**
   * Platform administrator creates a new hospital or clinic.
   * POST /api/v1/admin/providers/
   */
  async createProvider(data: {
    name: string;
    name_ar?: string;
    type?: 'hospital' | 'clinic';
    location?: string;
    address?: string;
    address_ar?: string;
    phone?: string;
    operating_hours?: string;
    operating_hours_ar?: string;
    about?: string;
    about_ar?: string;
    photo?: string;
    emergency_available?: boolean;
    primary_specialty?: string;
  }): Promise<ProviderItem> {
    const response = await apiClient.post<BackendProviderFacility>(
      API_ENDPOINTS.ADMIN.PROVIDERS,
      data
    );
    return mapProvider(response);
  },

  /**
   * Platform administrator deletes a hospital or clinic.
   * DELETE /api/v1/admin/providers/{id}/
   */
  async deleteProvider(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.PROVIDER_DETAIL(id));
  },

  /**
   * Update facility status.
   * PATCH /api/v1/admin/providers/{id}/status/
   */
  async updateProviderStatus(id: string, statusVal: string): Promise<void> {
    await apiClient.patch(
      API_ENDPOINTS.ADMIN.PROVIDER_STATUS(id),
      { status: statusVal }
    );
  },

  /**
   * Retrieves platform-wide appointments across all facilities with optional facility/doctor drill-down.
   * GET /api/v1/admin/bookings/
   */
  async getBookings(params?: {
    status?: string;
    search?: string;
    hospital_id?: string;
    clinic_id?: string;
    facility_id?: string;
    doctor_id?: string;
    page_size?: number;
  }): Promise<Appointment[]> {
    const response = await apiClient.get<BackendAdminBooking[] | PaginatedResponse<BackendAdminBooking>>(
      API_ENDPOINTS.ADMIN.BOOKINGS,
      { params: { page_size: 200, ...params } }
    );
    const list = Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
    return list.map(mapBooking);
  },

  /**
   * Administrative cancellation of any booking.
   * POST /api/v1/admin/bookings/{id}/cancel/
   */
  async cancelBooking(id: string, reason: string): Promise<Appointment> {
    const data = await apiClient.post<BackendAdminBooking>(
      API_ENDPOINTS.ADMIN.BOOKING_CANCEL(id),
      { reason }
    );
    return mapBooking(data);
  },

  /**
   * Retrieves provider onboarding requests submitted to the platform.
   * GET /api/v1/admin/requests/
   */
  async getRequests(params?: { status?: string; search?: string }): Promise<ProviderRequest[]> {
    const response = await apiClient.get<BackendProviderRequest[] | PaginatedResponse<BackendProviderRequest>>(
      API_ENDPOINTS.ADMIN.REQUESTS,
      { params }
    );
    const list = Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
    return list.map(mapRequest);
  },

  /**
   * Review provider application (approve / reject).
   * PATCH /api/v1/admin/requests/{id}/status/
   */
  async updateRequestStatus(id: string, statusVal: 'approved' | 'rejected' | 'Approved' | 'Rejected', adminNotes?: string): Promise<void> {
    await apiClient.patch(
      API_ENDPOINTS.ADMIN.REQUEST_STATUS(id),
      { status: statusVal.toLowerCase(), admin_notes: adminNotes || '' }
    );
  },

  /**
   * Regenerate setup invitation token and return the one-time setup link.
   * POST /api/v1/admin/requests/{id}/resend-invitation/
   */
  async resendInvitation(id: string): Promise<{ setup_link: string; admin_email: string; facility_name: string; expires_at: string }> {
    return await apiClient.post(
      API_ENDPOINTS.ADMIN.REQUEST_RESEND_INVITATION(id),
      {}
    );
  },
};
