import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { Appointment } from '../../types';

export interface AppointmentReviewModalProps {
  isOpen?: boolean;
  appointment: Appointment | null;
  initialTarget?: 'doctor' | 'facility';
  onClose: () => void;
  onSubmit: (target: 'doctor' | 'facility', rating: number, comment: string) => Promise<void> | void;
}

export const AppointmentReviewModal: React.FC<AppointmentReviewModalProps> = ({
  isOpen,
  appointment,
  initialTarget = 'doctor',
  onClose,
  onSubmit,
}) => {
  const { t, translateSpecialty, isArabic, isRTL } = useTranslation();

  const isDoctorReviewed = Boolean(
    appointment?.isDoctorReviewed ||
    (appointment?.doctorReview && appointment.doctorReview.rating) ||
    (appointment?.review && appointment.review.rating)
  );

  const isFacilityReviewed = Boolean(
    appointment?.isFacilityReviewed ||
    (appointment?.facilityReview && appointment.facilityReview.rating)
  );

  // Active review target
  const [target, setTarget] = useState<'doctor' | 'facility'>('doctor');

  // Doctor review state
  const [doctorRating, setDoctorRating] = useState<number>(0);
  const [doctorHovered, setDoctorHovered] = useState<number>(0);
  const [doctorComment, setDoctorComment] = useState<string>('');

  // Facility review state
  const [facilityRating, setFacilityRating] = useState<number>(0);
  const [facilityHovered, setFacilityHovered] = useState<number>(0);
  const [facilityComment, setFacilityComment] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const labels = isArabic
    ? ['', 'ضعيف', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز']
    : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  useEffect(() => {
    if (appointment) {
      if (initialTarget) {
        setTarget(initialTarget);
      } else if (!isDoctorReviewed) {
        setTarget('doctor');
      } else if (!isFacilityReviewed) {
        setTarget('facility');
      } else {
        setTarget('doctor');
      }
      setDoctorRating(0);
      setDoctorHovered(0);
      setDoctorComment('');
      setFacilityRating(0);
      setFacilityHovered(0);
      setFacilityComment('');
      setError('');
    }
  }, [appointment, initialTarget, isDoctorReviewed, isFacilityReviewed]);

  const effectiveIsOpen = isOpen !== undefined ? isOpen : Boolean(appointment);
  if (!effectiveIsOpen || !appointment) return null;

  const facilityName =
    appointment.facilityName ||
    appointment.hospitalName ||
    appointment.providerName ||
    'Healthcare Facility';

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentRating = target === 'doctor' ? doctorRating : facilityRating;
    const currentComment = target === 'doctor' ? doctorComment : facilityComment;

    if (currentRating === 0) {
      setError(isArabic ? 'يرجى اختيار تقييم بالنجوم' : 'Please select a star rating');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit(target, currentRating, currentComment);
      // Reset form for that target
      if (target === 'doctor') {
        setDoctorRating(0);
        setDoctorComment('');
      } else {
        setFacilityRating(0);
        setFacilityComment('');
      }
    } catch (err: any) {
      setError(err?.message || (isArabic ? 'فشل إرسال التقييم' : 'Failed to submit review'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingDoctorRating =
    appointment.doctorReview?.rating || appointment.review?.rating || 5;
  const existingDoctorComment =
    appointment.doctorReview?.comment || appointment.review?.comment || '';

  const existingFacilityRating =
    appointment.facilityReview?.rating || 5;
  const existingFacilityComment =
    appointment.facilityReview?.comment || '';

  const isCurrentTargetReviewed =
    target === 'doctor' ? isDoctorReviewed : isFacilityReviewed;

  const activeRating = target === 'doctor' ? doctorRating : facilityRating;
  const activeHovered = target === 'doctor' ? doctorHovered : facilityHovered;
  const setHovered = target === 'doctor' ? setDoctorHovered : setFacilityHovered;
  const setRating = target === 'doctor' ? setDoctorRating : setFacilityRating;
  const comment = target === 'doctor' ? doctorComment : facilityComment;
  const setComment = target === 'doctor' ? setDoctorComment : setFacilityComment;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-[#E2EBF0] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {target === 'doctor'
                  ? (isArabic ? 'تقييم الطبيب' : 'Rate Doctor')
                  : (isArabic ? 'تقييم المستشفى / المنشأة' : 'Rate Hospital & Facility')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isArabic
                  ? 'تقييم واحد للطبيب وتقييم واحد للمنشأة لكل موعد مكتمل'
                  : '1 Doctor review & 1 Facility review per completed appointment'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Review Tab Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F8FAFC] rounded-2xl border border-[#E2EBF0]">
          {/* Doctor Tab */}
          <button
            type="button"
            onClick={() => {
              setTarget('doctor');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              target === 'doctor'
                ? 'bg-white text-slate-900 shadow-xs border border-[#E2EBF0]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-cyan-600" />
            <span>{isArabic ? 'تقييم الطبيب' : 'Doctor Review'}</span>
            {isDoctorReviewed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>★{existingDoctorRating}</span>
              </span>
            )}
          </button>

          {/* Facility Tab */}
          <button
            type="button"
            onClick={() => {
              setTarget('facility');
              setError('');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              target === 'facility'
                ? 'bg-white text-slate-900 shadow-xs border border-[#E2EBF0]'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>{isArabic ? 'تقييم المستشفى' : 'Hospital Review'}</span>
            {isFacilityReviewed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>★{existingFacilityRating}</span>
              </span>
            )}
          </button>
        </div>

        {/* Target Header Card */}
        {target === 'doctor' ? (
          <div className="bg-[#F8FAFC] rounded-2xl p-3.5 flex items-center gap-3 border border-[#E2EBF0]">
            <img
              src={
                appointment.doctorPhoto ||
                'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150'
              }
              alt={appointment.doctorName}
              className="w-12 h-12 rounded-xl object-cover border border-[#E2EBF0] shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="truncate">
              <p className="text-sm font-bold text-slate-900 truncate">
                {appointment.doctorName}
              </p>
              <p className="text-xs text-[#0E7490] font-semibold">
                {translateSpecialty(appointment.specialty)}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{facilityName}</p>
            </div>
          </div>
        ) : (
          <div className="bg-[#F8FAFC] rounded-2xl p-3.5 flex items-center gap-3 border border-[#E2EBF0]">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-200 text-[#0E7490] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold text-slate-900 truncate">{facilityName}</p>
              <p className="text-xs text-slate-600 truncate">
                {appointment.location || 'Accredited Healthcare Facility'}
              </p>
              <p className="text-[11px] text-[#0E7490] font-semibold">
                {isArabic ? 'منشأة معتمدة' : 'Verified Partner Facility'}
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Content: Already Reviewed OR Rating Form */}
        {isCurrentTargetReviewed ? (
          /* Already Reviewed State */
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                {target === 'doctor'
                  ? (isArabic ? 'تم تقييم هذا الطبيب بنجاح' : 'Doctor Reviewed')
                  : (isArabic ? 'تم تقييم هذه المنشأة بنجاح' : 'Hospital / Facility Reviewed')}
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                {isArabic
                  ? 'تم تسجيل تقييمك المعتمد لهذه الزيارة.'
                  : 'Your verified rating for this appointment has been recorded.'}
              </p>
            </div>

            {/* Stars display */}
            <div className="flex items-center justify-center gap-1.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= (target === 'doctor' ? existingDoctorRating : existingFacilityRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
              <span className="font-bold text-slate-800 text-sm ml-1.5">
                {(target === 'doctor' ? existingDoctorRating : existingFacilityRating)} / 5
              </span>
            </div>

            {(target === 'doctor' ? existingDoctorComment : existingFacilityComment) && (
              <div className="bg-white/80 rounded-xl p-3 border border-emerald-100 text-xs text-slate-700 italic">
                "{target === 'doctor' ? existingDoctorComment : existingFacilityComment}"
              </div>
            )}

            {/* Prompt to review the OTHER target if not yet reviewed */}
            {target === 'doctor' && !isFacilityReviewed && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTarget('facility');
                    setError('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0E7490] hover:bg-[#0c627a] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Building2 className="w-4 h-4" />
                  <span>
                    {isArabic
                      ? 'تقييم المستشفى / المنشأة الآن'
                      : `Rate ${facilityName} Now`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            )}

            {target === 'facility' && !isDoctorReviewed && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTarget('doctor');
                    setError('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Star className="w-4 h-4 fill-white text-white" />
                  <span>
                    {isArabic
                      ? `تقييم الدكتور ${appointment.doctorName} الآن`
                      : `Rate Dr. ${appointment.doctorName} Now`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Rating Form */
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {target === 'doctor'
                  ? (isArabic
                      ? `كيف كانت استشارتك مع الدكتور ${appointment.doctorName}؟`
                      : `How was your consultation with Dr. ${appointment.doctorName}?`)
                  : (isArabic
                      ? `كيف كانت تجربتك في ${facilityName}؟`
                      : `How was your experience at ${facilityName}?`)}
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110 cursor-pointer p-1"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (activeHovered || activeRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {(activeHovered || activeRating) > 0 && (
                <p className="text-sm font-bold text-amber-500">
                  {labels[activeHovered || activeRating]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('patientPortal.shareDetails')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  target === 'doctor'
                    ? (isArabic
                        ? 'كيف كانت تجربة الاستشارة الطبية وتشخيص الطبيب...'
                        : 'Share feedback about the doctor consultation, communication, and care...')
                    : (isArabic
                        ? 'كيف كانت المنشأة؟ ملاحظات حول النظافة، وقت الانتظار، وطاقم الاستقبال...'
                        : 'Share feedback about facility cleanliness, wait time, staff support, parking...')
                }
                rows={3}
                className="w-full text-xs border border-[#E2EBF0] rounded-xl px-4 py-3 focus:outline-none focus:border-[#2DA7B5] focus:ring-1 focus:ring-[#2DA7B5] resize-none text-slate-700 placeholder:text-slate-400 transition-all bg-white"
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-[#E2EBF0] text-xs font-bold text-slate-600 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                {t('patientPortal.skipForNow')}
              </button>
              <button
                type="button"
                disabled={activeRating === 0 || isSubmitting}
                onClick={() => handleSubmit()}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activeRating === 0 || isSubmitting
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : target === 'doctor'
                    ? 'bg-[#2DA7B5] hover:bg-[#23929F] text-white shadow-xs'
                    : 'bg-[#0E7490] hover:bg-[#0c627a] text-white shadow-xs'
                }`}
              >
                {isSubmitting ? (
                  <span>{isArabic ? 'جاري الإرسال...' : 'Submitting...'}</span>
                ) : (
                  <>
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>
                      {target === 'doctor'
                        ? (isArabic ? 'إرسال تقييم الطبيب' : 'Submit Doctor Review')
                        : (isArabic ? 'إرسال تقييم المستشفى' : 'Submit Facility Review')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer info badge */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isArabic ? 'تقييم معتمد بعد الزيارة' : 'Verified Post-Visit Review'}</span>
          </span>
          <span className="font-mono">ID: {appointment.id.slice(-6)}</span>
        </div>
      </div>
    </div>
  );
};
