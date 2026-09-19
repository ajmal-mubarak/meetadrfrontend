import React, { useState, useEffect } from 'react';
import { Building2, Phone, Mail, MapPin, Check, X, Clock } from 'lucide-react';
import { providerService } from '../../services/providerService';
import { ProviderRequest } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

export const AdminRequests: React.FC = () => {
  const { showToast } = useToast();
  const { t, isRTL, isArabic } = useTranslation();
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await providerService.getAllRequests();
      setRequests(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await providerService.updateRequestStatus(id, newStatus);
      showToast(
        isArabic
          ? `تم تحديث حالة الطلب إلى: ${newStatus === 'approved' ? 'معتمد' : 'مرفوض'}`
          : `Application marked as ${newStatus}.`,
        'success'
      );
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update request', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">{t('adminPortal.requestsTitle')}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('adminPortal.requestsSubtitle')}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
              <tr>
                <th className="px-5 py-3">{t('adminPortal.applicantCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.categoryCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.contactCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.locationCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.submittedCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.statusCol')}</th>
                <th className="px-5 py-3 text-right rtl:text-left">{t('adminPortal.reviewCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    {t('adminPortal.noRequestsFound')}
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{r.name}</td>
                    <td className="px-5 py-3.5 capitalize">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                        {r.providerType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800">
                      <div className="font-mono" dir="ltr">{r.contactNumber}</div>
                      <div className="text-slate-400 text-[11px]" dir="ltr">{r.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {r.location}, {r.country}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          r.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status === 'approved'
                          ? t('status.approved')
                          : r.status === 'rejected'
                          ? t('status.rejected')
                          : t('status.pending')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right rtl:text-left">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'approved')}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>{t('adminPortal.approveBtn')}</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'rejected')}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                          >
                            {t('adminPortal.rejectBtn')}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] capitalize">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
