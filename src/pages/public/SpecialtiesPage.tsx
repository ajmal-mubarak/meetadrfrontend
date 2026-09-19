import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Stethoscope,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

export interface SpecialtyItem {
  id: string;
  name: string;
  nameAr?: string;
  group: 'clinical' | 'surgical' | 'diagnostic' | 'wellness' | 'pediatric';
  groupLabel: string;
  image: string;
  doctorCount: number;
  clinicCount: number;
  description: string;
  commonConditions: string[];
}

export const ALL_SPECIALTIES_DATA: SpecialtyItem[] = [
  {
    id: 'skin-care',
    name: 'Skin Care & Dermatology',
    nameAr: 'العناية بالبشرة والجلدية',
    group: 'wellness',
    groupLabel: 'Wellness & Aesthetic',
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
    doctorCount: 38,
    clinicCount: 16,
    description: 'Specialized clinical dermatology, acne therapies, eczema, cosmetic skin treatments, and skin health.',
    commonConditions: ['Acne', 'Eczema', 'Psoriasis', 'Skin Rejuvenation', 'Pigmentation'],
  },
  {
    id: 'dental',
    name: 'Dental Care & Orthodontics',
    nameAr: 'طب وتقويم الأسنان',
    group: 'wellness',
    groupLabel: 'Wellness & Aesthetic',
    image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=80',
    doctorCount: 45,
    clinicCount: 22,
    description: 'Comprehensive oral healthcare, restorative dentistry, smile design, implants, and orthodontic alignment.',
    commonConditions: ['Teeth Whitening', 'Dental Implants', 'Root Canal', 'Braces', 'Cavities'],
  },
  {
    id: 'ent',
    name: 'ENT (Ear, Nose & Throat)',
    nameAr: 'الأنف والأذن والحنجرة',
    group: 'surgical',
    groupLabel: 'Surgical & Musculoskeletal',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&auto=format&fit=crop&q=80',
    doctorCount: 28,
    clinicCount: 14,
    description: 'Medical and surgical management of sinus conditions, hearing disorders, voice issues, and sleep apnea.',
    commonConditions: ['Sinusitis', 'Tinnitus', 'Hearing Loss', 'Deviated Septum', 'Tonsillitis'],
  },
  {
    id: 'physiotherapy',
    name: 'Physiotherapy & Rehabilitation',
    nameAr: 'العلاج الطبيعي وإعادة التأهيل',
    group: 'wellness',
    groupLabel: 'Wellness & Aesthetic',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
    doctorCount: 34,
    clinicCount: 18,
    description: 'Post-operative recovery, spine health, sports injury rehabilitation, and mobility improvement programs.',
    commonConditions: ['Back Pain', 'Post-Surgery Rehab', 'Sciatica', 'Sports Injuries', 'Joint Mobility'],
  },
  {
    id: 'radiology',
    name: 'Radiology & Diagnostics',
    nameAr: 'الأشعة والتشخيص',
    group: 'diagnostic',
    groupLabel: 'Diagnostics & Laboratory',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80',
    doctorCount: 26,
    clinicCount: 12,
    description: 'Advanced clinical imaging including 3T MRI, CT scans, ultrasound, mammography, and fluoroscopy.',
    commonConditions: ['MRI Scans', 'CT Imaging', 'Ultrasound', 'Bone Density', 'Mammogram'],
  },
  {
    id: 'laboratory',
    name: 'Medical Laboratory & Pathology',
    nameAr: 'المختبرات الطبية والتحاليل',
    group: 'diagnostic',
    groupLabel: 'Diagnostics & Laboratory',
    image: 'https://images.unsplash.com/photo-1579165466741-7f35e4755660?w=600&auto=format&fit=crop&q=80',
    doctorCount: 22,
    clinicCount: 15,
    description: 'Comprehensive pathology, molecular genetics, biomarker analysis, blood panels, and hormone tests.',
    commonConditions: ['Full Blood Panel', 'Lipid Profile', 'Thyroid Test', 'Genetic Screening', 'Biopsy'],
  },
  {
    id: 'cardiology',
    name: 'Cardiology & Heart Care',
    nameAr: 'أمراض القلب والأوعية الدموية',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=600&auto=format&fit=crop&q=80',
    doctorCount: 42,
    clinicCount: 19,
    description: 'Diagnosis and interventional treatment of cardiovascular diseases, hypertension, and arrhythmias.',
    commonConditions: ['Hypertension', 'Arrhythmia', 'Coronary Artery Disease', 'Heart Failure', 'Chest Pain'],
  },
  {
    id: 'orthopedics',
    name: 'Orthopedics & Joint Surgery',
    nameAr: 'جراحة العظام والمفاصل',
    group: 'surgical',
    groupLabel: 'Surgical & Musculoskeletal',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
    doctorCount: 35,
    clinicCount: 16,
    description: 'Expert care for bones, joints, ligaments, minimally invasive arthroscopy, and total joint replacement.',
    commonConditions: ['Knee Pain', 'ACL Tear', 'Arthritis', 'Fractures', 'Spine Disorders'],
  },
  {
    id: 'pediatrics',
    name: 'Pediatrics & Child Health',
    nameAr: 'طب الأطفال وصحة الطفل',
    group: 'pediatric',
    groupLabel: 'Women & Children',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
    doctorCount: 29,
    clinicCount: 14,
    description: 'Dedicated neonatal, infant, and child healthcare, developmental tracking, and vaccination schedules.',
    commonConditions: ['Childhood Infections', 'Vaccinations', 'Asthma', 'Growth Delays', 'Allergies'],
  },
  {
    id: 'general-practice',
    name: 'General Practice & Family Medicine',
    nameAr: 'الطب العام وطب الأسرة',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=600&auto=format&fit=crop&q=80',
    doctorCount: 54,
    clinicCount: 30,
    description: 'Comprehensive primary medical consultations, preventative screenings, and chronic illness management.',
    commonConditions: ['Routine Health Check', 'Fever & Flu', 'Chronic Care', 'Health Screening', 'Fatigue'],
  },
  {
    id: 'neurology',
    name: 'Neurology & Brain Health',
    nameAr: 'طب الأعصاب والدماغ',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=80',
    doctorCount: 21,
    clinicCount: 10,
    description: 'Advanced neurological diagnoses for migraines, nerve disorders, epilepsy, stroke, and spinal conditions.',
    commonConditions: ['Migraine', 'Epilepsy', 'Neuropathy', 'Memory Disorders', 'Parkinson’s'],
  },
  {
    id: 'ophthalmology',
    name: 'Ophthalmology & Vision Care',
    nameAr: 'طب وجراحة العيون',
    group: 'surgical',
    groupLabel: 'Surgical & Musculoskeletal',
    image: 'https://images.unsplash.com/photo-1579684288402-e3d069b1836a?w=600&auto=format&fit=crop&q=80',
    doctorCount: 24,
    clinicCount: 12,
    description: 'Complete eye care, LASIK refractive correction, cataract surgery, glaucoma care, and retina treatments.',
    commonConditions: ['Cataracts', 'Glaucoma', 'LASIK Correction', 'Dry Eyes', 'Diabetic Retinopathy'],
  },
  {
    id: 'gynecology',
    name: 'Obstetrics & Gynecology',
    nameAr: 'طب النساء والولادة',
    group: 'pediatric',
    groupLabel: 'Women & Children',
    image: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&auto=format&fit=crop&q=80',
    doctorCount: 36,
    clinicCount: 18,
    description: 'Comprehensive women’s reproductive health, prenatal and antenatal care, and minimally invasive surgery.',
    commonConditions: ['Pregnancy Care', 'PCOS', 'Fertility Support', 'Fibroids', 'Menopause'],
  },
  {
    id: 'pulmonology',
    name: 'Pulmonology & Respiratory Medicine',
    nameAr: 'أمراض الصدر والجهاز التنفسي',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&auto=format&fit=crop&q=80',
    doctorCount: 19,
    clinicCount: 9,
    description: 'Diagnosis and management of lung disorders, chronic cough, COPD, asthma, and sleep-disordered breathing.',
    commonConditions: ['Chronic Cough', 'Asthma', 'COPD', 'Sleep Apnea', 'Bronchitis'],
  },
  {
    id: 'gastroenterology',
    name: 'Gastroenterology & Digestive Health',
    nameAr: 'أمراض الجهاز الهضمي والكبد',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=80',
    doctorCount: 25,
    clinicCount: 11,
    description: 'Clinical evaluation of gastrointestinal health, endoscopy, liver health, colonoscopy, and digestive disorders.',
    commonConditions: ['Acid Reflux (GERD)', 'IBS', 'Endoscopy', 'Liver Health', 'Ulcers'],
  },
  {
    id: 'endocrinology',
    name: 'Endocrinology & Diabetes',
    nameAr: 'الغدد الصماء والسكري',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop&q=80',
    doctorCount: 23,
    clinicCount: 13,
    description: 'Hormonal disorder therapies, comprehensive diabetes management programs, thyroid care, and metabolism.',
    commonConditions: ['Diabetes Type 1 & 2', 'Hypothyroidism', 'Metabolic Syndrome', 'Hormonal Imbalance', 'PCOS'],
  },
  {
    id: 'urology',
    name: 'Urology & Men’s Health',
    nameAr: 'المسالك البولية وصحة الرجل',
    group: 'surgical',
    groupLabel: 'Surgical & Musculoskeletal',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80',
    doctorCount: 20,
    clinicCount: 10,
    description: 'Specialized care for urinary tract conditions, kidney stones, prostate health, and urological surgery.',
    commonConditions: ['Kidney Stones', 'Prostate Enlargement', 'UTI', 'Incontinence', 'Men’s Health'],
  },
  {
    id: 'oncology',
    name: 'Oncology & Cancer Care',
    nameAr: 'علاج الأورام وأمراض السرطان',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
    doctorCount: 18,
    clinicCount: 8,
    description: 'Multidisciplinary cancer diagnostics, medical oncology, targeted chemotherapy, and immunotherapy support.',
    commonConditions: ['Cancer Screening', 'Chemotherapy', 'Tumor Board Review', 'Immunotherapy', 'Second Opinion'],
  },
  {
    id: 'psychiatry',
    name: 'Psychiatry & Behavioral Health',
    nameAr: 'الطب النفسي والصحة السلوكية',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=600&auto=format&fit=crop&q=80',
    doctorCount: 27,
    clinicCount: 15,
    description: 'Compassionate mental wellness care, anxiety and depression treatments, psychotherapy, and stress support.',
    commonConditions: ['Anxiety', 'Depression', 'ADHD', 'Insomnia', 'Panic Disorders'],
  },
  {
    id: 'sports-medicine',
    name: 'Sports Medicine & Joint Performance',
    nameAr: 'الطب الرياضي والأداء الحركي',
    group: 'surgical',
    groupLabel: 'Surgical & Musculoskeletal',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    doctorCount: 16,
    clinicCount: 9,
    description: 'Athletic injury prevention, regenerative joint injections, performance recovery, and biomechanical analysis.',
    commonConditions: ['Tendonitis', 'Rotator Cuff Tear', 'Concussion Care', 'Runner’s Knee', 'Muscle Strains'],
  },
  {
    id: 'rheumatology',
    name: 'Rheumatology & Autoimmune',
    nameAr: 'أمراض الروماتيزم والمناعة الذاتية',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1583912267670-6575ad472688?w=600&auto=format&fit=crop&q=80',
    doctorCount: 14,
    clinicCount: 7,
    description: 'Specialized management of autoimmune disorders, chronic joint inflammation, gout, lupus, and arthritis.',
    commonConditions: ['Rheumatoid Arthritis', 'Lupus', 'Gout', 'Ankylosing Spondylitis', 'Joint Stiffness'],
  },
  {
    id: 'nephrology',
    name: 'Nephrology & Kidney Care',
    nameAr: 'أمراض الكلى والغسيل الكلوي',
    group: 'clinical',
    groupLabel: 'Clinical & Internal',
    image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80',
    doctorCount: 15,
    clinicCount: 8,
    description: 'Kidney function preservation, dialysis supervision, chronic kidney disease, and electrolyte management.',
    commonConditions: ['Chronic Kidney Disease', 'Proteinuria', 'Electrolyte Disorders', 'Glomerulonephritis'],
  },
  {
    id: 'vascular-surgery',
    name: 'Vascular & Endovascular Surgery',
    nameAr: 'جراحة الأوعية الدموية',
    group: 'surgical',
    groupLabel: 'Surgical & Musculoskeletal',
    image: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=600&auto=format&fit=crop&q=80',
    doctorCount: 12,
    clinicCount: 6,
    description: 'Minimally invasive vein ablation, treatment for varicose veins, arterial disease, and deep vein thrombosis.',
    commonConditions: ['Varicose Veins', 'Spider Veins', 'DVT', 'Peripheral Artery Disease', 'Aneurysm Care'],
  },
  {
    id: 'nutrition',
    name: 'Clinical Nutrition & Dietetics',
    nameAr: 'التغذية السريرية والحميات',
    group: 'wellness',
    groupLabel: 'Wellness & Aesthetic',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=80',
    doctorCount: 20,
    clinicCount: 14,
    description: 'Medical weight management, clinical dietary plans for diabetes and cardiovascular health, and gut nutrition.',
    commonConditions: ['Weight Management', 'Diabetes Diet', 'Bariatric Post-Op', 'Nutrient Deficiency', 'Food Intolerance'],
  },
];

const GROUPS = [
  { id: 'all', label: 'All Specialties' },
  { id: 'clinical', label: 'Clinical & Internal' },
  { id: 'surgical', label: 'Surgical & Bones' },
  { id: 'diagnostic', label: 'Diagnostics & Labs' },
  { id: 'wellness', label: 'Wellness & Aesthetic' },
  { id: 'pediatric', label: 'Women & Children' },
];

export const SpecialtiesPage: React.FC = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const isArabic = language === 'ar';

  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Filtered specialties
  const filteredSpecialties = useMemo(() => {
    return ALL_SPECIALTIES_DATA.filter((item) => {
      const matchesGroup = selectedGroup === 'all' || item.group === selectedGroup;
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.nameAr && item.nameAr.includes(query)) ||
        item.description.toLowerCase().includes(query) ||
        item.commonConditions.some((c) => c.toLowerCase().includes(query));

      return matchesGroup && matchesSearch;
    });
  }, [search, selectedGroup]);

  const handleSelectSpecialty = (specialtyName: string) => {
    navigate(`/doctors?specialty=${encodeURIComponent(specialtyName)}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 selection:bg-teal-100 selection:text-slate-800">
      
      {/* ── HERO BANNER ── */}
      <section className="relative pt-12 pb-16 bg-[#F4F7F9] border-b border-[#E2EBF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-6">
            <Link to="/" className="hover:text-slate-900 transition-colors">
              {t('navigation.home')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400" />
            <span className="text-slate-900 font-bold">Medical Specialties</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-xs font-semibold text-[#0E7490] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#2DA7B5]" />
              <span>30+ Accredited Clinical Specialties</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Explore Medical Specialties & Care Disciplines
            </h1>

            <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed">
              Find licensed doctors, specialized medical departments, and accredited clinical centers tailored to your specific healthcare needs across the UAE.
            </p>
          </div>

          {/* Search & Filter Console */}
          <div className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search specialty, symptom, or condition (e.g. Cardiology, Eczema, Knee, MRI)..."
                className="w-full pl-11 pr-10 rtl:pl-10 rtl:pr-11 py-3.5 bg-white rounded-2xl border border-[#E2EBF0] focus:border-[#2DA7B5] focus:outline-hidden text-sm text-slate-900 placeholder:text-slate-400 transition-all shadow-xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Group Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            {GROUPS.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedGroup(grp.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGroup === grp.id
                    ? 'bg-[#2DA7B5] text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] border border-[#E2EBF0] shadow-2xs'
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ── SPECIALTIES GRID ── */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Clinical Directory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredSpecialties.length} specialized healthcare departments
            </p>
          </div>
        </div>

        {filteredSpecialties.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F6F8] text-[#2DA7B5] flex items-center justify-center mx-auto mb-3 border border-[#CDEBF0]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No specialties found</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Try clearing your search query or choosing another group filter.</p>
            <button
              type="button"
              onClick={() => { setSearch(''); setSelectedGroup('all'); }}
              className="mt-4 px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSpecialties.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#E2EBF0] overflow-hidden hover:border-[#2DA7B5] hover:shadow-md transition-all duration-300 flex flex-col justify-between group shadow-xs"
              >
                <div>
                  {/* Image with zoom effect */}
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    {/* Badge: Doctor count */}
                    <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-semibold text-slate-800 border border-[#E2EBF0] flex items-center gap-1.5 shadow-xs">
                      <Stethoscope className="w-3.5 h-3.5 text-[#2DA7B5]" />
                      <span>{item.doctorCount} Doctors</span>
                    </div>

                    {/* Group pill on image */}
                    <div className="absolute bottom-3 left-3 rtl:left-auto rtl:right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-800 border border-[#E2EBF0] shadow-xs">
                      {item.groupLabel}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-[#2DA7B5] transition-colors leading-snug">
                      {isArabic && item.nameAr ? item.nameAr : item.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Common Conditions Treated */}
                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                        Common Conditions
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.commonConditions.slice(0, 3).map((cond) => (
                          <span
                            key={cond}
                            className="text-[10px] font-semibold text-slate-700 bg-[#F8FAFC] border border-[#E2EBF0] px-2 py-0.5 rounded-md"
                          >
                            {cond}
                          </span>
                        ))}
                        {item.commonConditions.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-500 px-1 py-0.5">
                            +{item.commonConditions.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 pt-0 border-t border-[#E2EBF0] mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {item.clinicCount} Partner Clinics
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectSpecialty(item.name)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Find Doctors</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-16 bg-white border-t border-[#E2EBF0] text-slate-900 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-xs font-semibold text-[#0E7490]">
            <ShieldCheck className="w-4 h-4 text-[#2DA7B5]" />
            <span>UAE Verified Medical Network</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
            Can’t Find Your Required Medical Specialty?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Our medical concierge team is available to assist you in connecting with the right sub-specialist or hospital facility across the Emirates.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/doctors"
              className="px-6 py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold rounded-xl text-xs shadow-xs transition-all"
            >
              Browse All Doctors
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 bg-[#F8FAFC] hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold border border-[#E2EBF0] transition-all"
            >
              Contact Medical Concierge
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
