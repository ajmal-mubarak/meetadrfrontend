import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  MapPin,
  Calendar,
  Clock,
  Award,
  GraduationCap,
  Building2,
  CheckCircle,
  ArrowLeft,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
import { Doctor } from '../../types';
import { useTranslation } from '../../i18n';

export const DoctorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const d = await doctorService.getDoctorById(id);
        setDoctor(d);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-slate-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500">{t('doctorDetails.loading')}</p>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t('doctorDetails.notFoundTitle')}</h2>
        <p className="text-sm text-slate-500 mb-6">{t('doctorDetails.notFoundDesc')}</p>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#007B8A] hover:bg-[#00606B] text-white rounded-xl text-sm font-semibold border border-[#005F6B]"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('doctorDetails.backToDoctors')}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-10 text-slate-900 selection:bg-teal-100 selection:text-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{t('doctorDetails.backToPrevious')}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <img
                  src={doctor.photo}
                  alt={doctor.name}
                  className="w-28 h-28 rounded-2xl object-cover border border-[#E2EBF0] shrink-0 bg-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                      {translateSpecialty(doctor.specialty)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0E7490] bg-[#E8F6F8] px-2 py-0.5 rounded-full border border-[#CDEBF0]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#2DA7B5]" />
                      {t('doctorDetails.verifiedSpecialist')}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {isArabic ? doctor.nameAr || translateDoctorName(doctor.name, doctor.id) : doctor.name}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1 font-medium">
                    {translateHospitalName(doctor.hospitalName || doctor.clinicName || 'City Care Hospital')}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{translateLocation(doctor.location)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-[#E2EBF0] text-xs">
                    <div className="flex items-center gap-1 font-bold text-slate-900">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{doctor.rating}</span>
                      <span className="text-slate-400 font-normal">({doctor.reviewCount} {t('doctorDetails.reviews')})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 font-medium">
                      <Award className="w-4 h-4 text-[#2DA7B5]" />
                      <span>{isArabic ? doctor.experienceAr || translateExperience(doctor.experience) : doctor.experience}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Doctor */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">{t('doctorDetails.aboutDoctor')}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {isArabic ? doctor.aboutAr || translateDoctorAbout(doctor.about, doctor.id) : doctor.about}
              </p>
            </div>

            {/* Education & Credentials */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#2DA7B5]" />
                <span>{t('doctorDetails.educationQualifications')}</span>
              </h3>
              <p className="text-sm text-slate-700 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2EBF0] leading-relaxed font-mono text-xs">
                {doctor.education}
              </p>
            </div>

            {/* Clinical Affiliations */}
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2DA7B5]" />
                <span>{t('doctorDetails.practicingAffiliation')}</span>
              </h3>
              <div className="p-4 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {translateHospitalName(doctor.hospitalName || doctor.clinicName || 'City Care Hospital')}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{translateLocation(doctor.location)}</p>
                </div>
                {doctor.hospitalId && (
                  <Link
                    to={`/hospitals/${doctor.hospitalId}`}
                    className="text-xs font-semibold text-[#2DA7B5] hover:text-[#23929F]"
                  >
                    {t('doctorDetails.viewFacility')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Booking Action Card (Col 3) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-[#E2EBF0] p-6 sticky top-24 space-y-5 shadow-sm">
              <div className="border-b border-[#E2EBF0] pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0E7490]">
                  {t('doctorDetails.appointmentScheduling')}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{t('doctorDetails.bookConsultation')}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t('doctorDetails.bookingNotice')}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">{t('doctorDetails.availableDays')}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {doctor.availableDays.map((day) => (
                    <span
                      key={day}
                      className="text-xs font-semibold px-2.5 py-1 bg-[#F8FAFC] text-slate-700 border border-[#E2EBF0] rounded-lg"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">{t('doctorDetails.typicalSlots')}</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {doctor.availableSlots.slice(0, 6).map((slot) => (
                    <span
                      key={slot}
                      className="text-xs text-center py-1.5 px-2 rounded-lg bg-[#F8FAFC] text-slate-800 border border-[#E2EBF0] font-mono font-medium"
                    >
                      {slot}
                    </span>
                  ))}
                </div>
                {doctor.availableSlots.length > 6 && (
                  <p className="text-[11px] text-slate-500 text-center mt-1.5">
                    {t('doctorDetails.moreSlotsAvailable', { count: doctor.availableSlots.length - 6 })}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link
                  to={`/book/doctor/${doctor.id}`}
                  className="w-full py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{t('doctorDetails.selectDateAndBook')}</span>
                </Link>
                <p className="text-[11px] text-slate-500 text-center mt-2">
                  {t('doctorDetails.contactNotice')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
