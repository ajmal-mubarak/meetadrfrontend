import React, { useState } from 'react';
import { Stethoscope, CheckCircle2, ArrowRight, Mail, User } from 'lucide-react';
import { waitlistService } from '../../services/waitlistService';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

export const WaitlistPage: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast(t('forms.invalidEmail'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await waitlistService.joinWaitlist(email, name);
      setIsSuccess(true);
      showToast(t('waitlist.priorityList'), 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to join waitlist.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 text-center relative z-10">
        
        {/* Launching Soon Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-xs font-bold text-[#0E7490] mb-6">
          <span className="w-2 h-2 rounded-full bg-[#2DA7B5] animate-pulse"></span>
          <span>{t('waitlist.badge')}</span>
        </div>

        {/* Stethoscope Icon in badge */}
        <div className="w-16 h-16 rounded-2xl bg-[#E8F6F8] border border-[#CDEBF0] text-[#2DA7B5] flex items-center justify-center mx-auto mb-6">
          <Stethoscope className="w-8 h-8" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight mb-3">
          {t('waitlist.title')}
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
          {t('waitlist.subtitle')}
        </p>

        {isSuccess ? (
          <div className="bg-[#F8FAFC] border border-[#E2EBF0] rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-[#E8F6F8] text-[#2DA7B5] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">{t('waitlist.priorityList')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {t('waitlist.priorityDesc', { email })}
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
                setName('');
              }}
              className="mt-2 text-xs font-bold text-[#2DA7B5] hover:underline cursor-pointer"
            >
              {t('waitlist.addAnother')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left rtl:text-right">
            <div className="bg-[#F8FAFC] rounded-xl border border-[#E2EBF0] px-4 py-3 flex items-center focus-within:border-[#2DA7B5] focus-within:bg-white transition-all shadow-2xs">
              <User className="w-4 h-4 text-slate-400 mr-2 rtl:mr-0 rtl:ml-2 shrink-0" />
              <input
                type="text"
                placeholder={t('waitlist.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>

            <div className="bg-[#F8FAFC] rounded-xl border border-[#E2EBF0] px-4 py-3 flex items-center focus-within:border-[#2DA7B5] focus-within:bg-white transition-all shadow-2xs">
              <Mail className="w-4 h-4 text-slate-400 mr-2 rtl:mr-0 rtl:ml-2 shrink-0" />
              <input
                type="email"
                required
                placeholder={t('waitlist.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? t('waitlist.securingSpot') : t('waitlist.joinBtn')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <p className="text-center text-xs text-slate-400 pt-3">
              {t('waitlist.joinedCount')}
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
