import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  RefreshCw,
  Building2,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  Sparkles,
  CalendarDays,
  Check,
  Star,
  ShieldCheck,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { realDoctorPortalService } from '../../services/realDoctorPortalService';
import { Appointment } from '../../types';

export const DoctorBookings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { language, isArabic } = useTranslation();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming' | 'past' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  
  // Action state
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await realDoctorPortalService.getMyAppointments();
      setAppointments(data);
    } catch (err: any) {
      showToast(err.message || (isArabic ? 'فشل تحميل حجوزات الطبيب' : 'Failed to load doctor bookings'), 'error');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Today & Tomorrow ISO strings
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (appt.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Date Filter
      if (dateFilter === 'today') {
        if (appt.date !== todayIso) return false;
      } else if (dateFilter === 'tomorrow') {
        if (appt.date !== tomorrowIso) return false;
      } else if (dateFilter === 'upcoming') {
        if (appt.date < todayIso) return false;
      } else if (dateFilter === 'past') {
        if (appt.date >= todayIso) return false;
      } else if (dateFilter === 'custom' && customDate) {
        if (appt.date !== customDate) return false;
      }

      // 3. Search Query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const patientName = (appt.patientName || '').toLowerCase();
        const patientPhone = (appt.patientPhone || appt.patientMobile || '').toLowerCase();
        const patientEmail = (appt.patientEmail || '').toLowerCase();
        const apptId = (appt.id || '').toLowerCase();
        const specialty = (appt.specialty || '').toLowerCase();

        const matches =
          patientName.includes(query) ||
          patientPhone.includes(query) ||
          patientEmail.includes(query) ||
          apptId.includes(query) ||
          specialty.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [appointments, statusFilter, dateFilter, customDate, search, todayIso, tomorrowIso]);

  // Status Counts
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      today: appointments.filter((a) => a.date === todayIso).length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      pending: appointments.filter((a) => a.status === 'pending').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
    };
  }, [appointments, todayIso]);

  // Handlers
  const handleConfirm = async (appt: Appointment) => {
    setActionLoadingId(appt.id);
    try {
      await realDoctorPortalService.confirmAppointment(appt.id);
      showToast(isArabic ? 'تم تأكيد موعد المريض بنجاح.' : 'Appointment confirmed successfully.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || (isArabic ? 'فشل تأكيد الموعد' : 'Failed to confirm appointment'), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (appt: Appointment) => {
    setActionLoadingId(appt.id);
    try {
      await realDoctorPortalService.completeAppointment(appt.id);
      showToast(isArabic ? 'تم تسجيل اكتمال الاستشارة الطبية بنجاح.' : 'Consultation marked completed successfully.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || (isArabic ? 'فشل إكمال الموعد' : 'Failed to complete appointment'), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAppt) return;
    const reason = cancelReason.trim() || (isArabic ? 'إلغاء من قبل الطبيب المعالج' : 'Cancelled by attending physician');
    setActionLoadingId(cancellingAppt.id);
    try {
      await realDoctorPortalService.cancelAppointment(cancellingAppt.id, reason);
      showToast(isArabic ? 'تم إلغاء الموعد وإخطار المريض.' : 'Appointment cancelled and patient notified.', 'info');
      setCancellingAppt(null);
      setCancelReason('');
      loadData();
    } catch (err: any) {
      showToast(err.message || (isArabic ? 'فشل إلغاء الموعد' : 'Failed to cancel appointment'), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header & Stats Banner ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#E8F6F8] text-[#2DA7B5]">
                <CalendarDays className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isArabic ? 'حجوزات المواعيد والاستشارات' : 'Appointments & Bookings'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isArabic
                ? 'إدارة حجوزات واستشارات المرضى المجدولة في عيادتك، وتأكيد المواعيد المعلقة، وتسجيل إتمام الزيارات الطبية.'
                : 'Manage patient consultations, confirm pending requests, filter schedules, and record visit completions in real-time.'}
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="self-start md:self-center py-2.5 px-4 rounded-xl border border-[#E2EBF0] hover:bg-[#F8FAFC] text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#2DA7B5] ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isArabic ? 'تحديث السجلات' : 'Refresh Bookings'}</span>
          </button>
        </div>

        {/* Quick KPI Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-[#E2EBF0]">
          <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2EBF0]">
            <span className="text-[11px] font-bold text-slate-500 uppercase">{isArabic ? 'الإجمالي' : 'Total'}</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{counts.all}</p>
          </div>
          <div className="bg-[#E8F6F8] p-3.5 rounded-2xl border border-[#CDEBF0]">
            <span className="text-[11px] font-bold text-[#0E7490] uppercase">{isArabic ? 'مواعيد اليوم' : 'Today'}</span>
            <p className="text-xl font-black text-[#0E7490] mt-0.5">{counts.today}</p>
          </div>
          <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">{isArabic ? 'مؤكد' : 'Confirmed'}</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{counts.confirmed}</p>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase">{isArabic ? 'معلق' : 'Pending'}</span>
            <p className="text-xl font-black text-amber-700 mt-0.5">{counts.pending}</p>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800 uppercase">{isArabic ? 'مكتمل' : 'Completed'}</span>
            <p className="text-xl font-black text-blue-700 mt-0.5">{counts.completed}</p>
          </div>
          <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200">
            <span className="text-[11px] font-bold text-rose-800 uppercase">{isArabic ? 'ملغي' : 'Cancelled'}</span>
            <p className="text-xl font-black text-rose-700 mt-0.5">{counts.cancelled}</p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Control Bar ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E2EBF0] p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isArabic ? 'بحث بالاسم، رقم الهاتف، المعرف، التخصص...' : 'Search by patient name, phone, booking ID, specialty...'}
              className="w-full bg-[#F8FAFC] hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-900 border border-[#E2EBF0] focus:border-[#2DA7B5] focus:ring-2 focus:ring-[#2DA7B5]/20 rounded-2xl pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 transition-all outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Presets Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="appearance-none bg-[#F8FAFC] border border-[#E2EBF0] rounded-2xl px-4 py-2.5 pr-8 rtl:pr-4 rtl:pl-8 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2DA7B5] cursor-pointer shadow-2xs"
              >
                <option value="all">{isArabic ? 'جميع التواريخ' : 'All Dates'}</option>
                <option value="today">{isArabic ? 'اليوم فقط' : 'Today Only'}</option>
                <option value="tomorrow">{isArabic ? 'غداً' : 'Tomorrow'}</option>
                <option value="upcoming">{isArabic ? 'القادمة' : 'Upcoming'}</option>
                <option value="past">{isArabic ? 'السابقة' : 'Past'}</option>
                <option value="custom">{isArabic ? 'تاريخ محدد...' : 'Custom Date...'}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 rtl:right-auto rtl:left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2EBF0] rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2DA7B5] cursor-pointer shadow-2xs"
              />
            )}
          </div>
        </div>

        {/* Status Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-[#E2EBF0] pt-3 scrollbar-none">
          {[
            { id: 'all', label: isArabic ? 'الكل' : 'All', count: counts.all },
            { id: 'confirmed', label: isArabic ? 'مؤكدة' : 'Confirmed', count: counts.confirmed },
            { id: 'completed', label: isArabic ? 'مكتملة' : 'Completed', count: counts.completed },
            { id: 'cancelled', label: isArabic ? 'ملغاة' : 'Cancelled', count: counts.cancelled },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#2DA7B5] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-[#E2EBF0]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bookings Grid / Table ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[#E2EBF0] p-12 text-center shadow-xs">
          <div className="w-10 h-10 border-3 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600">
            {isArabic ? 'جارٍ تحميل جدول المواعيد...' : 'Loading doctor appointments...'}
          </p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2EBF0] p-12 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarDays className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {isArabic ? 'لم يتم العثور على أي مواعيد مطابقة' : 'No appointments match your filters'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search || statusFilter !== 'all' || dateFilter !== 'all'
              ? (isArabic ? 'جرّب تعديل معايير البحث أو تصفية الحالة.' : 'Try changing your search keywords or resetting status and date filters.')
              : (isArabic ? 'لا توجد مواعيد مسجلة في جدولك حالياً.' : 'You have no scheduled patient consultations currently.')}
          </p>
          {(search || statusFilter !== 'all' || dateFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setDateFilter('all');
                setCustomDate('');
              }}
              className="mt-2 py-2 px-4 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs font-bold text-[#0E7490] hover:bg-[#E8F6F8] transition-all cursor-pointer"
            >
              {isArabic ? 'إعادة ضبط عوامل التصفية' : 'Reset All Filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appt) => {
            const isConfirmed = appt.status.toLowerCase() === 'confirmed';
            const isPending = appt.status.toLowerCase() === 'pending';
            const isCompleted = appt.status.toLowerCase() === 'completed';
            const isCancelled = appt.status.toLowerCase() === 'cancelled';
            const isToday = appt.date === todayIso;
            const isActionLoading = actionLoadingId === appt.id;

            return (
              <div
                key={appt.id}
                className={`bg-white rounded-3xl border p-5 sm:p-6 transition-all shadow-xs hover:shadow-sm ${
                  isToday ? 'border-[#2DA7B5]/40 ring-1 ring-[#2DA7B5]/20' : 'border-[#E2EBF0] hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left: Date ticket stub + Patient Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 flex-1">
                    {/* Date / Time Card */}
                    <div className="flex sm:flex-col items-center justify-between sm:justify-center p-3.5 sm:w-28 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] shrink-0 text-center shadow-2xs">
                      <div className="flex items-center sm:flex-col gap-1 sm:gap-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(appt.date).toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          {new Date(appt.date).toLocaleDateString(language === 'ar' ? 'ar-AE' : 'en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] font-bold text-[#0E7490] bg-white px-2 py-0.5 rounded-md border border-[#E2EBF0]">
                        {appt.timeSlot || appt.time}
                      </div>
                    </div>

                    {/* Patient Information */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                          #{appt.id.slice(-6).toUpperCase()}
                        </span>

                        {isToday && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-[#E8F6F8] text-[#0E7490] px-2 py-0.5 rounded-md border border-[#CDEBF0] animate-pulse">
                            {isArabic ? 'اليوم' : 'Today'}
                          </span>
                        )}

                        {/* Status Tag */}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{isArabic ? 'مؤكد' : 'Confirmed'}</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>{isArabic ? 'في انتظار التأكيد' : 'Pending Confirmation'}</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            <span>{isArabic ? 'مكتمل' : 'Completed'}</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>{isArabic ? 'ملغي' : 'Cancelled'}</span>
                          </span>
                        )}

                        {appt.isDependent && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                            {isArabic ? 'موعد تابع' : 'Dependent'}
                          </span>
                        )}
                      </div>

                      {/* Patient Name */}
                      <h3 className="text-base font-bold text-slate-900 truncate">
                        {appt.patientName || (isArabic ? 'مريض غير مسجل' : 'Patient')}
                      </h3>

                      {/* Contact & Specialty */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {(appt.patientPhone || appt.patientMobile) && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono">{appt.patientPhone || appt.patientMobile}</span>
                          </span>
                        )}
                        {appt.patientEmail && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{appt.patientEmail}</span>
                          </span>
                        )}
                        {appt.specialty && (
                          <span className="flex items-center gap-1 text-[#2DA7B5] font-semibold">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>{appt.specialty}</span>
                          </span>
                        )}
                      </div>

                      {/* Notes / Reason if cancelled */}
                      {isCancelled && appt.cancelReason && (
                        <p className="text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-xl border border-rose-200 mt-1">
                          <strong>{isArabic ? 'سبب الإلغاء:' : 'Cancellation Reason:'}</strong> {appt.cancelReason}
                        </p>
                      )}

                      {appt.notes && !isCancelled && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 mt-1">
                          <strong>{isArabic ? 'ملاحظات المريض:' : 'Patient Notes:'}</strong> {appt.notes}
                        </p>
                      )}

                      {/* Review stars if completed and reviewed */}
                      {isCompleted && appt.isReviewed && (
                        <div className="flex items-center gap-1.5 pt-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isArabic ? 'تم تقييم الزيارة من قبل المريض' : 'Reviewed by patient'}</span>
                          {appt.review?.rating ? (
                            <span className="inline-flex items-center gap-0.5 text-amber-500 ml-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{appt.review.rating}</span>
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions Column */}
                  <div className="flex items-center gap-2 self-end lg:self-center flex-wrap shrink-0">
                    {/* If Confirmed: Complete Visit Button */}
                    {isConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleComplete(appt)}
                        disabled={isActionLoading}
                        className="py-2.5 px-4 rounded-xl bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isActionLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isArabic ? 'تسجيل إتمام الزيارة' : 'Complete Visit'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Cancel Reason Modal ──────────────────────────────────────────────── */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#E2EBF0] space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isArabic ? 'إلغاء الموعد الطبي' : 'Cancel Consultation'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    #{cancellingAppt.id.slice(-6).toUpperCase()} • {cancellingAppt.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancellingAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? 'سيتم إلغاء الموعد وتحرير الفترة الزمنية في جدولك، وإرسال إشعار فوري للمريض برقم الحجز وسبب الإلغاء.'
                : 'This will cancel the booking, release the reserved slot in your calendar, and immediately notify the patient.'}
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isArabic ? 'سبب الإلغاء للمريض' : 'Reason for Cancellation'} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={isArabic ? 'مثال: ظرف طارئ، تغيير في جدول المناوبات الطبية...' : 'e.g. Emergency surgery schedule conflict, physician unavailable...'}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#E2EBF0] focus:border-rose-400 focus:bg-white rounded-2xl text-xs text-slate-900 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2EBF0]">
                <button
                  type="button"
                  onClick={() => setCancellingAppt(null)}
                  className="py-2.5 px-4 rounded-xl border border-[#E2EBF0] hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                >
                  {isArabic ? 'تراجع' : 'Keep Booking'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === cancellingAppt.id}
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {actionLoadingId === cancellingAppt.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  <span>{isArabic ? 'تأكيد الإلغاء' : 'Confirm Cancel'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
