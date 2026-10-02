import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { authService } from '../../services/realAuthService';
import { useTranslation } from '../../i18n';

interface TokenData {
  email: string;
  facility_name: string;
  facility_type: string;
}

export const ProviderSetupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isArabic } = useTranslation();

  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(
        isArabic
          ? 'رابط الإعداد غير مكتمل أو مفقود. يرجى استخدام الرابط المستلم عبر البريد الإلكتروني.'
          : 'Setup link is missing or incomplete. Please use the link provided in your invitation email.'
      );
      setIsLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await authService.validateProviderSetupToken(token);
        if (res.valid) {
          setTokenData({
            email: res.email,
            facility_name: res.facility_name,
            facility_type: res.facility_type,
          });
        } else {
          setError(
            isArabic
              ? 'رابط الإعداد هذا غير صالح أو انتهت صلاحيته (صلاحيته 72 ساعة) أو تم استخدامه بالفعل.'
              : 'This setup link is invalid, has expired (valid for 72 hours), or has already been used.'
          );
        }
      } catch (err: any) {
        setError(
          err.message ||
            (isArabic
              ? 'فشل التحقق من رابط الإعداد. يرجى التواصل مع إدارة المنصة.'
              : 'Failed to validate setup invitation. Please contact platform administration.')
        );
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [token, isArabic]);

  // Validation rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const passwordsMatch = password.length > 0 && password === passwordConfirm;
  const isFormValid = hasMinLength && hasNumber && hasLetter && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.completeProviderSetup(token, password, passwordConfirm);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F8FAFC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E8F6F8] border border-[#CDEBF0] text-[#2DA7B5] mb-4 shadow-sm">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isArabic ? 'إعداد حساب المنشأة الصحية' : 'Facility Account Setup'}
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {isArabic
              ? 'قم بتعيين كلمة المرور للوصول إلى لوحة تحكم المستشفى'
              : 'Establish your credentials to access the facility portal'}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2EBF0] p-8 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#2DA7B5] animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">
              {isArabic ? 'جاري التحقق من رابط الدعوة...' : 'Verifying your invitation token...'}
            </p>
          </div>
        )}

        {/* Error / Expired Link State */}
        {!isLoading && error && !isSuccess && (
          <div className="bg-white rounded-3xl shadow-sm border border-rose-200 p-6 sm:p-8 space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isArabic ? 'تعذر إتمام الإعداد' : 'Unable to Complete Setup'}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{error}</p>
            </div>
            <div className="pt-3 border-t border-[#E2EBF0] flex flex-col gap-2">
              <Link
                to="/hospital/login"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2DA7B5] hover:bg-[#258E9B] text-white font-bold text-sm transition-colors shadow-xs"
              >
                <span>{isArabic ? 'الذهاب إلى تسجيل الدخول' : 'Go to Facility Login'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="text-xs text-slate-500 hover:text-[#2DA7B5] font-medium transition-colors py-1"
              >
                {isArabic ? 'تحتاج إلى مساعدة؟ اتصل بنا' : 'Need help? Contact Support'}
              </Link>
            </div>
          </div>
        )}

        {/* Success State */}
        {!isLoading && isSuccess && (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2EBF0] p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isArabic ? 'تم إعداد الحساب بنجاح!' : 'Account Setup Complete!'}
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {isArabic
                  ? 'تم تفعيل حساب المنشأة وتعيين كلمة المرور بنجاح. أصبحت منشأتك الآن مفعلة وظاهرة في المنصة، ويمكنك تسجيل الدخول لإدارتها.'
                  : 'Your facility credentials have been set. Your facility is now activated and live on the public directory, and you can log in to manage doctors and appointments.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] text-left rtl:text-right text-xs space-y-1">
              <div className="text-slate-800 font-bold">{tokenData?.facility_name}</div>
              <div className="text-[#2DA7B5] font-mono">{tokenData?.email}</div>
            </div>

            <button
              onClick={() => navigate('/hospital/login')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#2DA7B5] hover:bg-[#258E9B] text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              <span>{isArabic ? 'تسجيل الدخول إلى لوحة المستشفى' : 'Log In to Facility Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form State */}
        {!isLoading && !error && !isSuccess && tokenData && (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2EBF0] p-6 sm:p-8 space-y-6">
            {/* Facility Context Card */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-medium">
                  {isArabic ? 'المنشأة الصحية:' : 'Healthcare Facility:'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8F6F8] text-[#2DA7B5] border border-[#CDEBF0]">
                  {tokenData.facility_type}
                </span>
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {tokenData.facility_name}
              </div>
              <div className="text-xs text-slate-500 truncate mt-0.5 font-mono">{tokenData.email}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isArabic ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E2EBF0] focus:bg-white focus:border-[#2DA7B5] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2DA7B5] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#F8FAFC] border border-[#E2EBF0] focus:bg-white focus:border-[#2DA7B5] rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2DA7B5] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements checklist */}
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs space-y-1.5">
                <div className="text-[11px] font-bold text-slate-600 mb-1">
                  {isArabic ? 'متطلبات الأمان:' : 'Security Requirements:'}
                </div>
                <div className="flex items-center gap-2">
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {isArabic ? '8 أحرف كحد أدنى' : 'At least 8 characters'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasLetter ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={hasLetter ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {isArabic ? 'يحتوي على حرف أبجدي' : 'Contains at least one letter'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {isArabic ? 'يحتوي على رقم واحد على الأقل' : 'Contains at least one number'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                    {isArabic ? 'كلمتا المرور متطابقتان' : 'Passwords match'}
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#2DA7B5] hover:bg-[#258E9B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isArabic ? 'جاري تفعيل الحساب...' : 'Activating Account...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isArabic ? 'تأكيد وتفعيل الحساب' : 'Set Password & Activate'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
