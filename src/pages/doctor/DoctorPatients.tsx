import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { realDoctorPortalService, DoctorPatientRecord } from '../../services/realDoctorPortalService';

export const DoctorPatients: React.FC = () => {
  const [patients, setPatients] = useState<DoctorPatientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await realDoctorPortalService.getPaginatedPatients({
          search,
          page: currentPage,
          page_size: pageSize,
        });
        if (isMounted) {
          setPatients(res.patients);
          setTotalCount(res.count);
          setTotalPages(res.totalPages);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Failed to load patient directory';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search, currentPage]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered patients with prior or upcoming appointments with you.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:bg-white focus:border-[#2DA7B5] focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
              <tr>
                <th className="px-5 py-3">Patient Name</th>
                <th className="px-5 py-3">Contact Phone</th>
                <th className="px-5 py-3">Total Appointments</th>
                <th className="px-5 py-3">Last Visit / Scheduled</th>
                <th className="px-5 py-3">Recent Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBF0]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0E7490]" />
                    <span>Loading patient records...</span>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No clinical patient records found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.patientId || p.patientName} className="hover:bg-[#F8FAFC]/60 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] flex items-center justify-center font-bold text-xs">
                          {p.patientName.charAt(0) || 'P'}
                        </div>
                        <span>{p.patientName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-mono">{p.patientPhone || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-900 font-semibold">
                      {p.totalVisits} {p.totalVisits === 1 ? 'visit' : 'visits'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{p.lastVisitDate}</td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{p.latestNotes || 'None recorded'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && (
          <div className="p-4 border-t border-[#E2EBF0] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} patients
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#2DA7B5] text-white shadow-xs font-black'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
