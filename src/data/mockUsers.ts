import { User } from '../types';

export interface MockUserRecord extends User {
  password: string;
}

export const INITIAL_USERS: MockUserRecord[] = [
  {
    id: 'usr_pat_1',
    name: 'Sarah Jenkins',
    email: 'patient@meetadr.demo',
    password: 'Patient@123',
    role: 'patient',
    mobile: '+971 50 123 4567',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_doc_1',
    name: 'Dr. Tariq Al-Mansoor',
    email: 'doctor@meetadr.demo',
    password: 'Doctor@123',
    role: 'doctor',
    doctorId: 'doc_1',
    hospitalId: 'hosp_1',
    mobile: '+971 52 234 5678',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_hosp_1',
    name: 'City Care Hospital Admin',
    email: 'hospital@meetadr.demo',
    password: 'Hospital@123',
    role: 'hospital',
    hospitalId: 'hosp_1',
    mobile: '+971 4 388 9000',
    avatar: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_admin_1',
    name: 'Admin Operations',
    email: 'admin@meetadr.demo',
    password: 'Admin@123',
    role: 'admin',
    mobile: '+971 4 555 0199',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  // Additional patients
  {
    id: 'usr_pat_2',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    password: 'Password@123',
    role: 'patient',
    mobile: '+971 50 234 1122',
  },
  {
    id: 'usr_pat_3',
    name: 'Amina Nour',
    email: 'amina.nour@example.com',
    password: 'Password@123',
    role: 'patient',
    mobile: '+971 55 345 2233',
  },
  {
    id: 'usr_pat_4',
    name: 'David Chen',
    email: 'david.chen@example.com',
    password: 'Password@123',
    role: 'patient',
    mobile: '+971 52 456 3344',
  },
  {
    id: 'usr_pat_5',
    name: 'Fatima Al-Sayed',
    email: 'fatima.sayed@example.com',
    password: 'Password@123',
    role: 'patient',
    mobile: '+971 50 567 4455',
  },
  {
    id: 'usr_pat_6',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    password: 'Password@123',
    role: 'patient',
    mobile: '+971 55 678 5566',
  },
  {
    id: 'usr_pat_7',
    name: 'Rashid Khan',
    email: 'rashid.khan@example.com',
    password: 'Password@123',
    role: 'patient',
    mobile: '+971 52 789 6677',
  },
  {
    id: 'usr_pat_8',
    name: 'Grace O\'Connor',
    email: 'grace.oconnor@example.com',
    password: 'Password@123',
    role: 'patient',
    mobile: '+971 50 890 7788',
  },
];
