/**
 * Real Doctor Portal Service — Section 12.5
 *
 * Connects the Doctor Portal to real Django backend endpoints:
 *   GET    /api/v1/doctor/dashboard/                  — Doctor KPI metrics and weekly trend
 *   GET    /api/v1/doctor/appointments/               — Doctor-scoped appointments
 *   PATCH  /api/v1/doctor/appointments/{id}/status/   — Status transition (completed / cancelled)
 *   GET    /api/v1/doctor/schedule/                   — Practicing schedule & standard slots
 *   PUT    /api/v1/doctor/schedule/                   — Update practicing schedule
 *   GET    /api/v1/doctor/patients/                   — Doctor's treated patient directory
 *   GET    /api/v1/doctor/patients/{id}/profile/      — Patient medical profile (clinical relationship check)
 *
 * Doctor identity is strictly derived from the authenticated user.
 */

import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { PaginatedResponse } from './api/types';
import { Appointment } from '../types';

export interface DoctorDashboardKPIs {
  total_appts: number;
  today_appts: number;
  completed_appts: number;
  cancelled_appts: number;
  pending_appts: number;
  confirmed_appts: number;
  completion_rate: number;
  total_revenue: number;
  active_patients: number;
  weekly_trend: Array<{
    date: string;
    day: string;
    total: number;
    completed: number;
  }>;
  upcoming: any[];
}

export interface DoctorScheduleData {
  id?: string;
  available_days: string[];
  standard_slots: string[];
  slot_duration_minutes: number;
}

export interface DoctorPatientRecord {
  patientId: string;
  patient_id?: string;
  patientName: string;
  patient_name?: string;
  patientPhone: string;
  patient_phone?: string;
  totalVisits: number;
  total_visits?: number;
  firstVisitDate?: string;
  lastVisitDate: string;
  last_visit_date?: string;
  latestNotes: string;
  latest_notes?: string;
  gender?: string;
  bloodGroup?: string;
  blood_group?: string;
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
  cancelled_by_role?: string;
  is_dependent?: boolean;
  dependent_id?: string | null;
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
    doctorName: b.doctorName || b.patient_name_snapshot || 'Doctor',
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

export const realDoctorPortalService = {
  /**
   * Retrieves aggregated KPI metrics and workload trend for authenticated doctor.
   * GET /api/v1/doctor/dashboard/
   */
  async getDashboard(): Promise<DoctorDashboardKPIs> {
    return await apiClient.get<DoctorDashboardKPIs>(API_ENDPOINTS.DOCTORS.DASHBOARD);
  },

  /**
   * Retrieves doctor-scoped appointments list.
   * GET /api/v1/doctor/appointments/
   */
  async getMyAppointments(params?: { status?: string; date?: string; search?: string }): Promise<Appointment[]> {
    const response = await apiClient.get<BackendAppointment[] | PaginatedResponse<BackendAppointment>>(
      API_ENDPOINTS.DOCTORS.MY_APPOINTMENTS,
      { params }
    );
    const list = Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
    return list.map(mapAppointment);
  },

  /**
   * Confirm a pending consultation.
   * PATCH /api/v1/doctor/appointments/{id}/status/
   */
  async confirmAppointment(id: string): Promise<Appointment> {
    const data = await apiClient.patch<BackendAppointment>(
      API_ENDPOINTS.DOCTORS.APPOINTMENT_STATUS(id),
      { status: 'confirmed' }
    );
    return mapAppointment(data);
  },

  /**
   * Mark a confirmed consultation as completed.
   * PATCH /api/v1/doctor/appointments/{id}/status/
   */
  async completeAppointment(id: string): Promise<Appointment> {
    const data = await apiClient.patch<BackendAppointment>(
      API_ENDPOINTS.DOCTORS.APPOINTMENT_STATUS(id),
      { status: 'completed' }
    );
    return mapAppointment(data);
  },

  /**
   * Cancel an appointment with a given reason.
   * PATCH /api/v1/doctor/appointments/{id}/status/
   */
  async cancelAppointment(id: string, reason: string): Promise<Appointment> {
    const data = await apiClient.patch<BackendAppointment>(
      API_ENDPOINTS.DOCTORS.APPOINTMENT_STATUS(id),
      { status: 'cancelled', reason }
    );
    return mapAppointment(data);
  },

  /**
   * Retrieves practicing schedule and slots for authenticated doctor.
   * GET /api/v1/doctor/schedule/
   */
  async getSchedule(): Promise<DoctorScheduleData> {
    return await apiClient.get<DoctorScheduleData>(API_ENDPOINTS.DOCTORS.SCHEDULE);
  },

  /**
   * Updates practicing days and consultation slots.
   * PUT /api/v1/doctor/schedule/
   */
  async updateSchedule(schedule: {
    available_days: string[];
    standard_slots: string[];
    slot_duration_minutes?: number;
  }): Promise<DoctorScheduleData> {
    return await apiClient.put<DoctorScheduleData>(
      API_ENDPOINTS.DOCTORS.SCHEDULE,
      schedule
    );
  },

  /**
   * Retrieves doctor-scoped treated patient directory.
   * GET /api/v1/doctor/patients/?search={q}
   */
  async getPatients(search?: string): Promise<DoctorPatientRecord[]> {
    const params = search?.trim() ? { search: search.trim() } : undefined;
    const response = await apiClient.get<DoctorPatientRecord[] | PaginatedResponse<DoctorPatientRecord>>(
      API_ENDPOINTS.DOCTORS.PATIENTS,
      { params }
    );
    return Array.isArray(response)
      ? response
      : (response && Array.isArray(response.results) ? response.results : []);
  },

  /**
   * Access patient clinical profile. Backend enforces clinical encounter check.
   * GET /api/v1/doctor/patients/{id}/profile/
   */
  async getPatientMedicalProfile(patientId: string): Promise<Record<string, unknown>> {
    return await apiClient.get<Record<string, unknown>>(
      API_ENDPOINTS.DOCTORS.PATIENT_PROFILE(patientId)
    );
  },
};
