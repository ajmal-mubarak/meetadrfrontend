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
import { DEFAULT_DOCTOR_AVATAR } from '../utils/avatar';
import type { PaginatedResponse } from './api/types';
import { Appointment, Doctor, Hospital, Clinic, ProviderRequest } from '../types';
import { WEEK_DAYS, DEFAULT_PRESET_SLOTS } from '../constants/schedule';

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
    photo: d.photo || DEFAULT_DOCTOR_AVATAR,
    specialty: d.specialty,
    specialInterest: d.special_interests || rawAny.specialInterest || ['General Practice'],
    experience: d.experience_text || rawAny.experience || `${d.experience_years || 5} years`,
    education: d.education || 'MD, Board Certified',
    about: d.about || '',
    rating: Number(d.rating) || 0,
    reviewCount: Number(d.review_count || rawAny.reviewCount) || 0,
    hospitalId: rawAny.hospitalId || rawAny.hospital_id || '',
    clinicId: rawAny.clinicId || rawAny.clinic_id || '',
    hospitalName: rawAny.hospitalName || rawAny.hospital_name || (!rawAny.clinicName && !rawAny.clinic_name ? d.facility_name : '') || '',
    clinicName: rawAny.clinicName || rawAny.clinic_name || '',
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
  patient_email_snapshot?: string;
  specialty_snapshot?: string;
  time_slot?: string;
  cancel_reason?: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  patientMobile?: string;
  patientEmail?: string;
  patient_email?: string;
  doctorId?: string;
  doctorName?: string;
  hospitalName?: string;
  specialty?: string;
  time?: string;
  timeSlot?: string;
  cancelReason?: string;
  location?: string;
  google_maps_url?: string;
  googleMapsUrl?: string;
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
    patientEmail: b.patientEmail || rawAny.patient_email || rawAny.patient_email_snapshot || '',
    hospitalId: hospId,
    hospitalName: hospName,
    facilityName: hospName,
    providerName: hospName || 'Medical Facility',
    specialty: b.specialty || b.specialty_snapshot || '',
    location: rawAny.location || 'Dubai, UAE',
    googleMapsUrl: rawAny.googleMapsUrl || rawAny.google_maps_url || '',
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
  google_maps_url?: string;
  default_available_days?: string[];
  default_standard_slots?: string[];
  defaultAvailableDays?: string[];
  defaultStandardSlots?: string[];
  country?: string;
  emirate?: string;
  area?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  phone_dial_code?: string;
  website?: string;
  logo?: string;
  facility_category?: 'Hospital' | 'Clinic' | 'Wellness';
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
}

export type ProviderItem = (Hospital | Clinic) & {
  providerCategory: 'Hospital' | 'Clinic';
  defaultAvailableDays?: string[];
  defaultStandardSlots?: string[];
  default_available_days?: string[];
  default_standard_slots?: string[];
};

function mapProvider(p: BackendProviderFacility): ProviderItem {
  const isClinic = (p.type || p.facility_type)?.toLowerCase() === 'clinic';
  const status = (p.status?.toLowerCase() === 'active' ? 'Active' : 'Deactivated') as 'Active' | 'Deactivated';
  const defaultDays = (p.defaultAvailableDays && p.defaultAvailableDays.length > 0)
    ? p.defaultAvailableDays
    : (p.default_available_days && p.default_available_days.length > 0)
    ? p.default_available_days
    : WEEK_DAYS.slice(0, 5);
  const defaultSlots = (p.defaultStandardSlots && p.defaultStandardSlots.length > 0)
    ? p.defaultStandardSlots
    : (p.default_standard_slots && p.default_standard_slots.length > 0)
    ? p.default_standard_slots
    : DEFAULT_PRESET_SLOTS;
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
    googleMapsUrl: p.google_maps_url || '',
    status,
    providerCategory: isClinic ? ('Clinic' as const) : ('Hospital' as const),
    defaultAvailableDays: defaultDays,
    defaultStandardSlots: defaultSlots,
    default_available_days: defaultDays,
    default_standard_slots: defaultSlots,
    country: p.country || 'UAE',
    emirate: p.emirate || p.city || p.location || 'Dubai',
    area: p.area || '',
    latitude: p.latitude != null ? Number(p.latitude) : undefined,
    longitude: p.longitude != null ? Number(p.longitude) : undefined,
    phoneDialCode: p.phone_dial_code || '+971',
    phone_dial_code: p.phone_dial_code || '+971',
    website: p.website || '',
    logo: p.logo || '',
    facilityCategory: (p.facility_category as any) || (isClinic ? 'Clinic' : 'Hospital'),
    facility_category: (p.facility_category as any) || (isClinic ? 'Clinic' : 'Hospital'),
    managerName: p.manager_name || '',
    manager_name: p.manager_name || '',
    managerPhone: p.manager_phone || '',
    manager_phone: p.manager_phone || '',
    managerEmail: p.manager_email || '',
    manager_email: p.manager_email || '',
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
  google_maps_url?: string;
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
    googleMapsUrl: r.google_maps_url || '',
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
   * Platform administrator creates an individual or facility doctor.
   * POST /api/v1/admin/doctors/
   */
  async createDoctor(data: {
    name: string;
    name_ar?: string;
    specialty: string;
    location: string;
    consultation_fee?: number;
    experience_years?: number;
    education?: string;
    about?: string;
    about_ar?: string;
    photo?: string;
    hospital_id?: string;
    clinic_id?: string;
    facility_id?: string;
    username?: string;
    email?: string;
    password?: string;
    available_days?: string[];
    standard_slots?: string[];
  }): Promise<Doctor> {
    const payload: Record<string, any> = {
      name: data.name,
      specialty: data.specialty,
      location: data.location,
    };
    if (data.name_ar) payload.nameAr = data.name_ar;
    if (data.consultation_fee !== undefined) payload.consultationFee = data.consultation_fee;
    if (data.experience_years !== undefined) payload.experienceYears = data.experience_years;
    if (data.education) payload.education = data.education;
    if (data.about) payload.about = data.about;
    if (data.about_ar) payload.aboutAr = data.about_ar;
    if (data.photo) payload.photo = data.photo;
    if (data.hospital_id) payload.hospitalId = data.hospital_id;
    if (data.clinic_id) payload.clinicId = data.clinic_id;
    if (data.facility_id) payload.facilityId = data.facility_id;
    if (data.username) payload.username = data.username;
    if (data.email) payload.email = data.email;
    if (data.password) payload.password = data.password;
    if (data.available_days) payload.availableDays = data.available_days;
    if (data.standard_slots) payload.standardSlots = data.standard_slots;

    const response = await apiClient.post<BackendAdminDoctor>(
      API_ENDPOINTS.ADMIN.DOCTORS,
      payload
    );
    return mapDoctor(response);
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
    google_maps_url?: string;
    country?: string;
    emirate?: string;
    area?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    phone_dial_code?: string;
    website?: string;
    logo?: string;
    facility_category?: 'Hospital' | 'Clinic' | 'Wellness';
    manager_name?: string;
    manager_phone?: string;
    manager_email?: string;
    username?: string;
    password?: string;
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
   * Resend onboarding invitation or get setup link for approved request.
   * POST /api/v1/admin/requests/{id}/resend-invitation/
   */
  async resendInvitation(id: string): Promise<{
    message: string;
    setup_link: string;
    admin_email: string;
    facility_name: string;
    expires_at: string;
  }> {
    return await apiClient.post(
      API_ENDPOINTS.ADMIN.REQUEST_RESEND_INVITATION(id),
      {}
    );
  },

  /**
   * Update doctor details (specialty, location, fee, experience, about, photo, hospital/clinic affiliation).
   * PATCH /api/v1/admin/doctors/{id}/
   */
  async updateDoctor(id: string, data: {
    name?: string;
    name_ar?: string;
    specialty?: string;
    location?: string;
    consultation_fee?: number;
    experience_years?: number;
    education?: string;
    about?: string;
    about_ar?: string;
    photo?: string;
    hospital_id?: string;
    clinic_id?: string;
    facilityId?: string;
    status?: string;
    available_days?: string[];
    standard_slots?: string[];
  }): Promise<Doctor> {
    const payload: Record<string, any> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.name_ar !== undefined) payload.nameAr = data.name_ar;
    if (data.specialty !== undefined) payload.specialty = data.specialty;
    if (data.location !== undefined) payload.location = data.location;
    if (data.consultation_fee !== undefined) payload.consultationFee = data.consultation_fee;
    if (data.experience_years !== undefined) payload.experienceYears = data.experience_years;
    if (data.education !== undefined) payload.education = data.education;
    if (data.about !== undefined) payload.about = data.about;
    if (data.about_ar !== undefined) payload.aboutAr = data.about_ar;
    if (data.photo !== undefined) payload.photo = data.photo;
    if (data.status !== undefined) payload.status = data.status;
    if (data.hospital_id !== undefined) payload.hospitalId = data.hospital_id;
    if (data.clinic_id !== undefined) payload.clinicId = data.clinic_id;
    if (data.facilityId !== undefined) payload.facilityId = data.facilityId;
    if (data.available_days !== undefined) payload.availableDays = data.available_days;
    if (data.standard_slots !== undefined) payload.standardSlots = data.standard_slots;

    const response = await apiClient.patch<BackendAdminDoctor>(
      API_ENDPOINTS.ADMIN.DOCTOR_DETAIL(id),
      payload
    );
    return mapDoctor(response);
  },

  /**
   * Delete an individual doctor.
   * DELETE /api/v1/admin/doctors/{id}/
   */
  async deleteDoctor(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ADMIN.DOCTOR_DETAIL(id));
  },

  /**
   * Bulk action for doctors (verify, deactivate, delete).
   * POST /api/v1/admin/doctors/bulk-action/
   */
  async bulkDoctorAction(
    arg1: 'verify' | 'deactivate' | 'delete' | string[],
    arg2?: 'verify' | 'deactivate' | 'delete' | string[]
  ): Promise<{ message: string; count: number }> {
    const action = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : 'verify');
    const doctor_ids = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : []);
    return await apiClient.post(
      API_ENDPOINTS.ADMIN.DOCTOR_BULK,
      { action, doctor_ids }
    );
  },

  /**
   * Update hospital or clinic facility details.
   * PATCH /api/v1/admin/providers/{id}/
   */
  async updateProvider(id: string, data: {
    name?: string;
    name_ar?: string;
    type?: 'hospital' | 'clinic';
    location?: string;
    address?: string;
    address_ar?: string;
    phone?: string;
    operating_hours?: string;
    about?: string;
    about_ar?: string;
    google_maps_url?: string;
    photo?: string;
    status?: string;
    emergency_available?: boolean;
    insurance_plans?: string;
    primary_specialty?: string;
    default_available_days?: string[];
    default_standard_slots?: string[];
    defaultAvailableDays?: string[];
    defaultStandardSlots?: string[];
    country?: string;
    emirate?: string;
    area?: string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    phone_dial_code?: string;
    website?: string;
    logo?: string;
    facility_category?: 'Hospital' | 'Clinic' | 'Wellness';
    manager_name?: string;
    manager_phone?: string;
    manager_email?: string;
  }): Promise<ProviderItem> {
    const response = await apiClient.patch<BackendProviderFacility>(
      API_ENDPOINTS.ADMIN.PROVIDER_DETAIL(id),
      data
    );
    return mapProvider(response);
  },

  /**
   * Bulk action for provider facilities (activate, deactivate, delete).
   * POST /api/v1/admin/providers/bulk-action/
   */
  async bulkProviderAction(
    arg1: 'activate' | 'deactivate' | 'delete' | string[],
    arg2?: 'activate' | 'deactivate' | 'delete' | string[]
  ): Promise<{ message: string; count: number }> {
    const action = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : 'activate');
    const provider_ids = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : []);
    return await apiClient.post(
      API_ENDPOINTS.ADMIN.PROVIDER_BULK,
      { action, provider_ids }
    );
  },

  /**
   * List all registered patients across the platform.
   * GET /api/v1/admin/patients/
   */
  async getPatients(params?: { search?: string; hospital_id?: string; doctor_id?: string }): Promise<AdminPatientItem[]> {
    return await apiClient.get<AdminPatientItem[]>(
      API_ENDPOINTS.ADMIN.PATIENTS,
      { params }
    );
  },

  /**
   * Get specific patient details with full appointment history.
   * GET /api/v1/admin/patients/{id}/
   */
  async getPatientDetail(id: string): Promise<AdminPatientDetail> {
    return await apiClient.get<AdminPatientDetail>(
      API_ENDPOINTS.ADMIN.PATIENT_DETAIL(id)
    );
  },
};

export interface AdminPatientItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  gender?: string;
  dob?: string;
  blood_group?: string;
  location?: string;
  is_verified?: boolean;
  emergency_contact?: string;
  insurance_provider?: string;
  insurance_number?: string;
  allergies?: string;
  total_appointments: number;
  attended_facilities: Array<{ id: string; name: string; type: string }>;
  attended_doctors: Array<{ id: string; name: string; specialty: string }>;
  recent_appointments: Array<{
    id: string;
    date: string;
    time_slot: string;
    status: string;
    doctor_name: string;
    facility_name: string;
  }>;
  created_at: string;
}

export interface AdminPatientDetail extends AdminPatientItem {
  dependents: Array<{
    id: string;
    name: string;
    relation: string;
    gender?: string;
    dob?: string;
    blood_group?: string;
  }>;
  appointments: Array<{
    id: string;
    date: string;
    time_slot: string;
    status: string;
    notes?: string;
    doctor_name: string;
    doctor_specialty: string;
    facility_name: string;
    facility_type: string;
  }>;
}
