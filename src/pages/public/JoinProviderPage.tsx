import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Hospital,
  Users,
  Calendar,
  Award,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Sparkles,
  FileCheck,
  ClipboardList,
  Send,
} from 'lucide-react';
import { providerService } from '../../services/providerService';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

type ProviderType = 'hospital' | 'clinic';

interface WizardData {
  providerType: ProviderType;
  facilityName: string;
  contactPerson: string;
  countryCode: string;
  contactNumber: string;
  email: string;
  location: string;
  country: string;
  website: string;
  notes: string;
}

const INITIAL_DATA: WizardData = {
  providerType: 'hospital',
  facilityName: '',
  contactPerson: '',
  countryCode: '+971',
  contactNumber: '',
  email: '',
  location: '',
  country: 'United Arab Emirates',
  website: '',
  notes: '',
};

const STEPS = [
  { id: 1, label: 'Provider Type', icon: Building2 },
  { id: 2, label: 'Organization Details', icon: ClipboardList },
  { id: 3, label: 'Review & Submit', icon: Send },
];

export const JoinProviderPage: React.FC = () => {
  const { t, isRTL } = useTranslation();
  const { showToast } = useToast();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>(INITIAL_DATA);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedReference, setSubmittedReference] = useState('');

  // FAQ state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Refs
  const wizardRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const scrollToWizard = (type?: ProviderType) => {
    if (type) setWizardData((d) => ({ ...d, providerType: type }));
    if (wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToHowItWorks = () => {
    if (howItWorksRef.current) {
      howItWorksRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const update = (field: keyof WizardData, value: string) => {
    setWizardData((d) => ({ ...d, [field]: value }));
  };

  const validateStep2 = (): boolean => {
    if (!wizardData.facilityName.trim()) {
      showToast('Please enter your facility name.', 'error');
      return false;
    }
    if (!wizardData.contactPerson.trim()) {
      showToast('Please enter the contact person name.', 'error');
      return false;
    }
    if (!wizardData.email.trim() || !wizardData.email.includes('@')) {
      showToast('Please provide a valid email address.', 'error');
      return false;
    }
    if (!wizardData.contactNumber.trim()) {
      showToast('Please enter a valid contact phone number.', 'error');
      return false;
    }
    if (!wizardData.location.trim()) {
      showToast('Please specify your city or emirate.', 'error');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep((s) => Math.min(s + 1, 3));
    if (wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    if (wizardRef.current) {
      wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await providerService.submitJoinRequest({
        providerType: wizardData.providerType,
        name: wizardData.facilityName.trim(),
        contactNumber: `${wizardData.countryCode} ${wizardData.contactNumber.trim()}`,
        email: wizardData.email.trim(),
        country: wizardData.country,
        location: wizardData.location.trim(),
      });
      setSubmittedReference(result.id);
      setIsSuccess(true);
      showToast('Application submitted successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit application. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setWizardData(INITIAL_DATA);
    setCurrentStep(1);
    setIsSuccess(false);
    setSubmittedReference('');
  };

  // Static data
  const benefits = [
    { icon: Users, title: t('joinProvider.benefit1Title'), desc: t('joinProvider.benefit1Desc') },
    { icon: Calendar, title: t('joinProvider.benefit2Title'), desc: t('joinProvider.benefit2Desc') },
    { icon: Award, title: t('joinProvider.benefit3Title'), desc: t('joinProvider.benefit3Desc') },
    { icon: LayoutDashboard, title: t('joinProvider.benefit4Title'), desc: t('joinProvider.benefit4Desc') },
  ];

  const howItWorksSteps = [
    { number: '01', title: 'Register', desc: 'Select Hospital or Clinic and fill in your facility details.' },
    { number: '02', title: 'Verification', desc: 'Our team reviews your credentials and practice information.' },
    { number: '03', title: 'Set Up Your Practice', desc: 'Add doctors, departments, consultation hours from your dashboard.' },
    { number: '04', title: 'Start Connecting', desc: 'Patients discover your facility and book appointments directly.' },
  ];

  const providerTypes: {
    type: ProviderType;
    icon: typeof Hospital;
    title: string;
    desc: string;
    cta: string;
    features: string[];
  }[] = [
    {
      type: 'clinic',
      icon: Building2,
      title: t('joinProvider.typeClinicTitle'),
      desc: t('joinProvider.typeClinicDesc'),
      cta: t('joinProvider.typeClinicCta'),
      features: [
        t('joinProvider.typeClinicItem1'),
        t('joinProvider.typeClinicItem2'),
        t('joinProvider.typeClinicItem3'),
      ],
    },
    {
      type: 'hospital',
      icon: Hospital,
      title: t('joinProvider.typeHospitalTitle'),
      desc: t('joinProvider.typeHospitalDesc'),
      cta: t('joinProvider.typeHospitalCta'),
      features: [
        t('joinProvider.typeHospitalItem1'),
        t('joinProvider.typeHospitalItem2'),
        t('joinProvider.typeHospitalItem3'),
      ],
    },
  ];

  const faqs = [
    { q: 'Who can join MeetAdr?', a: 'MeetAdr publicly onboards licensed Hospitals and Clinics operating in the UAE. Individual doctors are added by their affiliated Hospital or Clinic after account setup.' },
    { q: 'How do I register my Hospital or Clinic?', a: 'Select your provider type (Hospital or Clinic), fill in your organization details, review, and submit. Our team will review your application within 1–2 business days.' },
    { q: 'What about individual doctors?', a: 'Doctors are managed by the Hospital or Clinic they belong to. After your facility account is approved, you can add and manage your doctors directly from your dashboard.' },
    { q: 'What information do I need to provide?', a: 'You start with your facility name, contact person, official email, phone number, and city. Our team will request licensing credentials during the verification step.' },
    { q: 'How does provider verification work?', a: 'Our onboarding team verifies all submitted applications against UAE healthcare regulatory standards before activating your facility profile.' },
    { q: 'Can clinics and hospitals manage multiple doctors?', a: 'Yes. Both Clinics and Hospitals get a dedicated dashboard with full doctor roster management, scheduling tools, and centralized appointment oversight.' },
  ];

  return (
    <div className="bg-[#F4F7F9] min-h-screen text-slate-800">

      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden bg-[#F4F7F9] border-b border-[#E2EBF0] pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left rtl:text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-xs font-bold text-[#0E7490] tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#2DA7B5]" />
                <span>JOIN MEETADR — FOR HOSPITALS & CLINICS</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                {t('joinProvider.heroTitle')}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Register your Hospital or Clinic on MeetAdr. Connect with patients, manage your doctor roster, and streamline appointment scheduling — all from one platform.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToWizard()}
                  className="px-6 py-3.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Register Your Facility</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={scrollToHowItWorks}
                  className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#E2EBF0] text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  How It Works
                </button>
              </div>

              {/* Trust highlights */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2DA7B5] shrink-0" />
                  <span className="text-slate-700 font-semibold">3-Step Quick Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#2DA7B5] shrink-0" />
                  <span className="text-slate-700 font-semibold">{t('joinProvider.heroVisualBadge')}</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md">
                <div className="relative rounded-3xl overflow-hidden border border-[#E2EBF0] bg-white shadow-sm">
                  <img
                    src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800"
                    alt="Modern Hospital Facility"
                    className="w-full h-72 sm:h-80 object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                  <div className="absolute top-4 left-4 rtl:left-auto rtl:right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/50 flex items-center gap-1.5 text-xs font-bold text-slate-900 shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-[#2DA7B5]" />
                    <span>Verified Provider Network</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white text-left rtl:text-right space-y-1">
                    <span className="text-[10px] font-bold text-[#E8F6F8] uppercase tracking-wider block">
                      Hospitals & Clinics
                    </span>
                    <h3 className="text-base font-black leading-snug">
                      One Platform for Your Entire Facility
                    </h3>
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      Manage doctors, departments, and appointments across your entire organization.
                    </p>
                  </div>
                </div>

                <div className="mt-3 bg-white rounded-2xl border border-[#E2EBF0] shadow-xs p-4 space-y-2 text-left rtl:text-right text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2DA7B5] shrink-0" />
                    <span>Multi-doctor roster management</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2DA7B5] shrink-0" />
                    <span>Add doctors after account setup</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#2DA7B5] shrink-0" />
                    <span>Zero setup fees or complex hardware</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. BENEFITS SECTION                                                       */}
      {/* ========================================================================= */}
      <section id="benefits" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-[#2DA7B5] tracking-wider uppercase">
            {t('joinProvider.benefitsEyebrow')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('joinProvider.benefitsTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('joinProvider.benefitsSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-[#E2EBF0] p-6 sm:p-7 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all space-y-4 text-left rtl:text-right group"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#E8F6F8] border border-[#CDEBF0] flex items-center justify-center text-[#2DA7B5] group-hover:scale-105 transition-transform">
                <b.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">{b.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS                                                           */}
      {/* ========================================================================= */}
      <section
        ref={howItWorksRef}
        id="how-it-works"
        className="py-16 sm:py-20 bg-white border-y border-[#E2EBF0]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-[#2DA7B5] tracking-wider uppercase">
              {t('joinProvider.howItWorksEyebrow')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('joinProvider.howItWorksTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('joinProvider.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((step, idx) => (
              <div
                key={idx}
                className="relative bg-[#F8FAFC] border border-[#E2EBF0] rounded-3xl p-6 sm:p-7 space-y-3 text-left rtl:text-right hover:border-[#2DA7B5] hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {step.number}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-[#0E7490] flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROVIDER TYPES (Hospital & Clinic only)                               */}
      {/* ========================================================================= */}
      <section id="provider-types" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-bold text-[#2DA7B5] tracking-wider uppercase">
            {t('joinProvider.typesEyebrow')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Who Can Join MeetAdr
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            MeetAdr onboards Hospitals and Clinics. Your facility manages doctors from the dashboard after registration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {providerTypes.map((item) => (
            <div
              key={item.type}
              className="bg-white rounded-3xl border border-[#E2EBF0] p-6 sm:p-8 shadow-xs hover:border-[#2DA7B5] hover:shadow-md transition-all flex flex-col justify-between text-left rtl:text-right space-y-6"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F6F8] border border-[#CDEBF0] text-[#2DA7B5] flex items-center justify-center">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <div className="pt-2 border-t border-[#E2EBF0] space-y-2">
                  {item.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#2DA7B5] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => scrollToWizard(item.type)}
                className="w-full py-3 bg-[#F8FAFC] hover:bg-[#2DA7B5] hover:text-white text-slate-700 border border-[#E2EBF0] hover:border-[#2DA7B5] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{item.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          ))}
        </div>

        {/* Doctor note */}
        <div className="mt-8 max-w-3xl mx-auto bg-white border border-[#E2EBF0] shadow-xs rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#2DA7B5] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-bold block text-slate-900">For Individual Doctors</span>
            Doctors are added and managed by the Hospital or Clinic they are affiliated with. If you are a doctor, contact your facility administrator to be added to the MeetAdr roster.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. 3-STEP WIZARD                                                         */}
      {/* ========================================================================= */}
      <section
        ref={wizardRef}
        id="join-form"
        className="py-16 sm:py-20 bg-white border-y border-[#E2EBF0]"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="text-center mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F6F8] border border-[#CDEBF0] text-xs font-bold text-[#0E7490]">
              <FileCheck className="w-3.5 h-3.5 text-[#2DA7B5]" />
              <span>PROVIDER ONBOARDING</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Register Your Facility
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
              Complete 3 quick steps to submit your Hospital or Clinic application. Our team will review and connect with you within 1–2 business days.
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="bg-[#F4F7F9] border border-[#E2EBF0] rounded-3xl p-8 sm:p-12 text-center space-y-5">
              <div className="w-16 h-16 bg-[#2DA7B5] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Application Submitted!</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mt-2">
                  Thank you for registering <span className="font-bold text-slate-900">{wizardData.facilityName}</span> on MeetAdr. Our onboarding team will review your application and contact you at <span className="font-semibold text-slate-900">{wizardData.email}</span> within 1–2 business days.
                </p>
              </div>

              {submittedReference && (
                <div className="inline-block px-4 py-2 rounded-xl bg-white border border-[#E2EBF0] text-slate-800 text-xs font-bold font-mono shadow-xs">
                  Reference: {submittedReference}
                </div>
              )}

              <div className="pt-2 p-4 bg-white rounded-2xl border border-[#E2EBF0] text-xs text-slate-600 text-left rtl:text-right space-y-1.5">
                <p className="font-bold text-slate-900">What happens next?</p>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0 mt-0.5" />
                  <span>Our team reviews your credentials & facility info</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0 mt-0.5" />
                  <span>You receive your dashboard login credentials</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0 mt-0.5" />
                  <span>Add your doctors directly from your dashboard</span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetWizard}
                className="px-6 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Register Another Facility
              </button>
            </div>
          ) : (
            <>
              {/* Step Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between relative">
                  {/* Background connector */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-[#E2EBF0] rounded-full z-0" />
                  {/* Active connector */}
                  <div
                    className="absolute top-5 left-0 h-1 bg-[#2DA7B5] rounded-full z-0 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  />
                  {STEPS.map((step) => {
                    const isCompleted = currentStep > step.id;
                    const isActive = currentStep === step.id;
                    return (
                      <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold text-xs transition-all duration-300 ${
                            isCompleted
                              ? 'bg-[#2DA7B5] border-[#2DA7B5] text-white font-bold'
                              : isActive
                              ? 'bg-white border-[#2DA7B5] text-[#2DA7B5] font-bold shadow-xs'
                              : 'bg-white border-[#E2EBF0] text-slate-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                        </div>
                        <span
                          className={`text-[10px] font-bold text-center hidden sm:block ${
                            isActive ? 'text-slate-900 font-bold' : isCompleted ? 'text-[#2DA7B5]' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── STEP 1: Provider Type ─── */}
              {currentStep === 1 && (
                <div className="bg-[#F8FAFC] rounded-3xl border border-[#E2EBF0] p-6 sm:p-10 space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Select Provider Type</h3>
                    <p className="text-xs text-slate-500 mt-1">Choose the type of healthcare facility you are registering.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Clinic Card */}
                    <button
                      type="button"
                      onClick={() => update('providerType', 'clinic')}
                      className={`p-6 rounded-2xl border-2 text-left rtl:text-right cursor-pointer transition-all space-y-3 ${
                        wizardData.providerType === 'clinic'
                          ? 'bg-white border-[#2DA7B5] shadow-xs'
                          : 'bg-white border-[#E2EBF0] hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        wizardData.providerType === 'clinic' ? 'bg-[#E8F6F8] text-[#2DA7B5]' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Clinic</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Outpatient clinics, polyclinics, and specialized medical centers.
                        </p>
                      </div>
                      {wizardData.providerType === 'clinic' && (
                        <div className="flex items-center gap-1 text-[#2DA7B5] text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      )}
                    </button>

                    {/* Hospital Card */}
                    <button
                      type="button"
                      onClick={() => update('providerType', 'hospital')}
                      className={`p-6 rounded-2xl border-2 text-left rtl:text-right cursor-pointer transition-all space-y-3 ${
                        wizardData.providerType === 'hospital'
                          ? 'bg-white border-[#2DA7B5] shadow-xs'
                          : 'bg-white border-[#E2EBF0] hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        wizardData.providerType === 'hospital' ? 'bg-[#E8F6F8] text-[#2DA7B5]' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Hospital className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Hospital</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Tertiary hospitals and large integrated healthcare organizations.
                        </p>
                      </div>
                      {wizardData.providerType === 'hospital' && (
                        <div className="flex items-center gap-1 text-[#2DA7B5] text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Doctor note */}
                  <div className="bg-white border border-[#E2EBF0] rounded-2xl p-4 flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#2DA7B5] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-900">Individual doctors</span> are not onboarded through this page. They are added by their affiliated Hospital or Clinic after account creation.
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={goNext}
                      className="px-7 py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 2: Organization Details ─── */}
              {currentStep === 2 && (
                <div className="bg-[#F8FAFC] rounded-3xl border border-[#E2EBF0] p-6 sm:p-10 space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F6F8] border border-[#CDEBF0] text-[#0E7490] text-[10px] font-bold mb-2">
                      {wizardData.providerType === 'hospital'
                        ? <Hospital className="w-3 h-3 text-[#2DA7B5]" />
                        : <Building2 className="w-3 h-3 text-[#2DA7B5]" />}
                      <span className="capitalize">{wizardData.providerType} Registration</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900">Organization Details</h3>
                    <p className="text-xs text-slate-500 mt-1">Provide your facility and contact information.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Facility Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {wizardData.providerType === 'hospital' ? 'Hospital Name' : 'Clinic Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardData.facilityName}
                        onChange={(e) => update('facilityName', e.target.value)}
                        placeholder={wizardData.providerType === 'hospital' ? 'e.g. City Care Hospital' : 'e.g. Green Valley Clinic'}
                        className="w-full bg-white border border-[#E2EBF0] rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] font-medium shadow-xs"
                      />
                    </div>

                    {/* Contact Person */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={wizardData.contactPerson}
                        onChange={(e) => update('contactPerson', e.target.value)}
                        placeholder="e.g. Mohammed Al Rashid or Dr. Sarah Chen"
                        className="w-full bg-white border border-[#E2EBF0] rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] font-medium shadow-xs"
                      />
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Contact Phone *
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={wizardData.countryCode}
                            onChange={(e) => update('countryCode', e.target.value)}
                            className="w-28 bg-white border border-[#E2EBF0] rounded-xl px-2.5 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2DA7B5] cursor-pointer shadow-xs"
                          >
                            <option value="+971">+971 (UAE)</option>
                            <option value="+965">+965 (KWT)</option>
                            <option value="+966">+966 (KSA)</option>
                            <option value="+974">+974 (QAT)</option>
                            <option value="+44">+44 (UK)</option>
                            <option value="+1">+1 (US)</option>
                          </select>
                          <div className="flex-1 bg-white rounded-xl border border-[#E2EBF0] px-3.5 py-3 flex items-center shadow-xs">
                            <Phone className="w-3.5 h-3.5 text-slate-400 mr-2 rtl:mr-0 rtl:ml-2 shrink-0" />
                            <input
                              type="tel"
                              required
                              value={wizardData.contactNumber}
                              onChange={(e) => update('contactNumber', e.target.value)}
                              placeholder="50 123 4567"
                              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-medium placeholder-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Official Email *
                        </label>
                        <div className="bg-white rounded-xl border border-[#E2EBF0] px-3.5 py-3 flex items-center shadow-xs">
                          <Mail className="w-3.5 h-3.5 text-slate-400 mr-2 rtl:mr-0 rtl:ml-2 shrink-0" />
                          <input
                            type="email"
                            required
                            value={wizardData.email}
                            onChange={(e) => update('email', e.target.value)}
                            placeholder="info@hospital.com"
                            className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-medium placeholder-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* City & Country */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          City / Emirate *
                        </label>
                        <div className="bg-white rounded-xl border border-[#E2EBF0] px-3.5 py-3 flex items-center shadow-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 rtl:mr-0 rtl:ml-2 shrink-0" />
                          <input
                            type="text"
                            required
                            value={wizardData.location}
                            onChange={(e) => update('location', e.target.value)}
                            placeholder="e.g. Dubai, Abu Dhabi, Sharjah"
                            className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-medium placeholder-slate-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Country
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={wizardData.country}
                          className="w-full bg-slate-100 border border-[#E2EBF0] rounded-xl px-4 py-3 text-xs text-slate-500 cursor-not-allowed font-medium"
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Website <span className="font-normal text-slate-400">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={wizardData.website}
                        onChange={(e) => update('website', e.target.value)}
                        placeholder="https://yourhospital.com"
                        className="w-full bg-white border border-[#E2EBF0] rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] font-medium shadow-xs"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Additional Notes <span className="font-normal text-slate-400">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={wizardData.notes}
                        onChange={(e) => update('notes', e.target.value)}
                        placeholder="Briefly describe your facility, departments, or any questions for our team..."
                        className="w-full bg-white border border-[#E2EBF0] rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2DA7B5] font-medium resize-none shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-[#E2EBF0] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="px-7 py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span>Review Application</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Review & Submit ─── */}
              {currentStep === 3 && (
                <div className="bg-[#F8FAFC] rounded-3xl border border-[#E2EBF0] p-6 sm:p-10 space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Review Your Application</h3>
                    <p className="text-xs text-slate-500 mt-1">Please confirm all details before submitting.</p>
                  </div>

                  {/* Review Card */}
                  <div className="bg-white rounded-2xl border border-[#E2EBF0] divide-y divide-[#E2EBF0] overflow-hidden shadow-xs">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {wizardData.providerType === 'hospital'
                          ? <Hospital className="w-5 h-5 text-[#2DA7B5]" />
                          : <Building2 className="w-5 h-5 text-[#2DA7B5]" />}
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Provider Type</p>
                          <p className="text-sm font-bold text-slate-900 capitalize">{wizardData.providerType}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setCurrentStep(1)} className="text-[10px] text-[#2DA7B5] font-bold hover:underline cursor-pointer">Edit</button>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                          {wizardData.providerType === 'hospital' ? 'Hospital' : 'Clinic'} Name
                        </p>
                        <p className="text-sm font-bold text-slate-900">{wizardData.facilityName}</p>
                      </div>
                      <button type="button" onClick={() => setCurrentStep(2)} className="text-[10px] text-[#2DA7B5] font-bold hover:underline cursor-pointer">Edit</button>
                    </div>

                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Contact Person</p>
                        <p className="text-sm font-bold text-slate-900">{wizardData.contactPerson}</p>
                      </div>
                      <button type="button" onClick={() => setCurrentStep(2)} className="text-[10px] text-[#2DA7B5] font-bold hover:underline cursor-pointer">Edit</button>
                    </div>

                    <div className="p-4">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Contact Phone</p>
                      <p className="text-sm font-bold text-slate-900">{wizardData.countryCode} {wizardData.contactNumber}</p>
                    </div>

                    <div className="p-4">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Official Email</p>
                      <p className="text-sm font-bold text-slate-900">{wizardData.email}</p>
                    </div>

                    <div className="p-4">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Location</p>
                      <p className="text-sm font-bold text-slate-900">{wizardData.location}, {wizardData.country}</p>
                    </div>

                    {wizardData.website && (
                      <div className="p-4">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Website</p>
                        <p className="text-sm font-bold text-slate-900">{wizardData.website}</p>
                      </div>
                    )}

                    {wizardData.notes && (
                      <div className="p-4">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Additional Notes</p>
                        <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{wizardData.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E2EBF0] text-xs text-slate-600 flex items-start gap-3 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-[#2DA7B5] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">{t('joinProvider.trustSecurityTitle')}</span>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                        {t('joinProvider.trustSecurityDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={goBack}
                      className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-[#E2EBF0] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-7 py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Application</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. FAQ SECTION                                                            */}
      {/* ========================================================================= */}
      <section id="faq" className="py-16 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <span className="text-xs font-bold text-[#2DA7B5] tracking-wider uppercase">
            {t('joinProvider.faqEyebrow')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('joinProvider.faqTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t('joinProvider.faqSubtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq((prev) => (prev === idx ? null : idx))}
                  className="w-full p-5 text-left rtl:text-right flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#2DA7B5]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-[#E2EBF0] font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FINAL CTA                                                              */}
      {/* ========================================================================= */}
      <section className="py-12 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E2EBF0] shadow-sm relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {t('joinProvider.finalCtaTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {t('joinProvider.finalCtaSubtitle')}
            </p>
            <div className="pt-3 flex flex-wrap justify-center items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToWizard()}
                className="px-6 py-3 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Register Your Facility</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
              <Link
                to="/contact"
                className="px-6 py-3 bg-[#F8FAFC] hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-[#E2EBF0] transition-all cursor-pointer"
              >
                {t('joinProvider.finalCtaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

