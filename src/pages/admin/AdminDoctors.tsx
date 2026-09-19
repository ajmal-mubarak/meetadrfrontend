import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Star,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Calendar,
  Clock,
  ExternalLink,
  X,
  ShieldCheck,
  Award,
  AlertTriangle,
  BadgePercent,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { Doctor } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminDoctors: React.FC = () => {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Deactivated'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (doctor: Doctor, newStatus: 'Active' | 'Deactivated') => {
    setIsUpdatingStatus(true);
    try {
      await doctorService.updateDoctorStatus(doctor.id, newStatus);
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, status: newStatus } : d))
      );
      if (selectedDoctor && selectedDoctor.id === doctor.id) {
        setSelectedDoctor({ ...selectedDoctor, status: newStatus });
      }
      showToast(
        newStatus === 'Active'
          ? `${doctor.name} has been activated successfully.`
          : `${doctor.name} has been deactivated.`,
        newStatus === 'Active' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update doctor status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filtered = doctors.filter((d) => {
    const docStatus = d.status || 'Active';
    if (statusFilter !== 'all' && docStatus !== statusFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        (d.hospitalName && d.hospitalName.toLowerCase().includes(q)) ||
        d.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = doctors.filter((d) => (d.status || 'Active') === 'Active').length;
  const deactivatedCount = doctors.filter((d) => d.status === 'Deactivated').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Manage Doctors</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
              {doctors.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global directory of licensed medical practitioners, credentials, and real-time status management.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Pills Filter */}
          <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({doctors.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'Active'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Deactivated')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'Deactivated'
                  ? 'bg-white text-rose-700 shadow-xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deactivated ({deactivatedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor, specialty, facility..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
              <tr>
                <th className="px-5 py-3">Doctor Name</th>
                <th className="px-5 py-3">Specialty</th>
                <th className="px-5 py-3">Facility</th>
                <th className="px-5 py-3">Experience & Rating</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading medical practitioners...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No doctors found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => {
                  const isDocActive = (doc.status || 'Active') === 'Active';
                  return (
                    <tr key={doc.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <img
                            src={doc.photo}
                            alt={doc.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 shrink-0 border border-[#E2EBF0]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-slate-900 font-bold">{doc.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {doc.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#0E7490] font-semibold">
                        {doc.specialty}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {doc.hospitalName || doc.clinicName || 'City Care Hospital'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center text-amber-600 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                            {doc.rating}
                          </span>
                          <span className="text-slate-400 font-normal">({doc.experience})</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {isDocActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedDoctor(doc)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] text-slate-700 rounded-xl text-xs font-semibold transition-all border border-[#E2EBF0] cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Doctor</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOCTOR DETAILS & ACTIVATION / DEACTIVATION MODAL                         */}
      {/* ========================================================================= */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E2EBF0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2EBF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#2DA7B5]" />
                <h2 className="text-base font-bold text-slate-900">Doctor Profile & Verification</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Doctor Hero Card */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] flex flex-col sm:flex-row sm:items-center gap-4">
                <img
                  src={selectedDoctor.photo}
                  alt={selectedDoctor.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedDoctor.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                      <ShieldCheck className="w-3 h-3 text-[#2DA7B5]" />
                      Licensed Specialist
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0E7490]">{selectedDoctor.specialty}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedDoctor.hospitalName || selectedDoctor.clinicName || 'City Care Hospital'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">System ID: {selectedDoctor.id}</p>
                </div>
              </div>

              {/* Status Alert Banner */}
              {(selectedDoctor.status || 'Active') === 'Active' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 space-y-0.5">
                    <span className="font-bold block text-sm">Status: Active</span>
                    <p className="text-emerald-700 leading-relaxed">
                      This doctor is actively listed in search results, accepts in-person patient bookings, and can receive consultation inquiries.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 space-y-0.5">
                    <span className="font-bold block text-sm">Status: Deactivated / Suspended</span>
                    <p className="text-rose-700 leading-relaxed">
                      Public appointment bookings are suspended for this practitioner. They will not accept new bookings until reactivated by an administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Experience</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedDoctor.experience}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Patient Rating</span>
                  <span className="font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {selectedDoctor.rating} ({selectedDoctor.reviewCount} reviews)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Consultation Fee</span>
                  <span className="font-bold text-[#0E7490] mt-0.5 block">AED {selectedDoctor.consultationFee || 350}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Location</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{selectedDoctor.location}</span>
                </div>
              </div>

              {/* Education & Bio */}
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <GraduationCap className="w-4 h-4 text-[#2DA7B5]" />
                    <span>Education & Board Certification</span>
                  </h4>
                  <p className="text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2EBF0] leading-relaxed">
                    {selectedDoctor.education || 'MD, Board Certified in Specialist Medicine'}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <Award className="w-4 h-4 text-[#2DA7B5]" />
                    <span>About & Clinical Focus</span>
                  </h4>
                  <p className="text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2EBF0] leading-relaxed">
                    {selectedDoctor.about}
                  </p>
                </div>

                {/* Available Slots Preview */}
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-4 h-4 text-[#2DA7B5]" />
                    <span>Rostered Slots Preview</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoctor.availableSlots.slice(0, 8).map((slot) => (
                      <span
                        key={slot}
                        className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] text-slate-700 text-[11px] font-mono font-medium border border-[#E2EBF0]"
                      >
                        {slot}
                      </span>
                    ))}
                    {selectedDoctor.availableSlots.length > 8 && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] text-slate-500 text-[11px] font-mono border border-[#E2EBF0]">
                        +{selectedDoctor.availableSlots.length - 8} more slots
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer / Action Bar */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2EBF0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                to={`/doctors/${selectedDoctor.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#0E7490] hover:text-[#2DA7B5] flex items-center gap-1 cursor-pointer"
              >
                <span>View Public Profile Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="px-4 py-2.5 bg-white hover:bg-[#F8FAFC] text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-[#E2EBF0] cursor-pointer shadow-2xs"
                >
                  Close
                </button>

                {(selectedDoctor.status || 'Active') === 'Active' ? (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleToggleStatus(selectedDoctor, 'Deactivated')}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isUpdatingStatus ? 'Updating...' : 'Deactivate Doctor'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleToggleStatus(selectedDoctor, 'Active')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isUpdatingStatus ? 'Updating...' : 'Activate Doctor'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
