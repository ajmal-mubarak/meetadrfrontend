import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { en } from './en';
import { ar } from './ar';

export type Language = 'en' | 'ar';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isArabic: boolean;
  isRTL: boolean;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatDate: (date: string | Date | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (timeStr: string) => string;
  translateStatus: (status: string) => string;
  translateSpecialty: (specialty: string) => string;
  translateLocation: (location: string) => string;
  translateHospitalName: (name: string, id?: string) => string;
  translateHospitalAbout: (about: string, id?: string) => string;
  translateDoctorName: (name: string, id?: string) => string;
  translateDoctorAbout: (about: string, id?: string) => string;
  translateExperience: (exp: string) => string;
}

const STORAGE_KEY = 'meetadr_language';

const dictionaries: Record<Language, typeof en> = {
  en,
  ar,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to safely resolve nested keys with dot notation
function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let current: any = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
    } catch {
      // Ignore localStorage issues
    }
    return 'en';
  });

  const isArabic = language === 'ar';
  const isRTL = language === 'ar';

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // Ignore localStorage issues
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  // Synchronize document direction and lang attributes globally
  useEffect(() => {
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    
    // Add or remove an rtl class on the html body for convenience in custom styling if needed
    if (isRTL) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }, [language, isRTL]);

  // Translate function with fallback and parameter interpolation
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      // 1. Try active language dictionary
      let val = getNestedValue(dictionaries[language], path);

      // 2. Fallback to English if missing or empty
      if (!val && language !== 'en') {
        val = getNestedValue(dictionaries.en, path);
      }

      // 3. Fallback to clean human-readable text if missing
      if (!val) {
        if (path && path.includes('.')) {
          const parts = path.split('.');
          const lastPart = parts[parts.length - 1];
          val = lastPart
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (s) => s.toUpperCase())
            .replace(/\bBtn\b/i, '')
            .trim();
        } else {
          val = path;
        }
      }

      // 4. Interpolate parameters like {count}, {name}
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          val = val!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
        });
      }

      return val;
    },
    [language]
  );

  // Locale-aware date formatting
  const formatDate = useCallback(
    (dateInput: string | Date | number, options?: Intl.DateTimeFormatOptions): string => {
      if (!dateInput) return '';
      try {
        const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
        if (isNaN(d.getTime())) return String(dateInput);

        const defaultOptions: Intl.DateTimeFormatOptions = options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        };

        const locale = language === 'ar' ? 'ar-AE' : 'en-US';
        return new Intl.DateTimeFormat(locale, defaultOptions).format(d);
      } catch {
        return String(dateInput);
      }
    },
    [language]
  );

  // Localized time formatting (e.g., "10:30 AM" -> "10:30 ص" or localized time)
  const formatTime = useCallback(
    (timeStr: string): string => {
      if (!timeStr) return '';
      if (language !== 'ar') return timeStr;

      // Translate standard AM / PM
      return timeStr
        .replace(/AM/gi, 'ص')
        .replace(/PM/gi, 'م')
        .replace(/\bMorning\b/gi, 'الصباح')
        .replace(/\bAfternoon\b/gi, 'الظهيرة')
        .replace(/\bEvening\b/gi, 'المساء');
    },
    [language]
  );

  // Translate appointment status values safely
  const translateStatus = useCallback(
    (status: string): string => {
      if (!status) return '';
      const s = status.toLowerCase();
      const translated = getNestedValue(dictionaries[language], `status.${s}`);
      return translated || status;
    },
    [language]
  );

  // Translate specialty names
  const translateSpecialty = useCallback(
    (specialty: string): string => {
      if (!specialty) return '';
      const translated = getNestedValue(dictionaries[language], `specialties.${specialty}`);
      return translated || specialty;
    },
    [language]
  );

  // Translate UAE city / location names
  const translateLocation = useCallback(
    (location: string): string => {
      if (!location) return '';
      const direct = getNestedValue(dictionaries[language], `locations.${location}`);
      if (direct) return direct;

      // If location contains hyphen separator (e.g. "Dubai - Downtown"), translate each part
      if (location.includes(' - ')) {
        const parts = location.split(' - ').map((part) => {
          const trimmed = part.trim();
          const translatedPart = getNestedValue(dictionaries[language], `locations.${trimmed}`);
          return translatedPart || trimmed;
        });
        return parts.join(' - ');
      }

      return location;
    },
    [language]
  );

  // Translate hospital name
  const translateHospitalName = useCallback(
    (name: string, id?: string): string => {
      if (!name) return '';
      if (language !== 'ar') return name;

      const idMap: Record<string, string> = {
        hosp_cmc: 'المستشفى الأمريكي دبي',
        hosp_1: 'مستشفى سيتي كير التخصصي',
        hosp_2: 'مركز الإمارات أبكس الطبي',
        hosp_3: 'مستشفى النور الملكي',
        hosp_4: 'مستشفى الخليج المركزي التخصصي',
        hosp_5: 'مستشفى مارينا جيت واي',
        hosp_6: 'مستشفى كابيتال هيلث العام',
        hosp_7: 'مستشفى الزهراء هيريتيج',
        hosp_8: 'مستشفى جامعة الشارقة التعليمي',
        hosp_palm: 'جناح نخلة جميرا الطبي والجراحي',
        hosp_difc: 'مستشفى مركز دبي المالي التخصصي',
      };

      if (id && idMap[id]) return idMap[id];

      const nameMap: Record<string, string> = {
        'American Hospital Dubai': 'المستشفى الأمريكي دبي',
        'City Care Hospital': 'مستشفى سيتي كير التخصصي',
        'Emirates Apex Medical Center': 'مركز الإمارات أبكس الطبي',
        'Al Noor Royal Hospital': 'مستشفى النور الملكي',
        'Gulf Central Specialty Hospital': 'مستشفى الخليج المركزي التخصصي',
        'Marina Gateway Hospital': 'مستشفى مارينا جيت واي',
        'Capital Health General Hospital': 'مستشفى كابيتال هيلث العام',
        'Al Zahra Heritage Hospital': 'مستشفى الزهراء هيريتيج',
        'Sharjah University Teaching Hospital': 'مستشفى جامعة الشارقة التعليمي',
        'Palm Jumeirah Medical & Surgical Pavilion': 'جناح نخلة جميرا الطبي والجراحي',
        'DIFC Gate Precinct Specialty Hospital': 'مستشفى مركز دبي المالي التخصصي',
        'CityCare': 'سيتي كير',
        'Emirates': 'الإمارات',
        'Al-Noor': 'النور',
        'Gulf': 'الخليج',
        'Marina': 'المارينا',
        'Capital': 'كابيتال',
        'Al-Zahra': 'الزهراء',
        'Sharjah': 'الشارقة',
        'American Hospital': 'المستشفى الأمريكي',
      };

      return nameMap[name] || name;
    },
    [language]
  );

  // Translate hospital about text
  const translateHospitalAbout = useCallback(
    (about: string, id?: string): string => {
      if (!about) return '';
      if (language !== 'ar') return about;

      const aboutMap: Record<string, string> = {
        hosp_cmc: 'المستشفى الأمريكي دبي صرح طبي متقدم يوفر رعاية تخصصية عالمية المستوى، ومختبرات متطورة لقسطرة القلب، وجراحة الروبوت، وعيادات خارجية شاملة.',
        hosp_1: 'مستشفى تخصصي رائد يضم أحدث أجهزة التصوير التشخيصي، ومختبرات دقيقة لقسطرة القلب، ومراكز معتمدة لعلاج الحوادث والطوارئ.',
        hosp_2: 'مستشفى معتمد دولياً مشهود له بالريادة في جراحات المنظار طفيفة التوغل، وتأهيل القلب والأوعية الدموية، والفحوصات الطبية التنفيذية.',
        hosp_3: 'ملتزمون بتقديم رعاية سريرية تركز على المريض، مع وحدات متخصصة للعناية المركزة للأطفال وأحدث غرف عمليات جراحة المخ والأعصاب.',
        hosp_4: 'نخدم مجتمع الإمارات الشمالية بأحدث أجنحة الولادة، وعيادات متكاملة لعلاج السكري، وخدمات طوارئ شاملة على مدار الساعة.',
        hosp_5: 'مستشفى جراحي راقٍ ومتطور متخصص في الطب الرياضي، وجراحة وتنظير المفاصل، والأمراض الجلدية التجميلية، وجراحات اليوم الواحد.',
        hosp_6: 'مستشفى تعليمي متكامل يقدم فحوصات وقائية شاملة، وعلاجات متقدمة لأمراض الجهاز التنفسي، ورعاية طبية مخصصة لكبار السن.',
        hosp_7: 'رواد في رعاية الأمومة والجنين، والعناية المركزة لحديثي الولادة، وبرامج الصحة المتكاملة للأسرة والطفل.',
        hosp_8: 'مؤسسة طبية أكاديمية متقدمة تقود الأبحاث السريرية، وجراحات الأوعية الدموية الدقيقة، والتأهيل العصبي الشامل.',
        hosp_palm: 'صرح طبي متطور على الواجهة البحرية يقدم فحوصات صحية تنفيذية، وعيادات قلب متقدمة، وطب الجلدية والتجميل.',
        hosp_difc: 'مستشفى متميز في قلب المركز المالي يقدم رعاية طبية سريعة، واستشارات لكبار الشخصيات، وأحدث تقنيات التشخيص.',
      };

      if (id && aboutMap[id]) return aboutMap[id];

      // Match by keyword in about text if id not provided
      const lower = about.toLowerCase();
      if (lower.includes('marina')) return aboutMap['hosp_5'];
      if (lower.includes('american hospital')) return aboutMap['hosp_cmc'];
      if (lower.includes('city care') || lower.includes('high-acuity cardiac cath')) return aboutMap['hosp_1'];
      if (lower.includes('emirates apex') || lower.includes('laparoscopic surgeries')) return aboutMap['hosp_2'];
      if (lower.includes('al noor') || lower.includes('pediatric intensive care')) return aboutMap['hosp_3'];
      if (lower.includes('gulf central') || lower.includes('northern emirates')) return aboutMap['hosp_4'];
      if (lower.includes('capital health') || lower.includes('teaching hospital offering preventative')) return aboutMap['hosp_6'];
      if (lower.includes('al zahra') || lower.includes('maternal-fetal')) return aboutMap['hosp_7'];
      if (lower.includes('sharjah university') || lower.includes('clinical research trials')) return aboutMap['hosp_8'];
      if (lower.includes('palm jumeirah') || lower.includes('waterfront medical')) return aboutMap['hosp_palm'];
      if (lower.includes('difc') || lower.includes('financial district')) return aboutMap['hosp_difc'];

      return about;
    },
    [language]
  );

  // Translate doctor name
  const translateDoctorName = useCallback(
    (name: string, id?: string): string => {
      if (!name) return '';
      if (language !== 'ar') return name;

      const docIdMap: Record<string, string> = {
        doc_sarah_chen: 'د. سارة تشن',
        doc_james_okafor: 'د. جيمس أوكافور',
        doc_priya_sharma: 'د. بريا شارما',
        doc_michael_torres: 'د. مايكل توريس',
        doc_aisha_rahman: 'د. عائشة رحمن',
        doc_david_kim: 'د. ديفيد كيم',
        doc_1: 'د. ألكسندر رايت',
        doc_2: 'د. فاطمة المنصور',
        doc_3: 'د. ماركوس فانس',
        doc_4: 'د. ليلى محمود',
        doc_5: 'د. طارق الهاشمي',
        doc_6: 'د. إيلينا روستوفا',
        doc_7: 'د. عمر الزعابي',
        doc_8: 'د. سارة جنكينز',
        doc_9: 'د. خالد بن علي',
        doc_10: 'د. أميرة سعيد',
        doc_11: 'د. فيكرام باتيل',
        doc_12: 'د. نور الحسن',
      };

      if (id && docIdMap[id]) return docIdMap[id];

      const docNameMap: Record<string, string> = {
        'Dr. Sarah Chen': 'د. سارة تشن',
        'Dr. James Okafor': 'د. جيمس أوكافور',
        'Dr. Priya Sharma': 'د. بريا شارما',
        'Dr. Michael Torres': 'د. مايكل توريس',
        'Dr. Aisha Rahman': 'د. عائشة رحمن',
        'Dr. David Kim': 'د. ديفيد كيم',
        'Dr. Alexander Wright': 'د. ألكسندر رايت',
        'Dr. Fatima Al-Mansoor': 'د. فاطمة المنصور',
        'Dr. Marcus Vance': 'د. ماركوس فانس',
        'Dr. Layla Mahmoud': 'د. ليلى محمود',
        'Dr. Tariq Al-Hashimi': 'د. طارق الهاشمي',
        'Dr. Elena Rostova': 'د. إيلينا روستوفا',
        'Dr. Omar Al-Zaabi': 'د. عمر الزعابي',
        'Dr. Sarah Jenkins': 'د. سارة جنكينز',
        'Dr. Khaled Benali': 'د. خالد بن علي',
        'Dr. Amira Saeed': 'د. أميرة سعيد',
        'Dr. Vikram Patel': 'د. فيكرام باتيل',
        'Dr. Nour Al-Hassan': 'د. نور الحسن',
      };

      return docNameMap[name] || name;
    },
    [language]
  );

  // Translate doctor about
  const translateDoctorAbout = useCallback(
    (about: string, id?: string): string => {
      if (!about) return '';
      if (language !== 'ar') return about;

      const docAboutMap: Record<string, string> = {
        doc_sarah_chen: 'استشارية أمراض قلب ذات خبرة واسعة في طب القلب السريري والوقاية من أمراض القلب وتخطيط صدى القلب وإدارة ارتفاع ضغط الدم بالمستشفى الأمريكي دبي.',
        doc_james_okafor: 'رعاية صحية أولية شاملة، واستشارات وزيارات منزلية، وفحوصات وقائية وإدارة الحالات الأيضية والمزمنة.',
        doc_priya_sharma: 'أخصائية أمراض جلدية تركز على الإكزيما وعلاجات حب الشباب والصدفية وأمراض جلدية الأطفال والتجميل.',
        doc_michael_torres: 'استشاري أول مخ وأعصاب متخصص في علاج الصداع والصداع النصفي والتعافي من السكتات والتشخيص العصبي.',
        doc_aisha_rahman: 'أخصائية طب أطفال تركز على متابعة نمو الرضع وحديثي الولادة وتطعيمات الأطفال وعلاج الحساسية والربو.',
        doc_david_kim: 'جراح عظام وطب رياضي متخصص في استبدال المفاصل بالمنظار وعلاج إصابات الملاعب وتأهيل الرياضيين.',
      };

      if (id && docAboutMap[id]) return docAboutMap[id];
      return about;
    },
    [language]
  );

  // Translate experience text (e.g. "12 years experience" -> "خبرة 12 عاماً")
  const translateExperience = useCallback(
    (exp: string): string => {
      if (!exp) return '';
      if (language !== 'ar') return exp;
      const numMatch = exp.match(/(\d+)/);
      if (numMatch) {
        return `خبرة ${numMatch[1]} عاماً`;
      }
      return exp;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      isArabic,
      isRTL,
      t,
      formatDate,
      formatTime,
      translateStatus,
      translateSpecialty,
      translateLocation,
      translateHospitalName,
      translateHospitalAbout,
      translateDoctorName,
      translateDoctorAbout,
      translateExperience,
    }),
    [
      language,
      setLanguage,
      toggleLanguage,
      isArabic,
      isRTL,
      t,
      formatDate,
      formatTime,
      translateStatus,
      translateSpecialty,
      translateLocation,
      translateHospitalName,
      translateHospitalAbout,
      translateDoctorName,
      translateDoctorAbout,
      translateExperience,
    ]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

// Also export useLanguage alias
export const useLanguage = useTranslation;
