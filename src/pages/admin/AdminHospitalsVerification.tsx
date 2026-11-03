import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Calendar,
  Clock,
  X,
  MapPin,
  Phone,
  Mail,
  Users,
  CheckSquare,
  Square,
  Filter,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';

export const AdminHospitalsVerification: React.FC = () => {
  const { showToast } = useToast();
  const { isArabic } = useTranslation();

  const [facilities, setFacilities] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verification filter tab: 'pending' | 'verified' | 'all'
  const [verificationTab, setVerificationTab] = useState<'pending' | 'verified' | 'all'>('pending');

  // Search & Type Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'hospital' | 'clinic'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Multi-select for bulk verification
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // View Facility Details Modal
  const [viewFacility, setViewFacility] = useState<ProviderItem | null>(null);
  const [isProcessingSingle, setIsProcessingSingle] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await realAdminService.getProviders();
      setFacilities(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load healthcare facilities for verification', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      const isVerified = (fac as any).status?.toLowerCase() === 'active';

      // Tab filter
      if (verificationTab === 'pending' && isVerified) return false;
      if (verificationTab === 'verified' && !isVerified) return false;

      // Type filter
      const facType = (fac.providerCategory || (fac as any).type || '').toLowerCase();
      if (typeFilter !== 'all' && !facType.includes(typeFilter.toLowerCase())) return false;

      // Location filter
      if (locationFilter !== 'all' && (fac.location || '').toLowerCase() !== locationFilter.toLowerCase()) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (fac.name || '').toLowerCase().includes(q) || (fac.nameAr || '').toLowerCase().includes(q);
        const matchesLocation = (fac.location || '').toLowerCase().includes(q) || (fac.address || '').toLowerCase().includes(q);
        const matchesPhone = (fac.phone || '').includes(q);
        if (!matchesName && !matchesLocation && !matchesPhone) return false;
      }

      return true;
    });
  }, [facilities, verificationTab, typeFilter, locationFilter, searchQuery]);

  // Counts
  const pendingCount = useMemo(
    () => facilities.filter((f) => (f as any).status?.toLowerCase() !== 'active').length,
    [facilities]
  );
  const verifiedCount = useMemo(
    () => facilities.filter((f) => (f as any).status?.toLowerCase() === 'active').length,
    [facilities]
  );

  // Bulk Selection
  const handleToggleSelectAll = () => {
    if (selectedFacilityIds.length === filteredFacilities.length) {
      setSelectedFacilityIds([]);
    } else {
      setSelectedFacilityIds(filteredFacilities.map((f) => f.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedFacilityIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await realAdminService.bulkProviderAction(action, selectedFacilityIds);
      const newStatus = action === 'activate' ? 'Active' : 'Deactivated';
      setFacilities((prev) =>
        prev.map((f) => (selectedFacilityIds.includes(f.id) ? { ...f, status: newStatus as any } : f))
      );
      showToast(
        action === 'activate'
          ? `Successfully verified and activated ${selectedFacilityIds.length} facilities.`
          : `Deactivated ${selectedFacilityIds.length} facilities.`,
        'success'
      );
      setSelectedFacilityIds([]);
    } catch (err: any) {
      showToast(err.message || 'Failed to process bulk facility update', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleSingleAction = async (facilityId: string, action: 'activate' | 'deactivate') => {
    setIsProcessingSingle(true);
    try {
      const newStatus = action === 'activate' ? 'Active' : 'Deactivated';
      await realAdminService.updateProviderStatus(facilityId, newStatus);
      setFacilities((prev) =>
        prev.map((f) => (f.id === facilityId ? { ...f, status: newStatus as any } : f))
      );
      if (viewFacility && viewFacility.id === facilityId) {
        setViewFacility({ ...viewFacility, status: newStatus as any });
      }
      showToast(
        action === 'activate'
          ? (isArabic ? 'تم التحقق من المنشأة الطبية وتفعيلها بنجاح.' : 'Facility verified and activated successfully.')
          : (isArabic ? 'تم تعطيل المنشأة الطبية.' : 'Facility suspended/deactivated.'),
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update facility status', 'error');
    } finally {
      setIsProcessingSingle(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-[#0E7490] flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6 text-[#2DA7B5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isArabic ? 'تحقق المستشفيات والعيادات' : 'Hospitals & Clinics Verification'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isArabic
                ? 'مخصص للتحقق من التراخيص والاعتمادات الصحية وتفعيل المستشفيات والعيادات على منصة MeetAdr'
                : 'Strictly for verifying healthcare licensing, accreditations, and activating hospital & clinic profiles'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingCount} {isArabic ? 'بانتظار التحقق' : 'Pending Verification'}</span>
          </span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setVerificationTab('pending');
              setSelectedFacilityIds([]);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              verificationTab === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{isArabic ? 'قيد الانتظار' : 'Pending Verification'} ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVerificationTab('verified');
              setSelectedFacilityIds([]);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              verificationTab === 'verified'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{isArabic ? 'المعتمدة والنشطة' : 'Verified Facilities'} ({verifiedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setVerificationTab('all');
              setSelectedFacilityIds([]);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              verificationTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isArabic ? 'جميع المنشآت' : 'All Facilities'} ({facilities.length})
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={isArabic ? 'بحث بالاسم، الموقع، الهاتف...' : 'Search facility, emirate, phone...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#2DA7B5] focus:outline-hidden w-56 font-medium"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:bg-white focus:outline-hidden"
          >
            <option value="all">{isArabic ? 'النوع: الكل' : 'Type: All'}</option>
            <option value="hospital">{isArabic ? 'مستشفيات فقط' : 'Hospitals'}</option>
            <option value="clinic">{isArabic ? 'عيادات ومراكز' : 'Clinics'}</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedFacilityIds.length > 0 && (
        <div className="bg-[#E8F6F8] border border-[#CDEBF0] p-3 rounded-2xl flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-xs font-bold text-[#0E7490]">
            {selectedFacilityIds.length} {isArabic ? 'منشأة مختارة' : 'facility/facilities selected'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkProcessing}
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isArabic ? 'تأكيد وتفعيل المحدد' : 'Verify & Activate Selected'}</span>
            </button>
            <button
              type="button"
              disabled={isBulkProcessing}
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isArabic ? 'تعطيل المحدد' : 'Deactivate Selected'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    {filteredFacilities.length > 0 && selectedFacilityIds.length === filteredFacilities.length ? (
                      <CheckSquare className="w-4 h-4 text-[#2DA7B5]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-3 py-3 whitespace-nowrap">{isArabic ? 'المنشأة الطبية' : 'Healthcare Facility'}</th>
                <th className="px-3 py-3 whitespace-nowrap">{isArabic ? 'النوع والتصنيف' : 'Type & Scope'}</th>
                <th className="px-3 py-3 whitespace-nowrap">{isArabic ? 'الموقع والعنوان' : 'Location & Address'}</th>
                <th className="px-3 py-3 w-32 text-center whitespace-nowrap">{isArabic ? 'حالة التحقق' : 'Verification Status'}</th>
                <th className="px-3 py-3 text-right rtl:text-left min-w-[190px] whitespace-nowrap">{isArabic ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    <div className="w-7 h-7 border-3 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading healthcare facilities...</span>
                  </td>
                </tr>
              ) : filteredFacilities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    {isArabic
                      ? 'لا توجد منشآت مطابقة لمعايير البحث الحالية.'
                      : 'No healthcare facilities found matching current filters.'}
                  </td>
                </tr>
              ) : (
                filteredFacilities.map((fac) => {
                  const isVerified = (fac as any).status?.toLowerCase() === 'active';
                  const isSelected = selectedFacilityIds.includes(fac.id);
                  const isClinic = (fac.providerCategory || (fac as any).type || '').toLowerCase().includes('clinic');

                  return (
                    <tr
                      key={fac.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        isSelected ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(fac.id)}
                          className="cursor-pointer text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#2DA7B5]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Facility details */}
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={fac.photo || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=200'}
                            alt={fac.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate max-w-[200px]">
                              {fac.name}
                            </div>
                            {fac.nameAr && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[200px]" dir="rtl">
                                {fac.nameAr}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              #{fac.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & Scope */}
                      <td className="px-3 py-2.5 text-slate-700">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isClinic
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {isClinic ? (isArabic ? 'عيادة / مركز' : 'Clinic') : (isArabic ? 'مستشفى معتمد' : 'Hospital')}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{fac.doctorCount || 0} {isArabic ? 'أطباء' : 'Doctors'}</span>
                        </div>
                      </td>

                      {/* Location & Address */}
                      <td className="px-3 py-2.5 text-slate-700">
                        <div className="flex items-center gap-1 font-semibold text-xs text-slate-800">
                          <MapPin className="w-3 h-3 text-[#2DA7B5] shrink-0" />
                          <span className="truncate max-w-[170px]">{fac.location || 'UAE'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                          {fac.address || 'Medical District'}
                        </div>
                        {fac.phone && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">
                            {fac.phone}
                          </div>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{isArabic ? 'معتمد ونشط' : 'Verified & Active'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>{isArabic ? 'بانتظار التحقق' : 'Pending Verification'}</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2.5 text-right rtl:text-left whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => setViewFacility(fac)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#0E7490] hover:bg-[#E8F6F8] rounded-lg border border-[#CDEBF0] transition-colors cursor-pointer inline-flex items-center gap-1 shrink-0"
                            title="View Facility Details & Accreditation"
                          >
                            <Eye className="w-3 h-3 text-[#2DA7B5]" />
                            <span>{isArabic ? 'معاينة' : 'View'}</span>
                          </button>

                          {!isVerified ? (
                            <button
                              type="button"
                              onClick={() => handleSingleAction(fac.id, 'activate')}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 cursor-pointer shadow-2xs hover:scale-102 shrink-0"
                              title={isArabic ? 'تأكيد واعتماد المنشأة' : 'Verify & Activate Facility'}
                            >
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>{isArabic ? 'تفعيل واعتماد' : 'Verify & Activate'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSingleAction(fac.id, 'deactivate')}
                              className="px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors inline-flex items-center gap-1 text-slate-600 hover:bg-rose-50 hover:text-rose-600 border-slate-200 bg-white cursor-pointer shrink-0"
                              title={isArabic ? 'تعطيل المنشأة' : 'Suspend / Deactivate'}
                            >
                              <X className="w-3 h-3 text-slate-400" />
                              <span>{isArabic ? 'تعطيل' : 'Suspend'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Facility Inspection Modal */}
      {viewFacility && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewFacility(null);
          }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#2DA7B5]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{viewFacility.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">ID: {viewFacility.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewFacility(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Photo & Status Banner */}
              <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={viewFacility.photo || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=200'}
                  alt={viewFacility.name}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="space-y-1">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      ((viewFacility as any).status || '').toLowerCase() === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {((viewFacility as any).status || '').toLowerCase() === 'active'
                      ? '✓ Fully Verified & Active on MeetAdr'
                      : '⏳ Pending Accreditation Verification'}
                  </span>
                  <p className="font-bold text-slate-800 text-sm">{viewFacility.name}</p>
                  {viewFacility.nameAr && <p className="text-slate-500 font-arabic">{viewFacility.nameAr}</p>}
                </div>
              </div>

              {/* Location & Contact Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location & Address</span>
                  <div className="font-semibold text-slate-800">{viewFacility.location || 'UAE'}</div>
                  <div className="text-slate-500 text-[11px]">{viewFacility.address || 'Medical District'}</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telephone & Hotline</span>
                  <div className="font-semibold text-slate-800 font-mono" dir="ltr">{viewFacility.phone || '—'}</div>
                  <div className="text-slate-500 text-[11px]">Emergency: {(viewFacility as any).emergency_available ? '24/7 Available' : 'Standard'}</div>
                </div>
              </div>

              {/* Manager & Administration Information */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administrative Contact</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Manager Name:</span>
                    <span className="font-semibold text-slate-800">{(viewFacility as any).manager_name || 'Medical Director'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Manager Phone:</span>
                    <span className="font-semibold text-slate-800 font-mono" dir="ltr">{(viewFacility as any).manager_phone || viewFacility.phone || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Manager Email:</span>
                    <span className="font-semibold text-slate-800">{(viewFacility as any).manager_email || 'administration@facility.ae'}</span>
                  </div>
                </div>
              </div>

              {/* Doctors & Overview */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctors Network</span>
                <p className="text-slate-700">
                  Currently affiliated with <strong className="text-[#0E7490]">{viewFacility.doctorCount || 0} licensed medical specialists</strong> on MeetAdr.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-[#F8FAFC] border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setViewFacility(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>

              {((viewFacility as any).status || '').toLowerCase() !== 'active' ? (
                <button
                  type="button"
                  disabled={isProcessingSingle}
                  onClick={() => handleSingleAction(viewFacility.id, 'activate')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Verify & Activate Facility</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessingSingle}
                  onClick={() => handleSingleAction(viewFacility.id, 'deactivate')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Suspend Facility</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
