import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home as HomeIcon,
  Stethoscope,
  Building2,
  Calendar,
  Bell,
  User,
  ChevronDown,
  Menu,
  X,
  LogOut,
  CheckCircle2,
  ArrowRight,
  Search,
  LogIn,
  Hospital,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface PatientNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: 'appointment' | 'prescription' | 'reminder';
}

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showToast } = useToast();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<PatientNotification[]>([
    {
      id: 'notif_1',
      title: 'Appointment Confirmed',
      description: 'Dr. Sarah Chen at American Hospital Dubai • Today at 10:30 AM',
      time: '15m ago',
      unread: true,
      type: 'appointment',
    },
    {
      id: 'notif_2',
      title: 'Digital Prescription Ready',
      description: 'Prescription from Dr. Tariq Al-Mansoor ready for pharmacy pickup',
      time: '2h ago',
      unread: true,
      type: 'prescription',
    },
    {
      id: 'notif_3',
      title: 'Pre-Visit Check-in Reminder',
      description: 'Please confirm your insurance card details prior to consultation',
      time: '1d ago',
      unread: false,
      type: 'reminder',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setAboutOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (aboutRef.current && !aboutRef.current.contains(target)) setAboutOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    showToast('Signed out successfully.', 'info');
    navigate('/');
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('All notifications marked as read', 'info');
  };

  // Core discovery nav links (client flow: Search & Discover)
  const discoveryLinks = [
    { name: t('navigation.home'), path: '/', icon: HomeIcon },
    { name: t('navigation.findDoctor'), path: '/doctors', icon: Stethoscope },
    { name: t('navigation.hospitals'), path: '/hospitals', icon: Hospital },
  ];

  // Company dropdown links
  const companyLinks = [
    { name: t('navigation.aboutUs'), path: '/about' },
    { name: t('navigation.services'), path: '/services' },
    { name: t('navigation.ourPartners'), path: '/partners' },
  ];

  // All info links for mobile drawer
  const infoLinks = [
    ...companyLinks,
    { name: t('navigation.contactUs'), path: '/contact' },
    { name: t('navigation.joinWithUs'), path: '/join' },
  ];

  return (
    <header
      id="main-hospital-header"
      className={`sticky top-0 z-50 transition-all duration-200 w-full max-w-full overflow-x-clip ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-[#E2EBF0] shadow-xs'
          : 'bg-[#F4F7F9] border-b border-[#E2EBF0]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ===== BRAND LOGO ===== */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-[#2DA7B5] flex items-center justify-center text-white border border-[#23929F]"
            >
              <Stethoscope className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                meet<span className="text-[#2DA7B5]">Adr</span>
              </span>
              <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500 mt-0.5">
                {t('common.hospitalNetwork')}
              </span>
            </div>
          </Link>

          {/* ===== MAIN NAV (Desktop) ===== */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* Discovery links — primary patient flow */}
            {discoveryLinks.map((link) => {
              const active =
                link.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? 'text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* About Dropdown (About Us, Services, Partners) */}
            <div className="relative" ref={aboutRef}>
              <button
                type="button"
                onClick={() => setAboutOpen((prev) => !prev)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  aboutOpen || companyLinks.some((l) => location.pathname === l.path)
                    ? 'text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span>{t('navigation.company')}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    aboutOpen ? 'rotate-180 text-slate-700' : 'text-slate-400'
                  }`}
                />
              </button>

              <AnimatePresence>
                {aboutOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 rtl:left-auto rtl:right-0 mt-2 w-44 bg-white rounded-xl border border-[#E2EBF0] shadow-xl p-1.5 z-50 backdrop-blur-xl"
                  >
                    {companyLinks.map((link) => {
                      const active = location.pathname === link.path;
                      return (
                        <Link
                          key={link.name}
                          to={link.path}
                          onClick={() => setAboutOpen(false)}
                          className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            active
                              ? 'text-[#0E7490] bg-[#E8F6F8] font-semibold'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {link.name}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Contact Us link */}
            <Link
              to="/contact"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                location.pathname === '/contact'
                  ? 'text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {t('navigation.contactUs')}
            </Link>

            {/* Join With Us link */}
            <Link
              to="/join"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                location.pathname === '/join'
                  ? 'text-[#0E7490] bg-[#E8F6F8] border border-[#CDEBF0]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              {t('navigation.joinWithUs')}
            </Link>
          </nav>

          {/* ===== RIGHT SIDE ACTIONS (Desktop) ===== */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Language Switcher */}
            <LanguageSwitcher variant="header" />

            {isAuthenticated && user ? (
              <>
                {/* For staff accounts (admin, hospital, doctor): show quick Dashboard button */}
                {user.role !== 'patient' && (
                  <Link
                    to={
                      user.role === 'admin'
                        ? '/admin/dashboard'
                        : user.role === 'hospital'
                        ? '/hospital/dashboard'
                        : '/doctor/dashboard'
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2DA7B5] hover:bg-[#23929F] border border-[#23929F] transition-all cursor-pointer shadow-xs"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-white" />
                    <span>
                      {user.role === 'admin'
                        ? t('navigation.adminDashboard')
                        : user.role === 'hospital'
                        ? t('navigation.hospitalDashboard')
                        : t('navigation.doctorDashboard')}
                    </span>
                  </Link>
                )}

                {/* Notification Bell (for patients) */}
                {user.role === 'patient' && (
                  <div className="relative" ref={notifRef}>
                  <button
                    id="header-nav-notification-button"
                    type="button"
                    onClick={() => {
                      setNotificationsOpen((prev) => !prev);
                      setProfileOpen(false);
                    }}
                    className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-[#E2EBF0]"
                    aria-label={t('navigation.notifications')}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 rtl:right-auto rtl:left-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E2EBF0] shadow-2xl p-4 z-50 backdrop-blur-xl text-slate-900"
                      >
                        <div className="flex items-center justify-between pb-3 border-b border-[#E2EBF0]">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{t('navigation.notifications')}</span>
                            {unreadCount > 0 && (
                              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                {t('navigation.newNotifications', { count: unreadCount })}
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={markAllNotificationsRead}
                              className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              {t('navigation.markAllRead')}
                            </button>
                          )}
                        </div>

                        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2 space-y-1">
                          {notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-2.5 rounded-xl transition-colors ${
                                notif.unread ? 'bg-[#E8F6F8]/60' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                                <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-snug">{notif.description}</p>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 mt-2 border-t border-[#E2EBF0]">
                          <Link
                            to="/patient/bookings"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-xs font-bold text-[#0E7490] hover:text-[#08596F] flex items-center gap-1 cursor-pointer"
                          >
                            <span>{t('navigation.viewInPatientPortal')}</span>
                            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    id="header-nav-profile-button"
                    type="button"
                    onClick={() => {
                      setProfileOpen((prev) => !prev);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rtl:pr-1.5 rtl:pl-2.5 rounded-xl border border-[#E2EBF0] hover:bg-white transition-all cursor-pointer bg-white/60"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2DA7B5] text-white flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-left rtl:text-right">
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight capitalize">{user.role}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 bg-white rounded-2xl border border-[#E2EBF0] shadow-2xl p-2 z-50 backdrop-blur-xl text-slate-900"
                      >
                        <div className="px-3 py-2 border-b border-[#E2EBF0]">
                          <span className="text-xs font-bold text-slate-900 block truncate">{user.name}</span>
                          <span className="text-[11px] text-slate-500 block truncate">{user.email}</span>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] capitalize">
                            {user.role}
                          </span>
                        </div>

                        <div className="py-1 space-y-0.5">
                          {user.role === 'patient' && (
                            <>
                              <Link
                                to="/patient/profile"
                                onClick={() => setProfileOpen(false)}
                                className="w-full text-left rtl:text-right px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <User className="w-3.5 h-3.5 text-slate-500" />
                                <span>{t('navigation.myProfile')}</span>
                              </Link>
                              <Link
                                to="/patient/bookings"
                                onClick={() => setProfileOpen(false)}
                                className="w-full text-left rtl:text-right px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{t('navigation.myBookings')}</span>
                              </Link>
                            </>
                          )}
                          {user.role === 'doctor' && (
                            <Link
                              to="/doctor/dashboard"
                              onClick={() => setProfileOpen(false)}
                              className="w-full text-left rtl:text-right px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Stethoscope className="w-3.5 h-3.5 text-slate-500" />
                              <span>{t('navigation.doctorDashboard')}</span>
                            </Link>
                          )}
                          {user.role === 'hospital' && (
                            <Link
                              to="/hospital/dashboard"
                              onClick={() => setProfileOpen(false)}
                              className="w-full text-left rtl:text-right px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>{t('navigation.hospitalDashboard')}</span>
                            </Link>
                          )}
                          {user.role === 'admin' && (
                            <Link
                              to="/admin/dashboard"
                              onClick={() => setProfileOpen(false)}
                              className="w-full text-left rtl:text-right px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>{t('navigation.adminDashboard')}</span>
                            </Link>
                          )}
                        </div>

                        <div className="pt-1 mt-1 border-t border-[#E2EBF0]">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-left rtl:text-right px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5 text-rose-500" />
                            <span>{t('navigation.signOut')}</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* Guest user — show Sign In */
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2DA7B5] hover:bg-[#23929F] border border-[#23929F] transition-all cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t('navigation.signIn')}</span>
              </Link>
            )}
          </div>

          {/* ===== MOBILE TOGGLE ===== */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile compact language switcher */}
            <LanguageSwitcher variant="compact" />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ===== MOBILE DRAWER ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-[#E2EBF0] px-4 pt-3 pb-6 space-y-4 overflow-hidden text-slate-900 shadow-xl"
          >
            {/* Discovery Links */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t('navigation.findDoctor')}
              </p>
              <div className="flex flex-col gap-1">
                {discoveryLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <link.icon className="w-4 h-4 text-slate-500" />
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Info Links */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t('navigation.company')}
              </p>
              <div className="flex flex-col gap-1">
                {infoLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth / Patient Controls */}
            <div className="pt-3 border-t border-[#E2EBF0]">
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 px-3 py-2 bg-[#F8FAFC] rounded-xl border border-[#E2EBF0]">
                    <div className="w-8 h-8 rounded-lg bg-[#2DA7B5] text-white flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{user.name}</span>
                      <span className="text-[11px] text-slate-500 capitalize">{user.role}</span>
                    </div>
                  </div>
                  {user.role === 'patient' ? (
                    <Link
                      to="/patient/bookings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                    >
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {t('navigation.myBookings')}
                    </Link>
                  ) : (
                    <Link
                      to={
                        user.role === 'admin'
                          ? '/admin/dashboard'
                          : user.role === 'hospital'
                          ? '/hospital/dashboard'
                          : '/doctor/dashboard'
                      }
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-white bg-[#2DA7B5] hover:bg-[#23929F] rounded-xl"
                    >
                      <LayoutDashboard className="w-4 h-4 text-white" />
                      <span>
                        {user.role === 'admin'
                          ? t('navigation.adminDashboard')
                          : user.role === 'hospital'
                          ? t('navigation.hospitalDashboard')
                          : t('navigation.doctorDashboard')}
                      </span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('navigation.signOut')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2DA7B5] hover:bg-[#23929F] text-sm font-bold text-white transition-all shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    {t('navigation.signIn')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
