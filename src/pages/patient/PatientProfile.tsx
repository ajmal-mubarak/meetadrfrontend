import React, { useState } from 'react';
import { User, Mail, Phone, Heart, Save, Plus, Trash2, Users, AlertCircle, Edit3, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

interface Dependent {
  id: string;
  name: string;
  relation: string;
  dob: string;
  bloodGroup: string;
}

export const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, isRTL, isArabic } = useTranslation();

  // Edit Mode state (Default: locked / non-editable)
  const [isEditing, setIsEditing] = useState(false);

  // Personal info
  const [name, setName] = useState(user?.name || 'Sarah Jenkins');
  const [email, setEmail] = useState(user?.email || 'patient@meetadr.demo');
  const [phone, setPhone] = useState(user?.phone || '+971 52 412 2794');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('+971 55 987 6543 (Spouse)');
  const [allergies, setAllergies] = useState('Penicillin (Mild)');
  const [insuranceProvider, setInsuranceProvider] = useState('Daman — National Health Insurance Company');
  const [insuranceNumber, setInsuranceNumber] = useState('DAM-9482-UAE-2024');

  // Saved snapshot for Cancel button
  const [savedData, setSavedData] = useState({
    name: user?.name || 'Sarah Jenkins',
    email: user?.email || 'patient@meetadr.demo',
    phone: user?.phone || '+971 52 412 2794',
    bloodGroup: 'O+',
    emergencyContact: '+971 55 987 6543 (Spouse)',
    allergies: 'Penicillin (Mild)',
    insuranceProvider: 'Daman — National Health Insurance Company',
    insuranceNumber: 'DAM-9482-UAE-2024',
  });

  // Dependents (PDF: "Profile & Dependents")
  const [dependents, setDependents] = useState<Dependent[]>([
    { id: 'd1', name: 'James Jenkins', relation: 'Spouse', dob: '1985-06-12', bloodGroup: 'A+' },
    { id: 'd2', name: 'Lily Jenkins', relation: 'Child', dob: '2015-03-20', bloodGroup: 'O+' },
  ]);
  const [showAddDependent, setShowAddDependent] = useState(false);
  const [newDep, setNewDep] = useState<Omit<Dependent, 'id'>>({ name: '', relation: 'Spouse', dob: '', bloodGroup: 'O+' });

  const relationLabels: Record<string, string> = {
    Spouse: isArabic ? 'الزوج / الزوجة' : 'Spouse',
    Child: isArabic ? 'الابن / الابنة' : 'Child',
    Parent: isArabic ? 'الأب / الأم' : 'Parent',
    Sibling: isArabic ? 'الأخ / الأخت' : 'Sibling',
    Other: isArabic ? 'آخر' : 'Other',
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedData({
      name,
      email,
      phone,
      bloodGroup,
      emergencyContact,
      allergies,
      insuranceProvider,
      insuranceNumber,
    });
    setIsEditing(false);
    showToast(isArabic ? 'تم تحديث الملف الصحي بنجاح.' : 'Patient health profile updated successfully.', 'success');
  };

  const handleCancel = () => {
    setName(savedData.name);
    setEmail(savedData.email);
    setPhone(savedData.phone);
    setBloodGroup(savedData.bloodGroup);
    setEmergencyContact(savedData.emergencyContact);
    setAllergies(savedData.allergies);
    setInsuranceProvider(savedData.insuranceProvider);
    setInsuranceNumber(savedData.insuranceNumber);
    setIsEditing(false);
  };

  const handleAddDependent = () => {
    if (!newDep.name.trim() || !newDep.dob) {
      showToast(isArabic ? 'يرجى إدخال اسم التابع وتاريخ الميلاد.' : 'Please enter dependent name and date of birth.', 'error');
      return;
    }
    setDependents((prev) => [...prev, { ...newDep, id: `d${Date.now()}` }]);
    setNewDep({ name: '', relation: 'Spouse', dob: '', bloodGroup: 'O+' });
    setShowAddDependent(false);
    showToast(isArabic ? `تمت إضافة ${newDep.name} بنجاح.` : `${newDep.name} added as a dependent.`, 'success');
  };

  const handleRemoveDependent = (id: string) => {
    const dep = dependents.find((d) => d.id === id);
    setDependents((prev) => prev.filter((d) => d.id !== id));
    showToast(isArabic ? `تم حذف ${dep?.name} من التابعين.` : `${dep?.name} removed from dependents.`, 'info');
  };

  // Common styling for inputs depending on edit mode
  const inputClass = (extra: string = '') =>
    `w-full py-2.5 px-3 border rounded-xl text-sm transition-all ${
      isEditing
        ? 'bg-white text-slate-900 border-[#2DA7B5] focus:ring-2 focus:ring-[#2DA7B5]/20 focus:outline-none shadow-xs'
        : 'bg-[#F8FAFC] text-slate-700 border-[#E2EBF0] cursor-not-allowed select-none'
    } ${extra}`;

  const iconInputClass = `w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2.5 border rounded-xl text-sm transition-all ${
    isEditing
      ? 'bg-white text-slate-900 border-[#2DA7B5] focus:ring-2 focus:ring-[#2DA7B5]/20 focus:outline-none shadow-xs'
      : 'bg-[#F8FAFC] text-slate-700 border-[#E2EBF0] cursor-not-allowed select-none'
  }`;

  return (
    <div className="max-w-3xl space-y-6">

      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">{t('patientProfile.title')}</h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('patientProfile.subtitle')}
        </p>
      </div>

      {/* ── PERSONAL & CONTACT ── */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#0E7490] uppercase tracking-wider">{t('patientProfile.personalSection')}</h3>
            {!isEditing && (
              <span className="text-[11px] font-semibold text-slate-500 bg-[#F8FAFC] border border-[#E2EBF0] px-2.5 py-0.5 rounded-full">
                {isArabic ? 'للقراءة فقط' : 'View Only'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('patientProfile.fullName')}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-3" />
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={iconInputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('patientProfile.email')}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-3" />
                <input
                  type="email"
                  required
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={iconInputClass}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t('patientProfile.phone')} <span className="text-slate-400 font-normal">{t('patientProfile.phoneHint')}</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-3" />
                <input
                  type="tel"
                  required
                  disabled={!isEditing}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={iconInputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── INSURANCE ── */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-[#0E7490] uppercase tracking-wider mb-4">{t('patientProfile.insuranceSection')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('patientProfile.insuranceProvider')}</label>
              <input
                type="text"
                disabled={!isEditing}
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('patientProfile.insuranceNumber')}</label>
              <input
                type="text"
                disabled={!isEditing}
                value={insuranceNumber}
                onChange={(e) => setInsuranceNumber(e.target.value)}
                className={inputClass('font-mono')}
              />
            </div>
          </div>
        </div>

        {/* ── EMERGENCY HEALTH SUMMARY ── */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-[#0E7490] uppercase tracking-wider mb-4">{t('patientProfile.emergencySection')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('patientProfile.bloodGroup')}</label>
              <select
                disabled={!isEditing}
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className={inputClass(isEditing ? 'cursor-pointer' : '')}
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('patientProfile.emergencyContact')}</label>
              <input
                type="text"
                disabled={!isEditing}
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className={inputClass()}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('patientProfile.allergies')}</label>
              <input
                type="text"
                disabled={!isEditing}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{t('patientProfile.editProfile')}</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 border border-[#E2EBF0] text-slate-700 hover:bg-[#F8FAFC] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('patientProfile.cancelEdit')}</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{t('patientProfile.saveProfile')}</span>
              </button>
            </>
          )}
        </div>
      </form>

      {/* ── DEPENDENTS / FAMILY (PDF: "Profile & Dependents") ── */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Users className="w-4 h-4 text-[#2DA7B5]" />
              <h3 className="text-sm font-bold text-slate-900">{t('patientProfile.dependentsSection')}</h3>
            </div>
            <p className="text-[11px] text-slate-500">
              {t('patientProfile.dependentsDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddDependent((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('patientProfile.addDependent')}
          </button>
        </div>

        {/* Add Dependent Form */}
        {showAddDependent && (
          <div className="bg-[#E8F6F8]/40 border border-[#CDEBF0] rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-[#0E7490]">{t('patientProfile.newDependentTitle')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('patientProfile.fullName')} *</label>
                <input
                  type="text"
                  value={newDep.name}
                  onChange={(e) => setNewDep((p) => ({ ...p, name: e.target.value }))}
                  placeholder={isArabic ? 'مثال: أحمد المنصور' : 'e.g. Ahmed Al-Mansoor'}
                  className="w-full py-2 px-3 border border-[#E2EBF0] rounded-xl text-xs focus:border-[#2DA7B5] focus:outline-none transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('patientProfile.relation')}</label>
                <select
                  value={newDep.relation}
                  onChange={(e) => setNewDep((p) => ({ ...p, relation: e.target.value }))}
                  className="w-full py-2 px-3 border border-[#E2EBF0] rounded-xl text-xs focus:border-[#2DA7B5] focus:outline-none transition-all bg-white"
                >
                  {['Spouse', 'Child', 'Parent', 'Sibling', 'Other'].map((r) => (
                    <option key={r} value={r}>{relationLabels[r] || r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('patientProfile.dob')} *</label>
                <input
                  type="date"
                  value={newDep.dob}
                  onChange={(e) => setNewDep((p) => ({ ...p, dob: e.target.value }))}
                  className="w-full py-2 px-3 border border-[#E2EBF0] rounded-xl text-xs focus:border-[#2DA7B5] focus:outline-none transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('patientProfile.bloodGroup')}</label>
                <select
                  value={newDep.bloodGroup}
                  onChange={(e) => setNewDep((p) => ({ ...p, bloodGroup: e.target.value }))}
                  className="w-full py-2 px-3 border border-[#E2EBF0] rounded-xl text-xs focus:border-[#2DA7B5] focus:outline-none transition-all bg-white"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddDependent(false)}
                className="flex-1 py-2 rounded-xl border border-[#E2EBF0] text-xs font-bold text-slate-600 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              >
                {t('patientProfile.cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddDependent}
                className="flex-1 py-2 rounded-xl bg-[#2DA7B5] hover:bg-[#23929F] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {t('patientProfile.addMember')}
              </button>
            </div>
          </div>
        )}

        {/* Dependents List */}
        {dependents.length === 0 ? (
          <div className="text-center py-8 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E2EBF0]">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">{t('patientProfile.noDependents')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dependents.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2EBF0] bg-[#F8FAFC] hover:bg-white hover:border-[#2DA7B5] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] flex items-center justify-center font-bold text-sm">
                    {dep.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{dep.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {relationLabels[dep.relation] || dep.relation} · {t('patientProfile.dob')}: {dep.dob} · {t('patientProfile.bloodGroup')}: {dep.bloodGroup}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showToast(isArabic ? 'اختر طبيباً ثم حدد هذا التابع أثناء الحجز.' : 'Select a doctor and choose this dependent at booking.', 'info')}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] hover:bg-[#2DA7B5] hover:text-white transition-colors cursor-pointer"
                  >
                    {t('patientProfile.bookForThem')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveDependent(dep.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>{t('patientProfile.demoNotice')}</span>
        </div>
      </div>
    </div>
  );
};
