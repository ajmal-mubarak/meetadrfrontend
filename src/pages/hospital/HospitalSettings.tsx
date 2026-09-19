import React, { useState } from 'react';
import { Building2, MapPin, Phone, Clock, Save, ShieldCheck, Edit3, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

export const HospitalSettings: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isArabic } = useTranslation();

  // Edit Mode state (default: non-editable / locked)
  const [isEditing, setIsEditing] = useState(false);

  const initialHospitalName = user?.name || 'City Care Specialty Hospital';
  const initialAddress = 'Building 42, Dubai Healthcare City, Dubai, UAE';
  const initialPhone = '+971 4 362 4700';
  const initialHours = 'Mon - Sat: 08:00 - 21:00';
  const initialEmergency = true;

  const [name, setName] = useState(initialHospitalName);
  const [address, setAddress] = useState(initialAddress);
  const [phone, setPhone] = useState(initialPhone);
  const [operatingHours, setOperatingHours] = useState(initialHours);
  const [emergency, setEmergency] = useState(initialEmergency);

  // Saved snapshot for Cancel restoration
  const [savedData, setSavedData] = useState({
    name: initialHospitalName,
    address: initialAddress,
    phone: initialPhone,
    operatingHours: initialHours,
    emergency: initialEmergency,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedData({
      name,
      address,
      phone,
      operatingHours,
      emergency,
    });
    setIsEditing(false);
    showToast(
      isArabic ? 'تم حفظ إعدادات المنشأة بنجاح.' : 'Facility settings saved successfully.',
      'success'
    );
  };

  const handleCancel = () => {
    setName(savedData.name);
    setAddress(savedData.address);
    setPhone(savedData.phone);
    setOperatingHours(savedData.operatingHours);
    setEmergency(savedData.emergency);
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
