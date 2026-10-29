/**
 * Real Facility / Hospital Administrator Portal Service — Section 12.6
 *
 * Connects Hospital and Clinic portals to real Django backend endpoints:
 *   GET    /api/v1/facility/dashboard/               — Facility dashboard metrics
 *   GET    /api/v1/hospital/appointments/            — Facility-scoped appointments
 *   POST   /api/v1/hospital/appointments/{id}/cancel/— Facility appointment cancellation
 *   GET    /api/v1/facility/doctors/                 — Facility roster doctor listing
 *   POST   /api/v1/facility/doctors/                 — Add doctor to facility roster
 *   PATCH  /api/v1/facility/doctors/{id}/status/     — Update doctor status
 *   GET    /api/v1/facility/departments/             — Clinical departments
 *   POST   /api/v1/facility/departments/             — Create department (hospital only)
 *   DELETE /api/v1/facility/departments/{id}/        — Delete department (hospital only)
 *   GET    /api/v1/facility/settings/                — Facility profile & settings
 *   PATCH  /api/v1/facility/settings/                — Update facility profile & settings
 *
 * Security & Isolation:
 * - Scoped strictly to the facility associated with request.user.
 * - Client-supplied facility IDs are ignored.
 */

import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { PaginatedResponse } from './api/types';
import { Appointment, Doctor } from '../types';
import { DEFAULT_DOCTOR_AVATAR } from '../utils/avatar';
import { WEEK_DAYS, DEFAULT_PRESET_SLOTS } from '../constants/schedule';

export interface FacilityDashboardMetrics {
  facility_id: string;
  facility_name: string;
  facility_type: 'hospital' | 'clinic';
  facility_status: string;
  doctors: {
    total: number;
    active: number;
    deactivated: number;
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

export interface FacilityDepartment {
  id: string;
  name: string;
  name_ar?: string;
  head_name?: string;
  head_of_department?: string;
  doctor_count?: number;
  doctorCount?: number;
  bed_count?: number;
  bedCount?: number;
  bed_capacity?: number;
  description?: string;
  created_at?: string;
}

export interface FacilitySettingsData {
  id?: string;
  name: string;
  name_ar?: string;
  address: string;
  address_ar?: string;
  location?: string;
  phone: string;
  email?: string;
  website?: string;
  emergency_available: boolean;
  emergency?: boolean;
  operating_hours: string;
  operating_hours_ar?: string;
  insurance_plans?: string;
  description?: string;
  description_ar?: string;
  logo?: string;
  image?: string;
  photo?: string;
  google_maps_url?: string;
  default_available_days?: string[];
  default_standard_slots?: string[];
  defaultAvailableDays?: string[];
  defaultStandardSlots?: string[];
}

interface BackendAppointment {
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

function mapAppointment(b: BackendAppointment): Appointment {
  const rawAny = b as any;
  const status = (b.status || 'confirmed').toLowerCase() as Appointment['status'];
  const hospName = b.hospitalName || rawAny.facilityName || rawAny.providerName || rawAny.hospital_name || '';
  return {
    id: String(b.id),
    doctorId: b.doctorId || rawAny.doctor_id || '',
    doctorName: b.doctorName || rawAny.doctor_name || 'Doctor',
    patientId: b.patientId || rawAny.patient_id || '',
    patientName: b.patientName || b.patient_name_snapshot || 'Patient',
    patientMobile: b.patientMobile || b.patientPhone || b.patient_phone_snapshot || '',
    patientPhone: b.patientPhone || b.patientMobile || b.patient_phone_snapshot || '',
    patientEmail: b.patientEmail || rawAny.patient_email || rawAny.patient_email_snapshot || '',
    hospitalId: rawAny.hospitalId || rawAny.hospital_id || '',
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

interface BackendDoctor {
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
  consultation_fee?: number | string;
  status?: string;
  facility_id?: string;
  facility_name?: string;
  facility_type?: string;
  available_days?: string[];
  standard_slots?: string[];
  location?: string;
}

function mapDoctor(d: BackendDoctor): Doctor {
  return {
    id: String(d.id),
    name: d.name,
    photo: d.photo || DEFAULT_DOCTOR_AVATAR,
    specialty: d.specialty,
    specialInterest: d.special_interests || ['General Practice'],
    experience: d.experience_text || `${d.experience_years || 5} years`,
    education: d.education || 'MD, Board Certified',
    about: d.about || '',
    consultationFee: d.consultation_fee !== undefined && d.consultation_fee !== null ? Number(d.consultation_fee) : 500,
    rating: Number(d.rating) || 0,
    reviewCount: Number(d.review_count) || 0,
    hospitalId: d.facility_id || '',
    hospitalName: d.facility_name || 'Medical Facility',
    location: d.location || 'United Arab Emirates',
    availableDays: d.available_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
    availableSlots: d.standard_slots || ['09:00 - 09:30', '10:00 - 10:30', '11:00 - 11:30'],
    status: (d.status as 'Active' | 'Deactivated') || 'Active',
    firstName: (d as any).first_name || '',
    lastName: (d as any).last_name || '',
    gender: (d as any).gender || '',
    department: (d as any).department || '',
    qualifications: (d as any).qualifications || [],
    countryOfOrigin: (d as any).country_of_origin || '',
    languages: (d as any).languages || [],
    phoneDialCode: (d as any).phone_dial_code || '+971',
    contactNumber: (d as any).contact_number || '',
    email: (d as any).email || '',
  };
}

export const realFacilityAdminService = {
  /**
   * Retrieves facility dashboard KPI metrics.
   * GET /api/v1/facility/dashboard/
   */
  async getDashboard(): Promise<FacilityDashboardMetrics> {
    return await apiClient.get<FacilityDashboardMetrics>(API_ENDPOINTS.FACILITIES.DASHBOARD);
  },

  /**
   * Retrieves appointments scoped to this facility.
   * GET /api/v1/hospital/appointments/
   */
  async getAppointments(params?: { status?: string; date?: string; search?: string }): Promise<Appointment[]> {
    const response = await apiClient.get<BackendAppointment[] | PaginatedResponse<BackendAppointment>>(
      API_ENDPOINTS.FACILITIES.MY_APPOINTMENTS,
      { params }
    );
    const list = Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
    return list.map(mapAppointment);
  },

  /**
   * Cancel an appointment for this facility.
   * POST /api/v1/hospital/appointments/{id}/cancel/
   */
  async cancelAppointment(id: string, reason: string): Promise<Appointment> {
    const data = await apiClient.post<BackendAppointment>(
      API_ENDPOINTS.FACILITIES.APPOINTMENT_CANCEL(id),
      { reason }
    );
    return mapAppointment(data);
  },

  /**
   * Update status of an appointment (e.g. confirmed or completed).
   * PATCH /api/v1/hospital/appointments/{id}/status/
   */
  async updateAppointmentStatus(id: string, status: 'confirmed' | 'completed'): Promise<Appointment> {
    const data = await apiClient.patch<BackendAppointment>(
      API_ENDPOINTS.FACILITIES.APPOINTMENT_STATUS(id),
      { status }
    );
    return mapAppointment(data);
  },

  /**
   * List doctors belonging to this facility.
   * GET /api/v1/facility/doctors/
   */
  async getDoctors(params?: { status?: string; specialty?: string; search?: string }): Promise<Doctor[]> {
    const response = await apiClient.get<BackendDoctor[] | PaginatedResponse<BackendDoctor>>(
      API_ENDPOINTS.FACILITIES.DOCTORS,
      { params }
    );
    const list = Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
    return list.map(mapDoctor);
  },

  /**
   * Onboard / add a doctor to the facility roster.
   * POST /api/v1/facility/doctors/
   */
  async addDoctor(doctorData: {
    name: string;
    specialty: string;
    special_interests?: string[];
    experience_text?: string;
    education?: string;
    about?: string;
    photo?: string;
    location?: string;
    consultation_fee?: number;
    available_days?: string[];
    standard_slots?: string[];
    username?: string;
    email?: string;
    password?: string;
  }): Promise<Doctor> {
    const payload: Record<string, unknown> = {
      name: doctorData.name,
      specialty: doctorData.specialty,
      special_interests: doctorData.special_interests || ['General Practice'],
      experience_text: doctorData.experience_text || '5 years',
      education: doctorData.education || 'MD, Board Certified',
      about: doctorData.about || '',
      photo: doctorData.photo,
      location: doctorData.location,
      consultation_fee: doctorData.consultation_fee !== undefined ? Number(doctorData.consultation_fee) : 500,
      available_days: doctorData.available_days,
      standard_slots: doctorData.standard_slots,
    };
    if (doctorData.username) payload.username = doctorData.username;
    if (doctorData.email) payload.email = doctorData.email;
    if (doctorData.password) payload.password = doctorData.password;
    const dAny = doctorData as any;
    if (dAny.first_name || dAny.firstName) payload.first_name = dAny.first_name || dAny.firstName;
    if (dAny.last_name || dAny.lastName) payload.last_name = dAny.last_name || dAny.lastName;
    if (dAny.gender) payload.gender = dAny.gender;
    if (dAny.department) payload.department = dAny.department;
    if (dAny.qualifications) payload.qualifications = dAny.qualifications;
    if (dAny.country_of_origin || dAny.countryOfOrigin) payload.country_of_origin = dAny.country_of_origin || dAny.countryOfOrigin;
    if (dAny.languages) payload.languages = dAny.languages;
    if (dAny.phone_dial_code || dAny.phoneDialCode) payload.phone_dial_code = dAny.phone_dial_code || dAny.phoneDialCode;
    if (dAny.contact_number || dAny.contactNumber) payload.contact_number = dAny.contact_number || dAny.contactNumber;
    const created = await apiClient.post<BackendDoctor>(
      API_ENDPOINTS.FACILITIES.DOCTORS,
      payload
    );
    return mapDoctor(created);
  },

  /**
   * Update doctor status (Active vs Deactivated).
   * PATCH /api/v1/facility/doctors/{id}/status/
   */
  async updateDoctorStatus(id: string, statusVal: string): Promise<void> {
    await apiClient.patch(
      API_ENDPOINTS.FACILITIES.DOCTOR_STATUS(id),
      { status: statusVal }
    );
  },

  /**
   * Update doctor profile details.
   * PATCH /api/v1/facility/doctors/{id}/
   */
  async updateDoctor(
    id: string,
    doctorData: Partial<{
      name: string;
      specialty: string;
      special_interests: string[];
      experience_text: string;
      education: string;
      about: string;
      photo?: string;
      consultation_fee: number;
      status?: 'Active' | 'Deactivated';
      available_days?: string[];
      standard_slots?: string[];
    }>
  ): Promise<Doctor> {
    const payload: Record<string, unknown> = {};
    if (doctorData.name !== undefined) payload.name = doctorData.name;
    if (doctorData.specialty !== undefined) payload.specialty = doctorData.specialty;
    if (doctorData.special_interests !== undefined) payload.special_interests = doctorData.special_interests;
    if (doctorData.experience_text !== undefined) payload.experience_text = doctorData.experience_text;
    if (doctorData.education !== undefined) payload.education = doctorData.education;
    if (doctorData.about !== undefined) payload.about = doctorData.about;
    if (doctorData.photo !== undefined) payload.photo = doctorData.photo;
    if (doctorData.consultation_fee !== undefined) payload.consultation_fee = doctorData.consultation_fee;
    if (doctorData.available_days !== undefined) payload.available_days = doctorData.available_days;
    if (doctorData.standard_slots !== undefined) payload.standard_slots = doctorData.standard_slots;

    const updated = await apiClient.patch<BackendDoctor>(
      API_ENDPOINTS.FACILITIES.DOCTOR_DETAIL(id),
      payload
    );

    if (doctorData.status) {
      await apiClient.patch(API_ENDPOINTS.FACILITIES.DOCTOR_STATUS(id), { status: doctorData.status });
      updated.status = doctorData.status;
    }

    return mapDoctor(updated);
  },

  /**
   * Remove / delete doctor from facility roster.
   * DELETE /api/v1/facility/doctors/{id}/
   */
  async deleteDoctor(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FACILITIES.DOCTOR_DETAIL(id));
  },

  /**
   * List facility departments (Hospital only).
   * GET /api/v1/facility/departments/
   */
  async getDepartments(): Promise<FacilityDepartment[]> {
    const response = await apiClient.get<FacilityDepartment[] | PaginatedResponse<FacilityDepartment>>(
      API_ENDPOINTS.FACILITIES.DEPARTMENTS
    );
    const list = Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
    return list.map((d) => ({
      id: String(d.id),
      name: d.name,
      name_ar: d.name_ar,
      head_name: d.head_of_department || d.head_name || 'Unassigned',
      doctorCount: d.doctor_count !== undefined ? d.doctor_count : (d.doctorCount ?? 0),
      bedCount: d.bed_capacity || d.bed_count || d.bedCount || 15,
      description: d.description || '',
    }));
  },

  /**
   * Create a clinical department for the hospital.
   * POST /api/v1/facility/departments/
   */
  async createDepartment(data: {
    name: string;
    head_of_department?: string;
    bed_capacity?: number;
    description?: string;
  }): Promise<FacilityDepartment> {
    const created = await apiClient.post<FacilityDepartment>(
      API_ENDPOINTS.FACILITIES.DEPARTMENTS,
      {
        name: data.name,
        head_of_department: data.head_of_department,
        bed_capacity: data.bed_capacity || 15,
      }
    );
    return {
      id: String(created.id),
      name: created.name,
      head_name: created.head_of_department || created.head_name || 'Unassigned',
      doctorCount: created.doctor_count || 1,
      bedCount: created.bed_capacity || 15,
      description: created.description || '',
    };
  },

  /**
   * Delete a clinical department.
   * DELETE /api/v1/facility/departments/{id}/
   */
  async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.FACILITIES.DEPARTMENT_DETAIL(id));
  },

  /**
   * Update a clinical department for the hospital.
   * PATCH /api/v1/facility/departments/{id}/
   */
  async updateDepartment(
    id: string,
    data: {
      name?: string;
      head_of_department?: string;
      bed_capacity?: number;
      description?: string;
    }
  ): Promise<FacilityDepartment> {
    const updated = await apiClient.patch<FacilityDepartment>(
      API_ENDPOINTS.FACILITIES.DEPARTMENT_DETAIL(id),
      data
    );
    return {
      id: String(updated.id),
      name: updated.name,
      name_ar: updated.name_ar,
      head_name: updated.head_of_department || updated.head_name || 'Unassigned',
      doctorCount: updated.doctor_count ?? updated.doctorCount ?? 0,
      bedCount: updated.bed_capacity || updated.bed_count || updated.bedCount || 15,
      description: updated.description || '',
    };
  },

  /**
   * Inspect facility operational settings.
   * GET /api/v1/facility/settings/
   */
  async getSettings(): Promise<FacilitySettingsData> {
    const data = await apiClient.get<FacilitySettingsData>(API_ENDPOINTS.FACILITIES.SETTINGS);
    return {
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      emergency_available: data.emergency_available ?? false,
      emergency: data.emergency_available ?? false,
      operating_hours: data.operating_hours || '',
      insurance_plans: data.insurance_plans || '',
      description: data.description || '',
      email: data.email || '',
      website: data.website || '',
      photo: data.photo || data.image || '',
      google_maps_url: data.google_maps_url || '',
      defaultAvailableDays: (data.defaultAvailableDays && data.defaultAvailableDays.length > 0)
        ? data.defaultAvailableDays
        : (data.default_available_days && data.default_available_days.length > 0)
        ? data.default_available_days
        : WEEK_DAYS.slice(0, 5),
      defaultStandardSlots: (data.defaultStandardSlots && data.defaultStandardSlots.length > 0)
        ? data.defaultStandardSlots
        : (data.default_standard_slots && data.default_standard_slots.length > 0)
        ? data.default_standard_slots
        : DEFAULT_PRESET_SLOTS,
      default_available_days: (data.default_available_days && data.default_available_days.length > 0)
        ? data.default_available_days
        : (data.defaultAvailableDays && data.defaultAvailableDays.length > 0)
        ? data.defaultAvailableDays
        : WEEK_DAYS.slice(0, 5),
      default_standard_slots: (data.default_standard_slots && data.default_standard_slots.length > 0)
        ? data.default_standard_slots
        : (data.defaultStandardSlots && data.defaultStandardSlots.length > 0)
        ? data.defaultStandardSlots
        : DEFAULT_PRESET_SLOTS,
    };
  },

  /**
   * Update facility operational settings.
   * PATCH /api/v1/facility/settings/
   */
  async updateSettings(updates: Partial<FacilitySettingsData>): Promise<FacilitySettingsData> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.emergency_available !== undefined || updates.emergency !== undefined) {
      payload.emergency_available = updates.emergency_available ?? updates.emergency;
    }
    if (updates.operating_hours !== undefined) payload.operating_hours = updates.operating_hours;
    if (updates.insurance_plans !== undefined) payload.insurance_plans = updates.insurance_plans;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.photo !== undefined) payload.photo = updates.photo;
    if (updates.google_maps_url !== undefined) payload.google_maps_url = updates.google_maps_url;
    if (updates.default_available_days !== undefined) payload.default_available_days = updates.default_available_days;
    else if (updates.defaultAvailableDays !== undefined) payload.default_available_days = updates.defaultAvailableDays;
    if (updates.default_standard_slots !== undefined) payload.default_standard_slots = updates.default_standard_slots;
    else if (updates.defaultStandardSlots !== undefined) payload.default_standard_slots = updates.defaultStandardSlots;

    const data = await apiClient.patch<FacilitySettingsData>(
      API_ENDPOINTS.FACILITIES.SETTINGS,
      payload
    );
    return {
      name: data.name || '',
      address: data.address || '',
      phone: data.phone || '',
      emergency_available: data.emergency_available ?? false,
      emergency: data.emergency_available ?? false,
      operating_hours: data.operating_hours || '',
      insurance_plans: data.insurance_plans || '',
      description: data.description || '',
      email: data.email || '',
      website: data.website || '',
      photo: data.photo || data.image || '',
      google_maps_url: data.google_maps_url || '',
      defaultAvailableDays: (data.defaultAvailableDays && data.defaultAvailableDays.length > 0)
        ? data.defaultAvailableDays
        : (data.default_available_days && data.default_available_days.length > 0)
        ? data.default_available_days
        : WEEK_DAYS.slice(0, 5),
      defaultStandardSlots: (data.defaultStandardSlots && data.defaultStandardSlots.length > 0)
        ? data.defaultStandardSlots
        : (data.default_standard_slots && data.default_standard_slots.length > 0)
        ? data.default_standard_slots
        : DEFAULT_PRESET_SLOTS,
      default_available_days: (data.default_available_days && data.default_available_days.length > 0)
        ? data.default_available_days
        : (data.defaultAvailableDays && data.defaultAvailableDays.length > 0)
        ? data.defaultAvailableDays
        : WEEK_DAYS.slice(0, 5),
      default_standard_slots: (data.default_standard_slots && data.default_standard_slots.length > 0)
        ? data.default_standard_slots
        : (data.defaultStandardSlots && data.defaultStandardSlots.length > 0)
        ? data.defaultStandardSlots
        : DEFAULT_PRESET_SLOTS,
    };
  },
};
