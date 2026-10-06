import React, { useState, useEffect, useMemo } from 'react';
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
  MapPin,
  GraduationCap,
  ArrowLeft,
  Users,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { Doctor } from '../../types';
import { useToast } from '../../context/ToastContext';

interface FacilityGroup {
  id: string;
  name: string;
  nameAr?: string;
  type: 'hospital' | 'clinic';
  location: string;
  address?: string;
  phone?: string;
  photo?: string;
  doctors: Doctor[];
  verifiedCount: number;
  pendingCount: number;
}

export const AdminDoctors: React.FC = () => {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation: null = show hospital boxes; FacilityGroup = show that hospital's doctors
  const [selectedFacility, setSelectedFacility] = useState<FacilityGroup | null>(null);

  // Filters for Hospital Boxes view
  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<'all' | 'hospital' | 'clinic'>('all');
  const [facilityStatusFilter, setFacilityStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');

  // Filters for Doctor Roster view
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorStatusFilter, setDoctorStatusFilter] = useState<'all' | 'Active' | 'Deactivated'>('all');

  // Modal
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [doctorsData, providersData] = await Promise.all([
        realAdminService.getDoctors(),
        realAdminService.getProviders(),
      ]);
      setDoctors(doctorsData);
      setProviders(providersData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load doctors and facilities data';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Group doctors by hospital/facility
  const facilityGroups = useMemo<FacilityGroup[]>(() => {
    const map = new Map<string, FacilityGroup>();

    // 1. Initialize from providers directory
    providers.forEach((p) => {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        type: p.type || 'hospital',
        location: p.city || p.location || 'United Arab Emirates',
        address: p.address,
        phone: p.phone,
        photo: p.photo || (p.type === 'clinic' 
          ? 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600'
          : 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600'),
        doctors: [],
        verifiedCount: 0,
        pendingCount: 0,
      });
    });

    // 2. Associate each doctor with their hospital
    const unmatchedDoctors: Doctor[] = [];

    doctors.forEach((doc) => {
      let matched = false;
      const docHospitalId = doc.hospitalId || doc.clinicId;

      if (docHospitalId && map.has(docHospitalId)) {
        const group = map.get(docHospitalId)!;
        group.doctors.push(doc);
        matched = true;
      } else {
        // Match by normalized name
        const docHospitalName = (doc.hospitalName || doc.clinicName || '').trim().toLowerCase();
        for (const group of map.values()) {
          if (docHospitalName && group.name.trim().toLowerCase() === docHospitalName) {
            group.doctors.push(doc);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        unmatchedDoctors.push(doc);
      }
    });

    // 3. If there are unmatched doctors, group them by facility name or as independent
    if (unmatchedDoctors.length > 0) {
      const byName = new Map<string, Doctor[]>();
      unmatchedDoctors.forEach((doc) => {
        const facName = doc.hospitalName || doc.clinicName || 'Independent Medical Practitioners';
        if (!byName.has(facName)) byName.set(facName, []);
        byName.get(facName)!.push(doc);
      });

      byName.forEach((docs, facName) => {
        map.set(`custom-${facName}`, {
          id: `custom-${facName}`,
          name: facName,
          type: 'hospital',
          location: docs[0]?.location || 'United Arab Emirates',
          photo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
          doctors: docs,
          verifiedCount: 0,
          pendingCount: 0,
        });
      });
    }

    // 4. Calculate verification counts
    const result: FacilityGroup[] = [];
    map.forEach((g) => {
      g.verifiedCount = g.doctors.filter((d) => (d.status || 'Active') === 'Active').length;
      g.pendingCount = g.doctors.filter((d) => d.status === 'Deactivated').length;
      result.push(g);
    });

    // Sort: facilities with doctors first, then alphabetical
    return result.sort((a, b) => {
      if (b.doctors.length !== a.doctors.length) {
        return b.doctors.length - a.doctors.length;
      }
      return a.name.localeCompare(b.name);
    });
  }, [providers, doctors]);

  // Keep active selectedFacility synced with updated doctors
  const currentFacility = useMemo(() => {
    if (!selectedFacility) return null;
    return facilityGroups.find((g) => g.id === selectedFacility.id) || selectedFacility;
  }, [facilityGroups, selectedFacility]);

  // Handle Verify or Deactivate status toggle
  const handleToggleStatus = async (doctor: Doctor, newStatus: 'Active' | 'Deactivated') => {
    setIsUpdatingStatus(true);
    try {
      await realAdminService.updateDoctorStatus(doctor.id, newStatus);
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, status: newStatus } : d))
      );
      if (selectedDoctor && selectedDoctor.id === doctor.id) {
        setSelectedDoctor({ ...selectedDoctor, status: newStatus });
      }
      showToast(
        newStatus === 'Active'
          ? `Dr. ${doctor.name} has been verified and activated.`
          : `Dr. ${doctor.name} has been deactivated.`,
        newStatus === 'Active' ? 'success' : 'info'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update doctor status.';
      showToast(msg, 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filtered facilities for main view
  const filteredFacilities = useMemo(() => {
    return facilityGroups.filter((f) => {
      if (facilityTypeFilter !== 'all' && f.type !== facilityTypeFilter) return false;
      if (facilityStatusFilter === 'pending' && f.pendingCount === 0) return false;
      if (facilityStatusFilter === 'verified' && (f.pendingCount > 0 || f.doctors.length === 0)) return false;

      if (facilitySearch.trim()) {
        const q = facilitySearch.toLowerCase();
        const matchFacility = f.name.toLowerCase().includes(q) || f.location.toLowerCase().includes(q);
        const matchDoctor = f.doctors.some(
          (d) => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q)
        );
        return matchFacility || matchDoctor;
      }
      return true;
    });
  }, [facilityGroups, facilityTypeFilter, facilityStatusFilter, facilitySearch]);

  // Filtered doctors inside selected facility
  const filteredDoctorsInFacility = useMemo(() => {
    if (!currentFacility) return [];
    return currentFacility.doctors.filter((d) => {
      const docStatus = d.status || 'Active';
      if (doctorStatusFilter !== 'all' && docStatus !== doctorStatusFilter) return false;

      if (doctorSearch.trim()) {
        const q = doctorSearch.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [currentFacility, doctorStatusFilter, doctorSearch]);

  // Overall statistics
  const totalDoctorsCount = doctors.length;
  const totalVerifiedCount = doctors.filter((d) => (d.status || 'Active') === 'Active').length;
  const totalPendingCount = doctors.filter((d) => d.status === 'Deactivated').length;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS                                               */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          {currentFacility ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedFacility(null);
                  setDoctorSearch('');
                  setDoctorStatusFilter('all');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0E7490] hover:text-[#2DA7B5] mb-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to All Hospitals & Clinics</span>
              </button>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900">{currentFacility.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                  {currentFacility.doctors.length} Doctors Affiliated
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                  {currentFacility.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentFacility.location}</span>
                <span className="text-slate-300">•</span>
                <span>Review doctor licenses, approve newly added practitioners, or manage active roster.</span>
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900">Doctors Verification</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                  {facilityGroups.length} Medical Facilities
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Select a hospital or clinic to review, verify, or deactivate affiliated medical doctors.
              </p>
            </div>
          )}
        </div>

        {/* Global Summary Stats (When on Hospitals View) */}
        {!currentFacility && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total</span>
              <span className="text-sm font-bold text-slate-900">{totalDoctorsCount} Doctors</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Verified</span>
              <span className="text-sm font-bold text-emerald-700">{totalVerifiedCount} Active</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-center min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">Action Needed</span>
              <span className="text-sm font-bold text-amber-700">{totalPendingCount} Unverified</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. VIEW A: HOSPITAL BOXES GRID (Default View)                             */}
      {/* ========================================================================= */}
      {!currentFacility && (
        <div className="space-y-5">
          {/* Filters Bar for Hospitals */}
          <div className="bg-white rounded-2xl border border-[#E2EBF0] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
                <button
                  type="button"
                  onClick={() => setFacilityTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    facilityTypeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Facilities ({facilityGroups.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityTypeFilter('hospital')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    facilityTypeFilter === 'hospital'
                      ? 'bg-white text-[#0E7490] shadow-xs font-bold border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hospitals
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityTypeFilter('clinic')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    facilityTypeFilter === 'clinic'
                      ? 'bg-white text-[#0E7490] shadow-xs font-bold border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Clinics
                </button>
              </div>

              {/* Status Verification Filter */}
              <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
                <button
                  type="button"
                  onClick={() => setFacilityStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    facilityStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Status
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    facilityStatusFilter === 'pending'
                      ? 'bg-white text-amber-700 shadow-xs font-bold border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Has Unverified ({facilityGroups.filter((g) => g.pendingCount > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFacilityStatusFilter('verified')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    facilityStatusFilter === 'verified'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fully Verified
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={facilitySearch}
                onChange={(e) => setFacilitySearch(e.target.value)}
                placeholder="Search facility or doctor..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Hospital Boxes Grid */}
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-[#E2EBF0] p-16 text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading hospitals & doctor rosters...</p>
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E2EBF0] p-12 text-center text-slate-500">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No medical facilities found</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFacilities.map((facility) => {
                const hasPending = facility.pendingCount > 0;
                return (
                  <div
                    key={facility.id}
                    onClick={() => setSelectedFacility(facility)}
                    className="bg-white rounded-2xl border border-[#E2EBF0] hover:border-[#2DA7B5] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer"
                  >
                    {/* Facility Image Header */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={facility.photo}
                        alt={facility.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 text-slate-800 shadow-xs backdrop-blur-xs">
                          {facility.type}
                        </span>
                        {hasPending ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {facility.pendingCount} Needs Verification
                          </span>
                        ) : facility.doctors.length > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 text-white shadow-xs flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-700/80 text-white shadow-xs">
                            No Doctors
                          </span>
                        )}
                      </div>

                      {/* Bottom Info on Image */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-[11px] flex items-center gap-1 text-slate-200 font-medium">
                          <MapPin className="w-3 h-3 text-[#2DA7B5]" />
                          <span>{facility.location}</span>
                        </p>
                      </div>
                    </div>

                    {/* Facility Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base group-hover:text-[#0E7490] transition-colors line-clamp-1">
                          {facility.name}
                        </h3>
                        {facility.address && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {facility.address}
                          </p>
                        )}
                      </div>

                      {/* Doctor Stats & Action Button */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-[#E8F6F8] text-[#0E7490] flex items-center justify-center font-bold text-xs">
                            {facility.doctors.length}
                          </div>
                          <div className="text-[11px]">
                            <span className="font-bold text-slate-800 block">
                              {facility.doctors.length} Doctors
                            </span>
                            <span className="text-slate-400">
                              {facility.verifiedCount} active
                              {hasPending ? ` • ${facility.pendingCount} pending` : ''}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2DA7B5] group-hover:bg-[#0E7490] text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          <span>View Doctors</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW B: DOCTORS ROSTER FOR SELECTED HOSPITAL                           */}
      {/* ========================================================================= */}
      {currentFacility && (
        <div className="space-y-5">
          {/* Hospital Banner Info Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={currentFacility.photo}
                alt={currentFacility.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{currentFacility.name}</h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-200">
                    {currentFacility.type}
                  </span>
                </div>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2DA7B5]" />
                  <span>{currentFacility.location}</span>
                  {currentFacility.phone && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span>Phone: {currentFacility.phone}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Actions in Banner */}
            <div className="flex items-center gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-white/10 text-center border border-white/10">
                <span className="text-[10px] text-slate-300 block uppercase font-bold">Total</span>
                <span className="text-sm font-bold text-white">{currentFacility.doctors.length} Doctors</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-center border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 block uppercase font-bold">Verified</span>
                <span className="text-sm font-bold text-emerald-300">{currentFacility.verifiedCount} Active</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-center border border-amber-500/30">
                <span className="text-[10px] text-amber-300 block uppercase font-bold">Pending</span>
                <span className="text-sm font-bold text-amber-300">{currentFacility.pendingCount} Unverified</span>
              </div>
            </div>
          </div>

          {/* Filters Bar for Doctors Table */}
          <div className="bg-white rounded-2xl border border-[#E2EBF0] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
              <button
                type="button"
                onClick={() => setDoctorStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  doctorStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold border border-[#E2EBF0]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({currentFacility.doctors.length})
              </button>
              <button
                type="button"
                onClick={() => setDoctorStatusFilter('Active')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  doctorStatusFilter === 'Active'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold border border-[#E2EBF0]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Verified Active ({currentFacility.verifiedCount})
              </button>
              <button
                type="button"
                onClick={() => setDoctorStatusFilter('Deactivated')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  doctorStatusFilter === 'Deactivated'
                    ? 'bg-white text-rose-700 shadow-xs font-bold border border-[#E2EBF0]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unverified / Deactivated ({currentFacility.pendingCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Search by doctor or specialty..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Doctors Table */}
          <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
                  <tr>
                    <th className="px-5 py-3">Doctor Details</th>
                    <th className="px-5 py-3">Specialty</th>
                    <th className="px-5 py-3">Experience & Rating</th>
                    <th className="px-5 py-3">Verification Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDoctorsInFacility.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                        <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No doctors found in this facility</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your status filter or search query.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDoctorsInFacility.map((doc) => {
                      const isVerified = (doc.status || 'Active') === 'Active';

                      return (
                        <tr key={doc.id} className="hover:bg-[#F8FAFC] transition-colors">
                          {/* Doctor Avatar & Name */}
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

                          {/* Specialty */}
                          <td className="px-5 py-3.5 text-[#0E7490] font-semibold">
                            {doc.specialty}
                          </td>

                          {/* Experience & Rating */}
                          <td className="px-5 py-3.5 text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <span className="flex items-center text-amber-600 font-bold">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                                {doc.rating}
                              </span>
                              <span className="text-slate-400 font-normal">({doc.experience})</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-5 py-3.5">
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Verified & Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Newly Added (Unverified)
                              </span>
                            )}
                          </td>

                          {/* Actions: View Doctor + Verify (if unverified) or Deactivate (if verified) */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              {/* 1. View Doctor Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedDoctor(doc)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] text-slate-700 rounded-xl text-xs font-semibold transition-all border border-[#E2EBF0] cursor-pointer shadow-2xs whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View Doctor</span>
                              </button>

                              {/* 2. Conditional Verify vs Deactivate Button */}
                              {!isVerified ? (
                                <button
                                  type="button"
                                  disabled={isUpdatingStatus}
                                  onClick={() => handleToggleStatus(doc, 'Active')}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                  title="Approve credentials and activate doctor"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Verify</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isUpdatingStatus}
                                  onClick={() => handleToggleStatus(doc, 'Deactivated')}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50 whitespace-nowrap"
                                  title="Deactivate doctor from public bookings"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Deactivate</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DOCTOR PROFILE & VERIFICATION MODAL                                    */}
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
                    {(selectedDoctor.status || 'Active') === 'Active' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Verified Specialist
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Unverified
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#0E7490]">{selectedDoctor.specialty}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedDoctor.hospitalName || selectedDoctor.clinicName || 'Medical Facility'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">System ID: {selectedDoctor.id}</p>
                </div>
              </div>

              {/* Status Alert Banner */}
              {(selectedDoctor.status || 'Active') === 'Active' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 space-y-0.5">
                    <span className="font-bold block text-sm">Status: Verified & Active</span>
                    <p className="text-emerald-700 leading-relaxed">
                      This doctor is verified by platform administrators, listed in public directories, and accepting active patient appointments.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-0.5">
                    <span className="font-bold block text-sm">Status: Newly Added / Unverified</span>
                    <p className="text-amber-800 leading-relaxed">
                      This doctor requires administrator verification before their profile is published for patient bookings. Click &quot;Verify Doctor&quot; below to approve credentials.
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
                    {selectedDoctor.about || 'Specialist practitioner providing patient care.'}
                  </p>
                </div>

                {/* Available Slots Preview */}
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-4 h-4 text-[#2DA7B5]" />
                    <span>Rostered Slots Preview</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoctor.availableSlots && selectedDoctor.availableSlots.length > 0 ? (
                      selectedDoctor.availableSlots.slice(0, 8).map((slot) => (
                        <span
                          key={slot}
                          className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] text-slate-700 text-[11px] font-mono font-medium border border-[#E2EBF0]"
                        >
                          {slot}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-xs">No active slots configured</span>
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
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isUpdatingStatus ? 'Updating...' : 'Verify Doctor'}</span>
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
