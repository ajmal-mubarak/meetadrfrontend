import React, { useState, useEffect } from 'react';
import { Building2, Check, X, Clock, Link2, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import { realAdminService } from '../../services/realAdminService';
import { ProviderRequest } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

interface SetupLinkResult {
  setup_link: string;
  admin_email: string;
  facility_name: string;
  expires_at: string;
}

export const AdminRequests: React.FC = () => {
  const { showToast } = useToast();
  const { t, isArabic } = useTranslation();
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [setupLink, setSetupLink] = useState<SetupLinkResult | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await realAdminService.getRequests();
      setRequests(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load requests';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await realAdminService.updateRequestStatus(id, newStatus);
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

  const handleGetSetupLink = async (id: string) => {
    setResendingId(id);
    try {
      const result = await realAdminService.resendInvitation(id);
      setSetupLink(result);
      showToast('Setup link generated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate setup link', 'error');
    } finally {
      setResendingId(null);
    }
  };

  const handleCopy = async () => {
    if (!setupLink) return;
    try {
      await navigator.clipboard.writeText(setupLink.setup_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy — please select and copy manually.', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup Link Modal */}
      {setupLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-[#E2EBF0]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[#2DA7B5]" />
                  Hospital Setup Link
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Send this one-time link to the hospital administrator to set up their portal password.</p>
              </div>
              <button
                onClick={() => setSetupLink(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl p-4 space-y-3 mb-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Facility</span>
                <span className="font-bold text-slate-900">{setupLink.facility_name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Admin Email</span>
                <span className="font-mono text-slate-800">{setupLink.admin_email}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Link Expires</span>
                <span className="text-amber-600 font-semibold">
                  {new Date(setupLink.expires_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Setup Link Display */}
            <div className="bg-slate-900 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-slate-500 mb-1 font-mono uppercase tracking-wider">One-Time Setup URL</p>
              <p className="text-xs text-emerald-400 font-mono break-all leading-relaxed">{setupLink.setup_link}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#2DA7B5] hover:bg-[#268d9b] text-white'
                }`}
              >
                {copied ? (
                  <><CheckCircle2 className="w-4 h-4" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Setup Link</>
                )}
              </button>
              <button
                onClick={() => setSetupLink(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#E2EBF0] text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-[10px] text-slate-400 mt-3 text-center">
              This link is single-use and expires in 72 hours. Once used, the hospital admin can set their password and access the portal.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">{t('adminPortal.requestsTitle')}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('adminPortal.requestsSubtitle')}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        {/* How credentials work info banner */}
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
          <Link2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            <strong>Credential delivery:</strong> When you approve a request, a setup link is emailed to the hospital contact. If email fails or they need a new link, click <strong>"Get Setup Link"</strong> on any approved row to generate a fresh 72-hour link to share manually.
          </p>
        </div>

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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">Loading...</td>
                </tr>
              ) : requests.length === 0 ? (
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
                      ) : r.status === 'approved' ? (
                        <button
                          onClick={() => handleGetSetupLink(r.id)}
                          disabled={resendingId === r.id}
                          className="px-2.5 py-1 text-xs font-semibold text-[#2DA7B5] hover:bg-[#E8F6F8] rounded-lg border border-[#CDEBF0] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {resendingId === r.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Link2 className="w-3 h-3" />
                          )}
                          Get Setup Link
                        </button>
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
