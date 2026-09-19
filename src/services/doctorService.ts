import { mockDb } from '../data/mockDatabase';
import { Doctor } from '../types';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const doctorService = {
  async getAllDoctors(): Promise<Doctor[]> {
    await delay();
    return mockDb.getDoctors();
  },

  async getDoctorById(id: string): Promise<Doctor | null> {
    await delay();
    const doctors = mockDb.getDoctors();
    return doctors.find((d) => d.id === id) || null;
  },

  async getDoctorsByHospital(hospitalId: string): Promise<Doctor[]> {
    await delay();
    const doctors = mockDb.getDoctors();
    const hospitals = mockDb.getHospitals();
    const hospital = hospitals.find((h) => h.id === hospitalId);
    return doctors.filter(
      (d) => d.hospitalId === hospitalId || (hospital && hospital.doctorIds.includes(d.id))
    );
  },

  async getDoctorsByClinic(clinicId: string): Promise<Doctor[]> {
    await delay();
    const doctors = mockDb.getDoctors();
    return doctors.filter((d) => d.clinicId === clinicId);
  },

  async searchDoctors(query: string, specialty?: string, location?: string): Promise<Doctor[]> {
    await delay();
    let docs = mockDb.getDoctors();
    if (query) {
      const q = query.toLowerCase().trim();
      docs = docs.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          (d.hospitalName && d.hospitalName.toLowerCase().includes(q)) ||
          (d.clinicName && d.clinicName.toLowerCase().includes(q))
      );
    }
    if (specialty && specialty !== 'All') {
      docs = docs.filter((d) => d.specialty.toLowerCase() === specialty.toLowerCase());
    }
    if (location && location !== 'All') {
      docs = docs.filter((d) => d.location.toLowerCase().includes(location.toLowerCase()));
    }
    return docs;
  },

  async createDoctor(input: Partial<Doctor> & { name: string; specialty: string }): Promise<Doctor> {
    await delay(300);
    const doctors = mockDb.getDoctors();
    const newDoc: Doctor = {
      id: `doc_${Date.now()}`,
      name: input.name,
      specialty: input.specialty,
      specialInterest: input.specialInterest || [],
      photo:
        input.photo ||
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      experience: input.experience || '8 years',
      education: input.education || 'MD, Board Certified',
      rating: input.rating || 4.9,
      reviewCount: input.reviewCount || 1,
      location: input.location || 'Dubai Healthcare City',
      hospitalId: input.hospitalId || 'hosp-1',
      hospitalName: input.hospitalName || 'City Care Specialty Hospital',
      about:
        input.about ||
        'Board-certified specialist dedicated to evidence-based healthcare and patient wellness.',
      availableDays: input.availableDays || [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Saturday',
      ],
      availableSlots: input.availableSlots || [
        '09:00 - 09:30',
        '09:30 - 10:00',
        '10:00 - 10:30',
        '11:00 - 11:30',
        '14:00 - 14:30',
        '15:00 - 15:30',
      ],
    };

    doctors.unshift(newDoc);
    mockDb.saveDoctors(doctors);
    return newDoc;
  },

  async updateDoctorStatus(id: string, status: 'Active' | 'Deactivated'): Promise<Doctor | null> {
    await delay(100);
    const doctors = mockDb.getDoctors();
    const idx = doctors.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    doctors[idx] = { ...doctors[idx], status };
    mockDb.saveDoctors(doctors);
    return doctors[idx];
  },
};
