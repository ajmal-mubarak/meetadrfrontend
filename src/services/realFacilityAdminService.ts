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
}

interface BackendAppointment {
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

function mapAppointment(b: BackendAppointment): Appointment {
  const status = (b.status || 'confirmed').toLowerCase() as Appointment['status'];
  return {
    id: String(b.id),
    doctorId: b.doctorId || '',
    doctorName: b.doctorName || 'Doctor',
    patientId: b.patientId || '',
    patientName: b.patientName || b.patient_name_snapshot || 'Patient',
    patientMobile: b.patientMobile || b.patientPhone || b.patient_phone_snapshot || '',
    patientPhone: b.patientPhone || b.patientMobile || b.patient_phone_snapshot || '',
    hospitalId: '',
    hospitalName: b.hospitalName || '',
    providerName: b.hospitalName || 'Medical Facility',
    specialty: b.specialty || b.specialty_snapshot || '',
    location: 'Dubai, UAE',
    date: b.date,
    time: b.timeSlot || b.time || b.time_slot || '',
    timeSlot: b.timeSlot || b.time || b.time_slot || '',
    status: ['pending', 'confirmed', 'completed', 'cancelled'].includes(status) ? status : 'confirmed',
    notes: b.notes || undefined,
    cancelReason: b.cancelReason || b.cancel_reason || undefined,
    createdAt: new Date().toISOString(),
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
    photo: d.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
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
    if (doctorData.email) payload.email = doctorData.email;
    if (doctorData.password) payload.password = doctorData.password;
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
    };
  },
};
