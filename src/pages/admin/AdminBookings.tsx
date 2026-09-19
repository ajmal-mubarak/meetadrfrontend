import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Phone, Trash2 } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { Appointment } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CancelModal } from '../../components/common/CancelModal';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

export const AdminBookings: React.FC = () => {
  const { showToast } = useToast();
  const { t, isRTL, isArabic, translateSpecialty } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await bookingService.getAllAppointments();
      setAppointments(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelConfirm = async (reason: string) => {
    if (!cancellingAppt) return;
    try {
      await bookingService.cancelAppointment(
        cancellingAppt.id,
        reason,
        'admin',
        'System Administrator'
      );
      showToast(isArabic ? 'تم إلغاء الموعد بواسطة الإدارة.' : 'Appointment cancelled by Administrator.', 'info');
      setCancellingAppt(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel appointment', 'error');
    }
  };

  const filtered = appointments.filter((a) => {
    if (status !== 'all' && a.status !== status) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.facilityName.toLowerCase().includes(q) ||
        a.patientPhone.includes(q)
      );
    }
    return true;
  });

  const statusLabel = (st: string) => {
    if (st === 'all') return t('adminPortal.filterAll');
    if (st === 'confirmed') return t('status.confirmed');
    if (st === 'completed') return t('status.completed');
    if (st === 'cancelled') return t('status.cancelled');
    return st;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('adminPortal.bookingsTitle')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('adminPortal.bookingsSubtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold w-full sm:w-auto border border-[#E2EBF0]">
            {['all', 'confirmed', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  status === st
                    ? 'bg-white text-[#0E7490] shadow-xs font-bold border border-[#E2EBF0]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {statusLabel(st)}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('adminPortal.searchPlaceholder')}
              className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
              <tr>
                <th className="px-5 py-3">{t('adminPortal.bookingId')}</th>
                <th className="px-5 py-3">{t('adminPortal.patientCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.doctorCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.facilityBreakdown')}</th>
                <th className="px-5 py-3">{t('adminPortal.scheduleCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.statusCol')}</th>
                <th className="px-5 py-3 text-right rtl:text-left">{t('adminPortal.actionsCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    {t('adminPortal.noBookingsFound')}
                  </td>
                </tr>
              ) : (
                filtered.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#0E7490] font-bold" dir="ltr">
                      #{appt.id}
                    </td>
                    <td className="px-5 py-3.5 text-slate-900 font-medium">
                      <div className="font-bold">{appt.patientName}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1" dir="ltr">
                        <Phone className="w-3 h-3 text-[#2DA7B5] shrink-0" />
                        <span>{appt.patientPhone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800">
                      <div className="font-semibold">{appt.doctorName}</div>
                      <div className="text-[11px] text-[#0E7490]">{translateSpecialty(appt.specialty)}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{appt.facilityName}</td>
                    <td className="px-5 py-3.5 text-slate-700">
                      <div>{appt.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{appt.timeSlot}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right rtl:text-left">
                      {appt.status === 'confirmed' ? (
                        <button
                          onClick={() => setCancellingAppt(appt)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                        >
                          {t('adminPortal.cancelBooking')}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
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
