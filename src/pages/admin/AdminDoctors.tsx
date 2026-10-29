import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Calendar,
  Clock,
  X,
  MapPin,
  GraduationCap,
  Users,
  CheckSquare,
  Square,
  Filter,
  AlertTriangle,
  Stethoscope,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { Doctor } from '../../types';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_DOCTOR_AVATAR } from '../../utils/avatar';

export const AdminDoctors: React.FC = () => {
  const { showToast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verification filter: 'pending' (default) | 'verified' | 'all'
  const [verificationTab, setVerificationTab] = useState<'pending' | 'verified' | 'all'>('pending');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [affiliationFilter, setAffiliationFilter] = useState<'all' | 'hospital' | 'independent'>('all');

  // Multi-select for bulk verification
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // View Doctor Credentials Modal
  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [isProcessingSingle, setIsProcessingSingle] = useState(false);

  // Load doctors and providers
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docs, provs] = await Promise.all([
        realAdminService.getDoctors(),
        realAdminService.getProviders(),
      ]);
      setDoctors(docs);
      setProviders(provs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load doctors for verification', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Tab filter
      if (verificationTab === 'pending' && doc.isVerified) return false;
      if (verificationTab === 'verified' && !doc.isVerified) return false;

      // Affiliation filter
      const isAffiliated = !!(doc.hospitalId || doc.hospitalName);
      if (affiliationFilter === 'hospital' && !isAffiliated) return false;
      if (affiliationFilter === 'independent' && isAffiliated) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpecialty = (doc.specialty || '').toLowerCase().includes(q);
        const matchesLocation = (doc.location || '').toLowerCase().includes(q);
        const matchesHospital = (doc.hospitalName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSpecialty && !matchesLocation && !matchesHospital) {
          return false;
        }
      }

      return true;
    });
  }, [doctors, verificationTab, affiliationFilter, searchQuery]);

  // Counts
  const pendingCount = useMemo(() => doctors.filter((d) => !d.isVerified).length, [doctors]);
  const verifiedCount = useMemo(() => doctors.filter((d) => d.isVerified).length, [doctors]);

  // Bulk Selection
  const handleToggleSelectAll = () => {
    if (selectedDoctorIds.length === filteredDoctors.length) {
      setSelectedDoctorIds([]);
    } else {
      setSelectedDoctorIds(filteredDoctors.map((d) => d.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'verify' | 'deactivate') => {
    if (selectedDoctorIds.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const res = await realAdminService.bulkDoctorAction(selectedDoctorIds, action);
      showToast(res.message || `Bulk ${action === 'verify' ? 'verification' : 'rejection'} completed.`, 'success');
      setSelectedDoctorIds([]);
      await loadData();
    } catch (err: any) {
      showToast(err.message || `Failed to perform bulk action.`, 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Single Doctor Verify / Reject
  const handleVerifyDoctor = async (doctor: Doctor, verify: boolean) => {
    setIsProcessingSingle(true);
    try {
      if (verify) {
        await realAdminService.updateDoctorStatus(doctor.id, 'Active');
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === doctor.id
              ? { ...d, isVerified: true, status: 'Active', isActive: true }
              : d
          )
        );
        if (viewDoctor && viewDoctor.id === doctor.id) {
          setViewDoctor({ ...viewDoctor, isVerified: true, status: 'Active', isActive: true });
        }
        showToast(`Dr. ${doctor.name} has been verified and account activated!`, 'success');
      } else {
        await realAdminService.updateDoctorStatus(doctor.id, 'Deactivated');
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === doctor.id
              ? { ...d, isVerified: false, status: 'Deactivated', isActive: false }
              : d
          )
        );
        if (viewDoctor && viewDoctor.id === doctor.id) {
          setViewDoctor({ ...viewDoctor, isVerified: false, status: 'Deactivated', isActive: false });
        }
        showToast(`Dr. ${doctor.name} status updated to unverified/deactivated.`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update verification status.', 'error');
    } finally {
      setIsProcessingSingle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Doctors Verification</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Strictly for verifying credentials and activating doctor accounts created by hospitals, clinics, or self-registration
            </p>
          </div>
        </div>

        {/* Link to Doctor Management for Full Add/Edit/Delete */}
        <Link
          to="/admin/doctors-manage"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
        >
          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
          <span>Go to Doctors Management (Add/Edit/Delete)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setVerificationTab('pending');
              setSelectedDoctorIds([]);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              verificationTab === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pending Verification ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setVerificationTab('verified');
              setSelectedDoctorIds([]);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              verificationTab === 'verified'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Verified Doctors ({verifiedCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setVerificationTab('all');
              setSelectedDoctorIds([]);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              verificationTab === 'all'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Doctors ({doctors.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <span>Affiliation:</span>
            <select
              aria-label="Filter doctors by affiliation"
              value={affiliationFilter}
              onChange={(e) => setAffiliationFilter(e.target.value as any)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="hospital">Hospital Affiliated</option>
              <option value="independent">Independent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedDoctorIds.length > 0 && (
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-teal-500/30 flex items-center justify-center text-xs font-bold border border-teal-400/50">
              {selectedDoctorIds.length}
            </span>
            <span className="text-sm font-semibold">
              {selectedDoctorIds.length} {selectedDoctorIds.length === 1 ? 'doctor' : 'doctors'} selected for verification
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkProcessing}
              onClick={() => handleBulkAction('verify')}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Bulk Verify & Activate ({selectedDoctorIds.length})
            </button>
            <button
              type="button"
              disabled={isBulkProcessing}
              onClick={() => handleBulkAction('deactivate')}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              Bulk Reject / Unverify
            </button>
            <button
              type="button"
              onClick={() => setSelectedDoctorIds([])}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Verification Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    aria-label={selectedDoctorIds.length === filteredDoctors.length && filteredDoctors.length > 0 ? 'Deselect all' : 'Select all'}
                    className="text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    {selectedDoctorIds.length === filteredDoctors.length && filteredDoctors.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Doctor Details</th>
                <th className="py-3.5 px-4">Specialty & Education</th>
                <th className="py-3.5 px-4">Created By / Affiliation</th>
                <th className="py-3.5 px-4">Fee & Location</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500 font-medium">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      Loading verification queue...
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-base font-bold text-slate-700">
                      {verificationTab === 'pending'
                        ? 'No pending doctor verifications!'
                        : 'No doctors match this verification filter'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {verificationTab === 'pending'
                        ? 'All registered and affiliated doctors have been verified and activated.'
                        : 'Try selecting a different tab or clearing search filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSelected = selectedDoctorIds.includes(doc.id);
                  const isDocVerified = !!doc.isVerified;

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-teal-50/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(doc.id)}
                          aria-label={`Select ${doc.name}`}
                          className="text-slate-400 hover:text-teal-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-teal-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={doc.photo || DEFAULT_DOCTOR_AVATAR}
                            alt={doc.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_DOCTOR_AVATAR;
                            }}
                          />
                          <div>
                            <div
                              onClick={() => setViewDoctor(doc)}
                              className="font-bold text-slate-900 hover:text-teal-600 transition-colors cursor-pointer"
                            >
                              Dr. {doc.name}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>ID: {doc.id.slice(0, 8)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold border border-teal-200">
                            {doc.specialty}
                          </span>
                          <div className="text-slate-500">{doc.education || 'MBBS'}</div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          {doc.hospitalName ? (
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="truncate max-w-[170px]">{doc.hospitalName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">Independent Practice</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-800">{doc.specialty}</div>
                        <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {doc.location || 'Dubai'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isDocVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Verified & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pending Verification
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewDoctor(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>

                          {!isDocVerified ? (
                            <button
                              type="button"
                              onClick={() => handleVerifyDoctor(doc, true)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Verify & Activate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVerifyDoctor(doc, false)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-lg transition-colors border border-rose-200"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject / Unverify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW CREDENTIALS MODAL */}
      {viewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={viewDoctor.photo || DEFAULT_DOCTOR_AVATAR}
                  alt={viewDoctor.name}
                  className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                />
                <div>
                  <h3 className="text-xl font-black text-slate-900">Dr. {viewDoctor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold">
                      {viewDoctor.specialty}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {viewDoctor.location}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDoctor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verification Status Header */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                viewDoctor.isVerified
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck
                  className={`w-5 h-5 ${viewDoctor.isVerified ? 'text-emerald-600' : 'text-amber-600'}`}
                />
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">
                    {viewDoctor.isVerified ? 'Account Verified & Active' : 'Account Pending Verification'}
                  </span>
                  <span className="text-xs opacity-80">
                    {viewDoctor.isVerified
                      ? 'Doctor is fully authorized to receive patient bookings on the platform.'
                      : 'Doctor account is deactivated until an administrator verifies credentials.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Credentials Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Practice Affiliation</span>
                <div className="font-bold text-slate-800 mt-1">
                  {viewDoctor.hospitalName || 'Independent Practice'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Education / Degrees</span>
                <div className="font-bold text-slate-800 mt-1">{viewDoctor.education || 'MBBS, MD'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Clinical Experience</span>
                <div className="font-bold text-slate-800 mt-1">{viewDoctor.experienceYears || 1} Years</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Consultation Type</span>
                <div className="font-bold text-teal-700 mt-1">In-Person Clinic Visit</div>
              </div>
            </div>

            {viewDoctor.about && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-medium block mb-1">Biography / Experience</span>
                <p className="text-slate-700 leading-relaxed">{viewDoctor.about}</p>
              </div>
            )}

            {/* Verification Actions in Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDoctor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!viewDoctor.isVerified ? (
                  <button
                    type="button"
                    disabled={isProcessingSingle}
                    onClick={() => handleVerifyDoctor(viewDoctor, true)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verify & Activate Doctor
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessingSingle}
                    onClick={() => handleVerifyDoctor(viewDoctor, false)}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject / Unverify
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
