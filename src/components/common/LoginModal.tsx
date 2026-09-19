import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User as UserIcon,
  Stethoscope,
  Hospital,
  Shield,
  Zap,
  Phone,
  ArrowRight,
  Mail,
  Lock,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoleOption {
  role: UserRole;
  label: string;
  icon: React.FC<{ className?: string }>;
  demoEmail: string;
  demoPassword: string;
  dashboard: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'patient',
    label: 'Patient',
    icon: UserIcon,
    demoEmail: 'patient@meetadr.demo',
    demoPassword: 'Patient@123',
    dashboard: '/patient/dashboard',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    icon: Stethoscope,
    demoEmail: 'doctor@meetadr.demo',
    demoPassword: 'Doctor@123',
    dashboard: '/doctor/dashboard',
  },
  {
    role: 'hospital',
    label: 'Hospital',
    icon: Hospital,
    demoEmail: 'hospital@meetadr.demo',
    demoPassword: 'Hospital@123',
    dashboard: '/hospital/dashboard',
  },
  {
    role: 'admin',
    label: 'Admin',
    icon: Shield,
    demoEmail: 'admin@meetadr.demo',
    demoPassword: 'Admin@123',
    dashboard: '/admin/dashboard',
  },
];

const DEMO_QUICK: { role: UserRole; label: string; accent: string }[] = [
  { role: 'patient', label: 'Patient', accent: 'bg-teal-700 text-white hover:bg-teal-800' },
  { role: 'doctor', label: 'Doctor', accent: 'bg-sky-600 text-white hover:bg-sky-700' },
  { role: 'admin', label: 'Admin', accent: 'bg-slate-800 text-white hover:bg-slate-900' },
];

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, quickLoginAs } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeRole, setActiveRole] = useState<UserRole>('patient');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState<UserRole | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const activeRoleData = ROLES.find((r) => r.role === activeRole)!;

  const redirectAfterLogin = (role: UserRole) => {
    onClose();
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login') { navigate(from, { replace: true }); return; }
    if (role === 'patient') navigate('/patient/dashboard');
    else if (role === 'doctor') navigate('/doctor/dashboard');
    else if (role === 'hospital') navigate('/hospital/dashboard');
    else navigate('/admin/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password.trim()) {
      showToast('Please enter your email and password.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const user = await login(loginInput.trim(), password);
      showToast(`Welcome back, ${user.name}!`, 'success');
      redirectAfterLogin(user.role);
    } catch (err: any) {
      showToast(err.message || 'Invalid credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setQuickLoading(role);
    try {
      await quickLoginAs(role);
      const r = ROLES.find((x) => x.role === role)!;
      showToast(`Signed in as ${r.label} (Demo)`, 'success');
      onClose();
      navigate(r.dashboard);
    } catch (err: any) {
      showToast(err.message || 'Quick login failed.', 'error');
    } finally {
      setQuickLoading(null);
    }
  };

  const autofillDemo = () => {
    setLoginInput(activeRoleData.demoEmail);
    setPassword(activeRoleData.demoPassword);
    setShowPassword(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm bg-[#f5f3ef] rounded-3xl shadow-2xl overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-xs"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="px-7 pt-8 pb-7 space-y-5">

                {/* Header */}
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Welcome to <span className="text-[#007B8A]">meetAdr</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Sign in to access your appointments and curated bookings
                  </p>
                </div>

                {/* Role Tabs */}
                <div className="flex bg-white rounded-2xl border border-slate-200 p-1 gap-0.5 shadow-xs">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setActiveRole(r.role)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeRole === r.role
                            ? 'bg-[#007B8A] text-white'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline truncate">{r.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Instant Demo Login */}
                <div className="bg-white/70 border border-slate-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Instant 1-Click Demo Login
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {DEMO_QUICK.map((dq) => (
                      <button
                        key={dq.role}
                        type="button"
                        onClick={() => handleQuickLogin(dq.role)}
                        disabled={quickLoading !== null}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-60 ${dq.accent}`}
                      >
                        {quickLoading === dq.role ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : null}
                        {dq.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Mobile / Email Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mobile Number or Email
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        {loginInput.includes('@') ? (
                          <Mail className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        placeholder={activeRoleData.demoEmail}
                        className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={autofillDemo}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Auto-Fill Demo
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={activeRoleData.demoPassword}
                        className="w-full pl-10 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#007B8A] hover:bg-[#005F6B] text-white font-bold text-sm rounded-xl transition-all border border-[#005F6B] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-1"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In as {activeRoleData.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* OR Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-300/60" />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-slate-300/60" />
                </div>

                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={() => showToast('Google login coming soon!', 'info')}
                  className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                {/* Security note */}
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  End-to-End Encrypted Concierge Security
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
