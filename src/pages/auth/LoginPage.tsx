import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User as UserIcon,
  Stethoscope,
  Hospital,
  Shield,
  Zap,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';

interface LoginPageProps {
  forcedRole?: UserRole;
}

const ROLES: {
  role: UserRole;
  label: string;
  icon: React.FC<{ className?: string }>;
  demoEmail: string;
  demoPassword: string;
  dashboard: string;
  ring: string;
  activeBg: string;
  activeText: string;
}[] = [
    {
      role: 'patient',
      label: 'Patient',
      icon: UserIcon,
      demoEmail: 'patient@meetadr.demo',
      demoPassword: 'Patient@123',
      dashboard: '/patient/dashboard',
      ring: 'ring-teal-600',
      activeBg: 'bg-teal-700',
      activeText: 'text-teal-700',
    },
    {
      role: 'doctor',
      label: 'Doctor',
      icon: Stethoscope,
      demoEmail: 'doctor@meetadr.demo',
      demoPassword: 'Doctor@123',
      dashboard: '/doctor/dashboard',
      ring: 'ring-sky-500',
      activeBg: 'bg-sky-600',
      activeText: 'text-sky-600',
    },
    {
      role: 'hospital',
      label: 'Hospital',
      icon: Hospital,
      demoEmail: 'hospital@meetadr.demo',
      demoPassword: 'Hospital@123',
      dashboard: '/hospital/dashboard',
      ring: 'ring-indigo-500',
      activeBg: 'bg-indigo-600',
      activeText: 'text-indigo-600',
    },
    {
      role: 'admin',
      label: 'Admin',
      icon: Shield,
      demoEmail: 'admin@meetadr.demo',
      demoPassword: 'Admin@123',
      dashboard: '/admin/dashboard',
      ring: 'ring-slate-500',
      activeBg: 'bg-slate-700',
      activeText: 'text-slate-700',
    },
  ];

const QUICK_DEMOS: { role: UserRole; label: string; cls: string }[] = [
  { role: 'patient', label: 'Patient', cls: 'bg-[#2DA7B5] hover:bg-[#23929F] text-white' },
  { role: 'doctor', label: 'Doctor', cls: 'bg-sky-600 hover:bg-sky-700 text-white' },
  { role: 'hospital', label: 'Hospital', cls: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  { role: 'admin', label: 'Admin', cls: 'bg-slate-800 hover:bg-slate-700 text-white' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ forcedRole }) => {
  const { login, quickLoginAs } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeRole, setActiveRole] = useState<UserRole>(forcedRole || 'patient');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<UserRole | null>(null);

  const role = ROLES.find((r) => r.role === activeRole)!;

  const redirectAfterLogin = (r: UserRole) => {
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login') { navigate(from, { replace: true }); return; }
    const found = ROLES.find((x) => x.role === r)!;
    navigate(found.dashboard);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password.trim()) {
      showToast('Please fill in all fields.', 'error'); return;
    }
    setIsLoading(true);
    try {
      const user = await login(loginInput.trim(), password);
      showToast(`Welcome, ${user.name}!`, 'success');
      redirectAfterLogin(user.role);
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials.', 'error');
    } finally { setIsLoading(false); }
  };

  const handleQuickLogin = async (r: UserRole) => {
    setQuickLoading(r);
    try {
      await quickLoginAs(r);
      const found = ROLES.find((x) => x.role === r)!;
      showToast(`Signed in as ${found.label}`, 'success');
      navigate(found.dashboard);
    } catch (err: any) {
      showToast(err.message || 'Quick login failed.', 'error');
    } finally { setQuickLoading(null); }
  };

  const autofill = () => {
    setLoginInput(role.demoEmail);
    setPassword(role.demoPassword);
    setShowPassword(true);
  };

  return (
    /* Full-page background */
    <div
      className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 sm:py-16 relative overflow-hidden bg-[#F4F7F9]"
    >
      {/* Subtle decorative glowing blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#2DA7B5]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-[#2DA7B5]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[420px] z-10"
      >
        {/* ── Heading ── */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#2DA7B5] flex items-center justify-center shadow-md shadow-[#2DA7B5]/25 mb-3">
            <Stethoscope className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {forcedRole
              ? `${ROLES.find((r) => r.role === forcedRole)?.label || ''} Portal Sign In`
              : 'Sign In'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium text-center">
            Sign in to manage your appointments & healthcare
          </p>
        </div>

        {/* ── CARD ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2EBF0] overflow-hidden">
          <div className="px-6 py-6 space-y-5">

            {/* ── Demo quick access ── */}
            <div className="rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 text-amber-600" strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold text-slate-700 tracking-wide">
                  Instant Demo Access
                </span>
              </div>
              <div className="flex gap-2">
                {QUICK_DEMOS.map((dq) => (
                  <button
                    key={dq.role}
                    type="button"
                    onClick={() => handleQuickLogin(dq.role)}
                    disabled={quickLoading !== null}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 shadow-2xs ${dq.cls}`}
                  >
                    {quickLoading === dq.role
                      ? <div className="w-3 h-3 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                      : dq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email / Mobile */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Email or Mobile
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    {loginInput.includes('@')
                      ? <Mail className="w-4 h-4" />
                      : <Phone className="w-4 h-4" />}
                  </span>
                  <input
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder={forcedRole ? role.demoEmail : 'name@example.com or mobile'}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] focus:bg-white transition-all font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">Password</label>
                  <button
                    type="button"
                    onClick={autofill}
                    className="flex items-center gap-1 text-[11px] font-bold text-[#2DA7B5] hover:underline cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-fill demo
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] focus:bg-white transition-all font-medium shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#2DA7B5] hover:bg-[#23929F] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer group mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{forcedRole ? `Sign in to ${role.label} Portal` : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E2EBF0]" />
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[#E2EBF0]" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={() => showToast('Google sign-in coming soon!', 'info')}
              className="w-full py-3 rounded-xl border border-[#E2EBF0] hover:border-slate-300 bg-[#F8FAFC] hover:bg-white text-sm font-bold text-slate-700 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* Security */}
            <div className="flex items-center justify-center gap-1.5 pb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" />
              <span className="text-[10px] text-slate-500 font-medium">End-to-End Encrypted</span>
            </div>

          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-5">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-[#2DA7B5] font-semibold transition-colors inline-flex items-center gap-1"
          >
            ← Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
