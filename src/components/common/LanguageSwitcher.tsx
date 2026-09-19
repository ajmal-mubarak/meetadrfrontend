import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'header';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { language, setLanguage, isArabic } = useTranslation();

  const handleToggle = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const nextLanguageLabel = language === 'en' ? 'العربية' : 'English';
  const buttonTitle = language === 'en' ? 'التبديل إلى العربية (Switch to Arabic)' : 'Switch to English (التبديل إلى الإنجليزية)';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] border border-[#E2EBF0] hover:border-[#2DA7B5] text-xs font-bold text-slate-700 hover:text-[#0E7490] shadow-2xs transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2DA7B5] ${className}`}
        aria-label={buttonTitle}
        title={buttonTitle}
      >
        <Globe className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" aria-hidden="true" />
        <span className="font-sans font-bold text-xs">{nextLanguageLabel}</span>
      </button>
    );
  }

  // Header variant (Single toggle button: in EN shows 'العربية', in AR shows 'English')
  return (
    <button
      id="site-language-switcher"
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8FAFC] active:bg-[#F1F5F9] border border-[#E2EBF0] hover:border-[#2DA7B5] text-xs font-bold text-slate-700 hover:text-[#0E7490] shadow-2xs transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#2DA7B5] ${className}`}
      aria-label={buttonTitle}
      title={buttonTitle}
    >
      <Globe className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" aria-hidden="true" />
      <span className="font-sans font-bold tracking-tight">{nextLanguageLabel}</span>
    </button>
  );
};
