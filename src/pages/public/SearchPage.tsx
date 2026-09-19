import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { hospitalService } from '../../services/hospitalService';
import { clinicService } from '../../services/clinicService';
import { Doctor, Hospital, Clinic } from '../../types';
import { SPECIALTIES, LOCATIONS, matchesLocation } from '../../data/mockSpecialties';
import { useTranslation } from '../../i18n';
import { useUserLocation } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';

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

  const initialQuery = searchParams.get('q') || '';
  const initialSpecialty = searchParams.get('specialty') || 'All';
  const initialLocation = searchParams.get('location') || 'All';
  const initialType = searchParams.get('type') || 'All';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [location, setLocation] = useState(initialLocation);
  const [providerType, setProviderType] = useState(initialType);

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
          doctorService.getAllDoctors(),
          hospitalService.getAllHospitals(),
          clinicService.getAllClinics(),
        ]);
        setDoctors(allDocs);
        setHospitals(allHosps);
        setClinics(allClins);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('q', searchTerm);
    if (specialty !== 'All') params.append('specialty', specialty);
    if (location !== 'All') params.append('location', location);
    if (providerType !== 'All') params.append('type', providerType);
    setSearchParams(params);
  };

  // Filter Doctors
  const filteredDoctors = doctors.filter((d) => {
    if (providerType !== 'All' && providerType !== 'Doctor') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q) ||
        (d.hospitalName && d.hospitalName.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (specialty !== 'All' && d.specialty.toLowerCase() !== specialty.toLowerCase()) return false;
    if (!matchesLocation(d.location, location)) return false;
    return true;
  });

  // Filter Hospitals
  const filteredHospitals = hospitals.filter((h) => {
    if (providerType !== 'All' && providerType !== 'Hospital') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.specialties.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (
      specialty !== 'All' &&
      !h.specialties.some((s) => s.toLowerCase() === specialty.toLowerCase())
    )
      return false;
    if (!matchesLocation(h.location, location)) return false;
    return true;
  });

  // Filter Clinics
  const filteredClinics = clinics.filter((c) => {
    if (providerType !== 'All' && providerType !== 'Clinic') return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (specialty !== 'All' && c.specialty.toLowerCase() !== specialty.toLowerCase()) return false;
    if (!matchesLocation(c.location, location)) return false;
    return true;
  });

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              <div className="sm:col-span-2 md:col-span-5 relative">
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
                    className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 border border-[#E2EBF0] rounded-xl text-xs sm:text-sm text-slate-900 focus:border-[#2DA7B5] focus:outline-hidden bg-[#F8FAFC] focus:bg-white placeholder:text-slate-400 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="sm:col-span-1 md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('search.specialty')}
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full py-2.5 px-3 border border-[#E2EBF0] rounded-xl text-xs sm:text-sm text-slate-800 focus:border-[#2DA7B5] focus:outline-hidden bg-[#F8FAFC] focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="All">{t('doctorList.allSpecialties')}</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {translateSpecialty(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('search.location')}
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-[#0D5C54] absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={location}
                      onChange={(e) => {
                        if (e.target.value === 'current') {
                          handleAutoDetectLocation();
                        } else {
                          setLocation(e.target.value);
                        }
                      }}
                      className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-9 py-2.5 px-3 border border-[#CBD5E1] hover:border-[#0D5C54] focus:border-[#0D5C54] rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-hidden bg-[#F8FAFC] focus:bg-white transition-all cursor-pointer font-semibold appearance-none shadow-2xs"
                    >
                      <option value="current" className="font-bold text-[#0E7490]">
                        {locationStatus === 'detecting'
                          ? (translateLocation('Detecting...') || 'Detecting...')
                          : detectedLoc
                          ? `${t('location.currentLocation')}: ${detectedLoc.emirateName}`
                          : `${t('location.useCurrentLocation')}`}
                      </option>
                      <option disabled className="text-slate-300">──────────</option>
                      <option value="All">{t('hospitals.allLocations')}</option>
                      {LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {translateLocation(loc)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-700 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    disabled={locationStatus === 'detecting'}
                    title={t('location.detectLocationTooltip')}
                    className="w-10 h-10 rounded-2xl bg-[#2DA7B5] hover:bg-[#23929F] active:scale-95 text-white transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center shadow-xs"
                  >
                    {locationStatus === 'detecting' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <LocateFixed className="w-4 h-4 text-white stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 md:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#2DA7B5] hover:bg-[#23929F] text-white active:scale-[0.99] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
                    onClick={() => setProviderType(type)}
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

              <div className="text-xs text-slate-500 font-semibold shrink-0">
                {t('search.foundResults', { count: totalCount })}
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
              onClick={() => {
                setSearchTerm('');
                setSpecialty('All');
                setLocation('All');
                setProviderType('All');
              }}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filteredDoctors.map((doc) => (
                    <motion.div
                      key={doc.id}
                      whileHover={{ y: -3, transition: { duration: 0.18 } }}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2EBF0] hover:border-[#2DA7B5] hover:shadow-md p-4 sm:p-5 transition-all flex flex-col justify-between group shadow-xs"
                    >
                      <div className="flex items-start gap-3.5 sm:gap-4">
                        <Link to={`/doctors/${doc.id}`} className="shrink-0 cursor-pointer">
                          <img
                            src={doc.photo}
                            alt={doc.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80';
                            }}
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover bg-slate-100 border border-[#E2EBF0] group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] sm:text-xs font-semibold text-[#0E7490] block mb-0.5 truncate">
                            {translateSpecialty(doc.specialty)}
                          </span>
                          <Link to={`/doctors/${doc.id}`} className="block">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate group-hover:text-[#2DA7B5] transition-colors">
                              {isArabic ? doc.nameAr || translateDoctorName(doc.name, doc.id) : doc.name}
                            </h4>
                          </Link>
                          <p className="text-xs text-slate-600 truncate mt-0.5">
                            {translateHospitalName(doc.hospitalName || doc.clinicName || 'City Care Hospital')}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{translateLocation(doc.location)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E2EBF0] flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-1 font-bold text-slate-900 shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{doc.rating}</span>
                          <span className="text-slate-400 font-normal">({doc.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Link
                            to={`/doctors/${doc.id}`}
                            className="px-2.5 sm:px-3 py-1.5 font-bold text-slate-700 hover:text-[#0E7490] hover:bg-[#E8F6F8] hover:border-[#2DA7B5] rounded-xl border border-[#CBD5E1] transition-all cursor-pointer text-xs shadow-2xs"
                          >
                            {t('doctors.viewProfile')}
                          </Link>
                          <Link
                            to={`/book/doctor/${doc.id}`}
                            className="px-3 sm:px-3.5 py-1.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer text-xs"
                          >
                            {t('search.bookSlot')}
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
                  {filteredHospitals.map((hosp) => (
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
                          <div className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 border border-[#E2EBF0] shadow-xs">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{hosp.rating}</span>
                          </div>
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
                  {filteredClinics.map((clinic) => (
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
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-[#F8FAFC] px-2 py-0.5 rounded-lg border border-[#E2EBF0]">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{clinic.rating}</span>
                          </div>
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
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
