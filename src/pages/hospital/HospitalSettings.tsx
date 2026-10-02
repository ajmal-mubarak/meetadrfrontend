import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Clock, Save, ShieldCheck, Edit3, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import { realFacilityAdminService, FacilitySettingsData } from '../../services/realFacilityAdminService';

export const HospitalSettings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isArabic } = useTranslation();

  // Edit Mode state (default: non-editable / locked)
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const initialHospitalName = (user as any)?.facilityName || user?.name || '';
  const initialAddress = '';
  const initialPhone = '';
  const initialHours = '';
  const initialEmergency = false;

  const [name, setName] = useState(initialHospitalName);
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [operatingHours, setOperatingHours] = useState(initialHours);
  const [emergency, setEmergency] = useState(initialEmergency);
  const [insurancePlans, setInsurancePlans] = useState('');

  // Saved snapshot for Cancel restoration
  const [savedData, setSavedData] = useState({
    name: initialHospitalName,
    address: initialAddress,
    phone: initialPhone,
    operatingHours: initialHours,
    emergency: initialEmergency,
    insurancePlans: '',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const settings = await realFacilityAdminService.getSettings();
        if (isMounted && settings) {
          const loadedName = settings.name || initialHospitalName;
          const loadedAddress = settings.address || initialAddress;
          const loadedPhone = settings.phone || initialPhone;
          const loadedHours = settings.operating_hours || initialHours;
          const loadedEmergency = settings.emergency_available ?? initialEmergency;

          setName(loadedName);
          setAddress(loadedAddress);
          setPhone(loadedPhone);
          setOperatingHours(loadedHours);
          setEmergency(loadedEmergency);
          setInsurancePlans(settings.insurance_plans || '');

          setSavedData({
            name: loadedName,
            address: loadedAddress,
            phone: loadedPhone,
            operatingHours: loadedHours,
            emergency: loadedEmergency,
            insurancePlans: settings.insurance_plans || '',
          });
        }
      } catch (err: unknown) {
        // Fall back gracefully to user profile info
        console.warn('Facility settings load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSettings();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await realFacilityAdminService.updateSettings({
        name,
        address,
        phone,
        operating_hours: operatingHours,
        emergency_available: emergency,
        insurance_plans: insurancePlans,
      });

      setSavedData({
        name,
        address,
        phone,
        operatingHours,
        emergency,
        insurancePlans,
      });
      setIsEditing(false);
      showToast(
        isArabic ? 'تم حفظ إعدادات المنشأة بنجاح.' : 'Facility settings saved successfully.',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update settings';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(savedData.name);
    setAddress(savedData.address);
    setPhone(savedData.phone);
    setOperatingHours(savedData.operatingHours);
    setEmergency(savedData.emergency);
    setInsurancePlans(savedData.insurancePlans);
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#2DA7B5]" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isArabic ? 'إعدادات المنشأة والمستشفى' : 'Hospital Facility Configuration'}
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {isArabic
            ? 'الملف العام، حالة الطوارئ، وبيانات الاتصال التشغيلية للمستشفى.'
            : 'Public profile, emergency status, and facility operational contacts.'}
        </p>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{isArabic ? 'اسم المنشأة' : 'Facility Name'}</span>
          </label>
          <input
            type="text"
            required
            disabled={!isEditing}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full p-3 rounded-xl text-sm transition-all border ${
              isEditing
                ? 'bg-white text-slate-900 border-[#2DA7B5] ring-2 ring-[#2DA7B5]/20 focus:outline-none'
                : 'bg-[#F8FAFC] text-slate-700 border-[#E2EBF0] cursor-not-allowed'
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{isArabic ? 'العنوان الجغرافي' : 'Physical Address'}</span>
          </label>
          <input
            type="text"
            required
            disabled={!isEditing}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`w-full p-3 rounded-xl text-sm transition-all border ${
              isEditing
                ? 'bg-white text-slate-900 border-[#2DA7B5] ring-2 ring-[#2DA7B5]/20 focus:outline-none'
                : 'bg-[#F8FAFC] text-slate-700 border-[#E2EBF0] cursor-not-allowed'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{isArabic ? 'هاتف الاستقبال المباشر' : 'Direct Phone'}</span>
            </label>
            <input
              type="text"
              required
              disabled={!isEditing}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full p-3 rounded-xl text-sm font-mono transition-all border ${
                isEditing
                  ? 'bg-white text-slate-900 border-[#2DA7B5] ring-2 ring-[#2DA7B5]/20 focus:outline-none'
                  : 'bg-[#F8FAFC] text-slate-700 border-[#E2EBF0] cursor-not-allowed'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{isArabic ? 'ساعات العمل الرسمية' : 'Operating Hours'}</span>
            </label>
            <input
              type="text"
              required
              disabled={!isEditing}
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              className={`w-full p-3 rounded-xl text-sm transition-all border ${
                isEditing
                  ? 'bg-white text-slate-900 border-[#2DA7B5] ring-2 ring-[#2DA7B5]/20 focus:outline-none'
                  : 'bg-[#F8FAFC] text-slate-700 border-[#E2EBF0] cursor-not-allowed'
              }`}
            />
          </div>
        </div>

        {/* Insurance Plans Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>{isArabic ? 'خطط التأمين المقبولة' : 'Accepted Insurance Plans'}</span>
          </label>
          <textarea
            rows={3}
            disabled={!isEditing}
            value={insurancePlans}
            onChange={(e) => setInsurancePlans(e.target.value)}
            placeholder={isArabic ? 'NextCare, AXA, Daman ...' : 'e.g. NextCare, AXA / GIG, Daman National, Thiqa'}
            className={`w-full p-3 rounded-xl text-sm transition-all border resize-none ${
              isEditing
                ? 'bg-white text-slate-900 border-[#2DA7B5] ring-2 ring-[#2DA7B5]/20 focus:outline-none'
                : 'bg-[#F8FAFC] text-slate-700 border-[#E2EBF0] cursor-not-allowed'
            }`}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {isArabic ? 'أدخل الأسماء مفصولة بفواصل' : 'Enter plan names separated by commas'}
          </p>
        </div>

        {/* 24/7 Emergency Toggle Box */}
        <div
          onClick={() => {
            if (isEditing) setEmergency(!emergency);
          }}
          className={`p-4.5 rounded-2xl border flex items-center justify-between transition-all ${
            isEditing ? 'cursor-pointer bg-[#F8FAFC] hover:bg-[#E8F6F8]/50 border-[#CBD5E1]' : 'bg-[#F8FAFC] border-[#E2EBF0] cursor-not-allowed'
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2DA7B5]" />
              <strong className="text-xs font-bold text-slate-900">
                {isArabic ? 'قسم طوارئ على مدار 24/7' : '24/7 Emergency Department'}
              </strong>
            </div>
            <p className="text-[11px] text-slate-500">
              {isArabic
                ? 'عرض شارة الطوارئ على القوائم العامة ونتائج البحث لمراكز الطوارئ.'
                : 'Display emergency badge on public listings and search results.'}
            </p>
          </div>
          <input
            type="checkbox"
            disabled={!isEditing}
            checked={emergency}
            onChange={(e) => setEmergency(e.target.checked)}
            className={`w-5 h-5 rounded-md text-[#2DA7B5] border-[#CBD5E1] focus:ring-[#2DA7B5] ${
              isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'
            }`}
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 bg-white hover:bg-[#F8FAFC] text-slate-700 text-xs font-semibold rounded-xl border border-[#E2EBF0] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isArabic ? 'إلغاء' : 'Cancel'}</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isArabic ? 'حفظ التعديلات' : 'Save Configuration'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isArabic ? 'تعديل الإعدادات' : 'Edit Configuration'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
