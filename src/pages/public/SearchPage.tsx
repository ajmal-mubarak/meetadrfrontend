import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  Star,
  Building2,
  Stethoscope,
  Filter,
  ArrowRight,
  ChevronDown,
  LocateFixed,
  Loader2,
  ChevronLeft,
} from 'lucide-react';
import { realDoctorService } from '../../services/realDoctorService';
import { realHospitalService, realClinicService } from '../../services/realFacilityService';
import { Doctor, Hospital, Clinic } from '../../types';
import { SPECIALTIES, LOCATIONS, EMIRATES, AREAS, matchesLocation } from '../../data/mockSpecialties';
import { HEALTH_CONDITIONS } from '../../data/mockConditions';
import { UAE_EMIRATES } from '../../services/locationService';
import { useTranslation } from '../../i18n';
import { useUserLocation } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';
import { CustomDropdown, DropdownOption } from '../../components/common/CustomDropdown';
import { DoctorCard } from '../../components/common/DoctorCard';
import { InsurancePicker } from '../../components/common/InsurancePicker';

// Flexible fuzzy specialty stem matcher
function matchesSpecialty(providerSpecialty: string, selectedSpec: string): boolean {
  if (!selectedSpec || selectedSpec === 'All') return true;
  const pLower = (providerSpecialty || '').toLowerCase().trim();
  const sLower = selectedSpec.toLowerCase().trim();
  if (pLower.includes(sLower) || sLower.includes(pLower)) return true;

  const stemPairs = [
    ['ortho', 'bone', 'joint', 'spine'],
    ['cardio', 'heart'],
    ['derma', 'skin'],
    ['pediatr', 'child', 'pedia'],
    ['general', 'family', 'internal'],
    ['neuro', 'brain', 'headache', 'migraine'],
    ['ophthal', 'eye', 'vision'],
    ['gynec', 'obstet', 'women'],
    ['gastro', 'digestive'],
    ['physio', 'rehab'],
    ['ent', 'ear', 'nose', 'throat', 'otolaryng'],
    ['dent', 'oral'],
    ['pulmon', 'chest', 'respir', 'lung', 'allerg', 'asthma'],
    ['endo', 'diabetes', 'thyroid'],
    ['home'],
  ];

  for (const group of stemPairs) {
    const sMatch = group.some((g) => sLower.includes(g));
    const pMatch = group.some((g) => pLower.includes(g));
    if (sMatch && pMatch) return true;
  }
  return false;
}

// Flexible matcher for doctors supporting name, hospital, clinic, specialty, condition, and symptoms
function doctorMatchesQuery(d: Doctor, q: string): boolean {
  if (!q) return true;
  const qLower = q.toLowerCase().trim();

  // 1. Direct fields match
  if (
    d.name.toLowerCase().includes(qLower) ||
    d.specialty.toLowerCase().includes(qLower) ||
    d.location.toLowerCase().includes(qLower) ||
    (d.hospitalName && d.hospitalName.toLowerCase().includes(qLower)) ||
    (d.clinicName && d.clinicName.toLowerCase().includes(qLower)) ||
    (d.specialInterest && d.specialInterest.some((si) => si.toLowerCase().includes(qLower))) ||
    (d.about && d.about.toLowerCase().includes(qLower))
  ) {
    return true;
  }

  // 2. Specialty stem match (e.g. 'Allergies & Asthma' or 'Asthma' matches 'Pulmonology')
  if (matchesSpecialty(d.specialty, qLower)) {
    return true;
  }

  // 3. Health conditions catalog match (e.g. symptom or condition name)
  const condMatch = HEALTH_CONDITIONS.find(
    (c) =>
      c.name.toLowerCase().includes(qLower) ||
      qLower.includes(c.name.toLowerCase()) ||
      (c.symptoms && c.symptoms.some((s) => qLower.includes(s.toLowerCase()) || s.toLowerCase().includes(qLower)))
  );
  if (condMatch && matchesSpecialty(d.specialty, condMatch.specialtyQuery)) {
    return true;
  }

  // 4. Token-level matching (split by space, &, comma)
  const tokens = qLower
    .split(/[\s&,/+]+/)
    .filter((w) => w.length >= 3 && !['and', 'the', 'for', 'with', 'care'].includes(w));
  if (tokens.length > 0) {
    const hasToken = tokens.some(
      (tok) =>
        d.name.toLowerCase().includes(tok) ||
        d.specialty.toLowerCase().includes(tok) ||
        (d.hospitalName && d.hospitalName.toLowerCase().includes(tok)) ||
        (d.clinicName && d.clinicName.toLowerCase().includes(tok)) ||
        (d.about && d.about.toLowerCase().includes(tok)) ||
        (d.specialInterest && d.specialInterest.some((si) => si.toLowerCase().includes(tok))) ||
        matchesSpecialty(d.specialty, tok)
    );
    if (hasToken) return true;
  }

  return false;
}

function hospitalMatchesQuery(h: Hospital, q: string): boolean {
  if (!q) return true;
  const qLower = q.toLowerCase().trim();

  // 1. Direct fields match
  if (
    h.name.toLowerCase().includes(qLower) ||
    h.location.toLowerCase().includes(qLower) ||
    (h.address && h.address.toLowerCase().includes(qLower)) ||
    h.specialties.some((s) => s.toLowerCase().includes(qLower))
  ) {
    return true;
  }

  // 2. Specialty stem match across hospital's specialties
  if (h.specialties.some((s) => matchesSpecialty(s, qLower))) {
    return true;
  }

  // 3. Health condition catalog match
  const condMatch = HEALTH_CONDITIONS.find(
    (c) =>
      c.name.toLowerCase().includes(qLower) ||
      qLower.includes(c.name.toLowerCase()) ||
      (c.symptoms && c.symptoms.some((s) => qLower.includes(s.toLowerCase()) || s.toLowerCase().includes(qLower)))
  );
  if (condMatch && h.specialties.some((s) => matchesSpecialty(s, condMatch.specialtyQuery))) {
    return true;
  }

  // 4. Token-level match
  const tokens = qLower
    .split(/[\s&,/+]+/)
    .filter((w) => w.length >= 3 && !['and', 'the', 'for', 'with', 'hospital'].includes(w));
  if (tokens.length > 0) {
    const hasToken = tokens.some(
      (tok) =>
        h.name.toLowerCase().includes(tok) ||
        h.specialties.some((s) => s.toLowerCase().includes(tok) || matchesSpecialty(s, tok)) ||
        (h.about && h.about.toLowerCase().includes(tok))
    );
    if (hasToken) return true;
  }

  return false;
}

function clinicMatchesQuery(c: Clinic, q: string): boolean {
  if (!q) return true;
  const qLower = q.toLowerCase().trim();

  if (
    c.name.toLowerCase().includes(qLower) ||
    c.location.toLowerCase().includes(qLower) ||
    (c.address && c.address.toLowerCase().includes(qLower)) ||
    c.specialty.toLowerCase().includes(qLower) ||
    matchesSpecialty(c.specialty, qLower)
  ) {
    return true;
  }

  const condMatch = HEALTH_CONDITIONS.find(
    (cond) =>
      cond.name.toLowerCase().includes(qLower) ||
      qLower.includes(cond.name.toLowerCase())
  );
  if (condMatch && matchesSpecialty(c.specialty, condMatch.specialtyQuery)) {
    return true;
  }

  const tokens = qLower
    .split(/[\s&,/+]+/)
    .filter((w) => w.length >= 3 && !['and', 'the', 'for', 'with', 'clinic'].includes(w));
  if (tokens.length > 0) {
    return tokens.some(
      (tok) =>
        c.name.toLowerCase().includes(tok) ||
        c.specialty.toLowerCase().includes(tok) ||
        matchesSpecialty(c.specialty, tok) ||
        (c.about && c.about.toLowerCase().includes(tok))
    );
  }

  return false;
}

export const SearchPage: React.FC = () => {
  const {
    t,
    translateSpecialty,
    translateLocation,
    isArabic,
    translateDoctorName,
    translateHospitalName,
  } = useTranslation();
  const { showToast } = useToast();
  const { location: detectedLoc, status: locationStatus, detectLocation } = useUserLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getUrlLocation = () => {
    const locParam = searchParams.get('location');
    const emParam = searchParams.get('emirate');
    const candidate = locParam || emParam;
    if (!candidate || candidate === 'All') return 'All';

    // 1. Try finding by emirate code or name
    const found = UAE_EMIRATES.find(
      (e) => e.code.toLowerCase() === candidate.toLowerCase() || e.name.toLowerCase() === candidate.toLowerCase()
    );
    if (found) return found.name;

    // 2. Try finding in LOCATIONS
    const locMatch = LOCATIONS.find((l) => l.toLowerCase() === candidate.toLowerCase());
    if (locMatch) return locMatch;

    return candidate;
  };

  const initialQuery = searchParams.get('q') || '';
  const initialSpecialty = searchParams.get('specialty') || 'All';
  const initialLocation = getUrlLocation();
  const initialType = searchParams.get('type') || 'All';
  const initialInsurance = searchParams.get('insurance') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [location, setLocation] = useState(initialLocation);
  const [providerType, setProviderType] = useState(initialType);
  const [insurance, setInsurance] = useState(initialInsurance);

  // Pagination states for each category
  const PAGE_SIZE = 6;
  const [doctorPage, setDoctorPage] = useState(1);
  const [hospitalPage, setHospitalPage] = useState(1);
  const [clinicPage, setClinicPage] = useState(1);

  // Sync state when URL search params change
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const sp = searchParams.get('specialty') || 'All';
    const loc = getUrlLocation();
    const tp = searchParams.get('type') || 'All';
    const ins = searchParams.get('insurance') || '';

    setSearchTerm(q);
    setSpecialty(sp);
    setLocation(loc);
    setProviderType(tp);
    setInsurance(ins);
    setDoctorPage(1);
    setHospitalPage(1);
    setClinicPage(1);
  }, [searchParams]);

  const specialtyOptions: DropdownOption[] = useMemo(() => [
    { value: 'All', label: t('doctorList.allSpecialties') },
    ...SPECIALTIES.map((s) => ({
      value: s,
      label: translateSpecialty(s),
    })),
  ], [t, translateSpecialty]);

  const locationOptions: DropdownOption[] = useMemo(() => [
    {
      value: 'current',
      label: locationStatus === 'detecting'
        ? (translateLocation('Detecting...') || 'Detecting...')
        : detectedLoc
        ? `${t('location.currentLocation')}: ${isArabic ? detectedLoc.emirateNameAr : detectedLoc.emirateName}`
        : `${t('location.useCurrentLocation')}`,
      badge: detectedLoc ? 'GPS' : undefined,
      icon: <LocateFixed className="w-3.5 h-3.5 text-[#2DA7B5]" />,
    },
    { value: 'divider-1', label: '', isDivider: true },
    { value: 'All', label: t('hospitals.allLocations') },
    { value: 'divider-emirates', label: isArabic ? 'الإمارات' : 'Emirates', isDivider: true },
    ...EMIRATES.map((loc) => ({
      value: loc,
      label: translateLocation(loc),
      icon: <MapPin className="w-3.5 h-3.5 text-[#2DA7B5]" />,
    })),
    { value: 'divider-areas', label: isArabic ? 'المناطق الشهيرة' : 'Popular Areas', isDivider: true },
    ...AREAS.map((loc) => ({
      value: loc,
      label: translateLocation(loc),
      icon: <MapPin className="w-3.5 h-3.5 text-slate-400" />,
    })),
  ], [locationStatus, detectedLoc, isArabic, t, translateLocation]);

  const handleAutoDetectLocation = async () => {
    const res = await detectLocation(true);
    if (res) {
      const matched = LOCATIONS.find((l) => l.toLowerCase().includes(res.emirateName.toLowerCase()));
      if (matched) {
        setLocation(matched);
      }
      showToast(`Location detected: ${res.emirateName} (${res.emirateCode})`, 'success');
    } else {
      showToast(t('location.permissionDenied'), 'info');
    }
  };

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
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
    loadData();
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

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (specialty !== 'All') params.append('specialty', specialty);
    if (location !== 'All') params.append('location', location);
    if (providerType !== 'All') params.append('type', providerType);
    if (insurance) params.append('insurance', insurance);
    setDoctorPage(1);
    setHospitalPage(1);
    setClinicPage(1);
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSpecialty('All');
    setLocation('All');
    setProviderType('All');
    setInsurance('');
    setDoctorPage(1);
    setHospitalPage(1);
    setClinicPage(1);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter Doctors
  const filteredDoctors = doctors.filter((d) => {
    if (providerType !== 'All' && providerType !== 'Doctor') return false;
    if (searchTerm && !doctorMatchesQuery(d, searchTerm)) return false;
    if (!matchesSpecialty(d.specialty, specialty)) return false;

    const docHosp = hospitals.find(
      (h) => h.id === d.hospitalId || (d.hospitalName && h.name.toLowerCase() === d.hospitalName.toLowerCase())
    );
    const docClinic = clinics.find(
      (c) => c.id === d.clinicId || (d.clinicName && c.name.toLowerCase() === d.clinicName.toLowerCase())
    );
    const effectiveLoc = d.location || docHosp?.location || docClinic?.location || '';
    if (!matchesLocation(effectiveLoc, location)) return false;

    if (insurance) {
      const insLower = insurance.toLowerCase();
      const hospMatches = docHosp?.insurancePlans && docHosp.insurancePlans.toLowerCase().includes(insLower);
      const clinicMatches = docClinic?.insurancePlans && docClinic.insurancePlans.toLowerCase().includes(insLower);
      if (!hospMatches && !clinicMatches) return false;
    }
    return true;
  });

  // Filter Hospitals
  const filteredHospitals = hospitals.filter((h) => {
    if (providerType !== 'All' && providerType !== 'Hospital') return false;
    if (searchTerm && !hospitalMatchesQuery(h, searchTerm)) return false;
    if (specialty !== 'All') {
      const hasSpec = h.specialties.some((s) => matchesSpecialty(s, specialty));
      if (!hasSpec) return false;
    }
    if (!matchesLocation(h.location, location)) return false;
    if (insurance && (!h.insurancePlans || !h.insurancePlans.toLowerCase().includes(insurance.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // Filter Clinics
  const filteredClinics = clinics.filter((c) => {
    if (providerType !== 'All' && providerType !== 'Clinic') return false;
    if (searchTerm && !clinicMatchesQuery(c, searchTerm)) return false;
    if (!matchesSpecialty(c.specialty, specialty)) return false;
    if (!matchesLocation(c.location, location)) return false;
    if (insurance && (!c.insurancePlans || !c.insurancePlans.toLowerCase().includes(insurance.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // Paginated Slices
  const paginatedDoctors = filteredDoctors.slice(
    (doctorPage - 1) * PAGE_SIZE,
    doctorPage * PAGE_SIZE
  );
  const paginatedHospitals = filteredHospitals.slice(
    (hospitalPage - 1) * PAGE_SIZE,
    hospitalPage * PAGE_SIZE
  );
  const paginatedClinics = filteredClinics.slice(
    (clinicPage - 1) * PAGE_SIZE,
    clinicPage * PAGE_SIZE
  );

  // Total results
  const totalCount =
    filteredDoctors.length + filteredHospitals.length + filteredClinics.length;

  const getProviderTypeLabel = (type: string) => {
    if (type === 'All') return t('search.allProviders');
    if (type === 'Doctor') return t('search.doctorOnly');
    if (type === 'Hospital') return t('search.hospitalOnly');
    if (type === 'Clinic') return t('search.clinicOnly');
    return type;
  };

  const renderPagination = (
    currentPage: number,
    totalItems: number,
    onPageChange: (p: number) => void
  ) => {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E2EBF0] pt-4 mt-6">
        <span className="text-xs text-slate-500 font-semibold">
          Showing {Math.min(totalItems, (currentPage - 1) * PAGE_SIZE + 1)}–{Math.min(totalItems, currentPage * PAGE_SIZE)} of {totalItems}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => {
              onPageChange(currentPage - 1);
              window.scrollTo({ top: 220, behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>Previous</span>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onPageChange(p);
                window.scrollTo({ top: 220, behavior: 'smooth' });
              }}
              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                p === currentPage
                  ? 'bg-[#2DA7B5] text-white shadow-xs font-black'
                  : 'text-slate-700 hover:bg-slate-100 border border-[#E2EBF0]'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => {
              onPageChange(currentPage + 1);
              window.scrollTo({ top: 220, behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#F4F7F9] min-h-screen py-6 sm:py-10 text-slate-900 selection:bg-teal-100 selection:text-slate-800"
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        {/* Search header / filters */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E2EBF0] shadow-sm mb-6 sm:mb-8">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-2 lg:col-span-4 relative">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('search.searchKeyword')}
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('search.keywordPlaceholder')}
                    className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 border border-[#E2EBF0] rounded-xl text-xs sm:text-sm text-slate-900 focus:border-[#2DA7B5] focus:outline-hidden bg-[#F8FAFC] focus:bg-white placeholder:text-slate-400 transition-all font-medium h-[42px]"
                  />
                </div>
              </div>

              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('search.specialty')}
                </label>
                <CustomDropdown
                  value={specialty}
                  onChange={(val) => setSpecialty(val)}
                  options={specialtyOptions}
                  placeholder={t('doctorList.allSpecialties')}
                  icon={<Stethoscope className="w-3.5 h-3.5 text-[#2DA7B5]" />}
                  buttonClassName="rounded-xl border-[#E2EBF0] text-xs sm:text-sm font-medium py-2 px-3 h-[42px]"
                />
              </div>

              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('search.location')}
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 min-w-0">
                    <CustomDropdown
                      value={location}
                      onChange={(val) => {
                        if (val === 'current') {
                          handleAutoDetectLocation();
                        } else {
                          setLocation(val);
                        }
                      }}
                      options={locationOptions}
                      placeholder={t('hospitals.allLocations')}
                      icon={<MapPin className="w-3.5 h-3.5 text-[#0D5C54]" />}
                      buttonClassName="rounded-xl border-[#CBD5E1] text-xs sm:text-sm font-semibold py-2 px-3 h-[42px]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
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
              </div>

              <div className="sm:col-span-1 lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'التأمين الطبي' : 'Insurance'}
                </label>
                <InsurancePicker
                  allHospitalPlans={allHospitalPlans}
                  selected={insurance}
                  onSelect={(val) => {
                    setInsurance(val);
                    const params = new URLSearchParams(searchParams);
                    if (val) {
                      params.set('insurance', val);
                    } else {
                      params.delete('insurance');
                    }
                    setDoctorPage(1);
                    setHospitalPage(1);
                    setClinicPage(1);
                    setSearchParams(params);
                  }}
                  isArabic={isArabic}
                  buttonClassName="w-full h-[42px] py-2 px-3 justify-between text-xs sm:text-sm font-semibold rounded-xl border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white"
                  containerClassName="w-full"
                />
              </div>

              <div className="sm:col-span-1 lg:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full h-[42px] px-4 bg-[#2DA7B5] hover:bg-[#23929F] text-white active:scale-[0.99] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{t('search.searchBtn')}</span>
                </button>
              </div>
            </div>

            {/* Provider Type selector tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E2EBF0]">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
                <span className="text-xs font-semibold text-slate-500 mr-1 rtl:mr-0 rtl:ml-1 shrink-0">
                  {t('search.category')}:
                </span>
                {['All', 'Doctor', 'Hospital', 'Clinic'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setProviderType(type);
                      setDoctorPage(1);
                      setHospitalPage(1);
                      setClinicPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
                      providerType === type
                        ? 'bg-[#2DA7B5] text-white shadow-xs'
                        : 'bg-[#F8FAFC] text-slate-700 hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] border border-[#E2EBF0]'
                    }`}
                  >
                    {getProviderTypeLabel(type)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {(searchTerm || specialty !== 'All' || location !== 'All' || providerType !== 'All') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#0E7490] hover:underline cursor-pointer"
                  >
                    {t('search.resetFilters')}
                  </button>
                )}
                <div className="text-xs text-slate-500 font-semibold">
                  {t('search.foundResults', { count: totalCount })}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Results List */}
        {isLoading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-12">
            <div className="w-9 h-9 border-3 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">{t('search.searching')}</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#E2EBF0] shadow-sm text-center max-w-lg mx-auto space-y-3">
            <Stethoscope className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">{t('search.noResultsTitle')}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              {t('search.noResultsText')}
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              {t('search.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Doctors Section */}
            {filteredDoctors.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#2DA7B5]" />
                  <span>{t('search.specialistDoctors', { count: filteredDoctors.length })}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedDoctors.map((doc, idx) => (
                    <DoctorCard key={doc.id} doctor={doc} delayIndex={idx} />
                  ))}
                </div>
                {renderPagination(doctorPage, filteredDoctors.length, setDoctorPage)}
              </div>
            )}

            {/* Hospitals Section */}
            {filteredHospitals.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#2DA7B5]" />
                  <span>{t('search.hospitalsCount', { count: filteredHospitals.length })}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {paginatedHospitals.map((hosp) => (
                    <motion.div
                      key={hosp.id}
                      whileHover={{ y: -3, transition: { duration: 0.18 } }}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2EBF0] hover:border-[#2DA7B5] hover:shadow-md transition-all flex flex-col justify-between group shadow-xs"
                    >
                      <div>
                        <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                          <img
                            src={hosp.photo}
                            alt={hosp.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          {hosp.emergencyAvailable && (
                            <span className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 bg-rose-600/95 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              {t('search.emergency247')}
                            </span>
                          )}
                          {hosp.rating > 0 && hosp.reviewCount > 0 && (
                            <div className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 border border-[#E2EBF0] shadow-xs">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{Number(hosp.rating).toFixed(1)}</span>
                              <span className="text-slate-400 font-normal text-[10px]">({hosp.reviewCount})</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 sm:p-5">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1 group-hover:text-[#2DA7B5] transition-colors">
                            {isArabic ? hosp.nameAr || translateHospitalName(hosp.name, hosp.id) : hosp.name}
                          </h4>
                          <p className="text-xs text-slate-500 mb-2.5">{translateLocation(hosp.location)}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {hosp.specialties.slice(0, 3).map((spec) => (
                              <span
                                key={spec}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#E2EBF0] text-slate-700"
                              >
                                {translateSpecialty(spec)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between border-t border-[#E2EBF0] pt-3 text-xs">
                        <span className="text-slate-500 font-semibold">
                          {t('search.specialistsCount', { count: hosp.doctorCount })}
                        </span>
                        <Link
                          to={`/hospitals/${hosp.id}`}
                          className="px-3.5 py-1.5 font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1 border border-[#E2EBF0] transition-colors cursor-pointer"
                        >
                          <span>{t('search.viewHospital')}</span>
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {renderPagination(hospitalPage, filteredHospitals.length, setHospitalPage)}
              </div>
            )}

            {/* Clinics Section */}
            {filteredClinics.length > 0 && (
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#2DA7B5]" />
                  <span>{t('search.clinicsCount', { count: filteredClinics.length })}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {paginatedClinics.map((clinic) => (
                    <motion.div
                      key={clinic.id}
                      whileHover={{ y: -3, transition: { duration: 0.18 } }}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2EBF0] hover:border-[#2DA7B5] hover:shadow-md p-4 sm:p-5 transition-all flex flex-col justify-between group shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#E8F6F8] text-[#0E7490] rounded-lg border border-[#CDEBF0]">
                            {translateSpecialty(clinic.specialty)}
                          </span>
                          {clinic.rating > 0 && clinic.reviewCount > 0 && (
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-[#F8FAFC] px-2 py-0.5 rounded-lg border border-[#E2EBF0]">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span>{Number(clinic.rating).toFixed(1)}</span>
                              <span className="text-slate-400 font-normal text-[10px]">({clinic.reviewCount})</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1 group-hover:text-[#2DA7B5] transition-colors">{clinic.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{translateLocation(clinic.location)}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {clinic.about}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E2EBF0] flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">
                          {t('search.doctorsCount', { count: clinic.doctorCount })}
                        </span>
                        <Link
                          to={`/clinics/${clinic.id}`}
                          className="px-3.5 py-1.5 font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1 border border-[#E2EBF0] transition-colors cursor-pointer"
                        >
                          <span>{t('search.viewClinic')}</span>
                          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {renderPagination(clinicPage, filteredClinics.length, setClinicPage)}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
