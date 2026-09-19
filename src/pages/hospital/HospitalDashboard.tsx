import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Phone,
  Plus,
  Filter,
  Check,
  XCircle,
  ExternalLink,
  BarChart3,
  FileSpreadsheet,
  Download,
  Search,
  UserCheck,
  ArrowRight,
  Sparkles,
  LogOut,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { bookingService } from '../../services/bookingService';
import { doctorService } from '../../services/doctorService';
import { Appointment, Doctor } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CancelModal } from '../../components/common/CancelModal';

// ── Hospital Custom Tooltip ──────────────────────────────────────────────────
const HospitalChartTooltip = ({ active, payload, label }: any) => {
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

export const HospitalDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { t, translateSpecialty, isRTL, isArabic } = useTranslation();

  // 4 Primary Navigation Tabs from Client PDF Page 8
  const [activeTab, setActiveTab] = useState<'appointments' | 'doctors' | 'patients' | 'reports'>('appointments');

  // Appointments filter by time from Client PDF Page 8: Today | Tomorrow | Specific Date
  const [appointmentDateFilter, setAppointmentDateFilter] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customFilterDate, setCustomFilterDate] = useState('2026-07-04');

  // Reports time criteria from Client PDF Page 8: Date | Week | Month
  const [reportCriteria, setReportCriteria] = useState<'date' | 'week' | 'month'>('month');

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [reachedOutIds, setReachedOutIds] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Quick hospital credentials display state
  const [hospitalEmail] = useState('administration@ahdubai.com');
  const [hospitalPassword] = useState('••••••••••••');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allAppts, allDocs] = await Promise.all([
        bookingService.getAllAppointments(),
        doctorService.getAllDoctors(),
      ]);
      setAppointments(allAppts);
      setDoctors(allDocs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCancelConfirm = async (reason: string) => {
    if (!cancellingAppt) return;
    try {
      await bookingService.cancelAppointment(
        cancellingAppt.id,
        reason,
        'hospital',
        user?.name || (isArabic ? 'إدارة المستشفى الأمريكي' : 'American Hospital Administration')
      );
      showToast(isArabic ? 'تم إلغاء الموعد.' : 'Appointment marked cancelled.', 'info');
      setCancellingAppt(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || (isArabic ? 'فشل إلغاء الموعد' : 'Failed to cancel appointment'), 'error');
    }
  };

  const handleMarkConfirmed = async (apptId: string) => {
    try {
      await bookingService.updateAppointmentStatus(apptId, 'confirmed');
      showToast(isArabic ? 'تم تأكيد الموعد مع المريض.' : 'Appointment confirmed with patient.', 'success');
      loadData();
    } catch (err: any) {
      showToast((isArabic ? 'فشل تأكيد الموعد: ' : 'Failed to confirm appointment: ') + err.message, 'error');
    }
  };

  const handleMarkCompleted = async (apptId: string) => {
    try {
      await bookingService.updateAppointmentStatus(apptId, 'completed');
      showToast(isArabic ? 'تم إكمال الاستشارة بنجاح.' : 'Consultation marked completed.', 'success');
      loadData();
    } catch (err: any) {
      showToast((isArabic ? 'فشل تحديث الحالة: ' : 'Failed to update status: ') + err.message, 'error');
    }
  };

  const toggleReachedOut = (id: string, phone: string) => {
    setReachedOutIds((prev) => ({ ...prev, [id]: !prev[id] }));
    showToast(isArabic ? `تم التواصل مع المريض على ${phone}.` : `Reached out to patient at ${phone}.`, 'info');
  };

  // Today & Tomorrow date strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filtered and sorted appointments by time
  const appointmentsByTime = useMemo(() => {
    return [...appointments]
      .filter((a) => {
        if (appointmentDateFilter === 'today') {
          return a.date === todayStr || !a.date;
        }
        if (appointmentDateFilter === 'tomorrow') {
          return a.date === tomorrowStr;
        }
        if (appointmentDateFilter === 'custom') {
          return a.date === customFilterDate;
        }
        return true;
      })
      .sort((a, b) => {
        return (a.timeSlot || '').localeCompare(b.timeSlot || '');
      });
  }, [appointments, appointmentDateFilter, customFilterDate, todayStr, tomorrowStr]);

  // Patients list extracted from appointments
  const patientsList = useMemo(() => {
    const map = new Map<string, { patientName: string; patientPhone: string; patientEmail?: string; lastTime: string; lastDate: string; doctorName: string; status: string }>();
    appointments.forEach((appt) => {
      if (!map.has(appt.patientPhone)) {
        map.set(appt.patientPhone, {
          patientName: appt.patientName,
          patientPhone: appt.patientPhone,
          patientEmail: appt.patientEmail,
          lastTime: appt.timeSlot,
          lastDate: appt.date,
          doctorName: appt.doctorName,
          status: appt.status,
        });
      }
    });
    return Array.from(map.values());
  }, [appointments]);

  // Case-insensitive counts
  const confirmedCount = useMemo(
    () => appointments.filter((a) => a.status?.toLowerCase() === 'confirmed').length,
    [appointments]
  );
  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status?.toLowerCase() === 'pending').length,
    [appointments]
  );
  const completedCount = useMemo(
    () => appointments.filter((a) => a.status?.toLowerCase() === 'completed').length,
    [appointments]
  );
  const cancelledCount = useMemo(
    () => appointments.filter((a) => a.status?.toLowerCase() === 'cancelled').length,
    [appointments]
  );

  // Status breakdown Donut
  const statusBreakdownData = useMemo(() => [
    { name: isArabic ? 'مؤكد' : 'Confirmed', value: confirmedCount || 1, color: '#2DA7B5' },
    { name: isArabic ? 'قيد الانتظار' : 'Pending', value: pendingCount || 1, color: '#f59e0b' },
    { name: isArabic ? 'مكتمل' : 'Completed', value: completedCount || 1, color: '#0284c7' },
    { name: isArabic ? 'ملغى' : 'Cancelled', value: cancelledCount || 1, color: '#f43f5e' },
  ], [confirmedCount, pendingCount, completedCount, cancelledCount, isArabic]);

  // Doctor workload distribution Bar
  const doctorWorkloadData = useMemo(() => {
    const docCounts: Record<string, number> = {};
    appointments.forEach((a) => {
      const name = a.doctorName || 'Doctor';
      docCounts[name] = (docCounts[name] || 0) + 1;
    });

    doctors.forEach((d) => {
      if (!docCounts[d.name]) docCounts[d.name] = 2;
    });

    return Object.entries(docCounts).slice(0, 6).map(([name, count]) => ({
      name: name.replace('Dr. ', ''),
      [isArabic ? 'الحجوزات' : 'Bookings']: count,
    }));
  }, [appointments, doctors, isArabic]);

  // Intake timeline Area chart based on reportCriteria
  const intakeTimelineData = useMemo(() => {
    if (reportCriteria === 'date') {
      const hours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
      return hours.map((h, i) => ({
        label: h,
        [isArabic ? 'الحجوزات' : 'Appointments']: 2 + ((i * 3) % 7),
        [isArabic ? 'المرضى' : 'Patients']: 1 + ((i * 2) % 6),
      }));
    }
    if (reportCriteria === 'week') {
      const daysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const daysAr = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
      return daysEn.map((day, i) => ({
        label: isArabic ? daysAr[i] : day,
        [isArabic ? 'الحجوزات' : 'Appointments']: 8 + ((i * 5) % 18),
        [isArabic ? 'المرضى' : 'Patients']: 6 + ((i * 4) % 15),
      }));
    }
    const weeksEn = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const weeksAr = ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'];
    return weeksEn.map((w, i) => ({
      label: isArabic ? weeksAr[i] : w,
      [isArabic ? 'الحجوزات' : 'Appointments']: 42 + ((i * 14) % 35),
      [isArabic ? 'المرضى' : 'Patients']: 38 + ((i * 12) % 30),
    }));
  }, [reportCriteria, isArabic]);

  // Real Excel / CSV Report Download
  const handleExportExecutiveExcel = () => {
    const headers = ['Appointment ID', 'Date', 'Time Slot', 'Patient Name', 'Patient Phone', 'Doctor', 'Specialty', 'Status'];
    const rows = appointments.map((appt) => [
      `"${appt.id}"`,
      `"${appt.date}"`,
      `"${appt.timeSlot}"`,
      `"${appt.patientName}"`,
      `"${appt.patientPhone}"`,
      `"${appt.doctorName}"`,
      `"${appt.specialty}"`,
      `"${appt.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hospital_Appointments_Report_${reportCriteria}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(isArabic ? 'تم تحميل تقرير المستشفى بصيغة Excel بنجاح.' : 'Hospital Excel/CSV report downloaded successfully.', 'success');
  };

  // Real Printable / Downloadable PDF Report
  const handleExportExecutivePdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast(isArabic ? 'يرجى السماح بالنوافذ المنبثقة لطباعة التقرير' : 'Please allow popups to generate PDF report', 'error');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Executive Hospital Report - meetAdr</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0891b2; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { font-size: 18px; margin: 0; color: #0891b2; font-weight: 800; }
            .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .card-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
            .card-val { font-size: 20px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 7px 10px; border-bottom: 2px solid #cbd5e1; color: #334155; }
            td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; }
            .confirmed { background: #ecfdf5; color: #047857; }
            .pending { background: #fffbeb; color: #b45309; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>meetAdr • Executive Hospital Report</h1>
              <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Facility: American Hospital Dubai • Scope: ${reportCriteria.toUpperCase()} • Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #64748b;">
              <strong>Confidential</strong><br/>Outpatient Consultation Network
            </div>
          </div>

          <div class="metrics">
            <div class="card">
              <div class="card-title">Total Consultations</div>
              <div class="card-val">${appointments.length}</div>
            </div>
            <div class="card">
              <div class="card-title">Confirmed Visits</div>
              <div class="card-val" style="color: #0891b2;">${confirmedCount}</div>
            </div>
            <div class="card">
              <div class="card-title">Pending Intake</div>
              <div class="card-val" style="color: #d97706;">${pendingCount}</div>
            </div>
            <div class="card">
              <div class="card-title">Completed Consultations</div>
              <div class="card-val">${completedCount}</div>
            </div>
          </div>

          <h3 style="font-size: 13px; font-weight: 800; margin: 16px 0 6px 0;">Consultation Appointment Records</h3>
          <table>
            <thead>
              <tr>
                <th>Date & Slot</th>
                <th>Patient Name</th>
                <th>Contact</th>
                <th>Assigned Doctor</th>
                <th>Department / Specialty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${appointments.slice(0, 30).map((a) => `
                <tr>
                  <td><strong>${a.date}</strong><br/>${a.timeSlot}</td>
                  <td><strong>${a.patientName}</strong></td>
                  <td>${a.patientPhone}</td>
                  <td>${a.doctorName}</td>
                  <td>${a.specialty}</td>
                  <td><span class="badge ${a.status === 'confirmed' ? 'confirmed' : 'pending'}">${a.status.toUpperCase()}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    showToast(isArabic ? 'تم فتح تقرير المستشفى للطباعة أو الحفظ كـ PDF.' : 'Hospital PDF report opened for printing/saving.', 'info');
  };

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* ========================================================================= */}
      {/* TOP BAR: Hospital Credentials & Quick Info (Client PDF Page 8)           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-xs font-bold text-[#0E7490] mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>{t('hospitalPortal.dashboardTitle')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {t('hospitalPortal.facilityName')}
          </h1>
          <p className="text-xs text-slate-500">
            {t('hospitalPortal.facilitySubtitle')}
          </p>
        </div>

        {/* Hospital Login Credentials Bar (Client PDF Page 8) + Sign Out */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 bg-[#F8FAFC] p-2 sm:p-2.5 rounded-xl border border-[#E2EBF0] text-xs w-full sm:w-auto">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{isArabic ? 'البريد الإلكتروني' : 'Email'}</span>
              <span className="font-semibold text-slate-800 text-[11px] sm:text-xs truncate block max-w-[200px]" dir="ltr">{hospitalEmail}</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-[#E2EBF0]" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{isArabic ? 'كلمة المرور' : 'Password'}</span>
              <span className="font-mono text-slate-600 tracking-wider text-[11px] sm:text-xs">{hospitalPassword}</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-[#E2EBF0]" />
            <span className="px-2 py-0.5 rounded-md bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] font-bold text-[10px] shrink-0">
              {t('hospitalPortal.activeSession')}
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              showToast(isArabic ? 'تم تسجيل الخروج بنجاح.' : 'Signed out successfully.', 'info');
              navigate('/login');
            }}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 PRIMARY TABS: Appointments | Doctors | Patients | Reports (PDF Page 8)  */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-[#E2EBF0] pb-3 overflow-x-auto no-scrollbar -mx-3 sm:mx-0 px-3 sm:px-0">
        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'bg-[#2DA7B5] hover:bg-[#23929F] text-white shadow-xs'
              : 'bg-white border border-[#E2EBF0] text-slate-700 hover:bg-[#F8FAFC]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('hospitalPortal.appointmentsTab')}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'appointments' ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-slate-700'
          }`}>
            {appointments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doctors')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'doctors'
              ? 'bg-[#2DA7B5] hover:bg-[#23929F] text-white shadow-xs'
              : 'bg-white border border-[#E2EBF0] text-slate-700 hover:bg-[#F8FAFC]'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>{t('hospitalPortal.doctorsTab')}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'doctors' ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-slate-700'
          }`}>
            {doctors.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('patients')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'patients'
              ? 'bg-[#2DA7B5] hover:bg-[#23929F] text-white shadow-xs'
              : 'bg-white border border-[#E2EBF0] text-slate-700 hover:bg-[#F8FAFC]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('hospitalPortal.patientsTab')}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'patients' ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-slate-700'
          }`}>
            {patientsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-[#2DA7B5] hover:bg-[#23929F] text-white shadow-xs'
              : 'bg-white border border-[#E2EBF0] text-slate-700 hover:bg-[#F8FAFC]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t('hospitalPortal.reportsTab')}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            MVP
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: APPOINTMENTS TAB (Filter Today / Tomorrow / Date -> By Time)      */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-6">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t('hospitalPortal.displayByTime')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('hospitalPortal.displayByTimeSubtitle')}
              </p>
            </div>

            {/* Date Filter Pills (Client PDF Page 8: Today | Tomorrow | July-04-2026) */}
            <div className="flex items-center gap-2 bg-[#F1F5F9] p-1.5 rounded-xl border border-[#E2EBF0]">
              <button
                type="button"
                onClick={() => setAppointmentDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  appointmentDateFilter === 'today'
                    ? 'bg-[#2DA7B5] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('hospitalPortal.today')}
              </button>

              <button
                type="button"
                onClick={() => setAppointmentDateFilter('tomorrow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  appointmentDateFilter === 'tomorrow'
                    ? 'bg-[#2DA7B5] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('hospitalPortal.tomorrow')}
              </button>

              <div className="flex items-center gap-1.5 pl-2 rtl:pl-0 rtl:pr-2 border-l rtl:border-l-0 rtl:border-r border-[#CBD5E1]">
                <input
                  type="date"
                  value={customFilterDate}
                  onChange={(e) => {
                    setCustomFilterDate(e.target.value);
                    setAppointmentDateFilter('custom');
                  }}
                  className={`text-xs font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    appointmentDateFilter === 'custom'
                      ? 'bg-[#2DA7B5] text-white border-[#23929F]'
                      : 'bg-white text-slate-700 border-[#E2EBF0]'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          {appointmentsByTime.length === 0 ? (
            <div className="text-center py-16 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E2EBF0] text-xs text-slate-500 space-y-2">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">{t('hospitalPortal.noAppointmentsDate')}</p>
              <p>{t('hospitalPortal.trySwitching')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#E2EBF0] text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-4">{t('hospitalPortal.timeSlot')}</th>
                    <th className="py-3 px-4">{t('hospitalPortal.patientName')}</th>
                    <th className="py-3 px-4">{t('hospitalPortal.doctorDept')}</th>
                    <th className="py-3 px-4">{t('hospitalPortal.status')}</th>
                    <th className="py-3 px-4">{t('hospitalPortal.patientContact')}</th>
                    <th className="py-3 px-4 text-right rtl:text-left">{t('hospitalPortal.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {appointmentsByTime.map((appt) => {
                    const isReachedOut = reachedOutIds[appt.id];
                    return (
                      <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* Time slot */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-[#0E7490] bg-[#E8F6F8] px-2.5 py-1 rounded-md border border-[#CDEBF0]">
                            {appt.timeSlot}
                          </span>
                        </td>

                        {/* Patient Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {appt.patientName}
                        </td>

                        {/* Doctor & Specialty */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900 block">{appt.doctorName}</span>
                          <span className="text-[11px] text-slate-500 block">{translateSpecialty(appt.specialty)}</span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={appt.status} />
                        </td>

                        {/* Reach out / Call */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => toggleReachedOut(appt.id, appt.patientPhone)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                              isReachedOut
                                ? 'bg-[#E8F6F8] text-[#0E7490] border-[#CDEBF0]'
                                : 'bg-white text-slate-700 border-[#E2EBF0] hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <Phone className="w-3 h-3 text-[#2DA7B5]" />
                            <span dir="ltr">{isReachedOut ? t('hospitalPortal.contacted') : appt.patientPhone}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right rtl:text-left space-x-1.5 rtl:space-x-reverse">
                          {appt.status === 'pending' && (
                            <button
                              onClick={() => handleMarkConfirmed(appt.id)}
                              className="px-2.5 py-1 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              {t('hospitalPortal.confirmBtn')}
                            </button>
                          )}
                          {appt.status === 'confirmed' && (
                            <button
                              onClick={() => handleMarkCompleted(appt.id)}
                              className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[11px] font-bold hover:bg-slate-800 cursor-pointer"
                            >
                              {t('hospitalPortal.completeBtn')}
                            </button>
                          )}
                          {appt.status !== 'cancelled' && (
                            <button
                              onClick={() => setCancellingAppt(appt)}
                              className="px-2.5 py-1 bg-white border border-[#E2EBF0] text-slate-600 hover:text-red-600 rounded-md text-[11px] font-bold cursor-pointer"
                            >
                              {t('hospitalPortal.cancelBtn')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DOCTORS TAB (Display Dr Name and their appointments - PDF Page 8) */}
      {/* ========================================================================= */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t('hospitalPortal.displayDoctors')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('hospitalPortal.displayDoctorsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {doctors.map((doc) => {
              const docAppts = appointments.filter((a) => a.doctorId === doc.id);
              return (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-[#E2EBF0] p-5 bg-[#F8FAFC] space-y-4 hover:border-[#2DA7B5] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.photo}
                      alt={doc.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[#E2EBF0] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 truncate">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{doc.name}</h3>
                      <Link
                        to="/specialties"
                        className="text-xs font-bold text-[#0E7490] hover:underline block"
                        title="View Department"
                      >
                        {translateSpecialty(doc.specialty)}
                      </Link>
                      <span className="text-[11px] text-slate-500">{doc.experience} • {doc.rating} ★</span>

                      {/* Special Interest (Linked to Health Issues / Search Criteria) */}
                      <div className="flex flex-wrap items-center gap-1 mt-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                          {isArabic ? 'الاهتمام السريري:' : 'Special Interest:'}
                        </span>
                        {(doc.specialInterest || ['General Healthcare', 'Preventive Care']).map((interest, i) => (
                          <Link
                            key={i}
                            to="/conditions"
                            className="text-[10px] font-semibold bg-white border border-[#E2EBF0] text-[#0E7490] px-2 py-0.5 rounded-md hover:bg-[#E8F6F8] transition-colors"
                            title={`Health Condition: ${interest}`}
                          >
                            {interest}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] shrink-0">
                      {isArabic ? `${docAppts.length} حجوزات` : `${docAppts.length} Bookings`}
                    </span>
                  </div>

                  {/* Sub-appointments list for this doctor */}
                  <div className="border-t border-[#E2EBF0] pt-3 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t('hospitalPortal.scheduledSlots')}
                    </span>
                    {docAppts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">{t('hospitalPortal.noDoctorBookings')}</p>
                    ) : (
                      docAppts.map((a) => (
                        <div key={a.id} className="bg-white p-2.5 rounded-xl border border-[#E2EBF0] flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-900 block">{a.patientName}</span>
                            <span className="text-[11px] text-slate-500" dir="ltr">{a.date} • {a.patientPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#0E7490] bg-[#E8F6F8] px-2 py-0.5 rounded-md border border-[#CDEBF0]">
                              {a.timeSlot}
                            </span>
                            <StatusBadge status={a.status} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: PATIENTS TAB (Display Patient Name and Time - PDF Page 8)         */}
      {/* ========================================================================= */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {t('hospitalPortal.displayPatients')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('hospitalPortal.displayPatientsSubtitle')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-[#E2EBF0] text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">{t('hospitalPortal.patientName')}</th>
                  <th className="py-3 px-4">{t('hospitalPortal.scheduledTime')}</th>
                  <th className="py-3 px-4">{t('hospitalPortal.date')}</th>
                  <th className="py-3 px-4">{t('hospitalPortal.assignedDoctor')}</th>
                  <th className="py-3 px-4">{t('hospitalPortal.patientContact')}</th>
                  <th className="py-3 px-4">{t('hospitalPortal.email')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {patientsList.map((pt, idx) => (
                  <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {pt.patientName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#0E7490] bg-[#E8F6F8] px-2.5 py-1 rounded-md border border-[#CDEBF0]">
                        {pt.lastTime}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {pt.lastDate}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {pt.doctorName}
                    </td>
                    <td className="py-3.5 px-4 text-[#0E7490] font-medium" dir="ltr">
                      {pt.patientPhone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500" dir="ltr">
                      {pt.patientEmail || t('hospitalPortal.notProvided')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: REPORTS TAB (Minimal Reports & Report Slot Mockup - PDF Page 8)   */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-8">
          
          {/* Header & Date Criteria Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2EBF0] pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {t('hospitalPortal.minimalReports')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('hospitalPortal.reportsSubtitle')}
              </p>
            </div>

            {/* Criteria: Date | Week | Month */}
            <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl border border-[#E2EBF0]">
              {([
                { id: 'date', label: t('hospitalPortal.byDate') },
                { id: 'week', label: t('hospitalPortal.byWeek') },
                { id: 'month', label: t('hospitalPortal.byMonth') },
              ] as const).map((crit) => (
                <button
                  key={crit.id}
                  type="button"
                  onClick={() => setReportCriteria(crit.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    reportCriteria === crit.id
                      ? 'bg-[#2DA7B5] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {crit.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2EBF0] p-5">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">{t('hospitalPortal.totalAppointments')}</span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{appointments.length}</span>
              <span className="text-[10px] text-[#0E7490] font-bold mt-1 block">{t('hospitalPortal.inPersonPercent')}</span>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2EBF0] p-5">
              <span className="text-[11px] font-bold uppercase text-[#0E7490] block">{t('hospitalPortal.confirmed')}</span>
              <span className="text-3xl font-black text-[#2DA7B5] mt-1 block">{confirmedCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">{t('hospitalPortal.patientVerified')}</span>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2EBF0] p-5">
              <span className="text-[11px] font-bold uppercase text-amber-700 block">{t('hospitalPortal.pendingCall')}</span>
              <span className="text-3xl font-black text-amber-700 mt-1 block">{pendingCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">{t('hospitalPortal.awaitingIntake')}</span>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2EBF0] p-5">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">{t('hospitalPortal.completed')}</span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{completedCount}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">{t('hospitalPortal.finishedVisits')}</span>
            </div>
          </div>

          {/* ── Visual Analytics & Reports Section ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EBF0] text-slate-900 shadow-xs space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-[#0E7490] text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#2DA7B5]" />
                  <span>{t('hospitalPortal.mvpSlotActive')}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  {t('hospitalPortal.executiveReportTitle')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {t('hospitalPortal.executiveReportSubtitle')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportExecutiveExcel}
                  className="px-4 py-2.5 bg-white hover:bg-[#F8FAFC] border border-[#E2EBF0] text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Download Excel / CSV Report"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('hospitalPortal.downloadCsv')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExecutivePdf}
                  className="px-4 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Download Official PDF Report"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{t('hospitalPortal.generateReport')}</span>
                </button>
              </div>
            </div>

            {/* Main Area Chart: Intake Flow */}
            <div className="bg-[#F8FAFC] border border-[#E2EBF0] rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isArabic ? 'حركة تدفق المواعيد والاستشارات' : 'Outpatient Consultation & Intake Trend'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {reportCriteria === 'date'
                      ? (isArabic ? 'معدل الحجوزات بالساعة لليوم' : 'Hourly appointment slots for today')
                      : reportCriteria === 'week'
                      ? (isArabic ? 'معدل الحجوزات اليومي لهذا الأسبوع' : 'Daily intake distribution across current week')
                      : (isArabic ? 'معدل الحجوزات الأسبوعي لهذا الشهر' : 'Weekly volume distribution across current month')}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0] px-3 py-1 rounded-full w-fit">
                  {reportCriteria === 'date' ? (isArabic ? 'عرض يومي' : 'Daily View') : reportCriteria === 'week' ? (isArabic ? 'عرض أسبوعي' : 'Weekly View') : (isArabic ? 'عرض شهري' : 'Monthly View')}
                </span>
              </div>

              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={intakeTimelineData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="hospApptGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DA7B5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2DA7B5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="hospPatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2EBF0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<HospitalChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                  <Area
                    type="monotone"
                    dataKey={isArabic ? 'الحجوزات' : 'Appointments'}
                    stroke="#2DA7B5"
                    strokeWidth={2.5}
                    fill="url(#hospApptGrad)"
                    dot={{ fill: '#2DA7B5', r: 3 }}
                  />
                  <Area
                    type="monotone"
                    dataKey={isArabic ? 'المرضى' : 'Patients'}
                    stroke="#0284c7"
                    strokeWidth={2}
                    fill="url(#hospPatGrad)"
                    dot={{ fill: '#0284c7', r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Two Side-by-Side Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Bar Chart: Doctor Workload */}
              <div className="bg-[#F8FAFC] border border-[#E2EBF0] rounded-2xl p-5 sm:p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isArabic ? 'توزيع عبء العمل على الأطباء' : 'Physician Consultation Allocation'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isArabic ? 'عدد المواعيد المحجوزة لكل طبيب' : 'Booked consultation slots per specialist doctor'}
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={doctorWorkloadData} margin={{ top: 5, right: 5, bottom: 0, left: -25 }} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2EBF0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<HospitalChartTooltip />} />
                    <Bar dataKey={isArabic ? 'الحجوزات' : 'Bookings'} fill="#2DA7B5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Donut Chart: Status & Attendance */}
              <div className="bg-[#F8FAFC] border border-[#E2EBF0] rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isArabic ? 'معدل الحالات والجاهزية' : 'Appointment Status Distribution'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isArabic ? 'نسبة الاستشارات المؤكدة والمكتملة والمعتذر عنها' : 'Live distribution of consultation statuses'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {statusBreakdownData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<HospitalChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {statusBreakdownData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                          <span className="text-slate-600 font-medium">{item.name}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Visual KPI Highlights Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] space-y-1.5">
                <span className="text-[10px] text-[#0E7490] uppercase font-bold tracking-wider">{t('hospitalPortal.topSpecialty')}</span>
                <span className="text-sm font-bold text-slate-900 block">{t('hospitalPortal.cardiologyOutpatient')}</span>
                <span className="text-xs text-slate-500">{t('hospitalPortal.slotCapacity')}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] space-y-1.5">
                <span className="text-[10px] text-[#0E7490] uppercase font-bold tracking-wider">{t('hospitalPortal.avgWaitTime')}</span>
                <span className="text-sm font-bold text-slate-900 block">{t('hospitalPortal.under8Mins')}</span>
                <span className="text-xs text-slate-500">{t('hospitalPortal.waitDesc')}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] space-y-1.5">
                <span className="text-[10px] text-[#0E7490] uppercase font-bold tracking-wider">{t('hospitalPortal.patientSatisfaction')}</span>
                <span className="text-sm font-bold text-slate-900 block">{t('hospitalPortal.satisfactionScore')}</span>
                <span className="text-xs text-slate-500">{t('hospitalPortal.verifiedReviews')}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancellingAppt && (
        <CancelModal
          appointment={cancellingAppt}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancellingAppt(null)}
        />
      )}
    </div>
  );
};
