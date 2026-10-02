import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Calendar,
  Stethoscope,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../config/api';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }
    if (!agreed) {
      showToast('Please agree to the Terms & Privacy Policy.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });
      const user = await login(email.trim().toLowerCase(), password);
      showToast(`Welcome to MeetAdr, ${user.name}! Your account is ready.`, 'success');
      navigate('/patient/dashboard');
    } catch (err: any) {
      const data = err?.response?.data || {};
      const msg =
        (data.email && data.email[0]) ||
        data.detail ||
        data.message ||
        err?.message ||
        'Registration failed. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 sm:py-14 relative overflow-hidden bg-[#F4F7F9]">
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#2DA7B5]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-[#2DA7B5]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[460px] z-10"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#2DA7B5] flex items-center justify-center shadow-md shadow-[#2DA7B5]/25 mb-3">
            <Stethoscope className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Create Patient Account
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Book appointments and manage your healthcare journey
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-[#E2EBF0] overflow-hidden">
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] focus:bg-white transition-all font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] focus:bg-white transition-all font-medium shadow-2xs"
                  />
                </div>
              </div>

              {/* Phone + DOB */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+971 5x xxx xxxx"
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] focus:bg-white transition-all font-medium shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] text-sm text-slate-700 focus:outline-none focus:border-[#2DA7B5] focus:bg-white transition-all font-medium shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Gender</label>
                <div className="flex gap-2">
                  {['Male', 'Female'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        gender === g
                          ? 'bg-[#2DA7B5] text-white border-[#2DA7B5] shadow-xs'
                          : 'bg-[#F8FAFC] text-slate-600 border-[#E2EBF0] hover:border-[#2DA7B5] hover:text-[#2DA7B5]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] focus:bg-white transition-all font-medium shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-medium shadow-2xs ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-rose-400 focus:border-rose-400'
                        : confirmPassword && password === confirmPassword
                        ? 'border-emerald-400 focus:border-emerald-400'
                        : 'border-[#E2EBF0] focus:border-[#2DA7B5]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {confirmPassword && password === confirmPassword && (
                    <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#E2EBF0] text-[#2DA7B5] focus:ring-[#2DA7B5] cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#2DA7B5] font-semibold hover:underline">Terms of Service</Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-[#2DA7B5] font-semibold hover:underline">Privacy Policy</Link>.
                  My health data is handled with strict confidentiality.
                </span>
              </label>

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
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" />
                <span className="text-[10px] text-slate-500 font-medium">
                  HIPAA-aligned · End-to-End Encrypted · UAE Healthcare Compliant
                </span>
              </div>
            </form>
          </div>
        </div>

        <div className="text-center mt-5 space-y-2">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-[#2DA7B5] hover:text-[#0E7490] font-bold transition-colors">
              Sign in here
            </Link>
          </p>
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
