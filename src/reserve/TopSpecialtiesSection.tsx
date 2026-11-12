import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ArrowRight,
  Sparkles,
  Award,
  Activity,
  Users,
  Zap,
  CheckCircle,
  HeartPulse,
  Bone,
  Baby,
  Stethoscope,
  Brain,
  Eye,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { Doctor } from '../../types';

interface TopSpecialtiesSectionProps {
  realDoctors?: Doctor[];
}

/**
 * RESERVE COMPONENT: Top Specialties & Clinical Disciplines
 * 
 * To re-enable this section on the Home page (frontend/src/pages/public/Home.tsx):
 * 1. Import this component:
 *    import { TopSpecialtiesSection } from '../../reserve/TopSpecialtiesSection';
 * 2. Place it in Home.tsx where desired:
 *    <TopSpecialtiesSection realDoctors={realDoctors} />
 */
export const TopSpecialtiesSection: React.FC<TopSpecialtiesSectionProps> = ({ realDoctors = [] }) => {
  const { t, isArabic } = useTranslation();
  const navigate = useNavigate();
  const isRTL = isArabic;

  const handleQuickSpecialty = (specialty: string) => {
    navigate(`/doctors?specialty=${encodeURIComponent(specialty)}`);
  };

  const getSpecialtyDoctorCount = (specialtyQuery: string): number => {
    if (!realDoctors.length) return 0;
    const keywords: Record<string, string[]> = {
      'Skin Care': ['derm', 'skin'],
      'Dental': ['dental', 'dent'],
      'ENT': ['ent', 'ear', 'nose', 'throat', 'otolaryng'],
      'Physiotherapy': ['physio', 'rehab', 'physical therap'],
      'Radiology': ['radio', 'imaging', 'x-ray', 'mri', 'scan'],
      'Laboratory': ['lab', 'pathol'],
      'Cardiology': ['cardio', 'heart'],
      'Orthopedics': ['ortho', 'bone', 'joint', 'spine'],
      'Pediatrics': ['pediat', 'paediat', 'child'],
      'General Practice': ['general practice', 'gp', 'family med', 'internal med', 'general medicine'],
      'Neurology': ['neuro', 'brain', 'spine'],
      'Ophthalmology': ['ophthalm', 'eye', 'vision'],
    };
    const targetKeywords = keywords[specialtyQuery] || [specialtyQuery.toLowerCase()];
    return realDoctors.filter((doc) => {
      const spec = (doc.specialty || '').toLowerCase();
      const interests = (doc.specialInterest || []).join(' ').toLowerCase();
      const combined = `${spec} ${interests}`;
      return targetKeywords.some((kw) => combined.includes(kw));
    }).length;
  };

  const formatSpecialistCount = (count: number) => {
    if (count <= 0) return '';
    if (isArabic) {
      return count === 1 ? '1 استشاري معتمد' : `${count} استشاريين معتمدين`;
    }
    return `${count} Specialist${count !== 1 ? 's' : ''}`;
  };

  const getSpecialtyName = (spec: { name: string; specialtyQuery: string }) => {
    if (!isArabic) return spec.name;
    const arNames: Record<string, string> = {
      'Cardiology': 'أمراض وجراحة القلب',
      'Orthopedics': 'جراحة العظام والمفاصل',
      'Pediatrics': 'طب الأطفال وحديثي الولادة',
      'General Practice': 'طب الأسرة والطب العام',
      'Neurology': 'طب المخ والأعصاب',
      'Ophthalmology': 'طب وجراحة العيون',
      'Skin Care & Aesthetic': 'الجلدية والتجميل والليزر',
      'Dental Care': 'طب وجراحة وتجميل الأسنان',
      'ENT (Ear, Nose & Throat)': 'الأنف والأذن والحنجرة',
      'Physiotherapy & Rehab': 'العلاج الطبيعي والتأهيل',
      'Radiology & Diagnostics': 'الأشعة والتصوير التشخيصي',
      'Medical Laboratory': 'المختبرات والتحاليل الطبية',
    };
    return arNames[spec.specialtyQuery] || arNames[spec.name] || spec.name;
  };

  const getSpecialtyDesc = (spec: { desc: string; specialtyQuery: string }) => {
    if (!isArabic) return spec.desc;
    const arDescs: Record<string, string> = {
      'Cardiology': 'رعاية القلب والشرايين والقسطرة',
      'Orthopedics': 'المفاصل والعمود الفقري والعظام',
      'Pediatrics': 'رعاية الأطفال وحديثي الولادة',
      'General Practice': 'الفحص الشامل والرعاية الأولية',
      'Neurology': 'الصداع والصرع واعتلال الأعصاب',
      'Ophthalmology': 'تصحيح النظر وجراحة المياه البيضاء',
      'Skin Care & Aesthetic': 'علاج الأمراض الجلدية والليزر',
      'Dental Care': 'تقويم وزراعة وتبييض الأسنان',
      'ENT (Ear, Nose & Throat)': 'الجيوب الأنفية والسمعيات والأحبال الصوتية',
      'Physiotherapy & Rehab': 'إعادة التأهيل بعد الإصابات الرياضية',
      'Radiology & Diagnostics': 'رنين مغناطيسي 3T وأشعة مقطعية وسونار',
      'Medical Laboratory': 'الفحوصات الهرمونية والجينية الشاملة',
    };
    return arDescs[spec.specialtyQuery] || arDescs[spec.desc] || spec.desc;
  };

  return (
    <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
        <div>
          <div className="inline-block px-3 py-1 bg-white border border-[#E2EBF0] text-slate-700 text-xs font-semibold rounded-full mb-2 shadow-2xs">
            {t('home.specializedCare')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Top Specialties & Clinical Disciplines
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {t('home.exploreSpecialtiesDesc')}
          </p>
        </div>
        <Link
          to="/specialties"
          className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 shrink-0 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all border border-[#E2EBF0] shadow-xs"
        >
          <span>{t('home.viewAllSpecialties')}</span>
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>

      {/* Two-line infinite auto-sliding marquee: First line slides right, Second line slides left */}
      <div className="relative overflow-hidden space-y-4 sm:space-y-5 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 marquee-track-container" dir="ltr">
        {/* Subtle edge fade overlays */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-24 bg-gradient-to-r from-[#F4F7F9] via-[#F4F7F9]/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-24 bg-gradient-to-l from-[#F4F7F9] via-[#F4F7F9]/80 to-transparent z-10" />

        {/* First Line: Slides to the RIGHT */}
        <div className="overflow-hidden w-full marquee-track-container" dir="ltr">
          <div className="animate-slide-right gap-4 sm:gap-5" dir="ltr">
            {[
              {
                name: 'Skin Care & Aesthetic',
                specialtyQuery: 'Skin Care',
                desc: 'Dermatology & clinical skin care',
                image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80',
                icon: Sparkles,
              },
              {
                name: 'Dental Care',
                specialtyQuery: 'Dental',
                desc: 'Oral health & orthodontics',
                image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=80',
                icon: Award,
              },
              {
                name: 'ENT (Ear, Nose & Throat)',
                specialtyQuery: 'ENT',
                desc: 'Sinus, hearing & voice care',
                image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=500&auto=format&fit=crop&q=80',
                icon: Activity,
              },
              {
                name: 'Physiotherapy & Rehab',
                specialtyQuery: 'Physiotherapy',
                desc: 'Mobility & sports recovery',
                image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&fit=crop&q=80',
                icon: Users,
              },
              {
                name: 'Radiology & Diagnostics',
                specialtyQuery: 'Radiology',
                desc: '3T MRI, CT scans & ultrasound',
                image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&auto=format&fit=crop&q=80',
                icon: Zap,
              },
              {
                name: 'Medical Laboratory',
                specialtyQuery: 'Laboratory',
                desc: 'Pathology & clinical testing',
                image: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=500&auto=format&fit=crop&q=80',
                icon: CheckCircle,
              },
              // Duplicate for seamless infinite loop
              {
                name: 'Skin Care & Aesthetic',
                specialtyQuery: 'Skin Care',
                desc: 'Dermatology & clinical skin care',
                image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop&q=80',
                icon: Sparkles,
              },
              {
                name: 'Dental Care',
                specialtyQuery: 'Dental',
                desc: 'Oral health & orthodontics',
                image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=80',
                icon: Award,
              },
              {
                name: 'ENT (Ear, Nose & Throat)',
                specialtyQuery: 'ENT',
                desc: 'Sinus, hearing & voice care',
                image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=500&auto=format&fit=crop&q=80',
                icon: Activity,
              },
              {
                name: 'Physiotherapy & Rehab',
                specialtyQuery: 'Physiotherapy',
                desc: 'Mobility & sports recovery',
                image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&fit=crop&q=80',
                icon: Users,
              },
              {
                name: 'Radiology & Diagnostics',
                specialtyQuery: 'Radiology',
                desc: '3T MRI, CT scans & ultrasound',
                image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=500&auto=format&fit=crop&q=80',
                icon: Zap,
              },
              {
                name: 'Medical Laboratory',
                specialtyQuery: 'Laboratory',
                desc: 'Pathology & clinical testing',
                image: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=500&auto=format&fit=crop&q=80',
                icon: CheckCircle,
              },
            ].map((spec, idx) => {
              const Icon = spec.icon;
              return (
                <button
                  key={`line1-${spec.name}-${idx}`}
                  type="button"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  onClick={() => handleQuickSpecialty(spec.specialtyQuery)}
                  className="group relative rounded-2xl overflow-hidden w-64 sm:w-72 md:w-80 h-38 sm:h-44 shrink-0 transition-all duration-300 hover:scale-[1.02] border border-slate-800 hover:border-slate-700 text-left rtl:text-right cursor-pointer"
                >
                  {/* Background image */}
                  <img
                    src={spec.image}
                    alt={spec.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081217] via-[#081217]/50 to-transparent" />

                  {/* Top badge: Specialists Count */}
                  {getSpecialtyDoctorCount(spec.specialtyQuery) > 0 && (
                    <div className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#0C1A22] text-[10px] font-semibold text-slate-200 border border-slate-800">
                        {formatSpecialistCount(getSpecialtyDoctorCount(spec.specialtyQuery))}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4 text-left rtl:text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 backdrop-blur-sm text-white flex items-center justify-center border border-white/20 shrink-0">
                        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-slate-100 transition-colors truncate">
                        {getSpecialtyName(spec)}
                      </h3>
                    </div>
                    <p className="text-[10px] text-white/70 font-medium truncate">{getSpecialtyDesc(spec)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Second Line: Slides to the LEFT */}
        <div className="overflow-hidden w-full marquee-track-container" dir="ltr">
          <div className="animate-slide-left gap-4 sm:gap-5" dir="ltr">
            {[
              {
                name: 'Cardiology',
                specialtyQuery: 'Cardiology',
                desc: 'Heart & cardiovascular care',
                image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=500&auto=format&fit=crop&q=80',
                icon: HeartPulse,
              },
              {
                name: 'Orthopedics',
                specialtyQuery: 'Orthopedics',
                desc: 'Joints, bones & spine surgery',
                image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80',
                icon: Bone,
              },
              {
                name: 'Pediatrics',
                specialtyQuery: 'Pediatrics',
                desc: 'Child health & newborn care',
                image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80',
                icon: Baby,
              },
              {
                name: 'General Practice',
                specialtyQuery: 'General Practice',
                desc: 'Family medicine & wellness',
                image: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=500&auto=format&fit=crop&q=80',
                icon: Stethoscope,
              },
              {
                name: 'Neurology',
                specialtyQuery: 'Neurology',
                desc: 'Brain, nerves & headache care',
                image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=80',
                icon: Brain,
              },
              {
                name: 'Ophthalmology',
                specialtyQuery: 'Ophthalmology',
                desc: 'Vision care & LASIK surgery',
                image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=80',
                icon: Eye,
              },
              // Duplicate for seamless infinite loop
              {
                name: 'Cardiology',
                specialtyQuery: 'Cardiology',
                desc: 'Heart & cardiovascular care',
                image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=500&auto=format&fit=crop&q=80',
                icon: HeartPulse,
              },
              {
                name: 'Orthopedics',
                specialtyQuery: 'Orthopedics',
                desc: 'Joints, bones & spine surgery',
                image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=500&auto=format&fit=crop&q=80',
                icon: Bone,
              },
              {
                name: 'Pediatrics',
                specialtyQuery: 'Pediatrics',
                desc: 'Child health & newborn care',
                image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=80',
                icon: Baby,
              },
              {
                name: 'General Practice',
                specialtyQuery: 'General Practice',
                desc: 'Family medicine & wellness',
                image: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=500&auto=format&fit=crop&q=80',
                icon: Stethoscope,
              },
              {
                name: 'Neurology',
                specialtyQuery: 'Neurology',
                desc: 'Brain, nerves & headache care',
                image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=500&auto=format&fit=crop&q=80',
                icon: Brain,
              },
              {
                name: 'Ophthalmology',
                specialtyQuery: 'Ophthalmology',
                desc: 'Vision care & LASIK surgery',
                image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=80',
                icon: Eye,
              },
            ].map((spec, idx) => {
              const Icon = spec.icon;
              return (
                <button
                  key={`line2-${spec.name}-${idx}`}
                  type="button"
                  dir={isRTL ? 'rtl' : 'ltr'}
                  onClick={() => handleQuickSpecialty(spec.specialtyQuery)}
                  className="group relative rounded-2xl overflow-hidden w-64 sm:w-72 md:w-80 h-38 sm:h-44 shrink-0 transition-all duration-300 hover:scale-[1.02] border border-[#E2EBF0] hover:border-[#2DA7B5] text-left rtl:text-right cursor-pointer shadow-xs"
                >
                  {/* Background image */}
                  <img
                    src={spec.image}
                    alt={spec.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent" />

                  {/* Top badge: Specialists Count */}
                  {getSpecialtyDoctorCount(spec.specialtyQuery) > 0 && (
                    <div className="absolute top-2.5 right-2.5 rtl:right-auto rtl:left-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/95 text-[10px] font-semibold text-slate-800 border border-[#E2EBF0] shadow-xs">
                        {formatSpecialistCount(getSpecialtyDoctorCount(spec.specialtyQuery))}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4 text-left rtl:text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 backdrop-blur-sm text-white flex items-center justify-center border border-white/20 shrink-0">
                        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-slate-100 transition-colors truncate">
                        {getSpecialtyName(spec)}
                      </h3>
                    </div>
                    <p className="text-[10px] text-white/80 font-medium truncate">{getSpecialtyDesc(spec)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Explore all specialties footer link */}
      <div className="mt-8 text-center">
        <Link
          to="/specialties"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-[#E2EBF0] text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
        >
          <span>{t('home.viewAllSpecialties')}</span>
          <ArrowRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
        </Link>
      </div>
    </section>
  );
};
export default TopSpecialtiesSection;
