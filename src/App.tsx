import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Scroll to top on every route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};
import { LanguageProvider, useTranslation } from './i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';
import { Header } from './components/layouts/Header';
import { Footer } from './components/layouts/Footer';
import { ProtectedRoute } from './components/layouts/ProtectedRoute';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { PatientLayout } from './components/layouts/PatientLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { SearchPage } from './pages/public/SearchPage';
import { DoctorList } from './pages/public/DoctorList';
import { DoctorDetails } from './pages/public/DoctorDetails';
import { HospitalList } from './pages/public/HospitalList';
import { HospitalDetails } from './pages/public/HospitalDetails';
import { ClinicList } from './pages/public/ClinicList';
import { ClinicDetails } from './pages/public/ClinicDetails';
import { SpecialtiesPage } from './pages/public/SpecialtiesPage';
import { ConditionsPage } from './pages/public/ConditionsPage';

import { JoinProviderPage } from './pages/public/JoinProviderPage';
import {
  AboutPage,
  ServicesPage,
  PartnersPage,
  ContactPage,
  FaqPage,
  HelpPage,
  PrivacyPage,
  TermsPage,
  AccessibilityPage,
  CareersPage,
  ReferPage,
} from './pages/public/StaticPages';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Booking Page
import { BookingPage } from './pages/booking/BookingPage';

// Patient Portal
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { PatientBookings } from './pages/patient/PatientBookings';
import { PatientProfile } from './pages/patient/PatientProfile';

// Doctor Portal
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorSchedule } from './pages/doctor/DoctorSchedule';
import { DoctorPatients } from './pages/doctor/DoctorPatients';

// Hospital Portal
import { HospitalDashboard } from './pages/hospital/HospitalDashboard';
import { HospitalDoctors } from './pages/hospital/HospitalDoctors';
import { HospitalDepartments } from './pages/hospital/HospitalDepartments';
import { HospitalSettings } from './pages/hospital/HospitalSettings';

// Admin Portal
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminDoctors } from './pages/admin/AdminDoctors';
import { AdminProviders } from './pages/admin/AdminProviders';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminRequests } from './pages/admin/AdminRequests';
import { AdminReports } from './pages/admin/AdminReports';

// Public Layout Wrapper with Header and Footer
const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const { isArabic } = useTranslation();
  const isNonPatientStaff = user && user.role !== 'patient';

  const getDashboardPath = (role: string) => {
    if (role === 'doctor') return '/doctor/dashboard';
    if (role === 'hospital') return '/hospital/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/';
  };

  const getRoleName = (role: string) => {
    if (role === 'doctor') return isArabic ? 'الطبيب' : 'Doctor';
    if (role === 'hospital') return isArabic ? 'المستشفى' : 'Hospital';
    if (role === 'admin') return isArabic ? 'الإدارة' : 'Admin';
    return role;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#081217] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200 font-sans overflow-x-clip w-full max-w-full">
      {/* If an admin, hospital, or doctor visits the public site, show site in guest view mode with a return bar */}
      {isNonPatientStaff && (
        <div className="bg-[#050D11] text-slate-300 text-xs px-4 py-2 flex items-center justify-between border-b border-teal-500/20 z-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-medium">
              {isArabic
                ? `تصفح الموقع العام كزائر (${getRoleName(user.role)}) · الحجز متاح للمرضى فقط`
                : `Browsing public website as Guest (${getRoleName(user.role)}) · Viewing mode (bookings reserved for patients)`}
            </span>
          </div>
          <Link
            to={getDashboardPath(user.role)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs shadow-teal-500/20"
          >
            <span>{isArabic ? 'العودة إلى لوحة التحكم' : `Back to ${getRoleName(user.role)} Portal`}</span>
          </Link>
        </div>
      )}
      <Header />
      <main className="flex-1 overflow-x-clip w-full max-w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <LocationProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* PUBLIC & MARKETING ROUTES */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/doctors" element={<DoctorList />} />
                  <Route path="/doctors/:id" element={<DoctorDetails />} />
                  <Route path="/hospitals" element={<HospitalList />} />
                  <Route path="/hospitals/:id" element={<HospitalDetails />} />
                  <Route path="/clinics" element={<ClinicList />} />
                  <Route path="/clinics/:id" element={<ClinicDetails />} />
                  <Route path="/specialties" element={<SpecialtiesPage />} />
                  <Route path="/conditions" element={<ConditionsPage />} />
                  <Route path="/diseases" element={<Navigate to="/conditions" replace />} />
                  <Route path="/waitlist" element={<Navigate to="/" replace />} />
                  <Route path="/join" element={<JoinProviderPage />} />
                  <Route path="/become-a-partner" element={<JoinProviderPage />} />
                  <Route path="/provider-register" element={<JoinProviderPage />} />

                  {/* Informational & Legal */}
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/partners" element={<PartnersPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/accessibility" element={<AccessibilityPage />} />
                  <Route path="/careers" element={<CareersPage />} />
                  <Route path="/refer" element={<ReferPage />} />

                  {/* Booking Flow */}
                  <Route path="/book" element={<BookingPage />} />
                  <Route path="/book/doctor/:doctorId" element={<BookingPage />} />

                  {/* Auth Routes - With Header Navbar & Footer */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/patient/login" element={<LoginPage forcedRole="patient" />} />
                  <Route path="/doctor/login" element={<LoginPage forcedRole="doctor" />} />
                  <Route path="/hospital/login" element={<LoginPage forcedRole="hospital" />} />
                  <Route path="/admin/login" element={<LoginPage forcedRole="admin" />} />
                </Route>


                {/* PATIENT PORTAL */}
                <Route
                  path="/patient"
                  element={
                    <ProtectedRoute allowedRoles={['patient']}>
                      <PatientLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/patient/dashboard" replace />} />
                  <Route path="dashboard" element={<PatientDashboard />} />
                  <Route path="profile" element={<PatientProfile />} />
                  <Route path="bookings" element={<PatientBookings />} />
                </Route>

                {/* DOCTOR PORTAL */}
                <Route
                  path="/doctor"
                  element={
                    <ProtectedRoute allowedRoles={['doctor']}>
                      <DashboardLayout portalType="doctor" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/doctor/dashboard" replace />} />
                  <Route path="dashboard" element={<DoctorDashboard />} />
                  <Route path="schedule" element={<DoctorSchedule />} />
                  <Route path="patients" element={<DoctorPatients />} />
                </Route>

                {/* HOSPITAL / CLINIC PORTAL */}
                <Route
                  path="/hospital"
                  element={
                    <ProtectedRoute allowedRoles={['hospital']}>
                      <DashboardLayout portalType="hospital" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/hospital/dashboard" replace />} />
                  <Route path="dashboard" element={<HospitalDashboard />} />
                  <Route path="doctors" element={<HospitalDoctors />} />
                  <Route path="departments" element={<HospitalDepartments />} />
                  <Route path="settings" element={<HospitalSettings />} />
                </Route>

                {/* ADMIN PORTAL */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DashboardLayout portalType="admin" />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="doctors" element={<AdminDoctors />} />
                  <Route path="providers" element={<AdminProviders />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="requests" element={<AdminRequests />} />
                  <Route path="reports" element={<AdminReports />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </LocationProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
