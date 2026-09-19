import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, Calendar, ArrowUpRight } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

export const AdminReports: React.FC = () => {
  const { showToast } = useToast();
  const { t, isRTL, isArabic, translateSpecialty } = useTranslation();
  const [data, setData] = useState<{
    byDoctor: { name: string; count: number }[];
    bySpecialty: { specialty: string; count: number }[];
    byHospital: { facility: string; count: number }[];
    summary: { daily: number; weekly: number; monthly: number; total: number };
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await reportService.getAnalyticalReports();
        setData(res);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleDownload = () => {
    if (!data) return;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetadr-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast(t('adminPortal.exportSuccess'), 'success');
  };

  if (isLoading || !data) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">{t('adminPortal.aggregatingReports')}</p>
      </div>
    );
  }

  const maxSpecialty = Math.max(...data.bySpecialty.map((s) => s.count), 1);
  const maxDoctor = Math.max(...data.byDoctor.map((d) => d.count), 1);
  const maxHospital = Math.max(...data.byHospital.map((h) => h.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('adminPortal.reportsTitle')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('adminPortal.reportsSubtitle')}
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="px-4 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{t('adminPortal.exportJson')}</span>
        </button>
      </div>

      {/* Summary Time Periods */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E2EBF0] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('adminPortal.daily')}
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{data.summary.daily}</div>
          <p className="text-[11px] text-slate-400 mt-1">{t('hospitalPortal.today')}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2EBF0] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('adminPortal.weekly')}
          </span>
          <div className="text-3xl font-extrabold text-[#0E7490] mt-2">{data.summary.weekly}</div>
          <p className="text-[11px] text-slate-400 mt-1">{isArabic ? 'آخر 7 أيام' : 'Last 7 rolling days'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2EBF0] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('adminPortal.monthly')}
          </span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{data.summary.monthly}</div>
          <p className="text-[11px] text-slate-400 mt-1">{isArabic ? 'الشهر الحالي' : 'Current calendar month'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E2EBF0] shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('adminPortal.totalConsultations')}
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">{data.summary.total}</div>
          <p className="text-[11px] text-slate-400 mt-1">{t('adminPortal.allTimeVisits')}</p>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointments by Specialty */}
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">{t('adminPortal.topSpecialties')}</h3>
          <div className="space-y-3">
            {data.bySpecialty.map((item) => {
              const pct = Math.round((item.count / maxSpecialty) * 100);
              return (
                <div key={item.specialty} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{translateSpecialty(item.specialty)}</span>
                    <span className="text-[#0E7490] font-bold">{item.count} {t('hospitalPortal.bookings')}</span>
                  </div>
                  <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2DA7B5] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments by Facility */}
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">{t('adminPortal.facilityBreakdown')}</h3>
          <div className="space-y-3">
            {data.byHospital.map((item) => {
              const pct = Math.round((item.count / maxHospital) * 100);
              return (
                <div key={item.facility} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="truncate max-w-[200px]">{item.facility}</span>
                    <span className="text-emerald-600 font-bold">{item.count} {t('hospitalPortal.bookings')}</span>
                  </div>
                  <div className="h-2 w-full bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointments by Doctor (Full width) */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">{t('adminPortal.activeDoctors')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.byDoctor.map((item) => {
              const pct = Math.round((item.count / maxDoctor) * 100);
              return (
                <div key={item.name} className="p-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>{item.name}</span>
                    <span className="text-[#0E7490] font-bold">{item.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#E2EBF0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2DA7B5] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
