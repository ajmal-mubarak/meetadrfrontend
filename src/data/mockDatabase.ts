import { MockUserRecord, INITIAL_USERS } from './mockUsers';
import { INITIAL_DOCTORS } from './mockDoctors';
import { INITIAL_HOSPITALS } from './mockHospitals';
import { INITIAL_CLINICS } from './mockClinics';
import { INITIAL_PATIENTS } from './mockPatients';
import { INITIAL_APPOINTMENTS } from './mockAppointments';
import {
  Doctor,
  Hospital,
  Clinic,
  Patient,
  Appointment,
  WaitlistEntry,
  ProviderRequest,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'meetadr_users_v3',
  DOCTORS: 'meetadr_doctors_v3',
  HOSPITALS: 'meetadr_hospitals_v3',
  CLINICS: 'meetadr_clinics_v3',
  PATIENTS: 'meetadr_patients_v3',
  APPOINTMENTS: 'meetadr_appointments_v3',
  WAITLIST: 'meetadr_waitlist_v3',
  PROVIDER_REQUESTS: 'meetadr_provider_requests_v3',
  SESSION: 'meetadr_session_v3',
};

class MockDatabase {
  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    // Purge legacy storage versions and any stale CMC references immediately
    try {
      const legacyKeys = [
        'meetadr_users', 'meetadr_users_v2',
        'meetadr_doctors', 'meetadr_doctors_v2',
        'meetadr_hospitals', 'meetadr_hospitals_v2',
        'meetadr_clinics', 'meetadr_clinics_v2',
        'meetadr_patients', 'meetadr_patients_v2',
        'meetadr_appointments', 'meetadr_appointments_v2',
        'meetadr_waitlist', 'meetadr_waitlist_v2',
        'meetadr_provider_requests', 'meetadr_provider_requests_v2',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));

      // Scan all localStorage items for any residual CMC mentions and remove them
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('meetadr_') || key.includes('hospital') || key.includes('doctor'))) {
          const val = localStorage.getItem(key);
          if (val && (val.includes('Clemenceau') || val.includes('CMC'))) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch {
      // ignore storage errors in restricted contexts
    }

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DOCTORS)) {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLINICS)) {
      localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(INITIAL_CLINICS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WAITLIST)) {
      localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify([
        { id: 'wt_1', name: 'Zaid Al-Ali', email: 'zaid@example.com', submittedAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 'wt_2', email: 'mariam.k@example.com', submittedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      ]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROVIDER_REQUESTS)) {
      localStorage.setItem(STORAGE_KEYS.PROVIDER_REQUESTS, JSON.stringify([
        {
          id: 'req_1',
          providerType: 'hospital',
          name: 'Al Zahra Medical Complex',
          contactNumber: '+971 4 333 4455',
          email: 'partnerships@alzahra-group.ae',
          country: 'United Arab Emirates',
          location: 'Dubai - Al Barsha',
          submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
      ]));
    }
  }

  // Users
  getUsers(): MockUserRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  saveUsers(users: MockUserRecord[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Doctors
  getDoctors(): Doctor[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      if (!data) return INITIAL_DOCTORS;
      const parsed: Doctor[] = JSON.parse(data);
      if (parsed.some((d) => d.hospitalName?.includes('CMC') || d.hospitalName?.includes('Clemenceau'))) {
        localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
        return INITIAL_DOCTORS;
      }
      return parsed;
    } catch {
      return INITIAL_DOCTORS;
    }
  }

  saveDoctors(doctors: Doctor[]) {
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
  }

  // Hospitals
  getHospitals(): Hospital[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
      if (!data) return INITIAL_HOSPITALS;
      const parsed: Hospital[] = JSON.parse(data);
      if (
        parsed.some(
          (h) =>
            h.name.includes('CMC') ||
            h.name.includes('Clemenceau') ||
            (h.about && h.about.includes('Clemenceau'))
        )
      ) {
        localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
        return INITIAL_HOSPITALS;
      }
      return parsed;
    } catch {
      return INITIAL_HOSPITALS;
    }
  }

  saveHospitals(hospitals: Hospital[]) {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
  }

  // Clinics
  getClinics(): Clinic[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLINICS);
      return data ? JSON.parse(data) : INITIAL_CLINICS;
    } catch {
      return INITIAL_CLINICS;
    }
  }

  saveClinics(clinics: Clinic[]) {
    localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(clinics));
  }

  // Patients
  getPatients(): Patient[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      return data ? JSON.parse(data) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  }

  savePatients(patients: Patient[]) {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }

  // Appointments
  getAppointments(): Appointment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (!data) return INITIAL_APPOINTMENTS;
      const parsed: Appointment[] = JSON.parse(data);
      if (
        parsed.some(
          (a) =>
            a.hospitalName?.includes('CMC') ||
            a.hospitalName?.includes('Clemenceau') ||
            a.facilityName?.includes('CMC') ||
            a.facilityName?.includes('Clemenceau')
        )
      ) {
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
        return INITIAL_APPOINTMENTS;
      }
      return parsed;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  }

  saveAppointments(appointments: Appointment[]) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }

  // Waitlist
  getWaitlist(): WaitlistEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WAITLIST);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveWaitlist(entries: WaitlistEntry[]) {
    localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(entries));
  }

  // Provider Requests
  getProviderRequests(): ProviderRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROVIDER_REQUESTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveProviderRequests(reqs: ProviderRequest[]) {
    localStorage.setItem(STORAGE_KEYS.PROVIDER_REQUESTS, JSON.stringify(reqs));
  }

  // Session
  getSession(): { user: any } | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveSession(session: { user: any } | null) {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.DOCTORS);
    localStorage.removeItem(STORAGE_KEYS.HOSPITALS);
    localStorage.removeItem(STORAGE_KEYS.CLINICS);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.WAITLIST);
    localStorage.removeItem(STORAGE_KEYS.PROVIDER_REQUESTS);
    this.initDatabase();
  }
}

export const mockDb = new MockDatabase();
