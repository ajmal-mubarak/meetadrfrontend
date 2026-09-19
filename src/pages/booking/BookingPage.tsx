import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  MapPin,
  Building2,
  Phone,
  Mail,
  User,
  ExternalLink,
  X,
  Stethoscope,
  ArrowRight,
  Eye,
  Check,
  Lock,
  LogIn,
  Smartphone,
  Zap,
  ShieldAlert,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import { doctorService } from '../../services/doctorService';
import { Doctor, Appointment } from '../../types';
import { useToast } from '../../context/ToastContext';
import { INITIAL_DOCTORS } from '../../data/mockDoctors';
import { useTranslation } from '../../i18n';

// ─── Guest Login Modal (intercepts booking when not authenticated) ────────────
interface GuestLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
  doctorName: string;
}

const GuestLoginModal: React.FC<GuestLoginModalProps> = ({ onSuccess, onClose, doctorName }) => {
  const { login, quickLoginAs } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [mode, setMode] = useState<'options' | 'email' | 'otp'>('options');
  const [email, setEmail] = useState('patient@meetadr.demo');
  const [password, setPassword] = useState('Patient@123');
  const [mobile, setMobile] = useState('52 412 2794');
  const [countryCode, setCountryCode] = useState('+971');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Signed in! Completing your booking...', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Login failed. Check credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = () => {
    if (!mobile.trim()) { showToast('Enter your mobile number.', 'error'); return; }
    setOtpSent(true);
    showToast(`OTP sent to ${countryCode} ${mobile}. (Demo: 1234)`, 'info');
  };

  const handleVerifyOtp = async () => {
    if (otp.trim() !== '1234') { showToast('Invalid OTP. Demo code is 1234.', 'error'); return; }
    setIsLoading(true);
    try {
      await login('patient@meetadr.demo', 'Patient@123');
      showToast('Verified! Completing your booking...', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Verification failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIsLoading(true);
    try {
      await quickLoginAs('patient');
      showToast('Quick login done! Completing your booking...', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Quick login failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-[#E2EBF0] overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-[#F8FAFC] p-6 border-b border-[#E2EBF0]">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <LogIn className="w-5 h-5 text-[#2DA7B5]" />
                <span className="font-bold text-sm text-slate-900">{t('auth.loginTitle')}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                You're one step away from booking with <strong className="text-slate-900">{doctorName}</strong>.<br />
                Sign in to save and track your appointment.
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {mode === 'options' && (
            <div className="space-y-3">
              {/* Quick Demo Login */}
              <button
                type="button"
                onClick={handleQuickDemo}
                disabled={isLoading}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[#E8F6F8] hover:bg-[#daf1f4] border border-[#CDEBF0] transition-all cursor-pointer disabled:opacity-60 group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2DA7B5] text-white flex items-center justify-center shrink-0 shadow-xs">
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-sm font-bold text-slate-900">{t('auth.demoPatient')}</p>
                  <p className="text-[11px] text-slate-500">Enter as patient instantly — for demo/review</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#2DA7B5] ml-auto rtl:ml-0 rtl:mr-auto rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E2EBF0]" />
                <span className="text-[11px] text-slate-400 font-semibold">{t('common.or') || 'or'}</span>
                <div className="flex-1 h-px bg-[#E2EBF0]" />
              </div>

              {/* Email Login */}
              <button
                type="button"
                onClick={() => setMode('email')}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-[#E2EBF0] bg-[#F8FAFC] hover:border-[#2DA7B5] hover:bg-white transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-sm font-bold text-slate-900">{t('auth.email')}</p>
                  <p className="text-[11px] text-slate-500">Use your meetAdr account credentials</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto rtl:ml-0 rtl:mr-auto rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              </button>

              {/* OTP Login */}
              <button
                type="button"
                onClick={() => setMode('otp')}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-[#E2EBF0] bg-[#F8FAFC] hover:border-[#2DA7B5] hover:bg-white transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left rtl:text-right">
                  <p className="text-sm font-bold text-slate-900">Sign in with Mobile OTP</p>
                  <p className="text-[11px] text-slate-500">Receive a 4-digit SMS code</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 ml-auto rtl:ml-0 rtl:mr-auto rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <p className="text-center text-[11px] text-slate-500 pt-1">
                New here?{' '}
                <Link to="/login" className="text-[#2DA7B5] font-bold hover:underline">
                  {t('auth.registerPatient')}
                </Link>
              </p>
            </div>
          )}

          {mode === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <button type="button" onClick={() => setMode('options')} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-bold">
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t('common.back')}
              </button>

              {/* Demo hint */}
              <div className="bg-[#E8F6F8] border border-[#CDEBF0] rounded-xl p-3 text-xs">
                <p className="font-bold text-[#0E7490] mb-1">Demo credentials pre-filled</p>
                <p className="text-[#0E7490] font-mono text-[11px]">{email} / {password}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 rtl:left-auto rtl:right-3" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 border border-[#E2EBF0] rounded-xl text-sm text-slate-900 bg-[#F8FAFC] focus:border-[#2DA7B5] focus:bg-white focus:outline-hidden transition-all shadow-2xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 rtl:left-auto rtl:right-3" />
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-2.5 border border-[#E2EBF0] rounded-xl text-sm text-slate-900 bg-[#F8FAFC] focus:border-[#2DA7B5] focus:bg-white focus:outline-hidden transition-all shadow-2xs font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
                {isLoading ? 'Signing in...' : 'Sign In & Book'}
              </button>
            </form>
          )}

          {mode === 'otp' && (
            <div className="space-y-4">
              <button type="button" onClick={() => { setMode('options'); setOtpSent(false); setOtp(''); }} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-bold">
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t('common.back')}
              </button>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('booking.mobileNumber')}</label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 border border-[#E2EBF0] rounded-xl px-2 py-2.5 text-xs font-bold bg-[#F8FAFC] text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="+971">+971</option>
                    <option value="+965">+965</option>
                    <option value="+966">+966</option>
                  </select>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="52 412 2794"
                    className="flex-1 border border-[#E2EBF0] rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-[#F8FAFC] focus:border-[#2DA7B5] focus:bg-white focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {!otpSent ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Send Verification Code
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Enter 4-digit OTP</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full border border-[#E2EBF0] rounded-xl py-2.5 text-center text-lg font-mono font-bold tracking-widest text-slate-900 bg-[#F8FAFC] focus:border-[#2DA7B5] focus:bg-white focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                    className="w-full py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const BookingPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Pending booking flag — set to true when user fills form but isn't logged in yet
  const [pendingBooking, setPendingBooking] = useState(false);
  const { showToast } = useToast();
  const { t, language, translateSpecialty, isArabic } = useTranslation();

  const isStaff = Boolean(user && user.role !== 'patient');
  const staffDashboardPath = user?.role === 'admin'
    ? '/admin/dashboard'
    : user?.role === 'hospital'
    ? '/hospital/dashboard'
    : '/doctor/dashboard';

  const staffRoleLabel = user?.role === 'admin'
    ? (language === 'ar' ? 'المسؤول' : 'Admin')
    : user?.role === 'hospital'
    ? (language === 'ar' ? 'المستشفى' : 'Hospital')
    : (language === 'ar' ? 'الطبيب' : 'Doctor');

  const staffDashboardName = user?.role === 'admin'
    ? (language === 'ar' ? 'لوحة تحكم المسؤول' : 'Admin Dashboard')
    : user?.role === 'hospital'
    ? (language === 'ar' ? 'لوحة تحكم المستشفى' : 'Hospital Dashboard')
    : (language === 'ar' ? 'لوحة تحكم الطبيب' : 'Doctor Dashboard');

// ─── Schedule Time Parsing & Full Daily Slots Generator ──────────────────────
const parseTimeToMinutes = (timeStr: string): number => {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const generateFullScheduleSlots = (doctorSlots: string[]): string[] => {
  const has20 = doctorSlots.some((s) => s.includes(':20') || s.includes(':40'));
  const slotSet = new Set<string>();

  // Full day clinical schedule: 09:00 AM to 05:00 PM
  if (has20) {
    const startMins = 9 * 60; // 09:00 AM
    const endMins = 17 * 60; // 05:00 PM
    for (let m = startMins; m <= endMins; m += 20) {
      const hours24 = Math.floor(m / 60);
      const mins = m % 60;
      const meridiem = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      const formatted = `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${meridiem}`;
      slotSet.add(formatted);
    }
  } else {
    const hasEarly = doctorSlots.some((s) => s.startsWith('08:'));
    const startMins = hasEarly ? 8 * 60 + 30 : 9 * 60;
    const endMins = 17 * 60;
    for (let m = startMins; m <= endMins; m += 30) {
      const hours24 = Math.floor(m / 60);
      const mins = m % 60;
      const meridiem = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      const formatted = `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${meridiem}`;
      slotSet.add(formatted);
    }
  }

  // Always include all doctor's specifically configured slots
  doctorSlots.forEach((s) => slotSet.add(s.trim()));

  return Array.from(slotSet).sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
};

  const [allDoctors, setAllDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);

  React.useEffect(() => {
    doctorService.getAllDoctors().then((docs) => {
      if (docs && docs.length > 0) setAllDoctors(docs);
    });
  }, []);

  // Selected doctor (defaulting to Dr. Sarah Chen or the param)
  const [selectedDocId, setSelectedDocId] = useState<string>(
    doctorId || 'doc_sarah_chen'
  );

  const doctor = useMemo(() => {
    return allDoctors.find((d) => d.id === selectedDocId) || allDoctors[0];
  }, [allDoctors, selectedDocId]);

  // Departments that THIS specific doctor actually has
  const doctorDepartments = useMemo(() => {
    const spec = (doctor.specialty || '').trim();
    const lower = spec.toLowerCase();

    if (lower.includes('cardio')) {
      return ['Cardiology', 'Interventional Cardiology', 'Cardiovascular Prevention'];
    }
    if (lower.includes('general') || lower.includes('family')) {
      return ['General Practice', 'Family Medicine', 'Primary Health Screening'];
    }
    if (lower.includes('derma')) {
      return ['Dermatology', 'Clinical Dermatology', 'Cosmetic Dermatology'];
    }
    if (lower.includes('neuro')) {
      return ['Neurology', 'Clinical Neurophysiology', 'Headache & Stroke Care'];
    }
    if (lower.includes('pedia')) {
      return ['Pediatrics', 'Child Health & Immunization', 'Pediatric Wellness'];
    }
    if (lower.includes('ortho')) {
      return ['Orthopedics', 'Sports Medicine', 'Joint & Arthroscopy'];
    }
    return [spec || 'Specialist Consultation'];
  }, [doctor]);

  // Form inputs
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(doctorDepartments[0]);

  // Update selected specialty when doctor changes
  React.useEffect(() => {
    setSelectedSpecialty(doctorDepartments[0]);
  }, [doctorDepartments]);

  const [patientName, setPatientName] = useState(user ? user.name : '');
  const [countryCode, setCountryCode] = useState('+971');
  const [mobileNumber, setMobileNumber] = useState(user ? user.phone || '524122794' : '');
  const [patientEmail, setPatientEmail] = useState(user ? user.email : '');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Generate date options (today + next 7 days)
  const nextDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? t('booking.today') : i === 1 ? t('booking.tomorrow') : d.toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', { weekday: 'short' });
      const display = d.toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', { month: 'short', day: 'numeric' });
      const fullDisplay = d.toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      dates.push({ date: iso, dayName, display, fullDisplay });
    }
    return dates;
  }, [language, t]);

  const [selectedDateObj, setSelectedDateObj] = useState(nextDates[0]);
  const [selectedSlot, setSelectedSlot] = useState(doctor.availableSlots[0] || '10:00 AM');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);

  // Load existing bookings from the database
  React.useEffect(() => {
    bookingService.getAllAppointments().then((data) => {
      if (data) setExistingAppointments(data);
    });
  }, []);

  // Compute which slots are already booked for this doctor on the selected date
  const bookedSlotsForDate = useMemo(() => {
    const dateStr = selectedDateObj.date;
    const set = new Set<string>();
    existingAppointments.forEach((a) => {
      const isDocMatch =
        a.doctorId === doctor.id ||
        (a.doctorName && a.doctorName.toLowerCase().trim() === doctor.name.toLowerCase().trim());
      if (!isDocMatch) return;
      if (a.date !== dateStr) return;
      if (a.status?.toLowerCase() === 'cancelled') return;

      const slotTime = (a.timeSlot || a.time || '').trim();
      if (slotTime) set.add(slotTime);
    });
    return set;
  }, [existingAppointments, doctor, selectedDateObj.date]);

  // Generate full daily schedule of slots (all times across the clinical day)
  const fullScheduleSlots = useMemo(() => {
    const base = generateFullScheduleSlots(doctor.availableSlots || []);
    bookedSlotsForDate.forEach((s) => {
      if (!base.includes(s)) base.push(s);
    });
    return base.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
  }, [doctor.availableSlots, bookedSlotsForDate]);

  // Keep selectedSlot on an available and unbooked slot
  React.useEffect(() => {
    const isAvailable = (doctor.availableSlots || []).includes(selectedSlot);
    const isBooked = bookedSlotsForDate.has(selectedSlot);
    if (!isAvailable || isBooked) {
      const firstValid = fullScheduleSlots.find(
        (s) => (doctor.availableSlots || []).includes(s) && !bookedSlotsForDate.has(s)
      );
      if (firstValid) {
        setSelectedSlot(firstValid);
      } else {
        setSelectedSlot('');
      }
    }
  }, [doctor, selectedDateObj.date, fullScheduleSlots, bookedSlotsForDate]);

  // Booking completion state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<any | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  // Form validation for dynamic button styling
  const isStep1Valid = doctor.status !== 'Deactivated' && Boolean(selectedSpecialty);
  const isStep2Valid =
    Boolean(selectedSlot) &&
    (doctor.availableSlots || []).includes(selectedSlot) &&
    !bookedSlotsForDate.has(selectedSlot);

  const isFormValid = useMemo(() => {
    return (
      patientName.trim().length > 0 &&
      mobileNumber.trim().length >= 7 &&
      Boolean(selectedSlot) &&
      (doctor.availableSlots || []).includes(selectedSlot) &&
      !bookedSlotsForDate.has(selectedSlot) &&
      termsAccepted
    );
  }, [patientName, mobileNumber, selectedSlot, doctor.availableSlots, bookedSlotsForDate, termsAccepted]);

  const handleSelectDoctor = (id: string) => {
    setSelectedDocId(id);
    const found = allDoctors.find((d) => d.id === id);
    if (found) {
      const foundSlots = generateFullScheduleSlots(found.availableSlots || []);
      const firstValid = foundSlots.find(
        (s) => (found.availableSlots || []).includes(s) && !bookedSlotsForDate.has(s)
      );
      setSelectedSlot(firstValid || '');
    }
  };

  // Core booking logic — called directly when authenticated
  const submitBooking = async () => {
    setIsSubmitting(true);
    try {
      const fullPhone = `${countryCode} ${mobileNumber.trim()}`;
      const newAppt = await bookingService.createAppointment({
        patientId: user ? user.id : 'guest_patient',
        patientName: patientName.trim(),
        patientPhone: fullPhone,
        patientEmail: patientEmail.trim() || undefined,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorPhoto: doctor.photo,
        specialty: selectedSpecialty,
        hospitalId: doctor.hospitalId || 'hosp_cmc',
        facilityName: doctor.hospitalName || 'American Hospital Dubai',
        date: selectedDateObj.date,
        timeSlot: selectedSlot,
      });
      setBookedAppointment(newAppt);
      setExistingAppointments((prev) => [...prev, newAppt]);
      showToast(t('booking.bookingConfirmedTitle'), 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      showToast(err.message || 'Failed to place booking.', 'error');
    } finally {
      setIsSubmitting(false);
      setPendingBooking(false);
    }
  };

  // Called after successful login inside the modal — resumes the pending booking
  const handleLoginSuccess = async () => {
    setShowLoginModal(false);
    setPendingBooking(false);
    await submitBooking();
  };

  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();

    // Staff check: Admin, Hospital, and Doctor accounts cannot place public bookings
    if (isStaff) {
      showToast(
        language === 'ar'
          ? 'حسابات الإدارة والمستشفيات لا يمكنها حجز المواعيد. يرجى التوجه للوحة التحكم الخاصة بك.'
          : 'Administrative and hospital accounts cannot place patient bookings. Please use your portal dashboard.',
        'error'
      );
      return;
    }

    // Step 1 progression
    if (currentStep === 1) {
      if (!isStep1Valid) {
        showToast(
          language === 'ar'
            ? 'عذراً، هذا الطبيب غير متاح للحجز حالياً.'
            : 'Sorry, this doctor is currently unavailable for bookings.',
          'error'
        );
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 160, behavior: 'smooth' });
      return;
    }

    // Step 2 progression
    if (currentStep === 2) {
      if (!isStep2Valid) {
        showToast(
          language === 'ar'
            ? 'يرجى اختيار وقت متاح للموعد للمتابعة.'
            : 'Please select an available time slot to continue.',
          'error'
        );
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 160, behavior: 'smooth' });
      return;
    }

    // Step 3 submission logic
    if (isStaff) {
      showToast(
        language === 'ar'
          ? 'حسابات الإدارة لا يمكنها حجز المواعيد كمريض.'
          : 'Staff accounts cannot place patient bookings.',
        'error'
      );
      return;
    }

    if (doctor.status === 'Deactivated') {
      showToast(
        language === 'ar'
          ? 'عذراً، هذا الطبيب غير متاح للحجز حالياً.'
          : 'Sorry, this doctor is currently unavailable for bookings.',
        'error'
      );
      return;
    }

    if (!isFormValid) {
      if (!patientName.trim()) {
        showToast('Please enter the patient full name.', 'error');
        return;
      }
      if (!mobileNumber.trim() || mobileNumber.trim().length < 7) {
        showToast('Please enter a valid mobile number for SMS confirmation.', 'error');
        return;
      }
      if (!termsAccepted) {
        showToast('Please accept the Terms and Conditions to proceed.', 'error');
        return;
      }
      return;
    }

    // ── GUEST GATE: show login modal instead of booking ──────────────────────
    if (!isAuthenticated) {
      setPendingBooking(true);
      setShowLoginModal(true);
      return;
    }

    // Logged in — proceed directly
    await submitBooking();
  };

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-2xl mx-auto">

        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => navigate('/doctors')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t('booking.backToDoctors')}</span>
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0E7490] bg-[#E8F6F8] px-3.5 py-1.5 rounded-full border border-[#CDEBF0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" />
            <span>{t('booking.inPersonPayAtReception')}</span>
          </span>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: BOOKING COMPLETED SCREEN                                         */}
        {/* ========================================================================= */}
        {bookedAppointment ? (
          <div className="bg-white rounded-3xl border border-[#E2EBF0] p-8 sm:p-10 shadow-sm animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            {/* Success Icon & Heading */}
            <div className="text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-[#2DA7B5] flex items-center justify-center mx-auto mb-4 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t('booking.bookingConfirmedTitle')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {t('booking.bookingConfirmedSubtitle')}
              </p>

              <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2EBF0] text-xs font-mono font-bold text-slate-800 shadow-2xs">
                <span className="text-slate-500">{t('booking.bookingReference')}:</span>
                <span className="text-[#2DA7B5]">#MADR-{bookedAppointment.id.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            {/* Appointment Summary Box */}
            <div className="mt-8 bg-[#F8FAFC] rounded-2xl border border-[#E2EBF0] p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[#E2EBF0]">
                <img
                  src={doctor.photo}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-[#E2EBF0] shrink-0 bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">{doctor.name}</h3>
                  <p className="text-xs font-semibold text-[#2DA7B5]">{translateSpecialty(selectedSpecialty)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" />
                    <span>{doctor.hospitalName || 'American Hospital Dubai'}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 block">{t('booking.dateTimeLabel')}:</span>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedDateObj.fullDisplay} at <span className="text-[#2DA7B5]">{selectedSlot}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block">{t('booking.patientLabel')}:</span>
                  <p className="font-bold text-slate-900 text-sm">{patientName}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block">{t('booking.contactLabel')}:</span>
                  <p className="font-semibold text-slate-900">{countryCode} {mobileNumber}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block">{t('booking.feeNote')}:</span>
                  <p className="font-semibold text-[#0E7490]">{t('booking.payAtReception')} ({t('booking.zeroUpfrontPayment')})</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2EBF0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-4 h-4 text-[#2DA7B5] shrink-0" />
                  <span>Dubai Healthcare City Phase 2 - Al Jaddaf</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="font-bold text-[#2DA7B5] hover:underline flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-auto ms-5 sm:ms-0"
                >
                  <span>{t('booking.viewMap')}</span>
                  <ExternalLink className="w-3 h-3 rtl:mr-1" />
                </button>
              </div>
            </div>

            {/* Notification notice */}
            <div className="mt-5 p-4 rounded-xl bg-[#E8F6F8] border border-[#CDEBF0] flex items-start gap-3">
              <Check className="w-4 h-4 text-[#2DA7B5] mt-0.5 shrink-0" />
              <p className="text-xs text-[#0E7490] leading-relaxed">
                An SMS confirmation has been dispatched to <strong>{countryCode} {mobileNumber}</strong>. You can view, track, or cancel this booking anytime from your Patient Portal.
              </p>
            </div>

            {/* The 2 Primary Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Link
                to="/patient/dashboard"
                className="w-full sm:w-1/2 py-3.5 px-5 bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs sm:text-sm font-bold rounded-xl text-center transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Eye className="w-4 h-4" />
                <span>{t('booking.viewBookingsBtn')}</span>
              </Link>
              <button
                type="button"
                onClick={() => navigate('/doctors')}
                className="w-full sm:w-1/2 py-3.5 px-5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl text-center transition-all border border-[#E2EBF0] flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t('booking.goBack')}</span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setBookedAppointment(null);
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-800 underline cursor-pointer"
              >
                {t('booking.bookAnotherBtn')}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: DEDICATED BOOKING PAGE                                            */
          /* ========================================================================= */
          <div className="space-y-4 sm:space-y-5">
            {/* ── 3-STEP PROGRESS STEPPER ── */}
            <div className="px-1 sm:px-2 pt-1 pb-1">
              <div className="grid grid-cols-3 gap-3 sm:gap-5 max-w-xl mx-auto">
                {[
                  { step: 1 as const, label: isArabic ? '01 الخدمة' : '01 Service' },
                  { step: 2 as const, label: isArabic ? '02 التاريخ والوقت' : '02 Date & Time' },
                  { step: 3 as const, label: isArabic ? '03 التأكيد' : '03 Confirm' },
                ].map((s) => {
                  const isActive = s.step === currentStep;
                  const isCompleted = s.step < currentStep;
                  const isPassedOrCurrent = isCompleted || isActive;
                  const isClickable = isCompleted || s.step === currentStep;

                  return (
                    <button
                      key={s.step}
                      type="button"
                      disabled={!isClickable}
                      onClick={() => {
                        if (isClickable) {
                          setCurrentStep(s.step);
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }
                      }}
                      className={`text-center transition-all ${
                        isClickable ? 'cursor-pointer hover:opacity-85' : 'cursor-default'
                      }`}
                    >
                      {/* Segmented Horizontal Line Bar */}
                      <div
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          isPassedOrCurrent ? 'bg-[#2DA7B5]' : 'bg-[#E2EBF0]'
                        }`}
                      />
                      {/* Step Text Underneath */}
                      <span
                        className={`block mt-2 text-xs sm:text-sm font-semibold tracking-tight transition-colors ${
                          isPassedOrCurrent ? 'text-slate-900 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Booking Card */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 sm:p-8 shadow-sm text-slate-800">
              
              {/* Page Header */}
              <div className="pb-5 border-b border-[#E2EBF0]">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {t('booking.pageTitle')}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  {t('booking.pageSubtitle')}
                </p>
              </div>

              {/* Staff Account Detected Banner */}
              {isStaff && (
                <div className="mt-5 p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-amber-900">
                          {language === 'ar' ? `حساب إداري نشط (${staffRoleLabel})` : `Staff Account Active (${staffRoleLabel})`}
                        </h3>
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 capitalize">
                          {user?.role}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        {language === 'ar'
                          ? 'حجز المواعيد على الموقع العام مخصص للمرضى فقط. بصفتك عضواً في الفريق، يرجى استخدام لوحة التحكم لإدارة المواعيد والعمليات.'
                          : 'Public appointment booking is reserved for patients. As an administrator or team member, please use your portal dashboard to manage schedules and bookings.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={staffDashboardPath}
                      className="py-2.5 px-4 bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>{staffDashboardName}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        showToast(language === 'ar' ? 'تم تسجيل الخروج. يمكنك الحجز الآن كمريض.' : 'Signed out. You can now book as a patient.', 'info');
                      }}
                      className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-[#E2EBF0] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
                      <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleBookNow} className="mt-6">
              {/* ========================================================================= */}
              {/* STEP 1: DOCTOR & SPECIALTY                                                */}
              {/* ========================================================================= */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Doctor Profile Banner */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={doctor.photo}
                        alt={doctor.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-[#E2EBF0] shrink-0 bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">
                            {doctor.name}
                          </h2>
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                            {t('booking.verifiedSpecialist')}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#2DA7B5] mt-0.5">
                          {translateSpecialty(doctor.specialty)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" />
                          <span>{doctor.hospitalName || 'American Hospital Dubai'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Doctor switcher dropdown */}
                    <div className="sm:text-right rtl:sm:text-left shrink-0">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                        {t('booking.changeDoctor')}
                      </label>
                      <div className="relative inline-block">
                        <select
                          value={selectedDocId}
                          onChange={(e) => handleSelectDoctor(e.target.value)}
                          className="appearance-none text-xs bg-white border border-[#E2EBF0] rounded-xl pl-3 pr-7 rtl:pl-7 rtl:pr-3 py-2 font-bold text-slate-800 cursor-pointer focus:outline-hidden hover:border-[#2DA7B5] shadow-2xs"
                        >
                          {allDoctors.map((d) => (
                            <option key={d.id} value={d.id} className="bg-white text-slate-900">
                              {d.name} ({translateSpecialty(d.specialty)})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Deactivated Doctor Banner */}
                  {doctor.status === 'Deactivated' && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-700">
                      <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                      <div>
                        <span className="font-bold block text-sm text-rose-800">
                          {language === 'ar' ? 'الطبيب غير متاح حالياً' : 'Doctor Currently Unavailable'}
                        </span>
                        <p className="text-rose-600 mt-0.5">
                          {language === 'ar'
                            ? 'تم تعليق الحجوزات لهذا الطبيب مؤقتاً بواسطة الإدارة. يرجى اختيار طبيب آخر من القائمة أعلاه.'
                            : 'Consultations for this specialist are temporarily suspended by administration. Please select another practitioner from the dropdown above.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Specialty / Department Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-[#2DA7B5]" />
                        <span>{t('booking.specialtyLabel')}</span>
                      </label>
                      <span className="text-[10px] font-bold text-[#0E7490] bg-[#E8F6F8] px-2 py-0.5 rounded-md border border-[#CDEBF0]">
                        {t('booking.doctorsSpecialties')}
                      </span>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3.5 flex items-center pointer-events-none text-[#2DA7B5]">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <select
                        value={selectedSpecialty}
                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                        className="w-full appearance-none bg-[#F8FAFC] border border-[#E2EBF0] hover:border-[#2DA7B5] focus:border-[#2DA7B5] focus:bg-white focus:ring-2 focus:ring-[#2DA7B5]/20 rounded-2xl pl-10 pr-10 rtl:pr-10 rtl:pl-10 py-3.5 text-xs sm:text-sm font-bold text-slate-900 transition-all cursor-pointer outline-hidden shadow-2xs"
                      >
                        {doctorDepartments.map((dept) => (
                          <option key={dept} value={dept} className="bg-white text-slate-900">
                            {translateSpecialty(dept)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3.5 rtl:right-auto rtl:left-0 rtl:pr-0 rtl:pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      {t('booking.showingDepartments', { name: doctor.name })}
                    </p>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="pt-4 border-t border-[#E2EBF0] flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isStep1Valid) {
                          showToast(isArabic ? 'الطبيب غير متاح حالياً للحجز' : 'Doctor is currently unavailable', 'error');
                          return;
                        }
                        setCurrentStep(2);
                        window.scrollTo({ top: 160, behavior: 'smooth' });
                      }}
                      disabled={!isStep1Valid}
                      className={`py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                        !isStep1Valid
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                          : 'bg-[#2DA7B5] hover:bg-[#23929F] text-white active:scale-[0.99]'
                      }`}
                    >
                      <span>{isArabic ? 'متابعة' : 'Continue'}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: DATE & TIME                                                       */}
              {/* ========================================================================= */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Selected Doctor Recap */}
                  <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2EBF0] flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={doctor.photo}
                        alt={doctor.name}
                        className="w-11 h-11 rounded-xl object-cover border border-[#E2EBF0] bg-slate-100"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{doctor.name}</h4>
                        <p className="text-[11px] text-[#2DA7B5] font-semibold">{translateSpecialty(selectedSpecialty)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        window.scrollTo({ top: 160, behavior: 'smooth' });
                      }}
                      className="text-xs font-bold text-[#2DA7B5] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{isArabic ? 'تغيير' : 'Change'}</span>
                    </button>
                  </div>

                  {/* Date Selection (7-Day Strip) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#2DA7B5]" />
                        <span>{t('booking.selectDate')}</span>
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {selectedDateObj.fullDisplay}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {nextDates.map((d) => {
                        const isSelected = selectedDateObj.date === d.date;
                        return (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => setSelectedDateObj(d)}
                            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer shadow-2xs ${
                              isSelected
                                ? 'bg-[#2DA7B5] text-white border-[#2DA7B5] font-bold scale-[1.02] shadow-xs'
                                : 'bg-[#F8FAFC] border-[#E2EBF0] text-slate-700 hover:border-[#2DA7B5] hover:bg-white'
                            }`}
                          >
                            <span className="text-[10px] block font-bold capitalize">
                              {d.dayName}
                            </span>
                            <span className="text-xs font-semibold block mt-0.5">
                              {d.display}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots (Full Schedule Grid) */}
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#2DA7B5]" />
                        <span>{t('booking.selectTime')}</span>
                      </label>
                      {selectedSlot ? (
                        <span className="text-xs font-bold text-[#2DA7B5]">
                          {t('booking.selectedSlotLabel')}: {selectedSlot}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-500">
                          {isArabic ? 'يرجى اختيار وقت متاح' : 'Please select an available slot'}
                        </span>
                      )}
                    </div>

                    <div
                      role="group"
                      aria-label={isArabic ? 'اختر وقت الموعد' : 'Select appointment time'}
                      className="grid grid-cols-4 sm:grid-cols-5 gap-1.5"
                    >
                      {fullScheduleSlots.map((slot) => {
                        const isConfiguredAvailable = (doctor.availableSlots || []).includes(slot);
                        const isBooked = bookedSlotsForDate.has(slot);
                        const isAvailable = isConfiguredAvailable && !isBooked;
                        const isSelected = selectedSlot === slot && isAvailable;

                        // ── BOOKED ────────────────────────────────────────────
                        if (isBooked) {
                          return (
                            <div
                              key={slot}
                              aria-label={isArabic ? `${slot} - محجوز` : `${slot} - Booked`}
                              title={isArabic ? 'تم حجز هذا الموعد مسبقاً' : 'This slot is already booked'}
                              className="py-2 px-1 text-center rounded-xl border border-[#E2EBF0] bg-slate-100 cursor-not-allowed select-none flex items-center justify-center min-h-[38px] relative overflow-hidden"
                            >
                              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(-45deg,currentColor 0,currentColor 1px,transparent 0,transparent 50%)', backgroundSize: '6px 6px' }} aria-hidden="true" />
                              <span className="text-[11px] font-mono font-medium line-through text-slate-400 leading-none relative z-10">{slot}</span>
                            </div>
                          );
                        }

                        // ── NOT AVAILABLE ─────────────────────────────────────
                        if (!isConfiguredAvailable) {
                          return (
                            <div
                              key={slot}
                              aria-label={isArabic ? `${slot} - غير متاح` : `${slot} - Not available`}
                              title={isArabic ? 'هذا الموعد غير متاح في جدول الطبيب' : 'Doctor is not available at this time'}
                              className="py-2 px-1 text-center rounded-xl border border-[#E2EBF0]/60 bg-slate-50 cursor-not-allowed select-none flex items-center justify-center min-h-[38px]"
                            >
                              <span className="text-[11px] font-mono font-medium text-slate-300 leading-none">{slot}</span>
                            </div>
                          );
                        }

                        // ── AVAILABLE / SELECTED ──────────────────────────────
                        return (
                          <button
                            key={slot}
                            type="button"
                            aria-label={isSelected ? (isArabic ? `${slot} - محدد` : `${slot} - Selected`) : (isArabic ? `${slot} - متاح` : `${slot} - Available`)}
                            aria-pressed={isSelected}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2 px-1 text-center rounded-xl border text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center min-h-[38px] relative focus:outline-none shadow-2xs active:scale-[0.97] ${
                              isSelected
                                ? 'bg-[#2DA7B5] text-white border-[#2DA7B5] font-bold scale-[1.02] shadow-xs'
                                : 'bg-white text-slate-800 border-[#E2EBF0] hover:border-[#2DA7B5]'
                            }`}
                          >
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none" className="absolute top-1 right-1 w-2.5 h-2.5 text-white" aria-hidden="true">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            <span className="leading-none">{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2 Actions */}
                  <div className="pt-4 border-t border-[#E2EBF0] flex items-center justify-between gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        window.scrollTo({ top: 160, behavior: 'smooth' });
                      }}
                      className="py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold border border-[#E2EBF0] bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                      <span>{isArabic ? 'رجوع' : 'Back'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isStep2Valid) {
                          showToast(isArabic ? 'يرجى اختيار وقت متاح للموعد للمتابعة' : 'Please select an available time slot', 'error');
                          return;
                        }
                        setCurrentStep(3);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      disabled={!isStep2Valid}
                      className={`py-3.5 px-7 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                        !isStep2Valid
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                          : 'bg-[#2DA7B5] hover:bg-[#23929F] text-white active:scale-[0.99]'
                      }`}
                    >
                      <span>{isArabic ? 'متابعة' : 'Continue'}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: PATIENT DETAILS & CONFIRMATION                                    */}
              {/* ========================================================================= */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Selected Booking Recap Summary */}
                  <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2EBF0] space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {isArabic ? 'ملخص الحجز المحدد' : 'Selected Appointment Summary'}
                      </span>
                      <span className="text-xs font-bold text-[#0E7490] bg-[#E8F6F8] px-2.5 py-0.5 rounded-full border border-[#CDEBF0]">
                        {t('booking.inPersonPayAtReception')}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2.5 border-t border-[#E2EBF0]">
                      <div className="flex items-center gap-3">
                        <img
                          src={doctor.photo}
                          alt={doctor.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E2EBF0] shrink-0 bg-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{doctor.name}</h4>
                          <p className="text-xs text-[#2DA7B5] font-semibold">{translateSpecialty(selectedSpecialty)}</p>
                          <p className="text-[11px] text-slate-500">{doctor.hospitalName || 'American Hospital Dubai'}</p>
                        </div>
                      </div>

                      <div className="sm:text-right rtl:sm:text-left bg-white px-3.5 py-2 rounded-xl border border-[#E2EBF0] shadow-2xs">
                        <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-slate-900">
                          <Calendar className="w-3.5 h-3.5 text-[#2DA7B5]" />
                          <span>{selectedDateObj.display}</span>
                          <span className="text-slate-300">•</span>
                          <Clock className="w-3.5 h-3.5 text-[#2DA7B5]" />
                          <span className="font-mono text-[#0E7490]">{selectedSlot}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStep(2);
                            window.scrollTo({ top: 160, behavior: 'smooth' });
                          }}
                          className="text-[11px] font-bold text-[#2DA7B5] hover:underline mt-0.5 cursor-pointer"
                        >
                          {isArabic ? 'تعديل التاريخ والوقت' : 'Change Date / Time'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Patient Info Fields */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#2DA7B5]" />
                        <span>{t('booking.patientInfoTitle')}</span>
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        * {t('common.required') || 'Required fields'}
                      </span>
                    </div>

                    {/* Full Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        {t('booking.fullName')} *
                      </label>
                      <div className="bg-[#F8FAFC] hover:bg-white focus-within:bg-white rounded-2xl border border-[#E2EBF0] focus-within:border-[#2DA7B5] focus-within:ring-2 focus-within:ring-[#2DA7B5]/20 px-4 py-3 flex items-center transition-all shadow-2xs">
                        <User className="w-4 h-4 text-slate-400 mr-2.5 rtl:mr-0 rtl:ml-2.5 shrink-0" />
                        <input
                          type="text"
                          required
                          placeholder={t('booking.fullNamePlaceholder')}
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full bg-transparent text-xs sm:text-sm text-slate-900 focus:outline-hidden font-medium placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        {t('booking.mobileNumber')} *
                      </label>
                      <div className="flex gap-2">
                        <div className="relative w-32 shrink-0">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full appearance-none bg-[#F8FAFC] border border-[#E2EBF0] rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#2DA7B5] cursor-pointer shadow-2xs"
                          >
                            <option value="+971">+971 (UAE)</option>
                            <option value="+965">+965 (KWT)</option>
                            <option value="+966">+966 (KSA)</option>
                            <option value="+974">+974 (QAT)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+1">+1 (US)</option>
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="flex-1 bg-[#F8FAFC] hover:bg-white focus-within:bg-white rounded-2xl border border-[#E2EBF0] focus-within:border-[#2DA7B5] focus-within:ring-2 focus-within:ring-[#2DA7B5]/20 px-4 py-3 flex items-center transition-all shadow-2xs">
                          <Phone className="w-4 h-4 text-slate-400 mr-2.5 rtl:mr-0 rtl:ml-2.5 shrink-0" />
                          <input
                            type="tel"
                            required
                            placeholder={t('booking.mobilePlaceholder')}
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 focus:outline-hidden font-medium placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        {t('booking.email')} <span className="text-slate-400 font-normal">({t('common.optional') || 'Optional'})</span>
                      </label>
                      <div className="bg-[#F8FAFC] hover:bg-white focus-within:bg-white rounded-2xl border border-[#E2EBF0] focus-within:border-[#2DA7B5] focus-within:ring-2 focus-within:ring-[#2DA7B5]/20 px-4 py-3 flex items-center transition-all shadow-2xs">
                        <Mail className="w-4 h-4 text-slate-400 mr-2.5 rtl:mr-0 rtl:ml-2.5 shrink-0" />
                        <input
                          type="email"
                          placeholder={t('booking.emailPlaceholder')}
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          className="w-full bg-transparent text-xs sm:text-sm text-slate-900 focus:outline-hidden font-medium placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Consultation Payment Notice */}
                  <div className="bg-[#E8F6F8] border border-[#CDEBF0] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#0E7490]">
                    <ShieldCheck className="w-5 h-5 text-[#2DA7B5] mt-0.5 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#0E7490] block">{t('booking.zeroUpfrontPayment')}</span>
                      <p className="leading-relaxed text-slate-600">
                        {t('booking.zeroUpfrontDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="termsCheckbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded-sm border-[#E2EBF0] text-[#2DA7B5] focus:ring-[#2DA7B5] cursor-pointer"
                    />
                    <label htmlFor="termsCheckbox" className="text-xs text-slate-500 cursor-pointer leading-snug">
                      {t('booking.termsText')}
                    </label>
                  </div>

                  {/* Guest notice */}
                  {!isAuthenticated && isFormValid && !isStaff && (
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                      <LogIn className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-amber-800 leading-snug">
                        {t('booking.signInRequiredNotice')}
                      </p>
                    </div>
                  )}

                  {/* Step 3 Actions */}
                  <div className="pt-4 border-t border-[#E2EBF0] flex items-center justify-between gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(2);
                        window.scrollTo({ top: 160, behavior: 'smooth' });
                      }}
                      className="py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold border border-[#E2EBF0] bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                      <span>{isArabic ? 'رجوع' : 'Back'}</span>
                    </button>

                    <div className="flex-1 sm:flex-initial">
                      {isStaff ? (
                        <div className="space-y-2">
                          <Link
                            to={staffDashboardPath}
                            className="py-3.5 px-6 bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>{staffDashboardName}</span>
                          </Link>
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={!isFormValid || isSubmitting}
                          className={`w-full sm:w-auto py-3.5 px-8 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 shadow-xs ${
                            !isFormValid
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-75 shadow-none'
                              : 'bg-[#2DA7B5] hover:bg-[#23929F] text-white active:scale-[0.99] cursor-pointer'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{t('booking.confirmingWithHospital')}</span>
                            </>
                          ) : !isAuthenticated && isFormValid ? (
                            <>
                              <LogIn className="w-4 h-4" />
                              <span>{t('booking.signInAndBook')}</span>
                            </>
                          ) : (
                            <>
                              <span>{t('booking.confirmAndBook')}</span>
                              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isFormValid && (
                    <p className="text-center text-[11px] text-slate-400">
                      {t('booking.fillRequiredNotice')}
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      </div>

      {/* Show Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-[#E2EBF0] shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">{t('booking.hospitalLocation')}</h3>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-16/9 bg-slate-100 rounded-2xl overflow-hidden border border-[#E2EBF0] flex items-center justify-center relative">
              <iframe
                title="American Hospital Map"
                src="https://maps.google.com/maps?q=American+Hospital+Dubai&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>

            <p className="text-xs text-slate-300">
              {t('booking.address')}: 19th St, Oud Metha, Dubai, UAE
            </p>

            <button
              type="button"
              onClick={() => setShowMapModal(false)}
              className="w-full py-2.5 palette-btn-primary text-xs rounded-xl cursor-pointer transition-all"
            >
              {t('booking.close')}
            </button>
          </div>
        </div>
      )}

      {/* Guest Login Modal — intercepts booking when user is not authenticated */}
      {showLoginModal && (
        <GuestLoginModal
          doctorName={doctor.name}
          onSuccess={handleLoginSuccess}
          onClose={() => { setShowLoginModal(false); setPendingBooking(false); }}
        />
      )}
    </div>
  );
};
