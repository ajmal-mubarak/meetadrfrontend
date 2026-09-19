import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Stethoscope,
  MapPin,
  ArrowRight,
  User,
  Plus,
  Building2,
  ExternalLink,
  CalendarCheck,
  Smartphone,
  Star,
  RefreshCw,
  FileText,
  X,
  TrendingUp,
  Activity,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { bookingService } from '../../services/bookingService';
import { Appointment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CancelModal } from '../../components/common/CancelModal';

// ─── Rate & Review Modal ────────────────────────────────────────────────────
interface ReviewModalProps {
  appointment: Appointment;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ appointment, onClose, onSubmit }) => {
  const { t, translateSpecialty, isArabic } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  const ratingLabels = isArabic
    ? ['', 'ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز']
    : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E2EBF0] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t('patientPortal.rateVisitModalTitle')}</h3>
              <p className="text-[11px] text-slate-500">{t('patientPortal.rateVisitModalSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Doctor info */}
        <div className="bg-[#F8FAFC] rounded-2xl p-3 flex items-center gap-3 border border-[#E2EBF0]">
          <img
            src={appointment.doctorPhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'}
            alt={appointment.doctorName}
            className="w-12 h-12 rounded-xl object-cover border border-[#E2EBF0] shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-sm font-bold text-slate-900">{appointment.doctorName}</p>
            <p className="text-xs text-[#0E7490] font-semibold">{translateSpecialty(appointment.specialty)}</p>
            <p className="text-[11px] text-slate-500">{appointment.facilityName || appointment.hospitalName}</p>
          </div>
        </div>

        {/* Star Rating */}
        <div className="text-center space-y-2">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('patientPortal.rateExperience')}</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110 cursor-pointer"
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    star <= (hovered || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p className="text-sm font-bold text-amber-500">
              {ratingLabels[hovered || rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t('patientPortal.shareDetails')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('patientPortal.sharePlaceholder')}
            rows={3}
            className="w-full text-xs border border-[#E2EBF0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#2DA7B5] focus:ring-1 focus:ring-[#2DA7B5] resize-none text-slate-700 placeholder:text-slate-400 transition-all bg-white"
          />
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#E2EBF0] text-xs font-bold text-slate-600 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            {t('patientPortal.skipForNow')}
          </button>
          <button
            type="button"
            disabled={rating === 0}
            onClick={() => onSubmit(rating, comment)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              rating === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-[#2DA7B5] hover:bg-[#23929F] text-white shadow-xs'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            {t('patientPortal.submitReview')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Timestamp & Countdown Helpers for Upcoming Appointments ─────────────────
export const getAppointmentTimestamp = (
  appt: Appointment | { date?: string; time?: string; timeSlot?: string }
): number => {
  if (!appt?.date) return 0;
  const timeStr = (appt.timeSlot || appt.time || '09:00 AM').trim();
  let hours = 9;
  let minutes = 0;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }
  const dateParts = appt.date.split('-');
  if (dateParts.length === 3) {
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    return new Date(year, month, day, hours, minutes, 0).getTime();
  }
  const d = new Date(`${appt.date} ${timeStr}`);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export const formatCountdown = (
  appt: Appointment,
  now: number,
  isArabic: boolean
): string => {
  const target = getAppointmentTimestamp(appt);
  if (!target) return '';
  const diff = target - now;

  if (diff <= 0) {
    if (diff > -2 * 60 * 60 * 1000) {
      return isArabic ? 'جارٍ الآن' : 'In progress';
    }
    return isArabic ? 'انتهى' : 'Passed';
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (isArabic) {
    if (days > 0) {
      return `متبقي ${days}ي ${hours}س ${minutes}د ${seconds}ث`;
    }
    if (hours > 0) {
      return `متبقي ${hours}س ${minutes}د ${seconds}ث`;
    }
    return `متبقي ${minutes}د ${seconds}ث`;
  }

  if (days > 0) {
    return `in ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  if (hours > 0) {
    return `in ${hours}h ${minutes}m ${seconds}s`;
  }
  return `in ${minutes}m ${seconds}s`;
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const PatientDashboard: React.FC = () => {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t, translateSpecialty, translateLocation, isRTL, isArabic } = useTranslation();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'confirmed' | 'my_bookings' | 'cancelled'>('confirmed');
  const [now, setNow] = useState<number>(Date.now());
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [reviewingAppt, setReviewingAppt] = useState<Appointment | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // OTP modal state (PDF Page 9)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '52 412 2794');
  const [countryCode, setCountryCode] = useState('+971');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await bookingService.getAllAppointments();
      setAppointments(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user]);

  // Live real-time ticker for appointment countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCancelConfirm = async (reason: string) => {
    if (!cancellingAppt) return;
    try {
      await bookingService.cancelAppointment(cancellingAppt.id, reason, 'patient', user?.name || 'Sarah Jenkins');
      showToast(isArabic ? 'تم إلغاء الموعد بنجاح.' : 'Appointment successfully cancelled.', 'info');
      setCancellingAppt(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || (isArabic ? 'فشل إلغاء الموعد' : 'Failed to cancel appointment'), 'error');
    }
  };

  const handleReviewSubmit = (rating: number, comment: string) => {
    if (!reviewingAppt) return;
    setReviewedIds((prev) => new Set([...prev, reviewingAppt.id]));
    setReviewingAppt(null);
    showToast(
      isArabic
        ? `شكراً لك! تم إرسال تقييم ${rating}★ للدكتور ${reviewingAppt.doctorName}.`
        : `Thank you! ${rating}★ review submitted for ${reviewingAppt.doctorName}.`,
      'success'
    );
  };

  const handleRebook = (appt: Appointment) => {
    navigate(`/book/doctor/${appt.doctorId}`);
  };

  // OTP handlers
  const handleSendOtp = () => {
    if (!mobileNumber.trim()) {
      showToast(isArabic ? 'يرجى إدخال رقم هاتفك المتحرك' : 'Please enter your mobile number', 'error');
      return;
    }
    setOtpSent(true);
    showToast(
      isArabic
        ? `تم إرسال رمز التحقق عبر الرسائل النصية إلى ${countryCode} ${mobileNumber}. (الرمز التجريبي: 1234)`
        : `Verification code sent via SMS to ${countryCode} ${mobileNumber}. (Demo OTP: 1234)`,
      'info'
    );
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim() !== '1234') {
      showToast(isArabic ? 'رمز غير صالح. يرجى إدخال الرمز التجريبي: 1234' : 'Invalid OTP. Please enter demo OTP: 1234', 'error');
      return;
    }
    await login('patient@meetadr.demo', 'Patient@123');
    showToast(isArabic ? 'تم التحقق بنجاح!' : 'Verified with mobile OTP successfully!', 'success');
    setShowOtpModal(false);
    setOtpSent(false);
    setOtpCode('');
  };

  // Tab filtering & sorting in strict chronological order
  // Confirmed / upcoming appointments sorted earliest first (in order)
  const confirmed = useMemo(
    () =>
      appointments
        .filter((a) => a.status?.toLowerCase() === 'confirmed')
        .sort((a, b) => getAppointmentTimestamp(a) - getAppointmentTimestamp(b)),
    [appointments]
  );
  const cancelled = useMemo(
    () =>
      appointments
        .filter((a) => a.status?.toLowerCase() === 'cancelled')
        .sort((a, b) => getAppointmentTimestamp(b) - getAppointmentTimestamp(a)),
    [appointments]
  );
  const completed = useMemo(
    () =>
      appointments
        .filter((a) => a.status?.toLowerCase() === 'completed')
        .sort((a, b) => getAppointmentTimestamp(b) - getAppointmentTimestamp(a)),
    [appointments]
  );
  // All bookings with confirmed upcoming placed first in order
  const myBookings = useMemo(
    () =>
      [...appointments].sort((a, b) => {
        const aIsConfirmed = a.status?.toLowerCase() === 'confirmed';
        const bIsConfirmed = b.status?.toLowerCase() === 'confirmed';
        if (aIsConfirmed && bIsConfirmed) {
          return getAppointmentTimestamp(a) - getAppointmentTimestamp(b);
        }
        if (aIsConfirmed) return -1;
        if (bIsConfirmed) return 1;
        return getAppointmentTimestamp(b) - getAppointmentTimestamp(a);
      }),
    [appointments]
  );

  const displayedAppointments =
    activeTab === 'my_bookings' ? myBookings : activeTab === 'confirmed' ? confirmed : cancelled;

  // The very next upcoming visit (earliest future or current visit)
  const nextAppt = useMemo(() => {
    if (confirmed.length === 0) return null;
    const future = confirmed.find((a) => getAppointmentTimestamp(a) >= now - 2 * 3600 * 1000);
    return future || confirmed[0];
  }, [confirmed, now]);



  const nearbyHospitals = [
    { id: 'ahd_dubai', name: isArabic ? 'المستشفى الأمريكي دبي' : 'American Hospital Dubai', location: isArabic ? 'شارع 19، عود ميثاء، دبي' : '19th St, Oud Metha, Dubai', distance: isArabic ? '2.1 كم' : '2.1 km', specialties: isArabic ? ['أمراض القلب', 'طب الأعصاب', 'جراحة العظام'] : ['Cardiology', 'Neurology', 'Orthopedics'] },
    { id: 'medcare_al_safa', name: isArabic ? 'مستشفى ميدكير الصفا' : 'Medcare Hospital Al Safa', location: isArabic ? 'بالقرب من حديقة الصفا، شارع الشيخ زايد' : 'Near Safa Park, Sheikh Zayed Road', distance: isArabic ? '4.2 كم' : '4.2 km', specialties: isArabic ? ['الجلدية', 'طب الأطفال', 'طب عام'] : ['Dermatology', 'Pediatrics', 'General Practice'] },
    { id: 'csh_dubai', name: isArabic ? 'المستشفى الكندي التخصصي' : 'Canadian Specialist Hospital', location: isArabic ? 'شارع أبو هيل، ديرة، دبي' : 'Abu Hail Road, Deira, Dubai', distance: isArabic ? '6.5 كم' : '6.5 km', specialties: isArabic ? ['أمراض القلب', 'الأمراض الباطنية', 'الجراحة العامة'] : ['Cardiology', 'Internal Medicine', 'Surgery'] },
    { id: 'aster_mankhool', name: isArabic ? 'مستشفى أستر المنخول' : 'Aster Hospital Mankhool', location: isArabic ? 'شارع الكويت، المنخول، بر دبي' : 'Kuwait Street, Al Mankhool, Bur Dubai', distance: isArabic ? '5.1 كم' : '5.1 km', specialties: isArabic ? ['طب عام', 'جراحة العظام', 'أنف وأذن وحنجرة'] : ['General Practice', 'Orthopedics', 'ENT'] },
  ];

  return (
    <div className="space-y-6">

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E8F6F8] text-[#0E7490] flex items-center justify-center shrink-0 border border-[#CDEBF0]">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('patientPortal.activeBookings')}</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{confirmed.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 border border-sky-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('patientPortal.digitalRx')}</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{isArabic ? '1 جاهزة' : '1 Ready'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isArabic ? 'التأمين' : 'Insurance'}</p>
            <p className="text-xs sm:text-sm font-black text-emerald-700 truncate mt-0.5">{isArabic ? 'ضمان نشط' : 'Daman Active'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('patientPortal.dependentsCount')}</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{isArabic ? '2 تابعين' : '2 Dependents'}</p>
          </div>
        </div>
      </div>



      {/* ── NEXT UPCOMING APPOINTMENT (In order with side countdown) ── */}
      {nextAppt && (
        <div className="bg-white rounded-3xl border border-[#2DA7B5]/40 p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                {isArabic ? 'الموعد القادم المحدد' : 'Next Scheduled Visit'}
              </h3>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Small side countdown with low opacity */}
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-500 opacity-60 flex items-center gap-1 bg-[#F8FAFC] border border-[#E2EBF0] px-2.5 py-1 rounded-lg">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{formatCountdown(nextAppt, now, isArabic)}</span>
              </span>
              <Link
                to="/patient/bookings"
                className="text-xs font-bold text-[#2DA7B5] hover:text-[#23929F] flex items-center gap-1"
              >
                <span>{t('patientBookings.pageTitle')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <img
                src={nextAppt.doctorPhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'}
                alt={nextAppt.doctorName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#E2EBF0] shrink-0 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E8F6F8] text-[#0E7490] text-[11px] font-bold border border-[#CDEBF0]">
                  {translateSpecialty(nextAppt.specialty)}
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900">{nextAppt.doctorName}</h4>
                <p className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{nextAppt.facilityName || nextAppt.hospitalName || 'American Hospital Dubai'}</span>
                </p>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-2 pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {nextAppt.date}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {nextAppt.timeSlot}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 opacity-60 flex items-center gap-1">
                    <span>•</span>
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatCountdown(nextAppt, now, isArabic)}</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
              <a
                href="https://maps.google.com/maps?q=American+Hospital+Dubai"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl border border-[#E2EBF0] text-xs font-bold text-slate-700 hover:bg-[#F8FAFC] flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{t('patientPortal.directions')}</span>
              </a>
              <button
                type="button"
                onClick={() => handleRebook(nextAppt)}
                className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {t('patientPortal.reschedule')}
              </button>
              <button
                type="button"
                onClick={() => setCancellingAppt(nextAppt)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                {t('patientPortal.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPOINTMENTS PREVIEW & RECENT BOOKINGS ── */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2EBF0] pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { key: 'confirmed', label: isArabic ? 'المواعيد القادمة' : 'Upcoming Visits', count: confirmed.length },
              { key: 'my_bookings', label: t('patientPortal.allAppointments'), count: myBookings.length },
              { key: 'cancelled', label: t('patientPortal.cancelledVisits'), count: cancelled.length },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-[#2DA7B5] text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-[#F8FAFC] border border-[#E2EBF0]'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <Link
            to="/patient/bookings"
            className="text-xs font-bold text-[#2DA7B5] hover:text-[#23929F] flex items-center gap-1"
          >
            <span>{isArabic ? 'السجل الكامل' : 'Full History'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>

        {displayedAppointments.length === 0 ? (
          <div className="text-center py-14 space-y-3 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E2EBF0]">
            <CalendarCheck className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
            <p className="text-xs font-bold text-slate-700">{t('patientPortal.noBookings')}</p>
            <Link to="/doctors" className="inline-block px-4 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs font-bold rounded-xl transition-colors">
              {t('patientPortal.findDoctorBtn')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedAppointments.map((appt) => {
              const isReviewed = reviewedIds.has(appt.id);
              const isConfirmed = appt.status?.toLowerCase() === 'confirmed';
              const isCancelled = appt.status?.toLowerCase() === 'cancelled';
              const isCompleted = appt.status?.toLowerCase() === 'completed';

              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-2xl border border-[#E2EBF0] p-4 space-y-3 hover:border-[#2DA7B5] transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={appt.doctorPhoto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'}
                          alt={appt.doctorName}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E2EBF0] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{appt.doctorName}</h4>
                          <p className="text-xs font-semibold text-[#0E7490]">{translateSpecialty(appt.specialty)}</p>
                          <p className="text-[11px] text-slate-500 truncate">{appt.facilityName || appt.hospitalName || 'American Hospital Dubai'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={appt.status} />
                        {isConfirmed && (
                          <span className="text-[10px] font-mono text-slate-400 opacity-70 flex items-center gap-1">
                            {formatCountdown(appt, now, isArabic)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 bg-[#F8FAFC] rounded-xl p-2.5 space-y-1.5 text-xs text-slate-600 border border-[#E2EBF0]/60">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{appt.date}</span>
                        <span className="text-slate-300">•</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-800">{appt.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{appt.facilityName || appt.hospitalName || 'American Hospital Dubai'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-slate-400">ID: {appt.id.slice(-6)}</span>

                    <div className="flex items-center gap-2">
                      {/* Rebook — on cancelled */}
                      {isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleRebook(appt)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer bg-[#F8FAFC] text-slate-800 hover:bg-slate-100 border border-[#E2EBF0]"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {t('patientPortal.rebook')}
                        </button>
                      )}

                      {/* Reschedule — on confirmed */}
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => handleRebook(appt)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-slate-500 hover:text-slate-700 hover:bg-[#F8FAFC]"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {t('patientPortal.reschedule')}
                        </button>
                      )}

                      {/* Prescription download — ONLY for completed visits */}
                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => showToast(isArabic ? 'الوصفة الطبية جاهزة للاستلام من صيدلية المركز الطبي.' : 'Prescription is ready for pickup at clinic pharmacy.', 'info')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E2EBF0] bg-[#F8FAFC] text-slate-800 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-slate-600" />
                          {t('patientPortal.prescription')}
                        </button>
                      )}

                      {/* Rate & Review — ONLY for completed visits */}
                      {isCompleted && !isReviewed && (
                        <button
                          type="button"
                          onClick={() => setReviewingAppt(appt)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold transition-colors cursor-pointer"
                        >
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {t('patientPortal.rateVisit')}
                        </button>
                      )}

                      {/* Reviewed badge */}
                      {isCompleted && isReviewed && (
                        <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F8FAFC] text-slate-800 border border-[#E2EBF0] font-bold text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          {t('patientPortal.reviewed')}
                        </span>
                      )}

                      {/* Cancel — on confirmed */}
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => setCancellingAppt(appt)}
                          className="text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors cursor-pointer px-2 py-1"
                        >
                          {t('patientPortal.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── NEARBY HOSPITALS ── */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-xs font-bold text-[#0E7490] mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>{isArabic ? 'شبكة المنشآت القريبة' : 'Nearby Network'}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{t('patientPortal.nearbyHospitals')}</h2>
          <p className="text-xs text-slate-500">{isArabic ? 'مستشفيات ومراكز طبية تخصصية معتمدة عبر دبي وكافة الإمارات' : 'Directly connected accredited facilities across Dubai and the UAE'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyHospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="p-4 rounded-2xl border border-[#E2EBF0] bg-[#F8FAFC] hover:bg-white hover:border-[#2DA7B5] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 pr-2 rtl:pr-0 rtl:pl-2">{hosp.name}</h3>
                  <span className="text-[10px] font-bold text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0] px-2 py-0.5 rounded-full shrink-0">{hosp.distance}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#2DA7B5] shrink-0" />
                  {hosp.location}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {hosp.specialties.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-md bg-white border border-[#E2EBF0] text-[10px] font-semibold text-slate-700">{s}</span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2EBF0] flex items-center justify-between text-xs">
                <a
                  href={`https://maps.google.com/maps?q=${encodeURIComponent(hosp.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#0E7490] hover:underline flex items-center gap-1"
                >
                  {t('patientPortal.directions')} <ExternalLink className="w-3 h-3" />
                </a>
                <Link
                  to="/doctors"
                  className="px-3 py-1.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                >
                  {t('common.bookNow')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODALS ── */}
      {cancellingAppt && (
        <CancelModal
          appointment={cancellingAppt}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancellingAppt(null)}
        />
      )}

      {reviewingAppt && (
        <ReviewModal
          appointment={reviewingAppt}
          onClose={() => setReviewingAppt(null)}
          onSubmit={handleReviewSubmit}
        />
      )}

      {/* OTP Login Modal (PDF Page 9) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-[#E2EBF0] shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#E8F6F8] text-[#0E7490] flex items-center justify-center border border-[#CDEBF0]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{t('patientPortal.smsOtpNotice')}</h3>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {t('patientPortal.smsOtpDesc')}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">{t('patientPortal.enterMobile')}</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-24 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl px-2 py-2.5 text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="+971">+971 UAE</option>
                    <option value="+965">+965 KWT</option>
                    <option value="+966">+966 KSA</option>
                  </select>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="52 412 2794"
                    className="flex-1 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none font-medium"
                  />
                </div>
              </div>

              {otpSent ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">{t('patientPortal.enterOtpCode')}</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="1234"
                      className="w-full bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-[#2DA7B5]"
                    />
                    <span className="text-[11px] text-slate-500 font-bold block mt-1 text-center">Demo code: 1234</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="w-full py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    {t('patientPortal.confirmOtp')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {t('patientPortal.sendOtp')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
