import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Stethoscope,
  MapPin,
  Star,
  Calendar,
  Search,
  CheckCircle2,
  Building2,
  ArrowRight,
  Clock,
  Sparkles,
  Filter,
  X,
  ChevronDown,
  User,
  LocateFixed,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { realDoctorService } from '../../services/realDoctorService';
import { Doctor } from '../../types';
import { SPECIALTIES, LOCATIONS, EMIRATES, AREAS, matchesLocation } from '../../data/mockSpecialties';
import { UAE_EMIRATES } from '../../services/locationService';
import { useTranslation } from '../../i18n';
import { useUserLocation } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';
import { CustomDropdown, DropdownOption } from '../../components/common/CustomDropdown';
import { DoctorCard } from '../../components/common/DoctorCard';
import { InsurancePicker } from '../../components/common/InsurancePicker';
import { realHospitalService, realClinicService } from '../../services/realFacilityService';
import { Hospital, Clinic } from '../../types';

export const DoctorList: React.FC = () => {
  const {
    t,
    translateSpecialty,
    translateLocation,
    isArabic,
    translateDoctorName,
    translateDoctorAbout,
    translateHospitalName,
    translateExperience,
  } = useTranslation();
  const { showToast } = useToast();
  const { location: detectedLoc, status: locationStatus, detectLocation } = useUserLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getUrlLocation = () => {
    const locParam = searchParams.get('location');
    const emParam = searchParams.get('emirate');
    const candidate = locParam || emParam;
    if (!candidate || candidate === 'All') return 'All';
    const found = UAE_EMIRATES.find(
      (e) => e.code.toLowerCase() === candidate.toLowerCase() || e.name.toLowerCase() === candidate.toLowerCase()
    );
    if (found) return found.name;
    const locMatch = LOCATIONS.find((l) => l.toLowerCase() === candidate.toLowerCase());
    if (locMatch) return locMatch;
    return candidate;
  };

  const urlSpecialty = searchParams.get('specialty') || 'All';
  const urlLocation = getUrlLocation();
  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const urlInsurance = searchParams.get('insurance') || '';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [specialty, setSpecialty] = useState(urlSpecialty);
  const [location, setLocation] = useState(urlLocation);
  const [search, setSearch] = useState(urlSearch);
  const [insurance, setInsurance] = useState(urlInsurance);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Sync state if URL query parameters change (e.g., clicking Top Specialties, Home, etc.)
  useEffect(() => {
    const qSpec = searchParams.get('specialty') || 'All';
    const qLoc = getUrlLocation();
    const qTerm = searchParams.get('search') || searchParams.get('q') || '';
    const qIns = searchParams.get('insurance') || '';
    setSpecialty(qSpec);
    setLocation(qLoc);
    setSearch(qTerm);
    setInsurance(qIns);
  }, [searchParams]);

  const updateFilters = (newSpec?: string, newLoc?: string, newSearch?: string, newIns?: string) => {
    const nextSpec = newSpec !== undefined ? newSpec : specialty;
    const nextLoc = newLoc !== undefined ? newLoc : location;
    const nextSearch = newSearch !== undefined ? newSearch : search;
    const nextIns = newIns !== undefined ? newIns : insurance;

    setSpecialty(nextSpec);
    setLocation(nextLoc);
    setSearch(nextSearch);
    setInsurance(nextIns);

    const params = new URLSearchParams();
    if (nextSpec && nextSpec !== 'All') params.set('specialty', nextSpec);
    if (nextLoc && nextLoc !== 'All') {
      params.set('location', nextLoc);
      const em = UAE_EMIRATES.find((e) => e.name.toLowerCase() === nextLoc.toLowerCase());
      if (em) params.set('emirate', em.code);
    }
    if (nextSearch && nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextIns && nextIns.trim()) params.set('insurance', nextIns.trim());
    setSearchParams(params);
  };

  const specialtyOptions: DropdownOption[] = useMemo(() => [
    { value: 'All', label: t('doctors.allSpecialties') },
    ...SPECIALTIES.map((s) => ({
      value: s,
      label: translateSpecialty(s),
    })),
  ], [t, translateSpecialty]);

  const locationOptions: DropdownOption[] = useMemo(() => [
    {
      value: 'current',
      label: locationStatus === 'detecting'
        ? (isArabic ? 'جارٍ تحديد موقعك...' : 'Detecting location...')
        : detectedLoc
        ? (isArabic ? `${t('location.currentLocation')}: ${detectedLoc.emirateNameAr}` : `${t('location.currentLocation')}: ${detectedLoc.emirateName}`)
        : (isArabic ? `${t('location.useCurrentLocation')}` : `${t('location.useCurrentLocation')}`),
      badge: detectedLoc ? 'GPS' : undefined,
      icon: <LocateFixed className="w-3.5 h-3.5 text-[#2DA7B5]" />,
    },
    { value: 'divider-1', label: '', isDivider: true },
    { value: 'All', label: t('doctors.allLocations') },
    { value: 'divider-emirates', label: isArabic ? 'الإمارات' : 'Emirates', isDivider: true },
    ...EMIRATES.map((l) => ({
      value: l,
      label: translateLocation(l),
      icon: <MapPin className="w-3.5 h-3.5 text-[#2DA7B5]" />,
    })),
    { value: 'divider-areas', label: isArabic ? 'المناطق الشهيرة' : 'Popular Areas', isDivider: true },
    ...AREAS.map((l) => ({
      value: l,
      label: translateLocation(l),
      icon: <MapPin className="w-3.5 h-3.5 text-slate-400" />,
    })),
  ], [locationStatus, isArabic, detectedLoc, t, translateLocation]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await realDoctorService.getAllDoctors();
        const [allDocs, allHosps, allClins] = await Promise.all([
          realDoctorService.getAllDoctors(),
          realHospitalService.getAllHospitals(),
          realClinicService.getAllClinics(),
        ]);
        setDoctors(allDocs || []);
        setHospitals(allHosps || []);
        setClinics(allClins || []);
      } catch {
        setDoctors([]);
        setHospitals([]);
        setClinics([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const allHospitalPlans = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => {
      if (h.insurancePlans) {
        h.insurancePlans.split(',').forEach((p) => {
          const t = p.trim();
          if (t) set.add(t);
        });
      }
    });
    return Array.from(set);
  }, [hospitals]);

  const handleNearMeToggle = async () => {
    if (nearMeOnly) {
      setNearMeOnly(false);
      return;
    }

    if (!detectedLoc) {
      const res = await detectLocation(true);
      if (res) {
        setNearMeOnly(true);
        showToast(
          isArabic
            ? `تم التصفية حسب موقعك: ${res.emirateNameAr}`
            : `Filtered near you: ${res.emirateName}`,
          'success'
        );
      } else {
        showToast(t('location.permissionDenied'), 'info');
      }
    } else {
      setNearMeOnly(true);
      showToast(
        isArabic
          ? `عرض الأطباء بالقرب من ${detectedLoc.emirateNameAr}`
          : `Showing doctors near ${detectedLoc.emirateName}`,
        'info'
      );
    }
  };

  // Quick suggested filters
  const popularSpecialtySuggestions = [
    'All',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Pediatrics',
    'General Practice',
    'Neurology',
    'Home Care',
  ];

  const filtered = useMemo(() => {
    let result = doctors.filter((doc) => {
      if (specialty !== 'All') {
        const specLower = specialty.toLowerCase().trim();
        const docSpecLower = doc.specialty.toLowerCase().trim();
        const isMatch =
          docSpecLower.includes(specLower) ||
          specLower.includes(docSpecLower) ||
          (specLower.includes('home') && (
            docSpecLower.includes('home') ||
            doc.about.toLowerCase().includes('home') ||
            (doc.specialInterest && doc.specialInterest.some((si) => si.toLowerCase().includes('home')))
          )) ||
          (specLower.includes('general') && docSpecLower.includes('general')) ||
          (specLower.includes('cardio') && docSpecLower.includes('cardio')) ||
          (specLower.includes('ortho') && docSpecLower.includes('ortho')) ||
          (specLower.includes('derma') && docSpecLower.includes('derma')) ||
          (specLower.includes('pediatr') && docSpecLower.includes('pediatr')) ||
          (specLower.includes('neuro') && docSpecLower.includes('neuro')) ||
          (specLower.includes('gynec') && docSpecLower.includes('gynec')) ||
          (specLower.includes('ent') && (docSpecLower.includes('ent') || docSpecLower.includes('ear'))) ||
          (specLower.includes('dent') && docSpecLower.includes('dent')) ||
          (specLower.includes('ophthal') && (docSpecLower.includes('ophthal') || docSpecLower.includes('eye')));
        if (!isMatch) {
          return false;
        }
      }
      const docHosp = hospitals.find(
        (h) => h.id === doc.hospitalId || (doc.hospitalName && h.name.toLowerCase() === doc.hospitalName.toLowerCase())
      );
      const docClinic = clinics.find(
        (c) => c.id === doc.clinicId || (doc.clinicName && c.name.toLowerCase() === doc.clinicName.toLowerCase())
      );
      const effectiveLoc = doc.location || docHosp?.location || docClinic?.location || '';
      if (!matchesLocation(effectiveLoc, location)) {
        return false;
      }
      if (insurance) {
        const insLower = insurance.toLowerCase();
        const hospMatches = docHosp?.insurancePlans && docHosp.insurancePlans.toLowerCase().includes(insLower);
        const clinicMatches = docClinic?.insurancePlans && docClinic.insurancePlans.toLowerCase().includes(insLower);
        if (!hospMatches && !clinicMatches) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          (doc.hospitalName && doc.hospitalName.toLowerCase().includes(q)) ||
          doc.location.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (nearMeOnly && detectedLoc) {
      const userEmirate = detectedLoc.emirateName.toLowerCase();
      const nearList = result.filter(
        (doc) =>
          doc.location.toLowerCase().includes(userEmirate) ||
          (doc.hospitalName && doc.hospitalName.toLowerCase().includes(userEmirate)) ||
          matchesLocation(doc.location, detectedLoc.emirateName)
      );
      if (nearList.length > 0) {
        result = nearList;
      }
    }

    return result;
  }, [doctors, specialty, location, search, insurance, nearMeOnly, detectedLoc, hospitals, clinics]);

  // Reset to page 1 whenever search or filter criteria change
  useEffect(() => {
    setCurrentPage(1);
  }, [specialty, location, search, insurance, nearMeOnly]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // Clamp current page if totalPages shrinks
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 220, behavior: 'smooth' });
  };

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-10 selection:bg-teal-100 selection:text-slate-800 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-xs font-bold text-[#0E7490]">
            <Stethoscope className="w-4 h-4 text-[#2DA7B5]" />
            <span>{t('doctors.verifiedBadge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('doctors.pageTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            {t('doctors.pageDesc')}
          </p>
        </div>

        {/* Filter Console */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E2EBF0] shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateFilters(undefined, undefined, e.target.value)}
                placeholder={t('doctors.searchPlaceholder')}
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 text-xs font-medium border border-[#E2EBF0] rounded-xl text-slate-900 focus:outline-hidden focus:border-[#2DA7B5] bg-[#F8FAFC] focus:bg-white transition-all placeholder:text-slate-400 h-[42px]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => updateFilters(undefined, undefined, '')}
                  className="absolute right-3 rtl:right-auto rtl:left-3 top-3 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Specialty Selector */}
            <div className="sm:col-span-3">
              <CustomDropdown
                value={specialty}
                onChange={(val) => updateFilters(val, undefined, undefined)}
                options={specialtyOptions}
                placeholder={t('doctors.allSpecialties')}
                icon={<Stethoscope className="w-3.5 h-3.5 text-[#2DA7B5]" />}
                buttonClassName="rounded-xl border-[#E2EBF0] text-xs font-bold h-[42px]"
              />
            </div>

            {/* Location Selector */}
            <div className="sm:col-span-3 flex items-center gap-1.5">
              <div className="flex-1 min-w-0">
                <CustomDropdown
                  value={nearMeOnly ? 'current' : location}
                  onChange={(val) => {
                    if (val === 'current') {
                      handleNearMeToggle();
                    } else {
                      updateFilters(undefined, val, undefined);
                      if (nearMeOnly) setNearMeOnly(false);
                    }
                  }}
                  options={locationOptions}
                  placeholder={t('doctors.allLocations')}
                  icon={<MapPin className="w-3.5 h-3.5 text-[#0D5C54]" />}
                  buttonClassName="rounded-xl border-[#CBD5E1] text-xs font-semibold h-[42px]"
                />
              </div>

              {/* Auto-detect Near Me button */}
              <button
                type="button"
                onClick={handleNearMeToggle}
                disabled={locationStatus === 'detecting'}
                title={t('location.detectLocationTooltip')}
                className="w-[42px] h-[42px] rounded-xl bg-[#2DA7B5] hover:bg-[#23929F] active:scale-95 text-white transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center shadow-xs"
              >
                {locationStatus === 'detecting' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <LocateFixed className="w-4 h-4 text-white stroke-[2.5]" />
                )}
              </button>
            </div>

            {/* Insurance Selector */}
            <div className="sm:col-span-2">
              <InsurancePicker
                allHospitalPlans={allHospitalPlans}
                selected={insurance}
                onSelect={(val) => updateFilters(undefined, undefined, undefined, val)}
                isArabic={isArabic}
                buttonClassName="w-full h-[42px] py-2.5 rounded-xl border-[#CBD5E1] justify-between text-xs font-semibold bg-[#F8FAFC] hover:bg-white"
                containerClassName="w-full"
              />
            </div>
          </div>

          {/* Quick Suggested Filter Badges */}
          <div className="pt-2 border-t border-[#E2EBF0] flex flex-wrap items-center justify-between gap-2">
            {/* Suggested Specialties */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 rtl:mr-0 rtl:ml-1">
                {t('doctors.specialtyFilterLabel')}
              </span>

              {popularSpecialtySuggestions.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => updateFilters(spec, undefined, undefined)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    specialty === spec
                      ? 'bg-[#2DA7B5] text-white shadow-xs font-bold'
                      : 'bg-[#F8FAFC] text-slate-700 hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] border border-[#E2EBF0]'
                  }`}
                >
                  {spec === 'All' ? t('common.all') : translateSpecialty(spec)}
                </button>
              ))}
            </div>

            {/* Near Me Quick Filter Badge (separated from specialties) */}
            <button
              type="button"
              onClick={handleNearMeToggle}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
                nearMeOnly
                  ? 'bg-[#2DA7B5] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-slate-700 hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] border border-[#E2EBF0]'
              }`}
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>
                {t('location.nearMe')}
                {detectedLoc ? ` (${isArabic ? detectedLoc.emirateNameAr : detectedLoc.emirateName})` : ''}
              </span>
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            {t('doctors.showingAccredited', { count: filtered.length })}
            {totalPages > 1 && (
              <span className="text-slate-400 font-normal ml-1.5 rtl:ml-0 rtl:mr-1.5">
                ({isArabic ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`})
              </span>
            )}
          </span>
          {(specialty !== 'All' || location !== 'All' || search || nearMeOnly) && (
            <button
              type="button"
              onClick={() => {
                updateFilters('All', 'All', '');
                setNearMeOnly(false);
                setCurrentPage(1);
              }}
              className="text-[#2DA7B5] font-bold hover:underline cursor-pointer"
            >
              {t('doctors.resetFilters')}
            </button>
          )}
        </div>

        {/* Doctor Cards Grid */}
        {isLoading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-12">
            <div className="w-9 h-9 border-3 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">{t('doctors.findingPhysicians')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E2EBF0] shadow-sm text-center max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F6F8] text-[#2DA7B5] flex items-center justify-center mx-auto border border-[#CDEBF0]">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t('doctors.noDoctorsFound')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('doctors.noDoctorsDesc')}
            </p>
            <button
              onClick={() => {
                updateFilters('All', 'All', '');
              }}
              className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {t('doctors.resetFiltersBtn')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedDoctors.map((doc, idx) => (
                <DoctorCard key={doc.id} doctor={doc} delayIndex={idx} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2EBF0] text-xs">
                <div className="text-slate-500 font-medium text-center sm:text-left rtl:sm:text-right">
                  {isArabic ? (
                    <>
                      عرض <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> إلى{' '}
                      <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> من{' '}
                      <span className="font-bold text-slate-900">{filtered.length}</span> طبيب
                    </>
                  ) : (
                    <>
                      Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> of{' '}
                      <span className="font-bold text-slate-900">{filtered.length}</span> doctors
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-white text-slate-700 font-bold hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#2DA7B5] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:border-[#CBD5E1] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                    <span className="hidden sm:inline">{isArabic ? 'السابق' : 'Previous'}</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        totalPages > 7 &&
                        pageNum !== 1 &&
                        pageNum !== totalPages &&
                        Math.abs(pageNum - currentPage) > 1
                      ) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return (
                            <span key={pageNum} className="w-7 text-center text-slate-400 font-bold">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isActive
                              ? 'bg-[#2DA7B5] text-white shadow-xs font-black'
                              : 'bg-white text-slate-700 border border-[#CBD5E1] hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#2DA7B5]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-white text-slate-700 font-bold hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#2DA7B5] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:border-[#CBD5E1] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="hidden sm:inline">{isArabic ? 'التالي' : 'Next'}</span>
                    <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
