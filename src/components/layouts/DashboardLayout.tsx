import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  Stethoscope,
  BarChart3,
  LogOut,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface DashboardLayoutProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  portalType?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  badge,
  actions,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, isRTL, isArabic } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    showToast(t('auth.logoutSuccess'), 'info');
    navigate('/login');
  };

  const getPortalLabel = (role?: string) => {
    if (role === 'patient') return isArabic ? 'بوابة المريض' : 'Patient Portal';
    if (role === 'doctor') return isArabic ? 'بوابة الطبيب' : 'Doctor Portal';
    if (role === 'hospital') return isArabic ? 'بوابة المستشفى والعيادة' : 'Hospital Portal';
    if (role === 'admin') return isArabic ? 'بوابة الإدارة' : 'Admin Portal';
    return isArabic ? 'بوابة النظام' : 'Portal';
  };

  const getNavItems = () => {
    if (!user) return [];

    if (user.role === 'patient') {
      return [
        { name: t('navigation.overview'), path: '/patient/dashboard', icon: LayoutDashboard },
        { name: t('navigation.myBookings'), path: '/patient/bookings', icon: Calendar },
        { name: t('navigation.findDoctor'), path: '/doctors', icon: Stethoscope },
        { name: t('navigation.hospitals'), path: '/hospitals', icon: Building2 },
      ];
    }

    if (user.role === 'doctor') {
      return [
        { name: t('navigation.doctorDashboard'), path: '/doctor/dashboard', icon: LayoutDashboard },
        { name: t('navigation.weeklySchedule'), path: '/doctor/schedule', icon: Calendar },
        { name: t('navigation.patientDirectory'), path: '/doctor/patients', icon: Users },
      ];
    }

    if (user.role === 'hospital') {
      return [
        { name: t('navigation.hospitalDashboard'), path: '/hospital/dashboard', icon: LayoutDashboard },
        { name: t('navigation.doctorsRoster'), path: '/hospital/doctors', icon: Stethoscope },
        { name: t('navigation.departments'), path: '/hospital/departments', icon: Building2 },
        { name: t('navigation.facilitySettings'), path: '/hospital/settings', icon: Users },
      ];
    }

    if (user.role === 'admin') {
      return [
        { name: t('navigation.adminDashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
        { name: t('navigation.doctorsVerification'), path: '/admin/doctors', icon: Stethoscope },
        { name: t('navigation.providersDirectory'), path: '/admin/providers', icon: Building2 },
        { name: t('navigation.bookingsRegistry'), path: '/admin/bookings', icon: Calendar },
        { name: t('navigation.providerRequests'), path: '/admin/requests', icon: UserCheck },
        { name: t('navigation.analyticalReports'), path: '/admin/reports', icon: BarChart3 },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-900 flex flex-col md:flex-row selection:bg-teal-100 selection:text-slate-800 overflow-x-clip w-full max-w-full">
      
      {/* ── MOBILE SLIDE-OUT DRAWER ── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <aside
            className={`fixed top-0 bottom-0 ${
              isRTL ? 'right-0' : 'left-0'
            } w-72 max-w-[85vw] bg-white border-r rtl:border-r-0 rtl:border-l border-[#E2EBF0] shadow-2xl flex flex-col z-50 animate-in ${
              isRTL ? 'slide-in-from-right' : 'slide-in-from-left'
            } duration-200`}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E2EBF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#E8F6F8] text-[#0E7490] flex items-center justify-center font-bold text-base border border-[#CDEBF0] shrink-0">
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{user?.name}</p>
                  <span className="inline-block mt-0.5 capitalize text-[10px] font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] px-2 py-0.5 rounded-full truncate">
                    {getPortalLabel(user?.role)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer shrink-0"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2DA7B5] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:bg-[#F4F7F9] hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80 shrink-0 rtl:rotate-180" />}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer with Public Site & Sign Out */}
            <div className="p-3 border-t border-[#E2EBF0] space-y-1 bg-[#F8FAFC]">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
                <span>{t('navigation.publicWebsite')}</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0 rtl:rotate-180" />
                <span>{t('navigation.signOut')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR NAVIGATION (hidden on mobile, sticky on md+) ── */}
      <aside className="hidden md:flex md:w-64 bg-white border-r rtl:border-r-0 rtl:border-l border-[#E2EBF0] shrink-0 flex-col h-screen sticky top-0 z-20">
        {/* User Card */}
        <div className="p-5 border-b border-[#E2EBF0] flex items-center gap-3 bg-[#F8FAFC]">
          <div className="w-10 h-10 rounded-xl bg-[#E8F6F8] text-[#0E7490] flex items-center justify-center font-bold text-base border border-[#CDEBF0] shrink-0">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="capitalize text-[10px] font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] px-2 py-0.5 rounded-full truncate">
                {getPortalLabel(user?.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2DA7B5] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-[#F4F7F9] hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1 truncate">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80 shrink-0 rtl:rotate-180" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer with Sign Out */}
        <div className="p-3 border-t border-[#E2EBF0] space-y-1 bg-[#F8FAFC]">
          <Link
            to="/"
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
            <span>{t('navigation.publicWebsite')}</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 rtl:rotate-180" />
            <span>{t('navigation.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 min-w-0 flex flex-col w-full max-w-full">
        {/* Top Header Bar with Hamburger Button, Language Switcher & Sign Out */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2EBF0] px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 rtl:-ml-0 rtl:-mr-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="text-base font-black tracking-tight text-slate-900 hover:text-[#2DA7B5] transition-colors shrink-0">
              meet<span className="text-[#2DA7B5]">Adr</span>
            </Link>
            <span className="text-slate-300 shrink-0">/</span>
            <span className="text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] capitalize truncate max-w-[125px] sm:max-w-none">
              {getPortalLabel(user?.role)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher variant="header" />

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t('navigation.viewSite')}</span>
            </Link>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2DA7B5] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-bold text-slate-800 hidden lg:block max-w-[120px] truncate">
                {user?.name}
              </span>
            </div>

            {/* TOP RIGHT PROMINENT SIGN OUT BUTTON */}
            <button
              type="button"
              onClick={handleLogout}
              title={t('navigation.signOut')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all shadow-xs cursor-pointer ml-1 rtl:ml-0 rtl:mr-1 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
              <span className="hidden sm:inline">{t('navigation.signOut')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 w-full max-w-full overflow-x-clip">
          <div className="max-w-7xl mx-auto space-y-6 w-full">
            {/* Optional Header Bar */}
            {title && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-[#E2EBF0]">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                    {badge && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                        {badge}
                      </span>
                    )}
                  </div>
                  {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
              </div>
            )}

            {/* Children / Routed content */}
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

