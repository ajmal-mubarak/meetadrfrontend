import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, MapPin, Star, Phone, Clock, Search, ShieldCheck, Activity, ArrowRight, ChevronDown } from 'lucide-react';
import { hospitalService } from '../../services/hospitalService';
import { Hospital } from '../../types';
import { LOCATIONS, matchesLocation } from '../../data/mockSpecialties';
import { useTranslation } from '../../i18n';

export const HospitalList: React.FC = () => {
  const { t, translateSpecialty, translateLocation, isArabic, translateHospitalName, translateHospitalAbout } = useTranslation();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await hospitalService.getAllHospitals();
        setHospitals(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = hospitals.filter((h) => {
    if (!matchesLocation(h.location, location)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const localizedName = isArabic ? (h.nameAr || translateHospitalName(h.name, h.id)).toLowerCase() : '';
      return (
        h.name.toLowerCase().includes(q) ||
        localizedName.includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.specialties.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-10 selection:bg-teal-100 selection:text-slate-800 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F6F8] text-[#0E7490] text-xs font-semibold rounded-full mb-2 border border-[#CDEBF0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>{t('hospitals.partnerBadge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t('hospitals.pageTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl">
            {t('hospitals.pageDesc')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-[#E2EBF0] shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('hospitals.searchPlaceholder')}
              className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border border-[#CBD5E1] rounded-2xl text-slate-900 focus:outline-hidden focus:border-[#0D5C54] bg-[#F8FAFC] focus:bg-white placeholder:text-slate-400 transition-colors shadow-2xs"
            />
          </div>

          <div className="sm:col-span-4 relative">
            <MapPin className="w-4 h-4 text-[#0D5C54] absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold border border-[#CBD5E1] hover:border-[#0D5C54] focus:border-[#0D5C54] rounded-2xl text-slate-800 focus:outline-hidden bg-[#F8FAFC] focus:bg-white transition-all cursor-pointer appearance-none shadow-2xs"
            >
              <option value="All">{t('hospitals.allLocations')}</option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {translateLocation(l)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-700 absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Hospital Cards Grid */}
        {isLoading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-12">
            <div className="w-9 h-9 border-3 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">{t('hospitals.loadingFacilities')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#E2EBF0] shadow-sm text-center max-w-md mx-auto space-y-3">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">{t('hospitals.noFacilitiesFound')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('hospitals.noFacilitiesDesc')}</p>
            <button
              onClick={() => {
                setLocation('All');
                setSearch('');
              }}
              className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              {t('hospitals.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((hosp, idx) => (
              <motion.div
                key={hosp.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className="bg-white rounded-3xl border border-[#E2EBF0] overflow-hidden hover:border-[#2DA7B5] hover:shadow-md transition-all flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                    <img
                      src={hosp.photo}
                      alt={hosp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {hosp.emergencyAvailable && (
                      <span className="absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 bg-white/95 backdrop-blur-md text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 border border-rose-200 shadow-xs">
                        <Activity className="w-3 h-3 text-rose-500" />
                        {t('hospitals.emergency247')}
                      </span>
                    )}
                    <div className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5 bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1 border border-[#E2EBF0] shadow-xs">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{hosp.rating}</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#2DA7B5] transition-colors">
                      {isArabic ? hosp.nameAr || translateHospitalName(hosp.name, hosp.id) : hosp.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{translateLocation(hosp.location)}</span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {isArabic ? hosp.aboutAr || translateHospitalAbout(hosp.about, hosp.id) : hosp.about}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hosp.specialties.slice(0, 4).map((spec) => (
                        <span
                          key={spec}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#E2EBF0] text-slate-700"
                        >
                          {translateSpecialty(spec)}
                        </span>
                      ))}
                      {hosp.specialties.length > 4 && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-lg bg-slate-100 border border-[#E2EBF0] text-slate-500">
                          {t('hospitals.moreSpecialties', { count: hosp.specialties.length - 4 })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between border-t border-[#E2EBF0] pt-3 text-xs">
                    <span className="text-slate-500 font-semibold">{t('hospitals.doctorsCount', { count: hosp.doctorCount })}</span>
                    <Link
                      to={`/hospitals/${hosp.id}`}
                      className="px-4 py-2 font-bold bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <span>{t('hospitals.viewDoctors')}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
