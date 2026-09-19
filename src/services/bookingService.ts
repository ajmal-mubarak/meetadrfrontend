import { mockDb } from '../data/mockDatabase';
import { Appointment } from '../types';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export interface CreateAppointmentInput {
  patientId?: string;
  patientName: string;
  patientMobile?: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  doctorPhoto?: string;
  hospitalId?: string;
  clinicId?: string;
  facilityId?: string;
  facilityType?: 'hospital' | 'clinic' | string;
  providerName?: string;
  facilityName?: string;
  specialty: string;
  location?: string;
  date: string;
  time?: string;
  timeSlot?: string;
  notes?: string;
}

function normalizeAppointment(a: Appointment): Appointment {
  return {
    ...a,
    patientPhone: a.patientPhone || a.patientMobile,
    timeSlot: a.timeSlot || a.time,
    facilityName: a.facilityName || a.providerName,
    status: (a.status ? a.status.toLowerCase() : 'confirmed') as any,
  };
}

export const bookingService = {
  async getAllAppointments(): Promise<Appointment[]> {
    await delay();
    return mockDb.getAppointments().map(normalizeAppointment);
  },

  async getAppointmentById(id: string): Promise<Appointment | null> {
    await delay();
    const list = mockDb.getAppointments();
    const found = list.find((a) => a.id === id);
    return found ? normalizeAppointment(found) : null;
  },

  async getAppointmentsByPatient(patientIdOrEmail: string): Promise<Appointment[]> {
    await delay();
    const list = mockDb.getAppointments();
    return list
      .filter(
        (a) =>
          a.patientId === patientIdOrEmail ||
          (a.patientEmail && a.patientEmail.toLowerCase() === patientIdOrEmail.toLowerCase())
      )
      .map(normalizeAppointment);
  },

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    await delay();
    const list = mockDb.getAppointments();
    return list.filter((a) => a.doctorId === doctorId).map(normalizeAppointment);
  },

  async getAppointmentsByHospital(hospitalId: string): Promise<Appointment[]> {
    await delay();
    const list = mockDb.getAppointments();
    return list.filter((a) => a.hospitalId === hospitalId).map(normalizeAppointment);
  },

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    await delay(350);
    const list = mockDb.getAppointments();
    const phone = input.patientPhone || input.patientMobile || '+971 50 123 4567';
    const slot = input.timeSlot || input.time || '10:00 AM';
    const facility = input.facilityName || input.providerName || 'City Care Specialty Hospital';

    const newAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      patientId: input.patientId || 'guest_pat',
      patientName: input.patientName,
      patientMobile: phone,
      patientPhone: phone,
      patientEmail: input.patientEmail,
      doctorId: input.doctorId,
      doctorName: input.doctorName,
      doctorPhoto: input.doctorPhoto,
      hospitalId: input.hospitalId,
      clinicId: input.clinicId,
      providerName: facility,
      facilityName: facility,
      specialty: input.specialty,
      location: input.location || 'Dubai, UAE',
      date: input.date,
      time: slot,
      timeSlot: slot,
      status: 'confirmed',
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newAppointment);
    mockDb.saveAppointments(list);
    return normalizeAppointment(newAppointment);
  },

  async createBooking(input: CreateAppointmentInput): Promise<Appointment> {
    return this.createAppointment(input);
  },

  async updateAppointmentStatus(
    id: string,
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  ): Promise<Appointment> {
    await delay(200);
    const list = mockDb.getAppointments();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Appointment not found.');
    }

    list[index] = {
      ...list[index],
      status,
    };

    mockDb.saveAppointments(list);
    return normalizeAppointment(list[index]);
  },

  async completeAppointment(id: string): Promise<Appointment> {
    await delay(250);
    const list = mockDb.getAppointments();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Appointment not found.');
    }

    list[index] = {
      ...list[index],
      status: 'completed',
    };

    mockDb.saveAppointments(list);
    return normalizeAppointment(list[index]);
  },

  async cancelAppointment(
    id: string,
    reason: string,
    cancelledBy?: string,
    cancelledByName?: string
  ): Promise<Appointment> {
    await delay(300);
    const list = mockDb.getAppointments();
    const index = list.findIndex((a) => a.id === id);
    if (index === -1) {
      throw new Error('Appointment not found.');
    }

    list[index] = {
      ...list[index],
      status: 'cancelled',
      cancelReason: reason,
      cancelledBy: cancelledBy || 'user',
      cancelledByName: cancelledByName || 'Authorized User',
    };

    mockDb.saveAppointments(list);
    return normalizeAppointment(list[index]);
  },
};
