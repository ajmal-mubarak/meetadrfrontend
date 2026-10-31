import React, { useState, useEffect } from 'react';
import {
  Building2,
  Check,
  X,
  Eye,
  Plus,
  Clock,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ShieldAlert,
  User,
  Stethoscope,
  Calendar,
  Lock,
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { ProviderRequest } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n';
import {
  SUPPORTING_COUNTRIES,
  SUPPORTING_EMIRATES,
  SUPPORTING_DIAL_CODES,
  FACILITY_CATEGORIES,
  SUPPORTING_INSURANCES,
  SUPPORTING_DEPARTMENTS,
  SUPPORTING_SPECIALTIES,
  SUPPORTING_QUALIFICATIONS,
  SUPPORTING_SPECIAL_INTERESTS,
  SUPPORTING_LANGUAGES,
  GENDERS,
} from '../../data/supportingKeys';
import {
  sanitizePhoneNumber,
  validatePhoneNumber,
  getPhoneRule,
} from '../../utils/phoneValidation';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { SearchableMultiSelect } from '../../components/common/SearchableMultiSelect';
import { ImageUpload } from '../../components/common/ImageUpload';
import { WEEK_DAYS, DEFAULT_PRESET_SLOTS } from '../../constants/schedule';

export const AdminRequests: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [viewingRequest, setViewingRequest] = useState<ProviderRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<ProviderRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Add Facility / Doctor modal state
  const [activeRequestToAdd, setActiveRequestToAdd] = useState<ProviderRequest | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Hospital / Clinic Form State
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    name_ar: '',
    type: 'hospital' as 'hospital' | 'clinic',
    facility_category: 'Hospital' as 'Hospital' | 'Clinic' | 'Wellness',
    country: 'United Arab Emirates',
    emirate: 'Dubai',
    location: 'Dubai',
    area: '',
    address: '',
    latitude: '',
    longitude: '',
    phone_dial_code: '+971',
    phone: '',
    website: '',
    operating_hours: 'Open 24/7',
    about: '',
    photo: '',
    logo: '',
    insurance_plans: [] as string[],
    emergency_available: true,
    google_maps_url: '',
    manager_name: '',
    manager_phone: '',
    manager_email: '',
    username: '',
    password: '',
  });

  // Doctor Form State
  const [doctorForm, setDoctorForm] = useState({
    facilityId: '',
    first_name: '',
    last_name: '',
    name: '',
    name_ar: '',
    gender: 'Male',
    department: '',
    specialty: 'Cardiology',
    qualifications: [] as string[],
    special_interests: [] as string[],
    experience_years: '5' as string | number,
    country_of_origin: 'United Arab Emirates',
    languages: ['English', 'Arabic'] as string[],
    phone_dial_code: '+971',
    contact_number: '',
    email: '',
    location: 'Dubai',
    consultation_fee: '150' as string | number,
    education: '',
    about: '',
    photo: '',
    username: '',
    password: '',
    available_days: WEEK_DAYS.slice(0, 5) as string[],
    standard_slots: DEFAULT_PRESET_SLOTS as string[],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqData, provData] = await Promise.all([
        realAdminService.getRequests(),
        realAdminService.getProviders(),
      ]);
      setRequests(reqData);
      setProviders(provData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load requests';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format date helper with robust fallback
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to extract dial code from phone string
  const extractPhoneAndDialCode = (rawPhone: string) => {
    const trimmed = (rawPhone || '').trim();
    for (const d of SUPPORTING_DIAL_CODES) {
      if (trimmed.startsWith(d.code)) {
        return {
          dialCode: d.code,
          cleanNumber: trimmed.slice(d.code.length).trim(),
        };
      }
    }
    return {
      dialCode: '+971',
      cleanNumber: trimmed,
    };
  };

  // Open Add Modal and prefill from application
  const handleOpenAddModal = (request: ProviderRequest) => {
    setActiveRequestToAdd(request);

    const { dialCode, cleanNumber } = extractPhoneAndDialCode(request.contactNumber);
    const suggestedUsername = request.email || request.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (request.providerType === 'doctor') {
      const parts = (request.name || '').trim().split(' ');
      const fName = parts[0] || '';
      const lName = parts.slice(1).join(' ') || '';

      setDoctorForm({
        facilityId: '',
        first_name: fName,
        last_name: lName,
        name: request.name || '',
        name_ar: request.nameAr || '',
        gender: 'Male',
        department: request.specialty || 'General Medicine',
        specialty: request.specialty || 'General Physician',
        qualifications: [],
        special_interests: [],
        experience_years: '5',
        country_of_origin: request.country || 'United Arab Emirates',
        languages: ['English', 'Arabic'],
        phone_dial_code: dialCode,
        contact_number: cleanNumber,
        email: request.email || '',
        location: request.location || 'Dubai',
        consultation_fee: '150',
        education: 'MBBS, MD',
        about: `Dr. ${request.name} is an accredited medical practitioner affiliated with MeetADr.`,
        photo: '',
        username: suggestedUsername,
        password: '',
        available_days: WEEK_DAYS.slice(0, 5),
        standard_slots: DEFAULT_PRESET_SLOTS,
      });
    } else {
      const isClinic = request.providerType === 'clinic';
      setHospitalForm({
        name: request.name || '',
        name_ar: request.nameAr || '',
        type: isClinic ? 'clinic' : 'hospital',
        facility_category: isClinic ? 'Clinic' : 'Hospital',
        country: request.country || 'United Arab Emirates',
        emirate: request.location || 'Dubai',
        location: request.location || 'Dubai',
        area: '',
        address: request.address || request.location || 'Dubai, UAE',
        latitude: '',
        longitude: '',
        phone_dial_code: dialCode,
        phone: cleanNumber,
        website: '',
        operating_hours: isClinic ? 'Mon - Sat: 08:00 - 20:00' : 'Open 24/7',
        about: `${request.name} is an accredited healthcare facility providing exceptional patient care.`,
        photo: '',
        logo: '',
        insurance_plans: [],
        emergency_available: !isClinic,
        google_maps_url: request.googleMapsUrl || '',
        manager_name: request.contactPerson || request.name || '',
        manager_phone: cleanNumber,
        manager_email: request.email || '',
        username: suggestedUsername,
        password: '',
      });
    }
  };

  // Submit Hospital / Clinic Creation
  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestToAdd) return;

    if (!hospitalForm.name.trim()) {
      showToast('Facility Name is required.', 'error');
      return;
    }
    if (!hospitalForm.username.trim() || !hospitalForm.password.trim()) {
      showToast('Username and Password are required to set the facility Live.', 'error');
      return;
    }
    if (hospitalForm.phone.trim()) {
      const phoneErr = validatePhoneNumber(hospitalForm.phone, hospitalForm.phone_dial_code);
      if (phoneErr) {
        showToast(phoneErr, 'error');
        return;
      }
    }

    setIsSubmittingAdd(true);
    try {
      const facilityPayload = {
        name: hospitalForm.name.trim(),
        name_ar: hospitalForm.name_ar.trim() || undefined,
        type: hospitalForm.type,
        facility_category: hospitalForm.facility_category,
        country: hospitalForm.country.trim(),
        emirate: hospitalForm.emirate.trim(),
        location: hospitalForm.location.trim(),
        area: hospitalForm.area.trim() || undefined,
        address: hospitalForm.address.trim() || undefined,
        latitude: hospitalForm.latitude ? parseFloat(hospitalForm.latitude) : undefined,
        longitude: hospitalForm.longitude ? parseFloat(hospitalForm.longitude) : undefined,
        phone_dial_code: hospitalForm.phone_dial_code.trim(),
        phone: hospitalForm.phone.trim() || undefined,
        website: hospitalForm.website.trim() || undefined,
        operating_hours: hospitalForm.operating_hours.trim() || 'Open 24/7',
        about: hospitalForm.about.trim() || undefined,
        photo: hospitalForm.photo.trim() || undefined,
        logo: hospitalForm.logo.trim() || undefined,
        insurance_plans: hospitalForm.insurance_plans.join(', ') || undefined,
        emergency_available: hospitalForm.emergency_available,
        google_maps_url: hospitalForm.google_maps_url.trim() || undefined,
        manager_name: hospitalForm.manager_name.trim() || undefined,
        manager_phone: hospitalForm.manager_phone.trim() || undefined,
        manager_email: hospitalForm.manager_email.trim() || undefined,
        username: hospitalForm.username.trim(),
        password: hospitalForm.password.trim(),
      };

      await realAdminService.updateRequestStatus(
        activeRequestToAdd.id,
        'approved',
        'Directly provisioned and set Live with credentials by Platform Admin',
        facilityPayload
      );

      showToast(`${hospitalForm.name} added successfully and is now Live on MeetADr!`, 'success');
      setActiveRequestToAdd(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add hospital and approve request', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Submit Doctor Creation
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestToAdd) return;

    if (!doctorForm.name.trim()) {
      showToast('Doctor Name is required.', 'error');
      return;
    }
    if (!doctorForm.username.trim() || !doctorForm.password.trim()) {
      showToast('Username and Password are required to set doctor Live.', 'error');
      return;
    }
    if (doctorForm.contact_number.trim()) {
      const phoneErr = validatePhoneNumber(doctorForm.contact_number, doctorForm.phone_dial_code);
      if (phoneErr) {
        showToast(phoneErr, 'error');
        return;
      }
    }

    setIsSubmittingAdd(true);
    try {
      const selectedFacilityItem = providers.find((p) => p.id === doctorForm.facilityId);
      const isHospital = (selectedFacilityItem as any)?.type === 'hospital' || selectedFacilityItem?.providerCategory === 'Hospital';
      const isClinic = (selectedFacilityItem as any)?.type === 'clinic' || selectedFacilityItem?.providerCategory === 'Clinic';

      const doctorPayload = {
        name: doctorForm.name.trim(),
        name_ar: doctorForm.name_ar.trim() || undefined,
        first_name: doctorForm.first_name.trim() || undefined,
        last_name: doctorForm.last_name.trim() || undefined,
        facility_id: doctorForm.facilityId || undefined,
        hospital_id: isHospital ? doctorForm.facilityId : undefined,
        clinic_id: isClinic ? doctorForm.facilityId : undefined,
        gender: doctorForm.gender,
        department: doctorForm.department.trim() || undefined,
        specialty: doctorForm.specialty.trim(),
        qualifications: doctorForm.qualifications,
        special_interests: doctorForm.special_interests,
        experience_years: parseInt(String(doctorForm.experience_years) || '5', 10),
        country_of_origin: doctorForm.country_of_origin.trim(),
        languages: doctorForm.languages,
        phone_dial_code: doctorForm.phone_dial_code.trim(),
        contact_number: doctorForm.contact_number.trim() || undefined,
        email: doctorForm.email.trim() || undefined,
        location: doctorForm.location.trim(),
        consultation_fee: parseFloat(String(doctorForm.consultation_fee) || '150'),
        education: doctorForm.education.trim() || undefined,
        about: doctorForm.about.trim() || undefined,
        photo: doctorForm.photo.trim() || undefined,
        username: doctorForm.username.trim(),
        password: doctorForm.password.trim(),
        available_days: doctorForm.available_days,
        standard_slots: doctorForm.standard_slots,
      };

      await realAdminService.updateRequestStatus(
        activeRequestToAdd.id,
        'approved',
        'Directly provisioned and set Live with credentials by Platform Admin',
        undefined,
        doctorPayload
      );

      showToast(`Dr. ${doctorForm.name} added successfully and is now Live on MeetADr!`, 'success');
      setActiveRequestToAdd(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add doctor and approve request', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!rejectingRequest) return;
    setIsSubmittingReject(true);
    try {
      await realAdminService.updateRequestStatus(
        rejectingRequest.id,
        'rejected',
        rejectionReason.trim() || 'Application rejected by platform administrator'
      );
      showToast('Application marked as rejected.', 'success');
      setRejectingRequest(null);
      setRejectionReason('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject request', 'error');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('adminPortal.requestsTitle')}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review inbound provider partnership applications. Inspect details, provision master templates directly, or reject.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-[#E8F6F8] text-[#0E7490] rounded-xl text-xs font-semibold border border-[#CDEBF0]">
            {requests.filter((r) => r.status === 'pending').length} Pending Review
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
              <tr>
                <th className="px-5 py-3">{t('adminPortal.applicantCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.categoryCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.contactCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.locationCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.submittedCol')}</th>
                <th className="px-5 py-3">{t('adminPortal.statusCol')}</th>
                <th className="px-5 py-3 text-right rtl:text-left">{t('adminPortal.reviewCol')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">Loading requests...</td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    {t('adminPortal.noRequestsFound')}
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div>{r.name}</div>
                      {r.nameAr && <div className="text-[11px] text-slate-400 font-normal">{r.nameAr}</div>}
                    </td>
                    <td className="px-5 py-3.5 capitalize">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                        {r.providerType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-800">
                      <div className="font-mono text-xs" dir="ltr">{r.contactNumber || '—'}</div>
                      <div className="text-slate-400 text-[11px]" dir="ltr">{r.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <div>{r.location}</div>
                      <div className="text-[11px] text-slate-400">{r.country}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                      {formatDate(r.submittedAt || r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          r.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {r.status === 'approved'
                          ? t('status.approved')
                          : r.status === 'rejected'
                          ? t('status.rejected')
                          : t('status.pending')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right rtl:text-left">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          {/* View Button */}
                          <button
                            onClick={() => setViewingRequest(r)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="View full submission details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          {/* Add Button */}
                          <button
                            onClick={() => handleOpenAddModal(r)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Complete template details and set live"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => {
                              setRejectingRequest(r);
                              setRejectionReason('');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Reject application"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : r.status === 'approved' ? (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end rtl:justify-start gap-1">
                          <Check className="w-3.5 h-3.5" /> Live on platform
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] capitalize">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. VIEW APPLICATION MODAL                                      */}
      {/* ============================================================== */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-[#E2EBF0] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2EBF0] flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] mb-1 inline-block">
                  {viewingRequest.providerType} Application
                </span>
                <h2 className="text-lg font-bold text-slate-900">{viewingRequest.name}</h2>
                {viewingRequest.nameAr && (
                  <p className="text-xs text-slate-500 font-arabic">{viewingRequest.nameAr}</p>
                )}
              </div>
              <button
                onClick={() => setViewingRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Contact Person
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {viewingRequest.contactPerson || '—'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                  </div>
                  <div className="text-sm font-semibold font-mono text-slate-800" dir="ltr">
                    {viewingRequest.contactNumber || '—'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                  </div>
                  <div className="text-sm font-semibold font-mono text-slate-800" dir="ltr">
                    {viewingRequest.email}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location & Country
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    {viewingRequest.location}, {viewingRequest.country}
                  </div>
                </div>
              </div>

              {viewingRequest.address && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium mb-1">Street Address</div>
                  <div className="text-xs text-slate-700">{viewingRequest.address}</div>
                </div>
              )}

              {viewingRequest.specialty && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                    <Stethoscope className="w-3.5 h-3.5 text-slate-400" /> Primary Specialty
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{viewingRequest.specialty}</div>
                </div>
              )}

              {viewingRequest.googleMapsUrl && (
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Google Maps Pin
                    </div>
                    <p className="text-[11px] text-emerald-600 mt-0.5 truncate max-w-sm">
                      {viewingRequest.googleMapsUrl}
                    </p>
                  </div>
                  <a
                    href={viewingRequest.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Open Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Submitted: {formatDate(viewingRequest.submittedAt || viewingRequest.createdAt)}
                </span>
                <span className="font-semibold capitalize">Status: {viewingRequest.status}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2EBF0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              {viewingRequest.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const req = viewingRequest;
                      setViewingRequest(null);
                      setRejectingRequest(req);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const req = viewingRequest;
                      setViewingRequest(null);
                      handleOpenAddModal(req);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Proceed to Add Facility</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. REJECT CONFIRMATION MODAL                                   */}
      {/* ============================================================== */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#E2EBF0] p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">Reject Application</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to reject the provider application for{' '}
                  <strong className="text-slate-800">{rejectingRequest.name}</strong>?
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason / Internal Notes (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Incomplete DHA facility license, unverified contact person, or duplicate entry."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                disabled={isSubmittingReject}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmittingReject}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReject ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
            {/* ADD HOSPITAL MODAL */}
      {activeRequestToAdd && activeRequestToAdd.providerType !== 'doctor' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Add Healthcare Facility</h3>
                  <p className="text-xs text-slate-500">Master template specification: 19 standardized registration fields</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveRequestToAdd(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHospital} className="space-y-4 text-xs">
              {/* Category & Facility Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <SearchableSelect
                    label="Hospital / Clinic / Wellness *"
                    value={hospitalForm.facility_category}
                    onChange={(val) => setHospitalForm({ ...hospitalForm, facility_category: val as any, type: val === 'Clinic' ? 'clinic' : 'hospital' })}
                    options={FACILITY_CATEGORIES.map((c) => ({ value: c, label: c }))}
                    placeholder="Select category"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Hospital / Facility Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC Hospital / Emirates Speciality Hospital"
                    value={hospitalForm.name}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              {/* Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <SearchableSelect
                    label="Country *"
                    value={hospitalForm.country}
                    onChange={(val) => setHospitalForm({ ...hospitalForm, country: val })}
                    options={SUPPORTING_COUNTRIES.map((c) => ({ value: c, label: c }))}
                    placeholder="Select country"
                    allowCustom
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="Emirates / Province *"
                    value={hospitalForm.emirate}
                    onChange={(val) => setHospitalForm({ ...hospitalForm, emirate: val, location: val })}
                    options={SUPPORTING_EMIRATES.map((e) => ({ value: e, label: e }))}
                    placeholder="Select emirate"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area / Sub-district</label>
                  <input
                    type="text"
                    placeholder="e.g. Barsha / Al Faseel"
                    value={hospitalForm.area}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, area: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address Of Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Barsha Heights, Street 1, Building A"
                  value={hospitalForm.address}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 25.2048"
                    value={hospitalForm.latitude}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, latitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 55.2708"
                    value={hospitalForm.longitude}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, longitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              {/* Dial Code, Main Number, Website */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <SearchableSelect
                    label={`Country Code (${hospitalForm.phone_dial_code || '+971'})`}
                    value={hospitalForm.phone_dial_code}
                    onChange={(val) => {
                      setHospitalForm({
                        ...hospitalForm,
                        phone_dial_code: val,
                        phone: hospitalForm.phone ? sanitizePhoneNumber(hospitalForm.phone, val) : '',
                      });
                    }}
                    options={SUPPORTING_DIAL_CODES.map((d) => ({ value: d.code, label: d.label }))}
                    placeholder="Select dial code"
                    allowCustom
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Hospital Main Number</label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Max {getPhoneRule(hospitalForm.phone_dial_code).maxLength} digits ({hospitalForm.phone?.length || 0}/{getPhoneRule(hospitalForm.phone_dial_code).maxLength})
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={`e.g. ${getPhoneRule(hospitalForm.phone_dial_code).example}`}
                    value={hospitalForm.phone}
                    maxLength={getPhoneRule(hospitalForm.phone_dial_code).maxLength + (hospitalForm.phone_dial_code === '+971' && hospitalForm.phone?.startsWith('0') ? 1 : 0)}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, phone: sanitizePhoneNumber(e.target.value, hospitalForm.phone_dial_code) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.hospital.ae"
                    value={hospitalForm.website}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              {/* Hospital Profile */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hospital Profile</label>
                <textarea
                  rows={3}
                  placeholder="Overview of hospital facilities, departments, specialized services, and clinical center description..."
                  value={hospitalForm.about}
                  onChange={(e) => setHospitalForm({ ...hospitalForm, about: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-normal resize-none"
                />
              </div>

              {/* Hospital Image & Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Image (Photo)</label>
                  <ImageUpload
                    value={hospitalForm.photo}
                    onChange={(url) => setHospitalForm({ ...hospitalForm, photo: url })}
                    placeholder="Upload facility photo"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Logo</label>
                  <ImageUpload
                    value={hospitalForm.logo}
                    onChange={(url) => setHospitalForm({ ...hospitalForm, logo: url })}
                    placeholder="Upload organization logo"
                  />
                </div>
              </div>

              {/* Accepted Insurances */}
              <div>
                <SearchableMultiSelect
                  label="Accepted Insurances"
                  sublabel="Select health insurance networks accepted by this facility"
                  placeholder="Search and select insurance providers (e.g. Daman, AXA, MetLife)..."
                  options={SUPPORTING_INSURANCES}
                  selected={hospitalForm.insurance_plans}
                  onChange={(vals) => setHospitalForm({ ...hospitalForm, insurance_plans: vals })}
                  allowCustom
                />
              </div>

              {/* Manager Details */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Hospital Manager Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Manager Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. John Smith"
                      value={hospitalForm.manager_name}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, manager_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Manager Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +971 50 123 4567"
                      value={hospitalForm.manager_phone}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, manager_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Manager Email</label>
                    <input
                      type="email"
                      placeholder="e.g. manager@hospital.ae"
                      value={hospitalForm.manager_email}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, manager_email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* User Name & Password */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Facility Admin Credentials (User Name & Password)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">User Name (Login email/ID) <span className="text-rose-500">*</span></label>
<input type="text" required
                      placeholder="e.g. hospital_admin or admin@hospital.ae"
                      value={hospitalForm.username}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Password <span className="text-rose-500">*</span></label>
<input type="password" required
                      placeholder="e.g. Hospital@12345"
                      value={hospitalForm.password}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveRequestToAdd(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingAdd ? 'Saving...' : 'Add Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DOCTOR MODAL */}



      {activeRequestToAdd && activeRequestToAdd.providerType === 'doctor' && (



        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">



          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">



            <div className="flex items-center justify-between">



              <div className="flex items-center gap-3">



                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">



                  <Plus className="w-5 h-5" />



                </div>



                <div>



                  <h3 className="text-lg font-black text-slate-900">Add New Doctor</h3>



                  <p className="text-xs text-slate-500">Create a doctor profile in the platform database</p>



                </div>



              </div>



              <button



                type="button"



                onClick={() => setActiveRequestToAdd(null)}



                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"



              >



                <X className="w-4 h-4" />



              </button>



            </div>







            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">



              <div>



                <label className="block font-bold text-slate-700 mb-1">Doctor Photo</label>



                <ImageUpload



                  value={doctorForm.photo}



                  onChange={(url) => setDoctorForm({ ...doctorForm, photo: url })}



                  placeholder="Upload professional doctor portrait"



                />



              </div>







              <div>



                <label className="block font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation *</label>



                <select



                  value={doctorForm.facilityId}



                  onChange={(e) => setDoctorForm({ ...doctorForm, facilityId: e.target.value })}



                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                >



                  <option value="">Independent / Private Practice</option>



                  {providers.map((p) => (



                    <option key={p.id} value={p.id}>



                      {p.name} ({p.providerCategory || 'Facility'}) — {p.location}



                    </option>



                  ))}



                </select>



                



              </div>







              <div>



                <SearchableSelect



                  label="Department"



                  placeholder="Select hospital department..."



                  options={SUPPORTING_DEPARTMENTS.map((d) => d.name)}



                  value={doctorForm.department}



                  onChange={(val) => setDoctorForm({ ...doctorForm, department: val })}



                  allowCustom



                />



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">



                <div>



                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>



                  <input



                    type="text"



                    required



                    placeholder="e.g. Ahmed"



                    value={doctorForm.first_name}



                    onChange={(e) => setDoctorForm({ ...doctorForm, first_name: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Last Name *</label>



                  <input



                    type="text"



                    required



                    placeholder="e.g. Refaat"



                    value={doctorForm.last_name}



                    onChange={(e) => setDoctorForm({ ...doctorForm, last_name: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



                <div>



                  <SearchableSelect



                    label="Gender *"



                    placeholder="Select gender"



                    options={[...GENDERS]}



                    value={doctorForm.gender}



                    onChange={(val) => setDoctorForm({ ...doctorForm, gender: val })}



                    required



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Display Title / Full Name (English)</label>



                  <input



                    type="text"



                    placeholder={doctorForm.first_name || doctorForm.last_name ? `Dr. ${doctorForm.first_name} ${doctorForm.last_name}`.trim() : 'e.g. Dr. Ahmed Refaat'}



                    value={doctorForm.name}



                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Doctor Name (Arabic)</label>



                  <input



                    type="text"



                    placeholder="e.g. د. أحمد رفعت"



                    value={doctorForm.name_ar}



                    onChange={(e) => setDoctorForm({ ...doctorForm, name_ar: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                    dir="rtl"



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



                <div>



                  <SearchableSelect



                    label="Specialty *"



                    placeholder="Select clinical specialty..."



                    options={SUPPORTING_SPECIALTIES}



                    value={doctorForm.specialty}



                    onChange={(val) => setDoctorForm({ ...doctorForm, specialty: val })}



                    allowCustom



                    required



                  />



                </div>



                <div>



                  <SearchableSelect



                    label="Emirate / Location *"



                    placeholder="Select emirate..."



                    options={SUPPORTING_EMIRATES}



                    value={doctorForm.location}



                    onChange={(val) => setDoctorForm({ ...doctorForm, location: val })}



                    required



                  />



                </div>



              </div>







              <div>



                <SearchableMultiSelect



                  label="Qualifications & Degrees (Multi-select from Supporting Keys)"



                  placeholder="Select qualifications (e.g. MBBS, American Board, MD, CCT)..."



                  options={SUPPORTING_QUALIFICATIONS}



                  selected={doctorForm.qualifications}



                  onChange={(quals) => setDoctorForm({ ...doctorForm, qualifications: quals })}



                  allowCustom



                />



              </div>







              <div>



                <SearchableMultiSelect



                  label="Special Interests / Conditions (Multi-select from Health Conditions)"



                  placeholder="Select conditions or symptoms (e.g. Stroke, Arrhythmia, Heart Attack)..."



                  options={SUPPORTING_SPECIAL_INTERESTS}



                  selected={doctorForm.special_interests}



                  onChange={(interests) => setDoctorForm({ ...doctorForm, special_interests: interests })}



                  allowCustom



                />



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



                <div>



                  <SearchableSelect



                    label="Country of Origin"



                    placeholder="Select nationality/origin..."



                    options={SUPPORTING_COUNTRIES}



                    value={doctorForm.country_of_origin}



                    onChange={(val) => setDoctorForm({ ...doctorForm, country_of_origin: val })}



                    allowCustom



                  />



                </div>



                <div>



                  <SearchableMultiSelect



                    label="Languages Spoken (Multi-select)"



                    placeholder="Select languages..."



                    options={SUPPORTING_LANGUAGES}



                    selected={doctorForm.languages}



                    onChange={(langs) => setDoctorForm({ ...doctorForm, languages: langs })}



                    allowCustom



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">



                <div className="sm:col-span-1">



                  <SearchableSelect



                    label="Country Code+ Area (+971 - UAE)"



                    value={doctorForm.phone_dial_code}



                    onChange={(val) => setDoctorForm({ ...doctorForm, phone_dial_code: val, contact_number: doctorForm.contact_number ? sanitizePhoneNumber(doctorForm.contact_number, val) : '' })}
                    options={SUPPORTING_DIAL_CODES.map((d) => ({ value: d.code, label: d.label }))}
                    placeholder="Select dial code"
                    allowCustom
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Contact Number</label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Max {getPhoneRule(doctorForm.phone_dial_code).maxLength} digits ({doctorForm.contact_number?.length || 0}/{getPhoneRule(doctorForm.phone_dial_code).maxLength})
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={`e.g. ${getPhoneRule(doctorForm.phone_dial_code).example}`}
                    value={doctorForm.contact_number}
                    maxLength={getPhoneRule(doctorForm.phone_dial_code).maxLength + (doctorForm.phone_dial_code === '+971' && doctorForm.contact_number?.startsWith('0') ? 1 : 0)}
                    onChange={(e) => setDoctorForm({ ...doctorForm, contact_number: sanitizePhoneNumber(e.target.value, doctorForm.phone_dial_code) })}
                  />
                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Doctor Email</label>



                  <input



                    type="email"



                    placeholder="e.g. doctor@meetadr.ae"



                    value={doctorForm.email}



                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



                



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>



                  <input



                    type="number"



                    min="0"



                    placeholder="e.g. 10"



                    value={doctorForm.experience_years}



                    onChange={(e) => setDoctorForm({ ...doctorForm, experience_years: e.target.value === '' ? '' : Number(e.target.value) })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



              </div>







              <div>



                <label className="block font-bold text-slate-700 mb-1">Doctor Profile / Biography</label>



                <textarea



                  rows={3}



                  placeholder="Detailed summary of doctor's clinical background and subspecialties..."



                  value={doctorForm.about}



                  onChange={(e) => setDoctorForm({ ...doctorForm, about: e.target.value })}



                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"



                />



              </div>







              {/* Login Credentials */}

              <div className="pt-2 border-t border-slate-100">

                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">

                  Doctor Account Credentials (Required Login Setup) <span className="text-rose-500">*</span>

                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div>

                    <label className="block font-bold text-slate-700 mb-1">

                      Username / Email <span className="text-rose-500">*</span>

                    </label>

                    <input

                      type="text"

                      required

                      placeholder="e.g. dr.sarah or sarah@hospital.com"

                      value={doctorForm.username}

                      onChange={(e) => setDoctorForm({ ...doctorForm, username: e.target.value })}

                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"

                    />

                  </div>

                  <div>

                    <label className="block font-bold text-slate-700 mb-1">

                      Password <span className="text-rose-500">*</span>

                    </label>

                    <input

                      type="password"

                      required

                      placeholder="Min. 8 characters"

                      value={doctorForm.password}

                      onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}

                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"

                    />



                  </div>



                </div>



              </div>







              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">



                <button



                  type="button"



                  onClick={() => setActiveRequestToAdd(null)}



                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"



                >



                  Cancel



                </button>



                <button



                  type="submit"



                  disabled={isSubmittingAdd}



                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"



                >



                  {isSubmittingAdd ? 'Saving...' : 'Add Doctor'}



                </button>



              </div>



            </form>



          </div>



        </div>



      )}
    </div>
  );
};
