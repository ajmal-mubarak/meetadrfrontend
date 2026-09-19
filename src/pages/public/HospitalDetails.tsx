import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Star,
  Phone,
  Clock,
  ShieldCheck,
  Stethoscope,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Share2,
  Check,
  Award,
  Bed,
  Activity,
  Pill,
  Car,
  Sparkles,
  AlertCircle,
  Navigation,
} from 'lucide-react';
import { hospitalService } from '../../services/hospitalService';
import { doctorService } from '../../services/doctorService';
import { Hospital, Doctor } from '../../types';
import { useTranslation } from '../../i18n';
import { HospitalBrandLogo } from '../../components/common/HospitalLogos';

export const HospitalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    t,
    translateSpecialty,
    translateLocation,
    isArabic,
    translateHospitalName,
    translateHospitalAbout,
    translateDoctorName,
    translateDoctorAbout,
    translateExperience,
  } = useTranslation();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [hosp, docs] = await Promise.all([
          hospitalService.getHospitalById(id),
          doctorService.getDoctorsByHospital(id),
        ]);
        setHospital(hosp);
        setDoctors(docs);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#F4F7F9] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">{t('hospitals.loadingDetails')}</p>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-[70vh] bg-[#F4F7F9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-[#E2EBF0] shadow-sm rounded-3xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Building2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('hospitals.hospitalNotFound')}</h2>
          <p className="text-xs text-slate-500 mb-6">
            The facility you are looking for may have been updated or relocated.
          </p>
          <Link
            to="/hospitals"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t('hospitals.backToHospitals')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const filteredDoctors =
    selectedSpecialty === 'all'
      ? doctors
      : doctors.filter(
          (doc) => doc.specialty?.toLowerCase() === selectedSpecialty.toLowerCase()
        );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${hospital.name} ${hospital.address}`
  )}`;

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-6 sm:py-10 text-slate-900 selection:bg-teal-100 selection:text-teal-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              <span>{t('hospitals.backToPrevious')}</span>
            </button>
            <span className="text-slate-400">/</span>
            <Link to="/hospitals" className="text-slate-500 hover:text-slate-900 transition-colors">
              {t('hospitals.pageTitle')}
            </Link>
            <span className="text-slate-400">/</span>
            <span className="text-slate-800 font-medium truncate max-w-[150px] sm:max-w-[260px]">
              {hospital.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2EBF0] text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title={t('hospitals.shareFacility')}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">{t('hospitals.linkCopied')}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('hospitals.shareFacility')}</span>
                </>
              )}
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2EBF0] text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5 text-[#2DA7B5]" />
              <span className="hidden sm:inline">{t('hospitals.getDirections')}</span>
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Flagship Hospital Hero Showcase                                           */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-[#E2EBF0] overflow-hidden mb-8 shadow-xs">
          {/* Architectural Hospital Photo Banner */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full bg-slate-100 overflow-hidden">
            <img
              src={hospital.photo}
              alt={hospital.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 flex flex-wrap items-center gap-2 z-10">
              {hospital.emergencyAvailable && (
                <div className="inline-flex items-center gap-1.5 bg-rose-50/95 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>{t('hospitals.emergencyServices')}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 bg-emerald-50/95 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('hospitals.accreditedFacility')}</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-10">
              <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-1.5 border border-[#E2EBF0] shadow-xs">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{hospital.rating}</span>
                <span className="text-slate-500 font-normal text-[11px]">(4.9/5.0)</span>
              </div>
            </div>

            {/* Bottom Hero Header Info */}
            <div className="absolute bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-8 z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="bg-white/95 backdrop-blur-md border border-[#E2EBF0] p-2.5 rounded-2xl shrink-0 flex items-center justify-center shadow-xs">
                    <HospitalBrandLogo hospitalId={hospital.id} className="h-9 sm:h-11 w-auto" theme="light" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
                      {isArabic ? hospital.nameAr || translateHospitalName(hospital.name, hospital.id) : hospital.name}
                    </h1>
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 mt-1">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{isArabic ? hospital.addressAr || hospital.address : hospital.address}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <a
                    href={`tel:${hospital.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F8FAFC] hover:bg-slate-100 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold border border-[#E2EBF0] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>{t('hospitals.callHospital')}</span>
                  </a>
                  <a
                    href="#doctors-section"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{t('hospitals.bookAppointment')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Four-Metric Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-[#E2EBF0] divide-y lg:divide-y-0 lg:divide-x divide-[#E2EBF0] rtl:divide-x-reverse bg-[#F8FAFC]">
            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E2EBF0] flex items-center justify-center shrink-0 shadow-2xs">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Quality Rating</p>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {hospital.rating} <span className="text-xs text-slate-500 font-normal">/ 5.0 (Top Care)</span>
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E2EBF0] flex items-center justify-center shrink-0 shadow-2xs">
                <Stethoscope className="w-5 h-5 text-[#2DA7B5]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Medical Faculty</p>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {doctors.length || hospital.doctorCount}+ <span className="text-xs text-slate-500 font-normal">Specialists</span>
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E2EBF0] flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Clinical Departments</p>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {hospital.specialties.length} <span className="text-xs text-slate-500 font-normal">Disciplines</span>
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E2EBF0] flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-5 h-5 text-[#0E7490]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Operating Status</p>
                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {hospital.emergencyAvailable ? t('hospitals.emergencyUnitOpen') : t('hospitals.standardHours')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Main Content: Split Grid (2/3 Main Info & Doctors, 1/3 Facility Directory) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Facility & Clinical Mission */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-[#2DA7B5]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {t('hospitals.aboutFacility')}
                </h2>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {isArabic ? hospital.aboutAr || translateHospitalAbout(hospital.about, hospital.id) : hospital.about}
              </p>

              {/* Key Clinical Amenities & Standards */}
              <div className="mt-6 pt-6 border-t border-[#E2EBF0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                  {t('hospitals.patientAmenities')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0]">
                    <Bed className="w-4 h-4 text-[#2DA7B5] shrink-0" />
                    <span className="text-xs font-medium text-slate-800">{t('hospitals.inpatientBeds')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0]">
                    <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-800">{t('hospitals.roboticSurgery')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0]">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-800">{t('hospitals.diagnosticImaging')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0]">
                    <Pill className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-800">{t('hospitals.pharmacy247')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] sm:col-span-2">
                    <Car className="w-4 h-4 text-sky-600 shrink-0" />
                    <span className="text-xs font-medium text-slate-800">{t('hospitals.valetParking')}</span>
                  </div>
                </div>
              </div>

              {/* Key Clinical Specialties */}
              <div className="mt-6 pt-6 border-t border-[#E2EBF0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  {t('hospitals.keyDepartments')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hospital.specialties.map((spec) => {
                    const isSelected = selectedSpecialty.toLowerCase() === spec.toLowerCase();
                    return (
                      <button
                        key={spec}
                        onClick={() => {
                          setSelectedSpecialty(isSelected ? 'all' : spec);
                          const el = document.getElementById('doctors-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#2DA7B5] text-white border-[#23929F] shadow-xs'
                            : 'bg-[#E8F6F8] text-[#0E7490] border-[#CDEBF0] hover:bg-[#D4EFF3]'
                        }`}
                      >
                        <span>{translateSpecialty(spec)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Doctors Section */}
            <div id="doctors-section" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {t('hospitals.specialistsAt', { name: hospital.name })}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('hospitals.specialistsSubtitle')}
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1.5 bg-white text-slate-700 border border-[#E2EBF0] rounded-full shrink-0 w-fit shadow-2xs">
                  {t('hospitals.doctorsAvailable', { count: filteredDoctors.length })}
                </span>
              </div>

              {/* Specialty Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                  onClick={() => setSelectedSpecialty('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer border ${
                    selectedSpecialty === 'all'
                      ? 'bg-[#2DA7B5] text-white border-[#23929F] shadow-xs'
                      : 'bg-white text-slate-600 border-[#E2EBF0] hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t('hospitals.allSpecialties')} ({doctors.length})
                </button>
                {hospital.specialties.map((spec) => {
                  const count = doctors.filter(
                    (d) => d.specialty?.toLowerCase() === spec.toLowerCase()
                  ).length;
                  return (
                    <button
                      key={spec}
                      onClick={() => setSelectedSpecialty(spec)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer border ${
                        selectedSpecialty.toLowerCase() === spec.toLowerCase()
                          ? 'bg-[#2DA7B5] text-white border-[#23929F] shadow-xs'
                          : 'bg-white text-slate-600 border-[#E2EBF0] hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {translateSpecialty(spec)} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Doctor Cards Grid */}
              {filteredDoctors.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E2EBF0] p-8 text-center shadow-xs">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800">{t('hospitals.noDoctorsSpecialty')}</p>
                  <button
                    onClick={() => setSelectedSpecialty('all')}
                    className="mt-4 px-4 py-2 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2EBF0] text-xs font-semibold text-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    View All Specialists
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-3xl border border-[#E2EBF0] p-5 hover:border-[#2DA7B5] transition-all flex flex-col justify-between group shadow-xs"
                    >
                      <div>
                        <div className="flex items-start gap-3.5">
                          <div className="relative shrink-0">
                            <img
                              src={doc.photo}
                              alt={doc.name}
                              className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-[#E2EBF0] group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                                {translateSpecialty(doc.specialty)}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-[#0E7490] transition-colors">
                              {isArabic ? doc.nameAr || translateDoctorName(doc.name, doc.id) : doc.name}
                            </h3>
                            <p className="text-xs text-slate-500 truncate">
                              {isArabic ? doc.experienceAr || translateExperience(doc.experience) : doc.experience}
                            </p>
                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-800 mt-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>{doc.rating}</span>
                              <span className="text-slate-400 font-normal">({doc.reviewCount})</span>
                            </div>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {isArabic ? doc.aboutAr || translateDoctorAbout(doc.about, doc.id) : doc.about}
                        </p>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-[#E2EBF0] flex items-center justify-between gap-2.5">
                        <Link
                          to={`/doctors/${doc.id}`}
                          className="flex-1 py-2 text-center text-xs font-semibold text-slate-700 bg-[#F8FAFC] hover:bg-slate-100 hover:text-slate-900 rounded-xl border border-[#E2EBF0] cursor-pointer transition-colors"
                        >
                          {t('hospitals.viewProfile')}
                        </Link>
                        <Link
                          to={`/book/doctor/${doc.id}`}
                          className="flex-1 py-2 text-center text-xs font-bold text-white bg-[#2DA7B5] hover:bg-[#23929F] rounded-xl cursor-pointer transition-colors shadow-xs"
                        >
                          {t('hospitals.book')}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Facility Directory & Patient Info Sidebar */}
          <div className="space-y-6">
            {/* Quick Contact & Appointments */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 space-y-5 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {t('hospitals.admissionsContact')}
                </h3>
              </div>

              {hospital.emergencyAvailable && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>{t('hospitals.emergencyHotline')}</span>
                  </div>
                  <a
                    href={`tel:${hospital.phone}`}
                    className="block text-base font-black text-rose-800 hover:text-rose-950 transition-colors"
                    dir="ltr"
                  >
                    {hospital.phone}
                  </a>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Direct Outpatient Desk</span>
                  <a
                    href={`tel:${hospital.phone}`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 w-full rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2EBF0] text-slate-800 font-semibold transition-colors"
                  >
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span dir="ltr">{hospital.phone}</span>
                  </a>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">{t('hospitals.operatingHours')}</span>
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] text-slate-800">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{isArabic ? hospital.operatingHoursAr || hospital.operatingHours : hospital.operatingHours}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">{t('hospitals.physicalLocation')}</span>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] space-y-2">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{isArabic ? hospital.addressAr || hospital.address : hospital.address}</span>
                    </div>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0E7490] hover:underline pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t('hospitals.getDirections')}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Accepted Health Insurance Card */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {t('hospitals.acceptedInsurance')}
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {t('hospitals.insuranceNote')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'NextCare',
                  'AXA / GIG',
                  'MetLife',
                  'Daman National',
                  'Thiqa',
                  'Sukoon (Oman)',
                  'Cigna Global',
                  'Allianz Care',
                  'MedNet',
                  'Neuron',
                ].map((ins) => (
                  <span
                    key={ins}
                    className="px-2.5 py-1 bg-[#F8FAFC] border border-[#E2EBF0] rounded-lg text-[11px] font-medium text-slate-700"
                  >
                    {ins}
                  </span>
                ))}
              </div>
            </div>

            {/* Quality & Safety Assurance */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Accreditation & Standards
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Licensed and accredited by UAE Health Authorities (DHA & MOHAP).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Joint Commission International (JCI) standards compliant.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('hospitals.verifiedSlotsNote')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
