import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Clock,
  HeartHandshake,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

// 1. ABOUT US
export const AboutPage: React.FC = () => {
  const { isArabic } = useTranslation();

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
            {isArabic ? 'من نحن' : 'About Us'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
            {isArabic ? 'إعادة ابتكار حجز المواعيد الطبية' : 'Transforming Healthcare Scheduling'}
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            {isArabic
              ? 'تأسست meetAdr برؤية واضحة: إزالة العوائق والانتظار في حجز المواعيد الطبية، وتوفير رعاية صحية عالية الجودة تتسم بالشفافية والسهولة والسرعة للمرضى والكوادر الطبية على حد سواء.'
              : 'MeetAdr was founded with a single mission: to eliminate friction in medical scheduling, making quality healthcare accessible, transparent, and seamless for patients and practitioners alike.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] shadow-2xs">
            <Clock className="w-6 h-6 text-[#2DA7B5] mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">
              {isArabic ? 'مواعيد حية ومؤكدة' : 'Real-Time Slots'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isArabic
                ? 'وداعاً للانتظار على الهاتف مع خانات استشارة مضمونة لمدة 30 دقيقة مرتبطة مباشرة بالمستشفيات والعيادات.'
                : 'Eliminate phone queues with guaranteed 30-minute consultation slots directly linked with hospitals.'}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] shadow-2xs">
            <Shield className="w-6 h-6 text-[#2DA7B5] mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">
              {isArabic ? 'أطباء معتمدون ومرخصون' : 'Verified Credentials'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isArabic
                ? 'يتم التحقق من تراخيص واعتمادات كل طبيب ومركز صحي مسجل على منصتنا وفقاً لأعلى المعايير الصحية.'
                : 'Every practitioner and clinical center on our platform is vetted for active regional licensing.'}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] shadow-2xs">
            <HeartHandshake className="w-6 h-6 text-[#2DA7B5] mb-2" />
            <h3 className="font-bold text-slate-900 text-sm">
              {isArabic ? 'مجاني تماماً للمرضى' : 'Free for Patients'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {isArabic
                ? 'بدون رسوم خفية أو إضافات على الحجز. يدفع المرضى رسوم الكشف مباشرة في العيادة أو المستشفى.'
                : 'Zero hidden booking fees or processing markups. Patients pay medical fees directly at the clinic.'}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#E2EBF0] text-sm text-slate-600 leading-relaxed">
          <h2 className="text-lg font-black text-slate-900">
            {isArabic ? 'رؤيتنا المستقبلية' : 'Our Vision'}
          </h2>
          <p>
            {isArabic
              ? 'نتطلع إلى بناء منظومة صحية رقمية متكاملة تتيح للمرضى في الإمارات والمنطقة العثور على أفضل الاستشاريين في ثوانٍ معدودة، وحجز استشاراتهم دون تأخير، مع تلقي تذكيرات فورية ومتابعة دورية بكل ثقة وسهولة.'
              : 'We envision an integrated digital health ecosystem where patients can discover the most suitable specialists in seconds, schedule consultations without bureaucratic delays, and receive timely reminders and follow-ups.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 2. SERVICES
export const ServicesPage: React.FC = () => {
  const { isArabic } = useTranslation();

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
            {isArabic ? 'قدرات وخدمات المنصة' : 'Platform Capabilities'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
            {isArabic ? 'خدمات الرعاية الصحية لدينا' : 'Our Healthcare Services'}
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            {isArabic
              ? 'من اكتشاف الأطباء للمرضى وحتى إدارة العيادات والمستشفيات، تدعم meetAdr أحدث آليات العمل الصحي.'
              : 'From patient discovery to clinical enterprise management, MeetAdr powers modern healthcare workflows.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] space-y-2 shadow-2xs hover:border-[#2DA7B5] transition-all">
            <h3 className="text-base font-bold text-slate-900">
              {isArabic ? 'حجز مواعيد المرضى الفوري' : 'Patient Appointment Scheduling'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isArabic
                ? 'استكشاف الأطباء في الوقت الفعلي حسب التخصص والموقع والمستشفى وشركات التأمين مع تأكيد فوري للحجز.'
                : 'Real-time appointment discovery by doctor specialty, location, hospital, or specific health condition with instant confirmation.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] space-y-2 shadow-2xs hover:border-[#2DA7B5] transition-all">
            <h3 className="text-base font-bold text-slate-900">
              {isArabic ? 'عمليات المستشفيات والمراكز الطبية' : 'Hospital & Clinic Operations'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isArabic
                ? 'إدارة مركزية لجداول الكشوفات، وتوزيع نوبات الأطباء، ومتابعة سجلات الحجز بدقة تامة وبدون تداخل.'
                : 'Centralized schedule management, multi-doctor roster visibility, and patient appointment tracking with zero double-booking.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] space-y-2 shadow-2xs hover:border-[#2DA7B5] transition-all">
            <h3 className="text-base font-bold text-slate-900">
              {isArabic ? 'بوابات الأطباء والاستشاريين' : 'Physician Practice Portals'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isArabic
                ? 'لوحات تحكم مخصصة لكل طبيب تعرض قائمة الانتظار اليومية، وسجلات الاستشارات، والجدول الأسبوعي المعتمد.'
                : "Specialist-specific dashboards displaying today's patient queue, consultation records, and upcoming weekly schedules."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] space-y-2 shadow-2xs hover:border-[#2DA7B5] transition-all">
            <h3 className="text-base font-bold text-slate-900">
              {isArabic ? 'التحليلات والتقارير التشغيلية' : 'Healthcare Analytics & Reports'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isArabic
                ? 'تقارير شاملة عن أداء العيادات ونسب التأكيد ونسب الإلغاء وتوزيع المواعيد على التخصصات الطبية.'
                : 'Operational summaries of appointments by specialty, doctor load, confirmed rates, and patient visit volumes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. PARTNERS
export const PartnersPage: React.FC = () => {
  const { isArabic } = useTranslation();

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
            {isArabic ? 'الشركاء والتعاون الطبي' : 'Collaborations'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
            {isArabic ? 'شركاؤنا في الرعاية الصحية' : 'Our Healthcare Partners'}
          </h1>
          <p className="text-base text-slate-600 mt-3 leading-relaxed">
            {isArabic
              ? 'تفخر meetAdr بالتعاون مع كبرى مجموعات المستشفيات والمراكز التخصصية والعيادات المعتمدة في دولة الإمارات.'
              : 'MeetAdr proudly collaborates with leading hospital groups, ambulatory medical centers, and specialized diagnostic laboratories across the region.'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          {[
            isArabic ? 'المستشفى الأمريكي دبي' : 'American Hospital Dubai',
            isArabic ? 'مستشفى ميدكير الصفا' : 'Medcare Al Safa',
            isArabic ? 'المستشفى الكندي التخصصي' : 'Canadian Specialist',
            isArabic ? 'مستشفى أستر المنخول' : 'Aster Mankhool',
            isArabic ? 'مجموعة سيتي كير' : 'CityCare Health',
            isArabic ? 'مجمع النور الطبي' : 'Al Noor Hospital',
            isArabic ? 'عيادات الخليج المركزية' : 'Gulf Central',
            isArabic ? 'مستشفى الشارقة الأكاديمي' : 'Sharjah Academic',
          ].map((partner) => (
            <div key={partner} className="p-4 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] flex items-center justify-center text-center shadow-2xs hover:border-[#2DA7B5] transition-all">
              <span className="text-xs font-bold text-slate-800">{partner}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E2EBF0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isArabic ? 'انضم كشريك طبي رسمي' : 'Become an Official Partner'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isArabic ? 'انضم إلى شبكتنا التي تضم أكثر من 100+ منشأة صحية معتمدة.' : 'Join our network of over 100+ accredited facilities.'}
            </p>
          </div>
          <Link
            to="/join"
            className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs shrink-0 transition-all"
          >
            {isArabic ? 'التسجيل كمقدم رعاية' : 'Join as Provider'}
          </Link>
        </div>
      </div>
    </div>
  );
};

// 4. CONTACT
export const ContactPage: React.FC = () => {
  const { isArabic } = useTranslation();
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast(
      isArabic
        ? 'تم استلام رسالتك بنجاح. سيتواصل فريقنا معك في أقرب وقت.'
        : 'Your message has been received. Our team will contact you shortly.',
      'success'
    );
  };

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
            {isArabic ? 'تواصل معنا' : 'Get In Touch'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
            {isArabic ? 'خدمة العملاء والاستفسارات' : 'Contact Support & Inquiries'}
          </h1>
          <p className="text-base text-slate-600 mt-2">
            {isArabic
              ? 'هل لديك أي استفسار حول حجز موعد، أو تسجيل طبيب أو مستشفى، أو الربط التقني؟'
              : 'Have questions about booking an appointment, provider onboarding, or system integration?'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs text-slate-600 space-y-1 shadow-2xs">
            <Phone className="w-5 h-5 text-[#2DA7B5] mb-2" />
            <strong className="block text-slate-900 font-bold text-sm">
              {isArabic ? 'الدعم الهاتفي' : 'Phone Support'}
            </strong>
            <span dir="ltr" className="inline-block font-mono font-bold text-slate-800">+971 52 412 2794</span>
            <span className="block text-slate-400">
              {isArabic ? 'يومياً: 8:00 صباحاً - 8:00 مساءً' : 'Sun - Thu: 8am - 8pm'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs text-slate-600 space-y-1 shadow-2xs">
            <Mail className="w-5 h-5 text-[#2DA7B5] mb-2" />
            <strong className="block text-slate-900 font-bold text-sm">
              {isArabic ? 'البريد الإلكتروني' : 'Email Inquiries'}
            </strong>
            <span dir="ltr" className="inline-block font-mono text-slate-800 font-semibold">info@meetadr.com</span>
            <span className="block text-slate-400">
              {isArabic ? 'الرد خلال 24 ساعة' : 'Response within 24 hours'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs text-slate-600 space-y-1 shadow-2xs">
            <MapPin className="w-5 h-5 text-[#2DA7B5] mb-2" />
            <strong className="block text-slate-900 font-bold text-sm">
              {isArabic ? 'المقر الرئيسي' : 'Headquarters'}
            </strong>
            <span className="text-slate-800 font-medium">{isArabic ? 'مدينة دبي الطبية' : 'Dubai Healthcare City'}</span>
            <span className="block text-slate-400">
              {isArabic ? 'مبنى 42، دبي، الإمارات' : 'Bldg 42, Dubai, UAE'}
            </span>
          </div>
        </div>

        {submitted ? (
          <div className="p-6 bg-[#E8F6F8] rounded-2xl border border-[#CDEBF0] text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#2DA7B5] mx-auto" />
            <h3 className="text-base font-black text-slate-900">
              {isArabic ? 'شكراً لتواصلك معنا!' : 'Thank you for your message!'}
            </h3>
            <p className="text-xs text-slate-600">
              {isArabic
                ? 'سيتواصل معك فريق دعم المرضى عبر بريدك الإلكتروني قريباً.'
                : 'Our patient support team will reach out to your email shortly.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-[#E2EBF0]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'الاسم الكامل' : 'Your Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isArabic ? 'سارة جنكينز' : 'Sarah Jenkins'}
                  className="w-full p-2.5 border border-[#E2EBF0] bg-[#F8FAFC] text-slate-900 rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none shadow-2xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full p-2.5 border border-[#E2EBF0] bg-[#F8FAFC] text-slate-900 rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isArabic ? 'موضوع الرسالة' : 'Subject'}
              </label>
              <input
                type="text"
                required
                placeholder={isArabic ? 'استفسار عن حجز موعد أو شراكة طبية...' : 'Appointment query or provider partnership...'}
                className="w-full p-2.5 border border-[#E2EBF0] bg-[#F8FAFC] text-slate-900 rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isArabic ? 'نص الرسالة' : 'Message'}
              </label>
              <textarea
                rows={4}
                required
                placeholder={isArabic ? 'كيف يمكننا مساعدتك اليوم؟' : 'How can we assist you today?'}
                className="w-full p-2.5 border border-[#E2EBF0] bg-[#F8FAFC] text-slate-900 rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none resize-none shadow-2xs"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isArabic ? 'إرسال الرسالة' : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// 5. FAQ
export const FaqPage: React.FC = () => {
  const { isArabic } = useTranslation();

  const faqs = isArabic
    ? [
        {
          q: 'هل يتعين علي دفع أي رسوم لحجز موعد عبر meetAdr؟',
          a: 'لا. إن منصة meetAdr مجانية 100% للمرضى. لا توجد رسوم حجز أو مصاريف منصة أو غرامات إلغاء. يتم دفع رسوم الاستشارة الطبية مباشرة في المستشفى أو العيادة أثناء زيارتك.',
        },
        {
          q: 'كيف أتأكد من أن موعدي قد تم تأكيده؟',
          a: 'بمجرد إتمام الحجز على meetAdr، يُسجل موعدك فوراً في النظام بحالة "مؤكد". وسيتواصل معك موظف الاستقبال في العيادة أو المستشفى عبر الهاتف أو الرسائل النصية القصيرة قبل الموعد.',
        },
        {
          q: 'هل يمكنني إلغاء موعدي أو إعادة جدولته؟',
          a: 'نعم بكل سهولة. يمكنك الانتقال إلى "حجوزاتي" في بوابة المريض أو النقر على رابط حجزك للإلغاء بنقرة واحدة وتحديد السبب ليتم تحرير الموعد فوراً.',
        },
        {
          q: 'هل الأطباء والمراكز الطبية معتمدون ومرخصون؟',
          a: 'نعم، يخضع كل طبيب ومستشفى وعيادة على meetAdr للتحقق والتأكد من مطابقة تراخيصهم للجهات الصحية الرسمية في الدولة.',
        },
        {
          q: 'ما الذي يجب أن أصحبه معي إلى الموعد الطبي؟',
          a: 'يُرجى إحضار بطاقة الهوية الإماراتية الأصلية، وبطاقة التأمين الصحي السارية (إن وجدت)، وأي تقارير أو فحوصات مخبرية سابقة.',
        },
      ]
    : [
        {
          q: 'Do I have to pay any fee to book an appointment through MeetAdr?',
          a: 'No. MeetAdr is 100% free for patients. There are zero booking fees, platform charges, or cancellation penalties. Any medical consultation fees are paid directly at the hospital or clinic during your visit.',
        },
        {
          q: 'How do I know my appointment is confirmed?',
          a: 'Immediately upon completing your booking on MeetAdr, your appointment is scheduled in the system with status Confirmed. The hospital or clinic reception will call or SMS your registered mobile number prior to the visit.',
        },
        {
          q: 'Can I cancel or reschedule my appointment?',
          a: 'Yes. You can visit My Bookings from your Patient Portal or click your booking link to cancel with a single click. Simply choose a cancellation reason and the slot is immediately released.',
        },
        {
          q: 'Are the doctors and clinics verified?',
          a: 'Yes, every doctor, hospital, and clinic on MeetAdr undergoes verification against regional medical licensing standards.',
        },
        {
          q: 'What should I bring to my appointment?',
          a: 'Please bring your regional Emirates ID or national identification card, any existing medical records or lab test results, and your health insurance card if applicable.',
        },
      ];

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
            {isArabic ? 'المساعدة والإجابات' : 'Help & Answers'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
            {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h1>
        </div>

        <div className="space-y-4 pt-2">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] space-y-2 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm">{faq.q}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 6. HELP
export const HelpPage: React.FC = () => {
  const { isArabic } = useTranslation();

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-6">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
          {isArabic ? 'مركز الدعم والمساعدة' : 'Support Center'}
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isArabic ? 'هل تحتاج إلى مساعدة؟' : 'Need Assistance?'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {isArabic
            ? 'فريق خدمة المرضى متاح طوال أيام الأسبوع لمساعدتك في العثور على الأطباء المناسبين، أو إدارة مواعيدك القادمة، أو تنسيق الاستشارات المستعجلة.'
            : 'Our customer care specialists are available 7 days a week to help you locate specialists, manage upcoming visits, or coordinate urgent appointments.'}
        </p>
        <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs text-slate-700 space-y-2 shadow-2xs">
          <strong className="block text-sm font-bold text-slate-900">
            {isArabic ? 'خط مساعدة المرضى المباشر' : '24/7 Patient Helpline'}
          </strong>
          <p className="flex items-center gap-2">
            <span>{isArabic ? 'الهاتف المباشر:' : 'Direct Phone:'}</span>
            <strong dir="ltr" className="font-mono text-sm text-[#2DA7B5]">+971 52 412 2794</strong>
          </p>
          <p className="flex items-center gap-2">
            <span>{isArabic ? 'البريد الإلكتروني:' : 'Email:'}</span>
            <strong dir="ltr" className="font-mono text-slate-900">info@meetadr.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

// 7. PRIVACY POLICY
export const PrivacyPage: React.FC = () => {
  const { isArabic } = useTranslation();

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-6 text-slate-600 text-sm leading-relaxed">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
            {isArabic ? 'الامتثال والخصوصية' : 'Legal Compliance'}
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            {isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isArabic ? 'آخر تحديث: يناير 2025' : 'Last Updated: January 2025'}
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-slate-900">
            {isArabic ? '1. البيانات التي نجمعها' : '1. Information We Collect'}
          </h2>
          <p>
            {isArabic
              ? 'تجمع meetAdr بيانات اتصال المريض (كالاسم الكامل، ورقم الهاتف المتحرك، والبريد الإلكتروني) حصراً لتسهيل جدولة المواعيد وتنسيقها بين المرضى ومقدمي الرعاية الصحية المعتمدين.'
              : 'MeetAdr collects patient contact information (such as full name, contact mobile number, and email address) exclusively to facilitate scheduling between patients and authorized healthcare providers.'}
          </p>

          <h2 className="text-base font-bold text-slate-900">
            {isArabic ? '2. سرية البيانات الطبية' : '2. Medical Data Privacy'}
          </h2>
          <p>
            {isArabic
              ? 'نحن لا نخزن السجلات الطبية الكاملة أو التشخيصات التفصيلية. يتم تشفير أي تفاصيل يتم إدخالها أثناء الحجز ونقلها بأمان إلى العيادة أو المستشفى المحددة.'
              : 'We do not store complete electronic medical health records or sensitive diagnosis history. Consultation details entered during appointment booking are transmitted securely to the designated clinic.'}
          </p>

          <h2 className="text-base font-bold text-slate-900">
            {isArabic ? '3. عدم مشاركة البيانات مع أطراف خارجية' : '3. Third-Party Sharing'}
          </h2>
          <p>
            {isArabic
              ? 'نحن لا نبيع أو نؤجر أو نتاجر ببيانات المرضى لأي شركات إعلانية. تتم مشاركة البيانات فقط مع المستشفى أو الطبيب الذي حجزت لديه الموعد لتأكيد حضورك.'
              : 'We do not sell, rent, or trade patient personal information to third-party advertisers. Information is only shared with the specific hospital, clinic, or doctor with whom you request an appointment.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 8. TERMS & CONDITIONS
export const TermsPage: React.FC = () => {
  const { isArabic } = useTranslation();

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-6 text-slate-600 text-sm leading-relaxed">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
            {isArabic ? 'شروط الاستخدام' : 'Terms of Use'}
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            {isArabic ? 'الشروط والأحكام' : 'Terms and Conditions'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isArabic ? 'سارية المفعول من: يناير 2025' : 'Effective Date: January 2025'}
          </p>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className="text-base font-bold text-slate-900">
            {isArabic ? '1. الموافقة على الشروط' : '1. Acceptance of Terms'}
          </h2>
          <p>
            {isArabic
              ? 'بحجزك موعداً عبر meetAdr، فإنك توافق على الالتزام الكامل بهذه الشروط والأحكام والسياسات المنظمة للخدمة.'
              : 'By booking an appointment or using MeetAdr, you agree to comply with and be legally bound by these Terms and Conditions. If you do not agree, please do not use our services.'}
          </p>

          <h2 className="text-base font-bold text-slate-900">
            {isArabic ? '2. إخلاء المسؤولية الطبية' : '2. No Medical Advice'}
          </h2>
          <p>
            {isArabic
              ? 'منصة meetAdr هي منصة تكنولوجية لحجز المواعيد وتنظيم الجداول الطبية. meetAdr لا تقدم أي استشارات طبية أو تشخيصات علاجية مباشرة. استشر دائماً طبيبك المؤهل بشأن أي حالة صحية.'
              : 'MeetAdr is a technology scheduling and marketplace platform. MeetAdr does NOT provide medical advice, diagnosis, or clinical treatment. Always seek the advice of your qualified physician with any questions regarding a medical condition.'}
          </p>

          <h2 className="text-base font-bold text-slate-900">
            {isArabic ? '3. المواعيد والإلغاء' : '3. Appointments and Cancellations'}
          </h2>
          <p>
            {isArabic
              ? 'تخضع المواعيد لجدول توافر الأطباء وتأكيد العيادة المعنية. في حالات الطوارئ السريرية غير المتوقعة، يحق للمنشأة الطبية تعديل الموعد بالتنسيق معك.'
              : 'Appointments booked on MeetAdr are subject to doctor availability and hospital verification. While we make every effort to ensure prompt scheduling, clinics may adjust appointments in unforeseen clinical emergencies.'}
          </p>

          <h2 className="text-base font-bold text-slate-900">
            {isArabic ? '4. حالات الطوارئ الطبية' : '4. Emergency Situations'}
          </h2>
          <p className="text-rose-600 font-bold">
            {isArabic
              ? 'لا تستخدم meetAdr لحالات الطوارئ الطبية الحرجة. في حالات الطوارئ العاجلة، اتصل فوراً بالإسعاف على 998 / 999 أو توجه إلى أقرب قسم طوارئ بمستشفى.'
              : 'Do not use MeetAdr for medical emergencies. In the event of an urgent medical emergency, call 998 / 999 or proceed immediately to the nearest hospital emergency department.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 9. ACCESSIBILITY
export const AccessibilityPage: React.FC = () => {
  const { isArabic } = useTranslation();

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-6 text-slate-600 text-sm leading-relaxed">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
          {isArabic ? 'إمكانية الوصول الشاملة' : 'Universal Access'}
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isArabic ? 'بيان إمكانية الوصول' : 'Accessibility Statement'}
        </h1>
        <p>
          {isArabic
            ? 'تلتزم meetAdr بضمان إمكانية الوصول الرقمي لجميع المستخدمين، بما في ذلك أصحاب الهمم وذوي التحديات البصرية أو السمعية أو الحركية. نحن نتبع معايير WCAG 2.1 AA لضمان تباين ألوان واضح، وقراءة الشاشة السلسة، والتنقل السهل عبر لوحة المفاتيح واللغتين العربية والإنجليزية.'
            : 'MeetAdr is dedicated to ensuring digital accessibility for all users, including those with visual, auditory, cognitive, or motor impairments. We conform to WCAG 2.1 AA guidelines with accessible color contrasts, screen-reader semantics, and responsive keyboard navigation.'}
        </p>
      </div>
    </div>
  );
};

// 10. CAREERS
export const CareersPage: React.FC = () => {
  const { isArabic } = useTranslation();

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-6">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
          {isArabic ? 'انضم إلى فريقنا' : 'Join Our Mission'}
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isArabic ? 'الوظائف والفرص في meetAdr' : 'Careers at MeetAdr'}
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          {isArabic
            ? 'ساعدنا في بناء مستقبل الرعاية الصحية الرقمية المترابطة. نحن نبحث دائماً عن مهندسين مبدعين، ومديري شبكات طبية، ومختصي تجربة عملاء شغوفين.'
            : 'Help us build the future of connected digital healthcare. We are always seeking passionate engineers, clinical network managers, and customer experience specialists.'}
        </p>
        <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs text-slate-700 space-y-2 shadow-2xs">
          <strong className="block text-sm font-bold text-slate-900">
            {isArabic ? 'الفرص الوظيفية المتاحة' : 'Open Opportunities'}
          </strong>
          <p>
            {isArabic
              ? 'أرسل سيرتك الذاتية ونبذة عنك إلى: '
              : 'Send your resume and portfolio to '}
            <strong dir="ltr" className="font-mono text-[#2DA7B5] font-bold">careers@meetadr.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

// 11. REFER A FRIEND
export const ReferPage: React.FC = () => {
  const { isArabic } = useTranslation();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    showToast(
      isArabic ? 'تم نسخ رابط المشاركة إلى الحافظة!' : 'Referral link copied to clipboard!',
      'success'
    );
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-[#F4F7F9] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E2EBF0] shadow-sm p-8 sm:p-12 space-y-6 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2DA7B5]">
          {isArabic ? 'شارك المنصة' : 'Spread the Word'}
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {isArabic ? 'رشّح meetAdr لصديق أو فرد من العائلة' : 'Refer a Friend or Family Member'}
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          {isArabic
            ? 'ساعد أحباءك وعائلتك على العثور على أفضل الأطباء وحجز مواعيد مؤكدة بكل سهولة وبدون أي انتظار.'
            : 'Help your friends and loved ones discover top-rated doctors and book verified appointments with zero hassle.'}
        </p>
        <div className="max-w-md mx-auto flex items-center gap-2 p-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-2xl shadow-2xs">
          <input
            type="text"
            readOnly
            value={window.location.origin}
            className="flex-1 bg-transparent px-3 text-xs text-slate-700 font-mono focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : isArabic ? 'نسخ الرابط' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
