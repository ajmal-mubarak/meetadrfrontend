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
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../services/api/apiClient';
import { API_ENDPOINTS } from '../../config/api';

const COUNTRY_CODES = [
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', min: 9, max: 9, example: '50 123 4567' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', min: 9, max: 9, example: '50 123 4567' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼', min: 8, max: 8, example: '9123 4567' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦', min: 8, max: 8, example: '3312 3456' },
  { code: '+968', country: 'Oman', flag: '🇴🇲', min: 8, max: 8, example: '9123 4567' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭', min: 8, max: 8, example: '3912 3456' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬', min: 10, max: 10, example: '10 1234 5678' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧', min: 7, max: 8, example: '71 123 456' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴', min: 9, max: 9, example: '7 9123 4567' },
  { code: '+91', country: 'India', flag: '🇮🇳', min: 10, max: 10, example: '98765 43210' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰', min: 10, max: 10, example: '300 1234567' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭', min: 10, max: 10, example: '917 123 4567' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', min: 10, max: 10, example: '7911 123456' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸', min: 10, max: 10, example: '415 555 2671' },
];

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+971');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Field-specific validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Max date for DOB (yesterday to prevent future or today)
  const todayStr = new Date().toISOString().split('T')[0];

  const validateAllFields = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Full Name
    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Full name must contain at least 2 characters.';
    }

    // 2. Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    // 3. Phone Number (Numbers only + country code)
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else if (!/^\d+$/.test(phoneNumber.trim())) {
      newErrors.phone = 'Phone number must contain numbers only.';
    } else if (phoneNumber.trim().length < (selectedCountry.min || 7) || phoneNumber.trim().length > 15) {
      newErrors.phone = `Phone number must be at least ${selectedCountry.min} digits (e.g. ${selectedCountry.example}).`;
    }

    // 4. Date of Birth
    if (!dob) {
      newErrors.dob = 'Date of birth is required.';
    } else {
      const dobDate = new Date(dob);
      const today = new Date();
      if (isNaN(dobDate.getTime())) {
        newErrors.dob = 'Please select a valid date of birth.';
      } else if (dobDate >= today) {
        newErrors.dob = 'Date of birth must be a past date.';
      }
    }

    // 5. Gender
    if (!gender) {
      newErrors.gender = 'Please select your gender (Male or Female).';
    }

    // 6. Password (Must contain at least 10 characters)
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 10) {
      newErrors.password = 'Password must contain at least 10 characters.';
    }

    // 7. Confirm Password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    // 8. Terms of Service
    if (!agreed) {
      newErrors.agreed = 'You must agree to the Terms of Service and Privacy Policy.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      showToast(firstError, 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) {
      return;
    }

    const fullPhoneNumber = `${countryCode}${phoneNumber.trim()}`;

    setIsLoading(true);
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: fullPhoneNumber,
        gender,
        dob,
        password,
      });

      const user = await login(email.trim().toLowerCase(), password);
      showToast(`Welcome to MeetAdr, ${user.name}! Your account is ready.`, 'success');
      navigate('/patient/dashboard');
    } catch (err: any) {
      const data = err?.response?.data || {};
      const msg =
        (data.email && data.email[0]) ||
        (data.phone && data.phone[0]) ||
        (data.password && data.password[0]) ||
        (data.gender && data.gender[0]) ||
        (data.dob && data.dob[0]) ||
        data.detail ||
        data.message ||
        err?.message ||
        'Registration failed. Please check all fields and try again.';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10 sm:py-14 relative overflow-hidden bg-[#F4F7F9]">
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#2DA7B5]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-[#2DA7B5]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[480px] z-10"
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
          <div className="px-6 py-6 sm:px-7 sm:py-7">
            <form onSubmit={handleSubmit} noValidate className="space-y-4">

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
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    placeholder="Your full name"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-medium shadow-2xs ${
                      errors.name ? 'border-rose-400 focus:border-rose-400 bg-rose-50/20' : 'border-[#E2EBF0] focus:border-[#2DA7B5]'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.name}</span>
                  </p>
                )}
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="name@example.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-medium shadow-2xs ${
                      errors.email ? 'border-rose-400 focus:border-rose-400 bg-rose-50/20' : 'border-[#E2EBF0] focus:border-[#2DA7B5]'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>

              {/* Phone + Country Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Phone Number <span className="text-rose-500">*</span>{' '}
                  <span className="text-slate-400 font-normal">(country code & numbers only)</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="relative shrink-0 w-36">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      className="w-full h-full appearance-none pl-3 pr-8 py-3 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2DA7B5] focus:bg-white transition-all shadow-2xs cursor-pointer"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Number Input (Strictly numbers only) */}
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phoneNumber}
                      onChange={(e) => {
                        // Strictly numbers only: remove any non-digit character immediately
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(digitsOnly);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder={currentCountry.example}
                      className={`w-full pl-10 pr-3 py-3 rounded-xl border bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-medium shadow-2xs ${
                        errors.phone ? 'border-rose-400 focus:border-rose-400 bg-rose-50/20' : 'border-[#E2EBF0] focus:border-[#2DA7B5]'
                      }`}
                    />
                  </div>
                </div>
                {errors.phone ? (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.phone}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 font-normal">
                    Enter numbers only without letters or symbols. Example: {countryCode} {currentCountry.example}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="date"
                    value={dob}
                    max={todayStr}
                    onChange={(e) => {
                      setDob(e.target.value);
                      if (errors.dob) setErrors((prev) => ({ ...prev, dob: '' }));
                    }}
                    className={`w-full pl-10 pr-3 py-3 rounded-xl border bg-[#F8FAFC] text-sm text-slate-700 focus:outline-none focus:bg-white transition-all font-medium shadow-2xs ${
                      errors.dob ? 'border-rose-400 focus:border-rose-400 bg-rose-50/20' : 'border-[#E2EBF0] focus:border-[#2DA7B5]'
                    }`}
                  />
                </div>
                {errors.dob && (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.dob}</span>
                  </p>
                )}
              </div>

              {/* Gender (Must be explicitly selected - No silent default) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  {!gender && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Selection required
                    </span>
                  )}
                </div>
                <div
                  className={`flex gap-2 p-1 rounded-2xl transition-all ${
                    errors.gender ? 'border border-rose-400 bg-rose-50/40' : 'border border-transparent'
                  }`}
                >
                  {(['Male', 'Female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGender(g);
                        if (errors.gender) setErrors((prev) => ({ ...prev, gender: '' }));
                      }}
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
                {errors.gender && (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.gender}</span>
                  </p>
                )}
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
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="Must contain at least 10 characters"
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-medium shadow-2xs ${
                      errors.password ? 'border-rose-400 focus:border-rose-400 bg-rose-50/20' : 'border-[#E2EBF0] focus:border-[#2DA7B5]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.password}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">Must contain at least 10 characters</p>
                )}
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
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    placeholder="Re-enter your password"
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border bg-[#F8FAFC] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition-all font-medium shadow-2xs ${
                      errors.confirmPassword
                        ? 'border-rose-400 focus:border-rose-400 bg-rose-50/20'
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
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      if (errors.agreed) setErrors((prev) => ({ ...prev, agreed: '' }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-[#E2EBF0] text-[#2DA7B5] focus:ring-[#2DA7B5] cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-[#2DA7B5] font-semibold hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-[#2DA7B5] font-semibold hover:underline">
                      Privacy Policy
                    </Link>
                    . My health data is handled with strict confidentiality.
                  </span>
                </label>
                {errors.agreed && (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1.5 pl-6">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.agreed}</span>
                  </p>
                )}
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
