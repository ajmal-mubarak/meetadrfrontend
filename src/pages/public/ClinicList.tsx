import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, MapPin, Star, Phone, Clock, Search, Sparkles, ArrowRight, Stethoscope } from 'lucide-react';
import { clinicService } from '../../services/clinicService';
import { Clinic } from '../../types';
import { SPECIALTIES } from '../../data/mockSpecialties';
import { useTranslation } from '../../i18n';
import { CustomDropdown, DropdownOption } from '../../components/common/CustomDropdown';

export const ClinicList: React.FC = () => {
  const { t, translateSpecialty, translateLocation } = useTranslation();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');

  const specialtyOptions: DropdownOption[] = useMemo(() => [
    { value: 'All', label: t('clinics.allSpecialties') },
    ...SPECIALTIES.map((s) => ({
      value: s,
      label: translateSpecialty(s),
    })),
  ], [t, translateSpecialty]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await clinicService.getAllClinics();
        setClinics(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = clinics.filter((c) => {
    if (specialty !== 'All' && c.specialty !== specialty) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.specialty.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#F4F7F9] min-h-screen py-10 selection:bg-teal-100 selection:text-slate-800 text-slate-900"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F6F8] text-[#0E7490] text-xs font-semibold rounded-full mb-2 border border-[#CDEBF0]">
            <Sparkles className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>{t('clinics.specializedBadge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('clinics.pageTitle')}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">
            {t('clinics.pageDesc')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-[#E2EBF0] shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('clinics.searchPlaceholder')}
              className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 text-sm border border-[#E2EBF0] rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-[#2DA7B5] focus:bg-white focus:outline-none bg-[#F8FAFC] transition-colors"
            />
          </div>

          <div className="sm:col-span-4">
            <CustomDropdown
              value={specialty}
              onChange={(val) => setSpecialty(val)}
              options={specialtyOptions}
              placeholder={t('clinics.allSpecialties')}
              icon={<Stethoscope className="w-3.5 h-3.5 text-[#2DA7B5]" />}
              buttonClassName="rounded-xl border-[#E2EBF0] text-sm"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-12">
            <div className="w-9 h-9 border-3 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">{t('clinics.loadingClinics')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#E2EBF0] shadow-sm text-center max-w-md mx-auto">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">{t('clinics.noClinicsFound')}</h3>
            <p className="text-xs text-slate-600 mb-4">{t('clinics.noClinicsDesc')}</p>
            <button
              onClick={() => {
                setSpecialty('All');
                setSearch('');
              }}
              className="px-4 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {t('clinics.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((clinic, idx) => (
              <motion.div
                key={clinic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                whileHover={{ y: -5, transition: { duration: 0.18 } }}
                className="bg-white rounded-2xl border border-[#E2EBF0] p-5 hover:border-[#2DA7B5] hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-[#E8F6F8] text-[#0E7490] rounded-md border border-[#CDEBF0]">
                      {translateSpecialty(clinic.specialty)}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-[#F8FAFC] px-2 py-0.5 rounded-md border border-[#E2EBF0]">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{clinic.rating}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1 leading-snug">{clinic.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{translateLocation(clinic.location)}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {clinic.about}
                  </p>

                  <div className="text-xs text-slate-600 space-y-1.5 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2EBF0]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate" dir="ltr">{clinic.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{clinic.operatingHours}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E2EBF0] flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">{t('clinics.doctorsCount', { count: clinic.doctorCount })}</span>
                  <Link
                    to={`/clinics/${clinic.id}`}
                    className="px-4 py-2 font-bold bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t('clinics.viewClinic')}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

