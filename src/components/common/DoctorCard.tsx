import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star, Building2, Award, ArrowRight } from 'lucide-react';
import { Doctor } from '../../types';
import { useTranslation } from '../../i18n';
import { DEFAULT_DOCTOR_AVATAR } from '../../utils/avatar';

interface DoctorCardProps {
  doctor: Doctor;
  delayIndex?: number;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor: doc,
  delayIndex = 0,
}) => {
  const {
    t,
    translateSpecialty,
    isArabic,
    translateDoctorName,
    translateDoctorAbout,
    translateHospitalName,
    translateExperience,
  } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: delayIndex * 0.02 }}
      className="bg-white rounded-3xl border border-[#E2EBF0] p-5 sm:p-6 hover:border-[#2DA7B5] hover:shadow-md transition-all flex flex-col justify-between group shadow-xs h-full"
    >
      <div>
        {/* Header: Avatar, Specialty Badge, Star Rating, Doctor Name, Hospital */}
        <div className="flex items-start gap-3.5 sm:gap-4">
          <Link to={`/doctors/${doc.id}`} className="shrink-0">
            <img
              src={doc.photo || DEFAULT_DOCTOR_AVATAR}
              alt={doc.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_DOCTOR_AVATAR;
              }}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border border-[#E2EBF0] group-hover:scale-105 transition-transform bg-slate-50"
              referrerPolicy="no-referrer"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0] px-3 py-0.5 rounded-full inline-block truncate max-w-[140px]">
                {translateSpecialty(doc.specialty)}
              </span>
              {doc.rating > 0 && (doc.reviewCount || 0) > 0 ? (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{Number(doc.rating).toFixed(1)}</span>
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  New
                </span>
              )}
            </div>

            <Link to={`/doctors/${doc.id}`} className="block">
              <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#0E7490] transition-colors truncate">
                {isArabic ? doc.nameAr || translateDoctorName(doc.name, doc.id) : doc.name}
              </h3>
            </Link>

            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {doc.hospitalName || doc.clinicName
                  ? translateHospitalName(doc.hospitalName || doc.clinicName || '')
                  : (isArabic ? 'مستقل' : 'Independent')}
              </span>
            </p>
          </div>
        </div>

        {/* Experience & Availability Strip */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600 bg-[#F8FAFC] px-3.5 py-2 rounded-2xl border border-[#E2EBF0]">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Award className="w-4 h-4 text-[#2DA7B5]" />
            <span>
              {isArabic ? doc.experienceAr || translateExperience(doc.experience) : doc.experience}
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t('home.availableThisWeek') || 'Available this week'}</span>
          </span>
        </div>

        {/* About Snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-3.5">
          {isArabic ? doc.aboutAr || translateDoctorAbout(doc.about, doc.id) : doc.about}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 pt-3.5 border-t border-slate-100">
        {doc.status === 'Deactivated' ? (
          <div className="w-full py-2.5 bg-slate-100 text-slate-400 text-center rounded-xl text-xs font-semibold cursor-not-allowed">
            Unavailable
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to={`/doctors/${doc.id}`}
              className="py-2.5 px-3 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:border-[#2DA7B5] hover:text-[#0E7490] text-slate-700 border border-[#CBD5E1] font-bold rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer shadow-2xs text-center"
            >
              {t('doctors.viewProfile')}
            </Link>
            <Link
              to={`/book/doctor/${doc.id}`}
              className="py-2.5 px-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer text-center"
            >
              <span>{t('doctors.bookAppointment')}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};
