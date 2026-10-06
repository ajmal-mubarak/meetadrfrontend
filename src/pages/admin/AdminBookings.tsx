import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Phone,
  ArrowLeft,
  Building2,
  Stethoscope,
  Users,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { Appointment, Doctor } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CancelModal } from '../../components/common/CancelModal';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

interface HospitalCardGroup {
  id: string;
  name: string;
  nameAr?: string;
  type: 'hospital' | 'clinic';
  location: string;
  address?: string;
  phone?: string;
  photo: string;
  doctors: Doctor[];
  bookings: Appointment[];
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
}

export const AdminBookings: React.FC = () => {
  const { showToast } = useToast();
  const { t, isRTL, isArabic, translateSpecialty } = useTranslation();

  // Primary data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drilldown states:
  // selectedFacility: null = show all hospital boxes
  // selectedDoctorId: null = show all bookings for that hospital, or specific doctor ID
  const [selectedFacility, setSelectedFacility] = useState<HospitalCardGroup | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // View toggle: 'boxes' (browse by hospital) or 'all-table' (flat table across ecosystem)
  const [viewMode, setViewMode] = useState<'boxes' | 'all-table'>('boxes');

  // Filters for Hospital boxes view
  const [facilitySearch, setFacilitySearch] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<'all' | 'hospital' | 'clinic'>('all');

  // Filters for Bookings table
  const [bookingStatus, setBookingStatus] = useState<string>('all');
  const [bookingSearch, setBookingSearch] = useState<string>('');
  const [cancellingAppt, setCancellingAppt] = useState<Appointment | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [apptsData, providersData, doctorsData] = await Promise.all([
        realAdminService.getBookings(),
        realAdminService.getProviders(),
        realAdminService.getDoctors(),
      ]);
      setAppointments(apptsData);
      setProviders(providersData);
      setDoctors(doctorsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load bookings and facilities data';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Synchronize selectedFacility reference if appointments change
  useEffect(() => {
    if (selectedFacility) {
      const updated = facilityGroups.find((g) => g.id === selectedFacility.id);
      if (updated) {
        setSelectedFacility(updated);
      }
    }
  }, [appointments, providers, doctors]);

  // Group appointments and doctors into hospital / clinic cards
  const facilityGroups = useMemo<HospitalCardGroup[]>(() => {
    const map = new Map<string, HospitalCardGroup>();

    // 1. Initialize known providers from directory
    providers.forEach((p) => {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        nameAr: p.nameAr,
        type: p.providerCategory === 'Clinic' ? 'clinic' : 'hospital',
        location: p.location || 'United Arab Emirates',
        address: p.address,
        phone: p.phone,
        photo:
          p.photo ||
          (p.providerCategory === 'Clinic'
            ? 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600'
            : 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600'),
        doctors: [],
        bookings: [],
        confirmedCount: 0,
        completedCount: 0,
        cancelledCount: 0,
      });
    });

    // 2. Associate doctors with facilities
    doctors.forEach((doc) => {
      const facilityId = doc.hospitalId || doc.clinicId;
      if (facilityId && map.has(facilityId)) {
        map.get(facilityId)!.doctors.push(doc);
      } else {
        const docHospitalName = (doc.hospitalName || doc.clinicName || '').trim().toLowerCase();
        for (const grp of map.values()) {
          if (docHospitalName && grp.name.trim().toLowerCase() === docHospitalName) {
            grp.doctors.push(doc);
            break;
          }
        }
      }
    });

    // 3. Associate appointments with facilities
    const unmatchedAppts: Appointment[] = [];
    appointments.forEach((appt) => {
      let matched = false;
      const apptFacilityId = appt.hospitalId || appt.clinicId;

      if (apptFacilityId && map.has(apptFacilityId)) {
        map.get(apptFacilityId)!.bookings.push(appt);
        matched = true;
      } else {
        const apptFacilityName = (appt.facilityName || appt.hospitalName || appt.providerName || '').trim().toLowerCase();
        for (const grp of map.values()) {
          if (apptFacilityName && grp.name.trim().toLowerCase() === apptFacilityName) {
            grp.bookings.push(appt);
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        // Try matching by doctor's affiliated facility
        if (appt.doctorId) {
          const doc = doctors.find((d) => d.id === appt.doctorId);
          if (doc) {
            const docFacilityId = doc.hospitalId || doc.clinicId;
            if (docFacilityId && map.has(docFacilityId)) {
              map.get(docFacilityId)!.bookings.push(appt);
              matched = true;
            }
          }
        }
      }

      if (!matched) {
        unmatchedAppts.push(appt);
      }
    });

    // 4. Calculate status counters for each facility
    map.forEach((grp) => {
      grp.confirmedCount = grp.bookings.filter((b) => b.status?.toLowerCase() === 'confirmed').length;
      grp.completedCount = grp.bookings.filter((b) => b.status?.toLowerCase() === 'completed').length;
      grp.cancelledCount = grp.bookings.filter((b) => b.status?.toLowerCase() === 'cancelled').length;
    });

    const groupsList = Array.from(map.values());

    // 5. If there are unmatched appointments, group them into a virtual "Other Partner Clinics" group
    if (unmatchedAppts.length > 0) {
      groupsList.push({
        id: 'unassigned-facilities',
        name: isArabic ? 'مراكز وعيادات أخرى' : 'Other Partner Clinics & General Practice',
        type: 'clinic',
        location: 'UAE General Practice',
        photo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
        doctors: [],
        bookings: unmatchedAppts,
        confirmedCount: unmatchedAppts.filter((b) => b.status?.toLowerCase() === 'confirmed').length,
        completedCount: unmatchedAppts.filter((b) => b.status?.toLowerCase() === 'completed').length,
        cancelledCount: unmatchedAppts.filter((b) => b.status?.toLowerCase() === 'cancelled').length,
      });
    }

    // Sort facilities: those with bookings first, then by name
    return groupsList.sort((a, b) => {
      if (b.bookings.length !== a.bookings.length) {
        return b.bookings.length - a.bookings.length;
      }
      return a.name.localeCompare(b.name);
    });
  }, [appointments, providers, doctors, isArabic]);

  // Filtered hospital boxes
  const filteredFacilityGroups = useMemo(() => {
    return facilityGroups.filter((g) => {
      if (facilityTypeFilter !== 'all' && g.type !== facilityTypeFilter) return false;
      if (facilitySearch.trim()) {
        const q = facilitySearch.toLowerCase();
        return (
          g.name.toLowerCase().includes(q) ||
          (g.nameAr && g.nameAr.toLowerCase().includes(q)) ||
          g.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [facilityGroups, facilityTypeFilter, facilitySearch]);

  // Appointments for the current table view
  const currentViewAppointments = useMemo(() => {
    let list: Appointment[] = [];

    if (viewMode === 'all-table' || !selectedFacility) {
      list = appointments;
    } else {
      list = selectedFacility.bookings;

      // Filter by doctor if selected
      if (selectedDoctorId) {
        list = list.filter((a) => {
          if (a.doctorId === selectedDoctorId) return true;
          // Match by doctor name if ID doesn't directly correlate
          const targetDoctor = selectedFacility.doctors.find((d) => d.id === selectedDoctorId);
          if (targetDoctor && a.doctorName.trim().toLowerCase() === targetDoctor.name.trim().toLowerCase()) {
            return true;
          }
          return false;
        });
      }
    }

    // Apply status filter
    if (bookingStatus !== 'all') {
      list = list.filter((a) => a.status?.toLowerCase() === bookingStatus.toLowerCase());
    }

    // Apply search filter
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      list = list.filter((a) => {
        return (
          a.id.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          (a.facilityName && a.facilityName.toLowerCase().includes(q)) ||
          (a.hospitalName && a.hospitalName.toLowerCase().includes(q)) ||
          (a.patientPhone && a.patientPhone.includes(q)) ||
          (a.date && a.date.includes(q))
        );
      });
    }

    return list;
  }, [appointments, selectedFacility, selectedDoctorId, viewMode, bookingStatus, bookingSearch]);

  const handleCancelConfirm = async (reason: string) => {
    if (!cancellingAppt) return;
    try {
      await realAdminService.cancelBooking(cancellingAppt.id, reason);
      showToast(isArabic ? 'تم إلغاء الموعد بواسطة الإدارة.' : 'Appointment cancelled by Administrator.', 'info');
      setCancellingAppt(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel appointment', 'error');
    }
  };

  const statusLabel = (st: string) => {
    if (st === 'all') return t('adminPortal.filterAll') || 'All Statuses';
    if (st === 'confirmed') return t('status.confirmed') || 'Confirmed';
    if (st === 'completed') return t('status.completed') || 'Completed';
    if (st === 'cancelled') return t('status.cancelled') || 'Cancelled';
    return st;
  };

  const activeDoctor = useMemo(() => {
    if (!selectedFacility || !selectedDoctorId) return null;
    return selectedFacility.doctors.find((d) => d.id === selectedDoctorId) || null;
  }, [selectedFacility, selectedDoctorId]);

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {isArabic ? 'سجل حجوزات ومواعيد المستشفيات' : 'Ecosystem Appointments Registry'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0E7490]/10 text-[#0E7490]">
              {appointments.length} {isArabic ? 'حجز' : 'Bookings'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isArabic
              ? 'اختر أي مستشفى أو مركز لعرض مواعيده وتصفح حجوزات كل طبيب على حدة.'
              : 'Select any hospital or clinic box to inspect its bookings and drill down into each doctor’s reservations.'}
          </p>
        </div>

        {/* View Toggle: Hospital Boxes vs Flat Ecosystem Table */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
            <button
              onClick={() => {
                setViewMode('boxes');
                setSelectedFacility(null);
                setSelectedDoctorId(null);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'boxes' && !selectedFacility
                  ? 'bg-white text-[#0E7490] shadow-xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{isArabic ? 'المستشفيات والعيادات' : 'Hospital Boxes'}</span>
            </button>
            <button
              onClick={() => {
                setViewMode('all-table');
                setSelectedFacility(null);
                setSelectedDoctorId(null);
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'all-table'
                  ? 'bg-white text-[#0E7490] shadow-xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isArabic ? 'جدول كافة الحجوزات' : 'All Bookings Log'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: HOSPITAL BOXES GRID */}
      {viewMode === 'boxes' && !selectedFacility && (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#E2EBF0] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">{isArabic ? 'إجمالي الحجوزات' : 'Total Bookings'}</span>
                <Calendar className="w-4 h-4 text-[#0E7490]" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{appointments.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {isArabic ? 'عبر جميع المرافق الطبية' : 'Across all medical facilities'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2EBF0] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-medium text-slate-500">{isArabic ? 'مؤكدة' : 'Confirmed'}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {appointments.filter((a) => a.status?.toLowerCase() === 'confirmed').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {isArabic ? 'جاهزة للحضور' : 'Upcoming scheduled appointments'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2EBF0] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-sky-600 mb-2">
                <span className="text-xs font-medium text-slate-500">{isArabic ? 'مكتملة' : 'Completed'}</span>
                <TrendingUp className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-bold text-sky-600">
                {appointments.filter((a) => a.status?.toLowerCase() === 'completed').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {isArabic ? 'استشارات منتهية بنجاح' : 'Fulfilled consultations'}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2EBF0] p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">{isArabic ? 'المرافق الطبية النشطة' : 'Active Providers'}</span>
                <Building2 className="w-4 h-4 text-[#2DA7B5]" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{providers.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                {facilityGroups.filter((g) => g.bookings.length > 0).length} {isArabic ? 'لديها حجوزات نشطة' : 'have current bookings'}
              </div>
            </div>
          </div>

          {/* Hospital Search & Filter Bar */}
          <div className="bg-white rounded-2xl border border-[#E2EBF0] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#0E7490]" />
                {isArabic ? 'تصفية المنشآت:' : 'Filter Facilities:'}
              </span>
              <div className="flex rounded-xl bg-[#F8FAFC] p-1 text-xs font-medium border border-[#E2EBF0] w-full sm:w-auto">
                <button
                  onClick={() => setFacilityTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    facilityTypeFilter === 'all'
                      ? 'bg-white text-[#0E7490] font-bold shadow-2xs border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isArabic ? 'الكل' : 'All'} ({facilityGroups.length})
                </button>
                <button
                  onClick={() => setFacilityTypeFilter('hospital')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    facilityTypeFilter === 'hospital'
                      ? 'bg-white text-[#0E7490] font-bold shadow-2xs border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isArabic ? 'المستشفيات' : 'Hospitals'} (
                  {facilityGroups.filter((g) => g.type === 'hospital').length})
                </button>
                <button
                  onClick={() => setFacilityTypeFilter('clinic')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    facilityTypeFilter === 'clinic'
                      ? 'bg-white text-[#0E7490] font-bold shadow-2xs border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isArabic ? 'العيادات' : 'Clinics'} (
                  {facilityGroups.filter((g) => g.type === 'clinic').length})
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
              <input
                type="text"
                value={facilitySearch}
                onChange={(e) => setFacilitySearch(e.target.value)}
                placeholder={isArabic ? 'ابحث باسم المستشفى أو الإمارة...' : 'Search by hospital or city...'}
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Hospital Boxes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFacilityGroups.map((facility) => {
              const totalBookings = facility.bookings.length;
              const hasBookings = totalBookings > 0;

              return (
                <div
                  key={facility.id}
                  onClick={() => {
                    setSelectedFacility(facility);
                    setSelectedDoctorId(null);
                  }}
                  className="bg-white rounded-2xl border border-[#E2EBF0] overflow-hidden shadow-xs hover:shadow-md hover:border-[#0E7490] transition-all cursor-pointer flex flex-col group relative"
                >
                  {/* Card Cover & Photo */}
                  <div className="h-36 relative overflow-hidden bg-slate-100">
                    <img
                      src={facility.photo}
                      alt={facility.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Facility Type Badge */}
                    <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${
                          facility.type === 'hospital'
                            ? 'bg-blue-600/90 text-white shadow-xs'
                            : 'bg-emerald-600/90 text-white shadow-xs'
                        }`}
                      >
                        {facility.type === 'hospital'
                          ? isArabic
                            ? 'مستشفى'
                            : 'Hospital'
                          : isArabic
                          ? 'عيادة تخصصية'
                          : 'Clinic'}
                      </span>
                    </div>

                    {/* Booking Count Pill on Photo */}
                    <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-1.5 ${
                          hasBookings
                            ? 'bg-[#0E7490] text-white shadow-md'
                            : 'bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {totalBookings} {isArabic ? 'حجز' : 'Bookings'}
                        </span>
                      </span>
                    </div>

                    {/* Facility Name on Cover Bottom */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-bold text-base truncate leading-snug drop-shadow-sm">
                        {isArabic && facility.nameAr ? facility.nameAr : facility.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-200 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-[#2DA7B5] shrink-0" />
                        <span>{facility.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    {/* Doctors Count & Breakdown */}
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-[#F8FAFC] p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0E7490]" />
                        <span className="font-semibold text-slate-800">
                          {facility.doctors.length} {isArabic ? 'أطباء معتمدين' : 'Doctors rostered'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {facility.phone || '+971 4 000 0000'}
                      </span>
                    </div>

                    {/* Booking Status Mini Chips */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                        <div className="text-[10px] text-emerald-700 font-medium">
                          {isArabic ? 'مؤكدة' : 'Confirmed'}
                        </div>
                        <div className="text-sm font-bold text-emerald-800 mt-0.5">
                          {facility.confirmedCount}
                        </div>
                      </div>

                      <div className="bg-sky-50 rounded-lg p-2 border border-sky-100">
                        <div className="text-[10px] text-sky-700 font-medium">
                          {isArabic ? 'مكتملة' : 'Completed'}
                        </div>
                        <div className="text-sm font-bold text-sky-800 mt-0.5">
                          {facility.completedCount}
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-200">
                        <div className="text-[10px] text-slate-600 font-medium">
                          {isArabic ? 'ملغاة' : 'Cancelled'}
                        </div>
                        <div className="text-sm font-bold text-slate-700 mt-0.5">
                          {facility.cancelledCount}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0E7490] to-[#2DA7B5] hover:from-[#0c627a] hover:to-[#258d99] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md transition-all">
                      <span>{isArabic ? 'عرض الحجوزات والأطباء' : 'View Bookings & Doctors'}</span>
                      <ChevronRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredFacilityGroups.length === 0 && (
            <div className="bg-white rounded-2xl border border-[#E2EBF0] p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">
                {isArabic ? 'لا توجد منشآت مطابقة' : 'No Facilities Found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isArabic ? 'يرجى تجربة البحث باسم آخر أو إزالة التصفية.' : 'Try adjusting your search query or filter options.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SELECTED HOSPITAL DRILL-DOWN (Doctors Boxes & Hospital Bookings) */}
      {viewMode === 'boxes' && selectedFacility && (
        <div className="space-y-6">
          {/* Breadcrumb & Facility Banner */}
          <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedFacility(null);
                    setSelectedDoctorId(null);
                  }}
                  className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2EBF0] text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  <span>{isArabic ? 'العودة لقائمة المستشفيات' : 'Back to All Hospitals'}</span>
                </button>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {isArabic ? 'سجل الحجوزات' : 'Bookings'} /
                  </span>
                  <span className="text-xs font-bold text-[#0E7490]">
                    {isArabic && selectedFacility.nameAr ? selectedFacility.nameAr : selectedFacility.name}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0E7490]/10 text-[#0E7490] border border-[#0E7490]/20">
                  {selectedFacility.bookings.length} {isArabic ? 'إجمالي الحجوزات' : 'Total Bookings'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {selectedFacility.doctors.length} {isArabic ? 'أطباء' : 'Doctors'}
                </span>
              </div>
            </div>

            {/* Selected Hospital Details Card */}
            <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedFacility.photo}
                  alt={selectedFacility.name}
                  className="w-16 h-16 rounded-xl object-cover border border-[#E2EBF0] shadow-2xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {isArabic && selectedFacility.nameAr ? selectedFacility.nameAr : selectedFacility.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                      {selectedFacility.type}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#2DA7B5]" />
                      {selectedFacility.location}
                    </span>
                    {selectedFacility.phone && (
                      <span className="flex items-center gap-1" dir="ltr">
                        <Phone className="w-3.5 h-3.5 text-[#2DA7B5]" />
                        {selectedFacility.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Mini counters */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-center">
                  <div className="text-[10px] font-medium">{isArabic ? 'مؤكدة' : 'Confirmed'}</div>
                  <div className="text-xs font-bold">{selectedFacility.confirmedCount}</div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-sky-800 text-center">
                  <div className="text-[10px] font-medium">{isArabic ? 'مكتملة' : 'Completed'}</div>
                  <div className="text-xs font-bold">{selectedFacility.completedCount}</div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-center">
                  <div className="text-[10px] font-medium">{isArabic ? 'ملغاة' : 'Cancelled'}</div>
                  <div className="text-xs font-bold">{selectedFacility.cancelledCount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* DOCTORS BOXES SECTION (Clickable doctor boxes for this hospital) */}
          <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#0E7490]" />
                  {isArabic ? 'أطباء هذا المستشفى' : 'Doctors & Specialists at this Hospital'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isArabic
                    ? 'انقر على أي طبيب لعرض وتصفية حجوزاته الخاصة فقط.'
                    : 'Click any doctor box to filter and view bookings specifically for that doctor.'}
                </p>
              </div>

              {selectedDoctorId && (
                <button
                  onClick={() => setSelectedDoctorId(null)}
                  className="px-3 py-1.5 text-xs font-bold text-[#0E7490] hover:text-[#0c627a] bg-[#0E7490]/5 hover:bg-[#0E7490]/10 rounded-xl border border-[#0E7490]/20 flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'إلغاء تصفية الطبيب (عرض الكل)' : 'Clear Doctor Filter (Show All)'}</span>
                </button>
              )}
            </div>

            {/* Doctors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              {/* Option 1: All Doctors box */}
              <div
                onClick={() => setSelectedDoctorId(null)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                  selectedDoctorId === null
                    ? 'border-[#0E7490] bg-[#0E7490]/5 ring-2 ring-[#0E7490]/20 shadow-xs'
                    : 'border-[#E2EBF0] bg-[#F8FAFC] hover:bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedDoctorId === null
                      ? 'bg-[#0E7490] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {isArabic ? 'كافة أطباء المستشفى' : 'All Doctors in Facility'}
                  </div>
                  <div className="text-[11px] text-[#0E7490] font-semibold mt-0.5">
                    {selectedFacility.bookings.length} {isArabic ? 'حجز إجمالي' : 'Total Bookings'}
                  </div>
                </div>
              </div>

              {/* Individual Doctor Boxes */}
              {selectedFacility.doctors.map((doc) => {
                const docBookings = selectedFacility.bookings.filter(
                  (b) =>
                    b.doctorId === doc.id ||
                    b.doctorName.trim().toLowerCase() === doc.name.trim().toLowerCase()
                );
                const isSelected = selectedDoctorId === doc.id;

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDoctorId(null);
                      } else {
                        setSelectedDoctorId(doc.id);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 relative group ${
                      isSelected
                        ? 'border-[#0E7490] bg-[#0E7490]/5 ring-2 ring-[#0E7490]/20 shadow-xs'
                        : 'border-[#E2EBF0] bg-white hover:border-[#2DA7B5] hover:shadow-2xs'
                    }`}
                  >
                    <img
                      src={
                        doc.photo ||
                        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
                      }
                      alt={doc.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {isArabic && doc.nameAr ? doc.nameAr : doc.name}
                        </h4>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#0E7490] shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {translateSpecialty(doc.specialty)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            docBookings.length > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {docBookings.length} {isArabic ? 'حجز' : 'Bookings'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedFacility.doctors.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                {isArabic
                  ? 'لا يوجد أطباء مسجلين مرتبطين بهذا المركز حالياً. سيتم عرض الحجوزات الواردة بشكل عام.'
                  : 'No rostered doctors linked directly to this facility profile yet. Displaying all recorded bookings for this clinic.'}
              </div>
            )}
          </div>

          {/* BOOKINGS TABLE WITH FILTER OPTIONS */}
          <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
            {/* Filter controls bar */}
            <div className="p-5 border-b border-[#E2EBF0] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8FAFC]/50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Active filter highlight pill */}
                {activeDoctor ? (
                  <div className="flex items-center gap-2 bg-[#0E7490]/10 border border-[#0E7490]/20 text-[#0E7490] px-3 py-1.5 rounded-xl text-xs font-semibold">
                    <span>
                      {isArabic ? 'حجوزات الطبيب:' : 'Filtered to:'}{' '}
                      <strong className="font-bold">
                        {isArabic && activeDoctor.nameAr ? activeDoctor.nameAr : activeDoctor.name}
                      </strong>
                    </span>
                    <button
                      onClick={() => setSelectedDoctorId(null)}
                      className="hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0E7490]" />
                    <span>
                      {isArabic
                        ? `كافة مواعيد: ${selectedFacility.name}`
                        : `All Bookings for ${selectedFacility.name}`}
                    </span>
                  </div>
                )}

                {/* Status tabs */}
                <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
                  {['all', 'confirmed', 'completed', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setBookingStatus(st)}
                      className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                        bookingStatus === st
                          ? 'bg-white text-[#0E7490] shadow-2xs font-bold border border-[#E2EBF0]'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {statusLabel(st)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder={
                    isArabic ? 'ابحث برقم الحجز، المريض، أو الهاتف...' : 'Search by ID, patient, phone...'
                  }
                  className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs bg-white border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
                  <tr>
                    <th className="px-5 py-3">{t('adminPortal.bookingId') || 'Booking ID'}</th>
                    <th className="px-5 py-3">{t('adminPortal.patientCol') || 'Patient'}</th>
                    <th className="px-5 py-3">{t('adminPortal.doctorCol') || 'Doctor & Specialty'}</th>
                    <th className="px-5 py-3">{t('adminPortal.scheduleCol') || 'Schedule Slot'}</th>
                    <th className="px-5 py-3">{t('adminPortal.statusCol') || 'Status'}</th>
                    <th className="px-5 py-3 text-right rtl:text-left">
                      {t('adminPortal.actionsCol') || 'Action'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentViewAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        {isArabic
                          ? 'لا توجد حجوزات مطابقة لمعايير البحث في هذا المستشفى.'
                          : 'No bookings found matching current filters for this hospital.'}
                      </td>
                    </tr>
                  ) : (
                    currentViewAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td
                          className="px-5 py-3.5 font-mono text-[11px] text-[#0E7490] font-bold"
                          dir="ltr"
                        >
                          #{appt.id}
                        </td>
                        <td className="px-5 py-3.5 text-slate-900 font-medium">
                          <div className="font-bold">{appt.patientName}</div>
                          <div
                            className="text-[11px] text-slate-500 font-mono flex items-center gap-1"
                            dir="ltr"
                          >
                            <Phone className="w-3 h-3 text-[#2DA7B5] shrink-0" />
                            <span>{appt.patientPhone || appt.patientMobile || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-800">
                          <div className="font-semibold">{appt.doctorName}</div>
                          <div className="text-[11px] text-[#0E7490]">
                            {translateSpecialty(appt.specialty)}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          <div className="font-medium">{appt.date}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {appt.timeSlot || appt.time}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={appt.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right rtl:text-left">
                          {appt.status?.toLowerCase() === 'confirmed' ? (
                            <button
                              onClick={() => setCancellingAppt(appt)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                            >
                              {t('adminPortal.cancelBooking') || 'Cancel'}
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
        </div>
      )}

      {/* VIEW 3: FLAT ALL-ECOSYSTEM BOOKINGS TABLE */}
      {viewMode === 'all-table' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2EBF0] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold w-full sm:w-auto border border-[#E2EBF0]">
              {['all', 'confirmed', 'completed', 'cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setBookingStatus(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    bookingStatus === st
                      ? 'bg-white text-[#0E7490] shadow-xs font-bold border border-[#E2EBF0]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {statusLabel(st)}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-2.5" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder={t('adminPortal.searchPlaceholder') || 'Search by ID, patient, doctor, facility...'}
                className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
                  <tr>
                    <th className="px-5 py-3">{t('adminPortal.bookingId') || 'Booking ID'}</th>
                    <th className="px-5 py-3">{t('adminPortal.patientCol') || 'Patient'}</th>
                    <th className="px-5 py-3">{t('adminPortal.doctorCol') || 'Doctor'}</th>
                    <th className="px-5 py-3">{t('adminPortal.facilityBreakdown') || 'Facility'}</th>
                    <th className="px-5 py-3">{t('adminPortal.scheduleCol') || 'Schedule'}</th>
                    <th className="px-5 py-3">{t('adminPortal.statusCol') || 'Status'}</th>
                    <th className="px-5 py-3 text-right rtl:text-left">{t('adminPortal.actionsCol') || 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentViewAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                        {t('adminPortal.noBookingsFound') || 'No bookings found.'}
                      </td>
                    </tr>
                  ) : (
                    currentViewAppointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-[11px] text-[#0E7490] font-bold" dir="ltr">
                          #{appt.id}
                        </td>
                        <td className="px-5 py-3.5 text-slate-900 font-medium">
                          <div className="font-bold">{appt.patientName}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1" dir="ltr">
                            <Phone className="w-3 h-3 text-[#2DA7B5] shrink-0" />
                            <span>{appt.patientPhone || appt.patientMobile || '—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-800">
                          <div className="font-semibold">{appt.doctorName}</div>
                          <div className="text-[11px] text-[#0E7490]">{translateSpecialty(appt.specialty)}</div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="font-medium text-slate-800">
                            {appt.facilityName || appt.hospitalName || appt.providerName || 'Healthcare Facility'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          <div>{appt.date}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{appt.timeSlot || appt.time}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={appt.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right rtl:text-left">
                          {appt.status?.toLowerCase() === 'confirmed' ? (
                            <button
                              onClick={() => setCancellingAppt(appt)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                            >
                              {t('adminPortal.cancelBooking') || 'Cancel'}
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
        </div>
      )}

      {/* Cancel Modal */}
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
