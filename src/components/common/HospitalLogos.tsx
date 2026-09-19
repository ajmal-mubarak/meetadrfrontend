import React from 'react';

interface LogoProps {
  className?: string;
  theme?: 'light' | 'dark';
}

export const AmericanHospitalLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 175 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="American Hospital Dubai">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#EBF7F9' : '#0C1A22'} stroke="#007B8A" strokeWidth="1.5" />
      <path d="M20 10v20M10 20h20" stroke="#00A3B4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3.5" fill={isLight ? '#007B8A' : '#FFFFFF'} />
      <text x="46" y="21" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="13" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="0.5">AMERICAN</text>
      <text x="122" y="21" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="12" fill="#00A3B4" letterSpacing="1">DUBAI</text>
      <text x="46" y="32" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="600" fontSize="7.5" fill={isLight ? '#64748B' : '#94A3B8'} letterSpacing="1.2">HOSPITAL DUBAI</text>
    </svg>
  );
};
export const CmcLogo = AmericanHospitalLogo;

export const AlZahraLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 170 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Al Zahra Hospital Dubai">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#ECFDF5' : '#0C1A22'} stroke="#10B981" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="9" stroke="#10B981" strokeWidth="1.5" fill="none" />
      <path d="M20 13c0 3.866-3.134 7-7 7 3.866 0 7 3.134 7 7 0-3.866 3.134-7 7-7-3.866 0-7-3.134-7-7z" fill="#10B981" />
      <circle cx="20" cy="20" r="2" fill="#F59E0B" />
      <text x="46" y="20" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="800" fontSize="13" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="0.8">AL ZAHRA</text>
      <text x="46" y="31" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="600" fontSize="7.5" fill="#059669" letterSpacing="1.5">HOSPITAL DUBAI</text>
    </svg>
  );
};

export const EmiratesHospitalLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 165 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Emirates Hospitals Group">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#FFF1F2' : '#0C1A22'} stroke="#E11D48" strokeWidth="1.5" />
      <path d="M14 16l6-5 6 5v8c0 4-6 7-6 7s-6-3-6-7v-8z" fill="#E11D48" opacity="0.25" stroke="#E11D48" strokeWidth="1.5" />
      <path d="M20 16v8M16 20h8" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
      <text x="46" y="20" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="13.5" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="1">EMIRATES</text>
      <text x="46" y="31" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="7.5" fill="#E11D48" letterSpacing="1.2">HOSPITALS GROUP</text>
    </svg>
  );
};

export const AlNoorLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Al Noor Royal Hospital">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#FFFBEB' : '#0C1A22'} stroke="#F59E0B" strokeWidth="1.5" />
      <path d="M20 11l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#D97706" />
      <circle cx="20" cy="20" r="2.5" fill="#FFFFFF" />
      <text x="46" y="20" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="13.5" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="0.8">AL NOOR</text>
      <text x="46" y="31" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="7.5" fill="#D97706" letterSpacing="1.2">ROYAL HOSPITAL</text>
    </svg>
  );
};

export const CityCareLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="CityCare Hospital">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#F0F9FF' : '#0C1A22'} stroke="#0284C7" strokeWidth="1.5" />
      <rect x="17" y="11" width="6" height="18" rx="2" fill="#0284C7" />
      <rect x="11" y="17" width="18" height="6" rx="2" fill="#0284C7" />
      <path d="M12 20h4l2-3 3 6 2-3h5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="46" y="20" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="13.5" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="0.5">CITYCARE</text>
      <text x="46" y="31" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="7.5" fill="#0284C7" letterSpacing="1.2">SPECIALTY HOSPITAL</text>
    </svg>
  );
};

export const MarinaGatewayLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 165 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Marina Gateway Hospital">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#F0F9FF' : '#0C1A22'} stroke="#0EA5E9" strokeWidth="1.5" />
      <path d="M13 25c3-6 7-12 11-14v14H13z" fill="#0EA5E9" opacity="0.3" />
      <path d="M14 26c4-1 8-1 12 0M20 13v13" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="13" r="2.5" fill="#0284C7" />
      <text x="46" y="20" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="13.5" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="0.8">MARINA</text>
      <text x="46" y="31" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="7.5" fill="#0284C7" letterSpacing="1.2">GATEWAY HOSPITAL</text>
    </svg>
  );
};

export const CapitalHealthLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 165 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Capital Health General Hospital">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#F5F3FF' : '#0C1A22'} stroke="#8B5CF6" strokeWidth="1.5" />
      <path d="M20 11l8 4.5v9L20 29l-8-4.5v-9L20 11z" stroke="#7C3AED" strokeWidth="1.5" fill="none" />
      <path d="M20 16v8M16 20h8" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
      <text x="46" y="20" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="13.5" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="0.8">CAPITAL</text>
      <text x="46" y="31" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="7.5" fill="#7C3AED" letterSpacing="1.2">HEALTH GENERAL</text>
    </svg>
  );
};

export const GulfCentralLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 165 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Gulf Central Specialty Hospital">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#F0FDFA' : '#0C1A22'} stroke="#14B8A6" strokeWidth="1.5" />
      <path d="M15 15a8 8 0 0 1 10 0M15 25a8 8 0 0 0 10 0" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="20" r="3" fill="#0D9488" />
      <text x="46" y="20" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="12.5" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="0.5">GULF CENTRAL</text>
      <text x="46" y="31" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="7.5" fill="#0D9488" letterSpacing="1.2">SPECIALTY HOSPITAL</text>
    </svg>
  );
};

export const SharjahHospitalLogo: React.FC<LogoProps> = ({ className = 'h-9 w-auto', theme = 'light' }) => {
  const isLight = theme === 'light';
  return (
    <svg viewBox="0 0 175 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Sharjah University Teaching Hospital">
      <rect x="2" y="2" width="36" height="36" rx="10" fill={isLight ? '#FFFBEB' : '#0C1A22'} stroke="#D97706" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="8" stroke="#D97706" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
      <path d="M20 14l1.5 4 4.5.5-3.5 3 1 4.5-3.5-2.5-3.5 2.5 1-4.5-3.5-3 4.5-.5L20 14z" fill="#D97706" />
      <text x="46" y="20" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="900" fontSize="13.5" fill={isLight ? '#0F172A' : '#FFFFFF'} letterSpacing="0.8">SHARJAH</text>
      <text x="46" y="31" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="700" fontSize="7.5" fill="#B45309" letterSpacing="1.2">UNIVERSITY HOSPITAL</text>
    </svg>
  );
};

export const HospitalBrandLogo: React.FC<{ hospitalId: string; className?: string; theme?: 'light' | 'dark' }> = ({
  hospitalId,
  className = 'h-9 w-auto',
  theme = 'light',
}) => {
  switch (hospitalId) {
    case 'hosp_ahd':
    case 'hosp_cmc':
      return <AmericanHospitalLogo className={className} theme={theme} />;
    case 'hosp_1':
      return <CityCareLogo className={className} theme={theme} />;
    case 'hosp_2':
      return <EmiratesHospitalLogo className={className} theme={theme} />;
    case 'hosp_3':
      return <AlNoorLogo className={className} theme={theme} />;
    case 'hosp_4':
      return <GulfCentralLogo className={className} theme={theme} />;
    case 'hosp_5':
      return <MarinaGatewayLogo className={className} theme={theme} />;
    case 'hosp_6':
      return <CapitalHealthLogo className={className} theme={theme} />;
    case 'hosp_7':
      return <AlZahraLogo className={className} theme={theme} />;
    case 'hosp_8':
    case 'hosp_suh':
      return <SharjahHospitalLogo className={className} theme={theme} />;
    default:
      return <CmcLogo className={className} theme={theme} />;
  }
};
