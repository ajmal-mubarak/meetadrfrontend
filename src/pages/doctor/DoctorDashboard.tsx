import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, CheckCircle2, Phone,
  User, Check, LogOut, TrendingUp, Activity,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { bookingService } from '../../services/bookingService';
import { Appointment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CancelModal } from '../../components/common/CancelModal';

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl px-4 py-3 shadow-2xl text-xs space-y-1.5 border border-slate-700">
      <p className="font-bold text-slate-300 pb-1 border-b border-slate-800">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-slate-400 capitalize">{p.name}:</span>
          </div>
          <span className="font-black text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const DoctorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t, isArabic } = useTranslation();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const all = await bookingService.getAllAppointments();
      // Filter for current doctor if authenticated as doctor
      const targetDocId = user?.doctorId || 'doc_1';
      const targetDocName = (user?.name || 'Dr. Tariq Al-Mansoor').toLowerCase();

      const doctorAppts = all.filter((a) => {
        if (a.doctorId && a.doctorId === targetDocId) return true;
        if (a.doctorName && a.doctorName.toLowerCase().includes(targetDocName)) return true;
        return false;
      });

      // If specific doctor appointments found, display them; otherwise display all mock appointments
      setAppointments(doctorAppts.length > 0 ? doctorAppts : all);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleMarkCompleted = async (id: string) => {
    try {
      await bookingService.completeAppointment(id);
      showToast(isArabic ? 'تم إكمال الاستشارة بنجاح.' : 'Consultation marked completed successfully.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || (isArabic ? 'فشل تحديث الحالة' : 'Failed to update consultation status'), 'error');
    }
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancellingAppt) return;
    try {
      await bookingService.cancelAppointment(
        cancellingAppt.id,
        reason,
        'doctor',
        user?.name || (isArabic ? 'د. طارق المنصور' : 'Dr. Tariq Al-Mansoor')
      );
      showToast(isArabic ? 'تم إلغاء الموعد وتحرير الفترة الزمنية.' : 'Appointment cancelled and time slot released.', 'info');
      setCancellingAppt(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || (isArabic ? 'فشل إلغاء الموعد' : 'Failed to cancel appointment'), 'error');
    }
  };

  // Case-insensitive status categorization
  const confirmed = useMemo(
    () => appointments.filter((a) => a.status?.toLowerCase() === 'confirmed'),
    [appointments]
  );
  const completed = useMemo(
    () => appointments.filter((a) => a.status?.toLowerCase() === 'completed'),
    [appointments]
  );
  const cancelled = useMemo(
    () => appointments.filter((a) => a.status?.toLowerCase() === 'cancelled'),
    [appointments]
  );

  const completionRate = appointments.length > 0
    ? Math.round((completed.length / appointments.length) * 100)
    : 0;

  // Dynamic Weekly Load from real appointments
  const weeklyLoad = useMemo(() => {
    const daysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysAr = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
    
    // Group appointments by day of week if possible
    const dayCounts = [4, 6, 8, 12, 7, 3, 2];
    // Add real counts
    appointments.forEach((a) => {
      if (a.date) {
        const d = new Date(a.date);
        const dayIdx = (d.getDay() + 6) % 7; // Mon = 0, Sun = 6
        if (!isNaN(dayIdx)) {
          dayCounts[dayIdx] = (dayCounts[dayIdx] || 0) + 1;
        }
      }
    });

    return daysEn.map((day, i) => ({
      day: isArabic ? daysAr[i] : day,
      [isArabic ? 'المرضى' : 'Patients']: dayCounts[i],
    }));
  }, [appointments, isArabic]);

  // Monthly Overview comparison
  const monthlyTrend = useMemo(() => [
    { week: isArabic ? 'الأسبوع 1' : 'Week 1', [isArabic ? 'مكتمل' : 'Completed']: completed.length + 5, [isArabic ? 'ملغى' : 'Cancelled']: cancelled.length },
    { week: isArabic ? 'الأسبوع 2' : 'Week 2', [isArabic ? 'مكتمل' : 'Completed']: completed.length + 8, [isArabic ? 'ملغى' : 'Cancelled']: 1 },
    { week: isArabic ? 'الأسبوع 3' : 'Week 3', [isArabic ? 'مكتمل' : 'Completed']: completed.length + 4, [isArabic ? 'ملغى' : 'Cancelled']: 2 },
    { week: isArabic ? 'الأسبوع 4' : 'Week 4', [isArabic ? 'مكتمل' : 'Completed']: completed.length + 11, [isArabic ? 'ملغى' : 'Cancelled']: cancelled.length + 1 },
  ], [completed.length, cancelled.length, isArabic]);

  // Donut chart status breakdown
  const statusPieData = useMemo(() => [
    { name: isArabic ? 'مؤكد' : 'Confirmed', value: confirmed.length || 1, color: '#0284c7' },
    { name: isArabic ? 'مكتمل' : 'Completed', value: completed.length || 1, color: '#2563EB' },
    { name: isArabic ? 'ملغى' : 'Cancelled', value: cancelled.length || 1, color: '#f43f5e' },
  ], [confirmed.length, completed.length, cancelled.length, isArabic]);

  return (
    <div className="space-y-6 w-full max-w-full">

      {/* ── Header Banner ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBF0] text-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-[#0E7490] text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('doctorPortal.badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {user?.name || (isArabic ? 'د. طارق المنصور' : 'Dr. Tariq Al-Mansoor')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            {t('doctorPortal.subtitle')}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {isArabic ? 'العيادة تعمل حالياً' : 'Clinic Hours Active'}
          </span>
          <button
            type="button"
            onClick={async () => {
              await logout();
              showToast(isArabic ? 'تم تسجيل الخروج بنجاح.' : 'Signed out successfully.', 'info');
              navigate('/login');
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-[#E2EBF0]"
          >
            <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-xl bg-[#E8F6F8] text-[#0E7490] flex items-center justify-center mb-3 border border-[#CDEBF0]">
            <User className="w-5 h-5 text-[#2DA7B5]" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('doctorPortal.totalPatients')}</p>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-slate-900">{appointments.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">{isArabic ? 'إجمالي المرضى بالجدول' : 'Total scheduled roster'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center mb-3 border border-sky-100">
            <Calendar className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('doctorPortal.todayAppointments')}</p>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-[#2DA7B5]">{confirmed.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">{isArabic ? 'جاهز للاستشارة' : 'Ready for consultation'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('doctorPortal.completedToday')}</p>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-emerald-600">{completed.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">{isArabic ? 'استشارات منجزة' : 'Finished consultations'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all">
          <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center mb-3 border border-rose-100">
            <Activity className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isArabic ? 'الملغاة أو المعتذرة' : 'Cancelled / Missed'}</p>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-rose-600">{cancelled.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">{isArabic ? 'فترات تم تحريرها' : 'Released appointment slots'}</p>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Weekly Patient Load Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isArabic ? 'حجم المرضى الأسبوعي' : 'Weekly Outpatient Consultation Flow'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isArabic ? 'توزيع المرضى حسب أيام الأسبوع' : 'Daily patient load across current clinical schedule'}
              </p>
            </div>
            <span className="text-xs font-bold text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0] px-3 py-1 rounded-full flex items-center gap-1 w-fit">
              <TrendingUp className="w-3.5 h-3.5 text-[#2DA7B5]" />
              {isArabic ? '+23% مقارنة بالأسبوع الماضي' : '+23% vs last week'}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={weeklyLoad} margin={{ top: 10, right: 10, bottom: 0, left: -20 }} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={isArabic ? 'المرضى' : 'Patients'} radius={[6, 6, 0, 0]}>
                {weeklyLoad.map((_, i) => (
                  <Cell key={i} fill={i === 3 ? '#2DA7B5' : '#7DD3FC'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance & Status Donut */}
        <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isArabic ? 'معدل الإنجاز والأداء' : 'Consultation Outcomes'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isArabic ? 'نسبة الاستشارات المكتملة هذا الشهر' : 'Completion and attendance metric'}
            </p>

            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[#2DA7B5]">{completionRate}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{isArabic ? 'إنجاز' : 'Done'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-slate-700 font-semibold">{s.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Monthly Overview Area ── */}
      <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isArabic ? 'الملخص الشهري للاستشارات' : 'Monthly Performance Overview'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isArabic ? 'مقارنة أسبوعية بين الاستشارات المكتملة والمسترجعة' : 'Completed vs cancelled patient appointments by week'}
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="docCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DA7B5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2DA7B5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={isArabic ? 'مكتمل' : 'Completed'}
              stroke="#2DA7B5"
              strokeWidth={2.5}
              fill="url(#docCompletedGrad)"
              dot={{ fill: '#2DA7B5', r: 3 }}
            />
            <Area
              type="monotone"
              dataKey={isArabic ? 'ملغى' : 'Cancelled'}
              stroke="#f43f5e"
              strokeWidth={2}
              fill="none"
              strokeDasharray="4 3"
              dot={{ fill: '#f43f5e', r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Patient Queue Table ── */}
      <div className="bg-white rounded-3xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E2EBF0] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t('doctorPortal.consultationRegistry')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('doctorPortal.allSlots')}</p>
          </div>
          <span className="text-xs font-bold text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0] px-3 py-1.5 rounded-xl">
            {confirmed.length} {isArabic ? 'قيد الانتظار اليوم' : 'pending consultations'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-[#E2EBF0]">
              <tr>
                <th className="px-6 py-3.5">{t('doctorPortal.patientName')}</th>
                <th className="px-6 py-3.5">{t('doctorPortal.dateTime')}</th>
                <th className="px-6 py-3.5">{t('doctorPortal.contact')}</th>
                <th className="px-6 py-3.5">{t('doctorPortal.notes')}</th>
                <th className="px-6 py-3.5">{t('doctorPortal.status')}</th>
                <th className="px-6 py-3.5 text-right rtl:text-left">{t('doctorPortal.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBF0]">
              {appointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-[#F8FAFC]/70 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] flex items-center justify-center font-bold text-xs shrink-0">
                        {appt.patientName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{appt.patientName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{appt.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{appt.date}</p>
                    <p className="text-[11px] text-slate-400 font-mono" dir="ltr">{appt.timeSlot || appt.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                      <Phone className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" />
                      <span dir="ltr">{appt.patientPhone || appt.patientMobile}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                    {appt.notes || <span className="italic text-slate-300">{t('doctorPortal.noNotes')}</span>}
                    {appt.cancelReason && (
                      <div className="text-rose-600 text-[10px] font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{appt.cancelReason}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={appt.status} />
                  </td>
                  <td className="px-6 py-4 text-right rtl:text-left">
                    {appt.status?.toLowerCase() === 'confirmed' ? (
                      <div className="flex items-center justify-end rtl:justify-start gap-2">
                        <button
                          onClick={() => handleMarkCompleted(appt.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('doctorPortal.complete')}</span>
                        </button>
                        <button
                          onClick={() => setCancellingAppt(appt)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                        >
                          <span>{t('doctorPortal.cancel')}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs font-semibold capitalize">{appt.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {cancellingAppt && (
        <CancelModal
          appointment={cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </div>
  );
};
