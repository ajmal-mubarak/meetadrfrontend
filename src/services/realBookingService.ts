/**
 * Real Appointment Booking Service — Sections 12.3 + 12.4
 *
 * Connects patient appointment booking, listing, cancellation, and review
 * to the real backend.
 *
 * Backend endpoints:
 *   POST   /api/v1/appointments/              — book appointment (patient)
 *   GET    /api/v1/appointments/my/           — patient's own appointments
 *   GET    /api/v1/appointments/{id}/         — appointment detail
 *   POST   /api/v1/appointments/{id}/cancel/  — cancel appointment
 *   POST   /api/v1/appointments/{id}/review/  — submit review (12.4)
 *   GET    /api/v1/appointments/{id}/review/  — get review (12.4)
 *
 * Maps the AppointmentDetailSerializer response (both snake_case and camelCase)
 * to the existing frontend Appointment type.
 */

import apiClient from './api/apiClient';
import { API_ENDPOINTS } from '../config/api';
import type { PaginatedResponse } from './api/types';
import { Appointment } from '../types';

// ─── Backend Appointment Shape ────────────────────────────────────────────────
// The backend AppointmentDetailSerializer outputs both snake_case and camelCase fields

interface BackendAppointment {
  id: string;
  date: string;
  status: string;
  notes?: string;
  created_at?: string;

  // Patient info (both naming conventions)
  patient_name_snapshot?: string;
  patient_phone_snapshot?: string;
  patient_email_snapshot?: string;
  specialty_snapshot?: string;
  time_slot?: string;
  cancel_reason?: string;
  cancelled_by_role?: string;
  cancelled_at?: string;
  is_dependent?: boolean;
  dependent_id?: string | null;
  is_reviewed?: boolean;
  is_doctor_reviewed?: boolean;
  is_facility_reviewed?: boolean;
  isDoctorReviewed?: boolean;
  isFacilityReviewed?: boolean;
  doctorReview?: {
    id: string;
    rating: number;
    comment?: string;
    created_at?: string;
  } | null;
  facilityReview?: {
    id: string;
    rating: number;
    comment?: string;
    created_at?: string;
  } | null;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    created_at?: string;
  } | null;

  // camelCase aliases from serializer
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  patientMobile?: string;
  patientEmail?: string;
  doctorId?: string;
  doctorName?: string;
  doctorPhoto?: string;
  hospitalId?: string | null;
  clinicId?: string | null;
  providerName?: string;
  facilityName?: string;
  hospitalName?: string;
  specialty?: string;
  location?: string;
  time?: string;
  timeSlot?: string;
  cancelReason?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  createdAt?: string;
}

export interface BookingInput {
  doctor_id: string;
  date: string;
  time_slot: string;
  dependent_id?: string | null;
  notes?: string;
  patient_phone?: string;
}

export interface CancelInput {
  reason?: string;
}

export interface ReviewInput {
  rating: number;
  comment?: string;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function mapAppointment(b: BackendAppointment): Appointment {
  const status = (b.status || 'confirmed').toLowerCase() as Appointment['status'];

  return {
    id: String(b.id),
    patientId: b.patientId || '',
    patientName: b.patientName || b.patient_name_snapshot || '',
    patientMobile: b.patientMobile || b.patientPhone || b.patient_phone_snapshot || '',
    patientPhone: b.patientPhone || b.patientMobile || b.patient_phone_snapshot || '',
    patientEmail: b.patientEmail || b.patient_email_snapshot || '',
    doctorId: b.doctorId || '',
    doctorName: b.doctorName || '',
    doctorPhoto: b.doctorPhoto || undefined,
    hospitalId: b.hospitalId || undefined,
    clinicId: b.clinicId || undefined,
    providerName: b.providerName || b.facilityName || b.hospitalName || '',
    facilityName: b.facilityName || b.providerName || b.hospitalName || '',
    hospitalName: b.hospitalName || b.facilityName || b.providerName,
    specialty: b.specialty || b.specialty_snapshot || '',
    location: b.location || '',
    date: b.date,
    time: b.time || b.timeSlot || b.time_slot || '',
    timeSlot: b.timeSlot || b.time || b.time_slot || '',
    status,
    notes: b.notes || undefined,
    cancelReason: b.cancelReason || b.cancel_reason || undefined,
    cancelledBy: b.cancelledBy || b.cancelled_by_role || undefined,
    cancelledByName: b.cancelledByName || undefined,
    createdAt: b.createdAt || b.created_at || new Date().toISOString(),
    isReviewed: Boolean(b.is_doctor_reviewed || b.isDoctorReviewed || b.is_reviewed || (b.review && b.review.rating)),
    isDoctorReviewed: Boolean(b.is_doctor_reviewed ?? b.isDoctorReviewed ?? b.is_reviewed ?? (b.review && b.review.rating)),
    isFacilityReviewed: Boolean(b.is_facility_reviewed ?? b.isFacilityReviewed ?? (b.facilityReview && b.facilityReview.rating)),
    doctorReview: b.doctorReview || b.review || null,
    facilityReview: b.facilityReview || null,
    review: b.doctorReview || b.review || null,
    isDependent: Boolean(b.is_dependent),
    dependentId: b.dependent_id || null,
  };
}

function extractList<T>(response: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  if ((response as PaginatedResponse<T>).results) return (response as PaginatedResponse<T>).results;
  return [];
}

// ─── Real Booking Service ─────────────────────────────────────────────────────

export const realBookingService = {
  /**
   * Retrieve authenticated patient's own appointments.
   * GET /api/v1/appointments/my/?status=<filter>
   */
  async getMyAppointments(statusFilter?: string): Promise<Appointment[]> {
    const params: Record<string, string> = {};
    if (statusFilter && statusFilter !== 'all') {
      params.status = statusFilter;
    }

    const response = await apiClient.get<BackendAppointment[] | PaginatedResponse<BackendAppointment>>(
      API_ENDPOINTS.APPOINTMENTS.MY,
      { params }
    );
    return extractList(response).map(mapAppointment);
  },

  /**
   * Retrieve a single appointment by ID.
   * GET /api/v1/appointments/{id}/
   */
  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const data = await apiClient.get<BackendAppointment>(
        API_ENDPOINTS.APPOINTMENTS.DETAIL(id)
      );
      return mapAppointment(data);
    } catch {
      return null;
    }
  },

  /**
   * Book a new appointment.
   * POST /api/v1/appointments/
   * Requires: doctor_id, date, time_slot
   * Optional: dependent_id, notes, patient_phone
   */
  async createBooking(input: BookingInput): Promise<Appointment> {
    const payload: Record<string, string | null | undefined> = {
      doctor_id: input.doctor_id,
      date: input.date,
      time_slot: input.time_slot,
      notes: input.notes || '',
      patient_phone: input.patient_phone || '',
    };

    if (input.dependent_id) {
      payload.dependent_id = input.dependent_id;
    }

    const data = await apiClient.post<BackendAppointment>(
      API_ENDPOINTS.APPOINTMENTS.BOOK,
      payload
    );
    return mapAppointment(data);
  },

  /**
   * Cancel an appointment.
   * POST /api/v1/appointments/{id}/cancel/
   */
  async cancelAppointment(id: string, reason: string = 'Cancelled by patient'): Promise<Appointment> {
    const data = await apiClient.post<BackendAppointment>(
      API_ENDPOINTS.APPOINTMENTS.CANCEL(id),
      { reason }
    );
    return mapAppointment(data);
  },

  /**
   * Reschedule an existing appointment to a new date and time slot.
   * POST /api/v1/appointments/{id}/reschedule/
   */
  async rescheduleAppointment(id: string, date: string, time_slot: string): Promise<Appointment> {
    const data = await apiClient.post<BackendAppointment>(
      API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id),
      { date, time_slot }
    );
    return mapAppointment(data);
  },

  /**
   * Submit a post-consultation doctor review.
   * POST /api/v1/appointments/{id}/review/
   * Only valid for completed appointments.
   */
  async submitDoctorReview(appointmentId: string, rating: number, comment?: string): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.APPOINTMENTS.REVIEW(appointmentId),
      { rating, comment: comment || '' }
    );
  },

  /**
   * Submit a post-consultation facility (hospital/clinic) review.
   * POST /api/v1/appointments/{id}/facility-review/
   * Only valid for completed appointments.
   */
  async submitFacilityReview(appointmentId: string, rating: number, comment?: string): Promise<void> {
    await apiClient.post(
      API_ENDPOINTS.APPOINTMENTS.FACILITY_REVIEW(appointmentId),
      { rating, comment: comment || '' }
    );
  },

  /**
   * Submit a post-consultation review (alias for submitDoctorReview).
   * POST /api/v1/appointments/{id}/review/
   * Only valid for completed appointments.
   */
  async submitReview(appointmentId: string, rating: number, comment?: string): Promise<void> {
    return this.submitDoctorReview(appointmentId, rating, comment);
  },

  /**
   * Get review for a completed appointment.
   * GET /api/v1/appointments/{id}/review/
   */
  async getReview(appointmentId: string): Promise<{
    id: string;
    rating: number;
    comment?: string;
    created_at?: string;
  } | null> {
    try {
      const data = await apiClient.get<{
        id: string;
        rating: number;
        comment?: string;
        created_at?: string;
      }>(API_ENDPOINTS.APPOINTMENTS.REVIEW(appointmentId));
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Get prescription for a completed appointment.
   * GET /api/v1/prescriptions/appointment/{appointment_id}/
   * Section 12.4 — Post-Consultation.
   */
  async getPrescriptionByAppointment(appointmentId: string): Promise<Record<string, unknown> | null> {
    try {
      const data = await apiClient.get<Record<string, unknown>>(
        API_ENDPOINTS.PRESCRIPTIONS.BY_APPOINTMENT(appointmentId)
      );
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Get patient's prescription list.
   * GET /api/v1/prescriptions/my/
   */
  async getMyPrescriptions(): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiClient.get<Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>>(
        API_ENDPOINTS.PRESCRIPTIONS.MY
      );
      return extractList(response);
    } catch {
      return [];
    }
  },
};
