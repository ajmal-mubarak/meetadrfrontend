import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Stethoscope, Building2, Calendar,
  ArrowRight, TrendingUp, FileBarChart,
  ShieldCheck, LogOut, Clock,
  AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { reportService } from '../../services/reportService';
import { bookingService } from '../../services/bookingService';
import { providerService } from '../../services/providerService';
import { Appointment, ProviderRequest } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

// ── Fallback Trend & Specialty Data ──────────────────────────────────────────
const BASE_TREND = [
  { monthEn: 'Apr', monthAr: 'أبريل', bookings: 142, volume: 184 },
  { monthEn: 'May', monthAr: 'مايو', bookings: 189, volume: 243 },
  { monthEn: 'Jun', monthAr: 'يونيو', bookings: 167, volume: 217 },
  { monthEn: 'Jul', monthAr: 'يوليو', bookings: 234, volume: 302 },
  { monthEn: 'Aug', monthAr: 'أغسطس', bookings: 298, volume: 386 },
  { monthEn: 'Sep', monthAr: 'سبتمبر', bookings: 312, volume: 401 },
  { monthEn: 'Oct', monthAr: 'أكتوبر', bookings: 345, volume: 440 },
];

const SPECIALTY_COLORS: Record<string, string> = {
  Cardiology: '#2563EB',
  Dermatology: '#6366f1',
  Orthopedics: '#f59e0b',
  Pediatrics: '#10b981',
  Neurology: '#ef4444',
  'Internal Medicine': '#8b5cf6',
  Others: '#64748b',
};

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white text-slate-900 rounded-xl px-4 py-3 shadow-xl text-xs space-y-1.5 border border-[#E2EBF0]">
      <p className="font-bold text-slate-700 pb-1 border-b border-[#E2EBF0]">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-slate-500 capitalize">{p.name}:</span>
          </div>
          <span className="font-black text-slate-900">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// ── KPI Card Component ───────────────────────────────────────────────────────
const KpiCard = ({
  label, value, sub, icon: Icon, color, bg, trend,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ComponentType<{ className?: string }>; color: string; bg: string; trend?: string;
}) => (
  <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs hover:border-[#2DA7B5] transition-all">
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {trend && (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
          <TrendingUp className="w-3.5 h-3.5" />{trend}
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl sm:text-3xl font-black mt-1 ${color}`}>{value}</p>
      <p className="text-[11px] text-slate-500 mt-1 font-medium">{sub}</p>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t, isArabic, translateSpecialty } = useTranslation();

  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<Appointment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ProviderRequest[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [kpis, appts, requests, reports] = await Promise.all([
          reportService.getSystemOverview(),
          bookingService.getAllAppointments(),
          providerService.getAllRequests(),
          reportService.getAnalyticalReports(),
        ]);
        setStats(kpis);
        setRecentBookings(appts.slice(0, 6));
        setPendingRequests(requests.filter((r) => r.status === 'pending'));
        setAnalytics(reports);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Specialty Data formatted for Donut Chart
  const specialtyChartData = useMemo(() => {
    if (!analytics?.bySpecialty?.length) {
      return [
        { name: 'Cardiology', value: 35, color: '#2563EB' },
        { name: 'Dermatology', value: 25, color: '#6366f1' },
        { name: 'Orthopedics', value: 20, color: '#f59e0b' },
        { name: 'Pediatrics', value: 12, color: '#10b981' },
        { name: 'Neurology', value: 8, color: '#ef4444' },
      ];
    }
    return analytics.bySpecialty.slice(0, 5).map((item: { specialty: string; count: number }) => ({
      name: item.specialty,
      translatedName: translateSpecialty(item.specialty),
      value: item.count,
      color: SPECIALTY_COLORS[item.specialty] || '#2563EB',
    }));
  }, [analytics, translateSpecialty]);

  // Provider Activity format
  const providerBarData = useMemo(() => {
    const daysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const daysAr = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
    return daysEn.map((day, i) => ({
      day: isArabic ? daysAr[i] : day,
      doctors: 10 + (i * 3) % 15,
      hospitals: 3 + (i % 4),
      clinics: 5 + (i * 2) % 8,
    }));
  }, [isArabic]);

  // Trend Data with localized month
  const trendData = useMemo(() => {
    return BASE_TREND.map((item) => ({
      month: isArabic ? item.monthAr : item.monthEn,
      [isArabic ? 'الحجوزات' : 'Bookings']: item.bookings,
      [isArabic ? 'الاستشارات' : 'Consultations']: item.volume,
    }));
  }, [isArabic]);

  return (
    <div className="space-y-6 w-full max-w-full">

      {/* ── Header Banner ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBF0] text-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-[#0E7490] text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>{t('adminPortal.systemAdmin')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{t('adminPortal.controlConsole')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">{t('adminPortal.consoleSubtitle')}</p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/reports"
            className="px-4 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-2"
          >
            <FileBarChart className="w-4 h-4" />
            <span>{t('adminPortal.operationalReports')}</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              showToast(isArabic ? 'تم تسجيل الخروج بنجاح.' : 'Signed out successfully.', 'info');
              navigate('/login');
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-slate-700 text-xs font-bold transition-all cursor-pointer border border-[#E2EBF0] shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          label={t('adminPortal.doctors')}
          value={stats?.totalDoctors ?? '—'}
          sub={t('adminPortal.verifiedActive')}
          icon={Stethoscope}
          color="text-[#0E7490]"
          bg="bg-[#E8F6F8]"
          trend="+12%"
        />
        <KpiCard
          label={t('adminPortal.hospitals')}
          value={stats?.totalHospitals ?? '—'}
          sub={t('adminPortal.accredited')}
          icon={Building2}
          color="text-indigo-600"
          bg="bg-indigo-50"
          trend="+4%"
        />
        <KpiCard
          label={t('adminPortal.clinics')}
          value={stats?.totalClinics ?? '—'}
          sub={t('adminPortal.specialized')}
          icon={ShieldCheck}
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <KpiCard
          label={t('adminPortal.bookings')}
          value={stats?.totalBookings ?? '—'}
          sub={t('adminPortal.allTimeVisits')}
          icon={Calendar}
          color="text-sky-600"
          bg="bg-sky-50"
          trend="+18%"
        />
        <KpiCard
          label={t('adminPortal.joinRequests')}
          value={pendingRequests.length}
          sub={t('adminPortal.pendingReview')}
          icon={AlertCircle}
          color="text-rose-600"
          bg="bg-rose-50"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Booking & Consultations Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isArabic ? 'مؤشر نمو الحجوزات والاستشارات' : 'Platform Booking & Consultation Velocity'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isArabic ? 'مقارنة شهرية لمعدل الحجوزات وسعة المنظومة' : 'Monthly aggregated appointments & capacity over 7 months'}
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 w-fit">
              <TrendingUp className="w-3.5 h-3.5" />
              {isArabic ? '+24% نمو هذا الربع' : '+24% QoQ Growth'}
            </span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="adminBookingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2DA7B5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2DA7B5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="adminConsultGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2EBF0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Area
                type="monotone"
                dataKey={isArabic ? 'الحجوزات' : 'Bookings'}
                stroke="#2DA7B5"
                strokeWidth={3}
                fill="url(#adminBookingGrad)"
                dot={{ fill: '#2DA7B5', r: 3 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey={isArabic ? 'الاستشارات' : 'Consultations'}
                stroke="#0284c7"
                strokeWidth={2}
                fill="url(#adminConsultGrad)"
                dot={{ fill: '#0284c7', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Specialty Donut Chart */}
        <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{t('adminPortal.topSpecialties')}</h3>
            <p className="text-xs text-slate-500 mb-4">{isArabic ? 'توزيع الحجوزات الطبية حسب التخصص' : 'Consultations volume by medical discipline'}</p>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie
                  data={specialtyChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {specialtyChartData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => [`${v} ${isArabic ? 'حجوزات' : 'visits'}`, '']}
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #E2EBF0',
                    borderRadius: 12,
                    color: '#0f172a',
                    fontSize: 12,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-[#E2EBF0]">
            {specialtyChartData.map((s: any) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="text-slate-700 font-semibold">{s.translatedName || s.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Provider Activity Bar & Recent Bookings Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Provider Active Volume Bar Chart */}
        <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isArabic ? 'نشاط المراكز والكوادر الطبية' : 'Provider Weekly Load'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isArabic ? 'معدل مشاركة الأطباء والمستشفيات هذا الأسبوع' : 'Active healthcare providers across the network'}
            </p>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={providerBarData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EBF0" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="doctors" name={isArabic ? 'أطباء' : 'Doctors'} fill="#2DA7B5" radius={[3, 3, 0, 0]} />
                <Bar dataKey="hospitals" name={isArabic ? 'مستشفيات' : 'Hospitals'} fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="clinics" name={isArabic ? 'عيادات' : 'Clinics'} fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex gap-4 mt-3 text-xs font-semibold justify-center pt-3 border-t border-[#E2EBF0]">
            {[
              [isArabic ? 'الأطباء' : 'Doctors', '#2DA7B5'],
              [isArabic ? 'المستشفيات' : 'Hospitals', '#6366f1'],
              [isArabic ? 'العيادات' : 'Clinics', '#f59e0b'],
            ].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Ecosystem Bookings Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E2EBF0] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-[#E2EBF0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t('adminPortal.recentBookings')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('adminPortal.recentBookingsSubtitle')}</p>
              </div>
              <Link
                to="/admin/bookings"
                className="text-xs font-bold text-[#0E7490] hover:text-[#2DA7B5] flex items-center gap-1 transition-colors"
              >
                <span>{t('adminPortal.viewAll')}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-[#E2EBF0]">
                  <tr>
                    <th className="px-6 py-3.5">{t('adminPortal.patient')}</th>
                    <th className="px-6 py-3.5">{t('adminPortal.doctor')}</th>
                    <th className="px-6 py-3.5">{t('adminPortal.dateSlot')}</th>
                    <th className="px-6 py-3.5">{t('adminPortal.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((appt) => (
                    <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] flex items-center justify-center font-bold text-xs shrink-0">
                            {appt.patientName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{appt.patientName}</p>
                            <p className="text-[10px] text-slate-400 font-mono" dir="ltr">{appt.patientPhone || appt.patientMobile}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{appt.doctorName}</p>
                        <p className="text-[10px] text-slate-400">{appt.facilityName || appt.providerName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-semibold">{appt.date}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{appt.timeSlot || appt.time}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={appt.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending Provider Requests ── */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">{t('adminPortal.providerApplications')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('adminPortal.providerApplicationsSubtitle')}</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full">
              {pendingRequests.length} {t('adminPortal.newBadge')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req.id} className="p-5 rounded-2xl border border-[#E2EBF0] bg-[#F8FAFC] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{req.name}</span>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                    {req.providerType}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{req.location}, {req.country}</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#E2EBF0]">
                  <span className="text-[11px] font-mono text-slate-600" dir="ltr">{req.contactNumber}</span>
                  <Link
                    to="/admin/requests"
                    className="text-xs font-bold text-[#0E7490] hover:text-[#2DA7B5] flex items-center gap-1"
                  >
                    <span>{t('adminPortal.manageApplications')}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
