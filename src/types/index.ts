export type UserRole = 'patient' | 'doctor' | 'hospital' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mobile?: string;
  phone?: string;
  hospitalId?: string;
  doctorId?: string;
  avatar?: string;
}

export interface Doctor {
  id: string;
  name: string;
  nameAr?: string;
  photo: string;
  specialty: string;
  specialInterest?: string[];
  experience: string;
  experienceAr?: string;
  rating: number;
  reviewCount: number;
  location: string;
  hospitalId?: string;
  clinicId?: string;
  hospitalName?: string;
  hospitalNameAr?: string;
  clinicName?: string;
  about: string;
  aboutAr?: string;
  education: string;
  availableDays: string[];
  availableSlots: string[];
  consultationFee?: number;
  status?: 'Active' | 'Deactivated';
}

export interface Hospital {
  id: string;
  name: string;
  nameAr?: string;
  photo: string;
  location: string;
  address: string;
  addressAr?: string;
  specialties: string[];
  doctorIds: string[];
  doctorCount: number;
  rating: number;
  emergencyAvailable: boolean;
  phone: string;
  operatingHours: string;
  operatingHoursAr?: string;
  about: string;
  aboutAr?: string;
  status?: 'Active' | 'Deactivated';
}

export interface Clinic {
  id: string;
  name: string;
  photo: string;
  location: string;
  address: string;
  specialty: string;
  doctorIds: string[];
  doctorCount: number;
  rating: number;
  phone: string;
  operatingHours: string;
  about: string;
  status?: 'Active' | 'Deactivated';
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  mobile: string;
  phone?: string;
  gender: string;
  age: number;
  bloodGroup: string;
}

export type AppointmentStatus =
  | 'Confirmed'
  | 'Cancelled'
  | 'Completed'
  | 'Upcoming'
  | 'Pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'upcoming'
  | 'pending';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  doctorPhoto?: string;
  hospitalId?: string;
  clinicId?: string;
  providerName: string;
  facilityName?: string;
  hospitalName?: string;
  specialty: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "10:00 AM"
  timeSlot?: string;
  status: AppointmentStatus;
  notes?: string;
  cancelReason?: string;
  cancelNote?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  createdAt: string;
}

export interface HealthCondition {
  id: string;
  name: string;
  specialty: string;
  letter: string;
  description: string;
}

export interface WaitlistEntry {
  id: string;
  name?: string;
  email: string;
  submittedAt: string;
  createdAt?: string;
}

export interface ProviderRequest {
  id: string;
  providerType: 'hospital' | 'clinic' | 'doctor';
  name: string;
  contactNumber: string;
  email: string;
  country: string;
  location: string;
  submittedAt: string;
  createdAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface FilterOptions {
  searchTerm?: string;
  providerType?: 'All' | 'Doctor' | 'Hospital' | 'Clinic';
  specialty?: string;
  location?: string;
  availability?: string;
}

