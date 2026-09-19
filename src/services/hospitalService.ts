import { mockDb } from '../data/mockDatabase';
import { Hospital } from '../types';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const hospitalService = {
  async getAllHospitals(): Promise<Hospital[]> {
    await delay();
    return mockDb.getHospitals();
  },

  async getHospitalById(id: string): Promise<Hospital | null> {
    await delay();
    const hospitals = mockDb.getHospitals();
    return hospitals.find((h) => h.id === id) || null;
  },

  async searchHospitals(query: string, specialty?: string, location?: string): Promise<Hospital[]> {
    await delay();
    let hospitals = mockDb.getHospitals();
    if (query) {
      const q = query.toLowerCase().trim();
      hospitals = hospitals.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.location.toLowerCase().includes(q) ||
          h.specialties.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (specialty && specialty !== 'All') {
      hospitals = hospitals.filter((h) =>
        h.specialties.some((s) => s.toLowerCase() === specialty.toLowerCase())
      );
    }
    if (location && location !== 'All') {
      hospitals = hospitals.filter((h) =>
        h.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    return hospitals;
  },

  async updateHospitalStatus(id: string, status: 'Active' | 'Deactivated'): Promise<Hospital | null> {
    await delay(100);
    const hospitals = mockDb.getHospitals();
    const idx = hospitals.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    hospitals[idx] = { ...hospitals[idx], status };
    mockDb.saveHospitals(hospitals);
    return hospitals[idx];
  },
};
