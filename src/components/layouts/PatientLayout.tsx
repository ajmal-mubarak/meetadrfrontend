import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  Plus,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { Header } from './Header';
import { Footer } from './Footer';

export const PatientLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { t, isArabic } = useTranslation();

  const handleLogout = async () => {
    await logout();
    showToast(t('auth.logoutSuccess'), 'info');
    navigate('/login');
  };

  const navTabs = [
    {
      name: t('patient.overviewTab'),
      path: '/patient/dashboard',
      icon: LayoutDashboard,
      isActive: location.pathname === '/patient/dashboard' || location.pathname === '/patient',
    },
    {
      name: t('patient.profileTab'),
      path: '/patient/profile',
      icon: User,
      isActive: location.pathname === '/patient/profile',
    },
    {
      name: t('patient.bookingsTab'),
      path: '/patient/bookings',
      icon: Calendar,
      isActive: location.pathname === '/patient/bookings',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F9] text-slate-900 font-sans selection:bg-teal-100 selection:text-slate-800 overflow-x-clip w-full max-w-full">
      {/* 1. Website Navbar is ALWAYS visible */}
      <Header />

      {/* 2. Patient Account Hero Header */}
      <div className="bg-white border-b border-[#E2EBF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Patient identity */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2DA7B5] to-[#1F7A85] text-white flex items-center justify-center font-black text-lg shadow-sm shadow-teal-700/20 ring-4 ring-teal-50 shrink-0">
                {user?.name?.charAt(0) || 'P'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                    {user?.name || (isArabic ? 'سارة جنكينز' : 'Sarah Jenkins')}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                    <ShieldCheck className="w-3 h-3 text-[#2DA7B5] shrink-0" />
                    <span>{t('patient.verifiedPatient')}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {user?.email || 'patient@meetadr.demo'} • {t('patient.healthId')}: #PT-8429
                </p>
              </div>
            </div>

            {/* Quick action button */}
            <div className="flex items-center gap-2.5">
              <NavLink
                to="/doctors"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('patient.bookNewDoctor')}</span>
              </NavLink>
            </div>
          </div>

          {/* 3. Patient Navigation Tabs: Overview | Personal/Profile | Bookings | Sign Out */}
          <div className="mt-6 flex items-center justify-between border-t border-[#E2EBF0] pt-1 flex-wrap gap-2">
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      tab.isActive
                        ? 'bg-[#2DA7B5] text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${tab.isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer ml-auto rtl:ml-0 rtl:mr-auto"
            >
              <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>{t('navigation.signOut')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Patient Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* 5. Website Footer */}
      <Footer />
    </div>
  );
};
