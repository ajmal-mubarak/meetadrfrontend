import { mockDb } from '../data/mockDatabase';
import { Clinic } from '../types';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const clinicService = {
  async getAllClinics(): Promise<Clinic[]> {
    await delay();
    return mockDb.getClinics();
  },

  async getClinicById(id: string): Promise<Clinic | null> {
    await delay();
    const clinics = mockDb.getClinics();
    return clinics.find((c) => c.id === id) || null;
  },

  async searchClinics(query: string, specialty?: string, location?: string): Promise<Clinic[]> {
    await delay();
    let clinics = mockDb.getClinics();
    if (query) {
      const q = query.toLowerCase().trim();
      clinics = clinics.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.specialty.toLowerCase().includes(q)
      );
    }
    if (specialty && specialty !== 'All') {
      clinics = clinics.filter(
        (c) => c.specialty.toLowerCase() === specialty.toLowerCase()
      );
    }
    if (location && location !== 'All') {
      clinics = clinics.filter((c) =>
        c.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    return clinics;
  },

  async updateClinicStatus(id: string, status: 'Active' | 'Deactivated'): Promise<Clinic | null> {
    await delay(100);
    const clinics = mockDb.getClinics();
    const idx = clinics.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    clinics[idx] = { ...clinics[idx], status };
    mockDb.saveClinics(clinics);
    return clinics[idx];
  },
};
