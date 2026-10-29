import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Stethoscope,
  Phone,
  Clock,
  MapPin,
  X,
  AlertTriangle,
  Users,
  CheckSquare,
  Square,
  Filter,
  ArrowLeft,
  Calendar,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { Doctor } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ImageUpload } from '../../components/common/ImageUpload';
import { DEFAULT_DOCTOR_AVATAR } from '../../utils/avatar';
import { BulkImportModal } from '../../components/common/BulkImportModal';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { SearchableMultiSelect } from '../../components/common/SearchableMultiSelect';
import {
  SUPPORTING_COUNTRIES,
  SUPPORTING_EMIRATES,
  SUPPORTING_DIAL_CODES,
  FACILITY_CATEGORIES,
  SUPPORTING_INSURANCES,
} from '../../data/supportingKeys';


import {
  WEEK_DAYS,
  DEFAULT_PRESET_SLOTS,
  MORNING_SLOTS,
  STANDARD_BUSINESS_SLOTS,
} from '../../constants/schedule';

export const AdminHospitalsManage: React.FC = () => {
  const { showToast } = useToast();

  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'hospital' | 'clinic'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Deactivated'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Bulk Selection for Hospitals
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Drilldown: See doctors in a specific hospital
  const [viewHospitalDoctors, setViewHospitalDoctors] = useState<ProviderItem | null>(null);

  // Facility Default Schedule Modal
  const [facilityScheduleToEdit, setFacilityScheduleToEdit] = useState<ProviderItem | null>(null);
  const [facilityDays, setFacilityDays] = useState<string[]>([]);
  const [facilitySlots, setFacilitySlots] = useState<string[]>([]);
  const [isSubmittingFacilitySchedule, setIsSubmittingFacilitySchedule] = useState(false);

  // Add Hospital Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
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
    manager_name: '',
    manager_phone: '',
    manager_email: '',
    username: '',
    password: '',
  });

  // Edit Hospital Modal
  const [hospitalToEdit, setHospitalToEdit] = useState<ProviderItem | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
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
    manager_name: '',
    manager_phone: '',
    manager_email: '',
    username: '',
    password: '',
  });

  // Delete Hospital Confirmation
  const [hospitalToDelete, setHospitalToDelete] = useState<ProviderItem | null>(null);
  const [isDeletingHospital, setIsDeletingHospital] = useState(false);

  // Add / Edit Doctor within Hospital Modal
  const [doctorModalFacility, setDoctorModalFacility] = useState<ProviderItem | null>(null);
  const [editingDoctorInHospital, setEditingDoctorInHospital] = useState<Doctor | null>(null);
  const [isSubmittingDoctor, setIsSubmittingDoctor] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    name_ar: '',
    specialty: '',
    location: 'Dubai',
    consultation_fee: '' as string | number,
    experience_years: '' as string | number,
    education: '',
    about: '',
    photo: '',
    username: '',
    password: '',
    available_days: [] as string[],
    standard_slots: [] as string[],
  });

  // Delete Doctor within Hospital
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [isDeletingDoctor, setIsDeletingDoctor] = useState(false);

  // Load providers and doctors
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [provs, docs] = await Promise.all([
        realAdminService.getProviders(),
        realAdminService.getDoctors(),
      ]);
      setProviders(provs);
      setDoctors(docs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load hospitals data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Locations list
  const locations = useMemo(() => {
    const set = new Set<string>();
    providers.forEach((p) => {
      if (p.location) set.add(p.location);
    });
    return Array.from(set).sort();
  }, [providers]);

  // Doctors mapped per provider
  const doctorsByProviderId = useMemo(() => {
    const map = new Map<string, Doctor[]>();
    doctors.forEach((d) => {
      if (d.hospitalId) {
        const list = map.get(d.hospitalId) || [];
        list.push(d);
        map.set(d.hospitalId, list);
      } else if (d.hospitalName) {
        // match by name
        const match = providers.find((p) => p.name.toLowerCase() === d.hospitalName?.toLowerCase());
        if (match) {
          const list = map.get(match.id) || [];
          list.push(d);
          map.set(match.id, list);
        }
      }
    });
    return map;
  }, [doctors, providers]);

  // Filtered providers
  const filteredProviders = useMemo(() => {
    return providers.filter((p) => {
      const pType = ((p as any).type || (p.providerCategory === 'Clinic' ? 'clinic' : 'hospital')).toLowerCase();
      if (typeFilter !== 'all' && pType !== typeFilter) return false;

      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      if (locationFilter !== 'all' && p.location !== locationFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesAddress = (p.address || '').toLowerCase().includes(q);
        const matchesLocation = (p.location || '').toLowerCase().includes(q);
        const matchesPhone = (p.phone || '').includes(q);
        if (!matchesName && !matchesAddress && !matchesLocation && !matchesPhone) {
          return false;
        }
      }

      return true;
    });
  }, [providers, typeFilter, statusFilter, locationFilter, searchQuery]);

  // Bulk Selection
  const handleToggleSelectAll = () => {
    if (selectedProviderIds.length === filteredProviders.length) {
      setSelectedProviderIds([]);
    } else {
      setSelectedProviderIds(filteredProviders.map((p) => p.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedProviderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'delete' | 'deactivate' | 'activate') => {
    if (selectedProviderIds.length === 0) return;

    if (action === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete ${selectedProviderIds.length} hospitals/clinics? This action cannot be undone.`
      );
      if (!confirmDelete) return;
    }

    setIsBulkProcessing(true);
    try {
      const targetAction = action === 'activate' ? 'activate' : action === 'deactivate' ? 'deactivate' : 'delete';
      const res = await realAdminService.bulkProviderAction(selectedProviderIds, targetAction);
      showToast(res.message || `Bulk ${action} completed successfully.`, 'success');
      setSelectedProviderIds([]);
      await loadData();
    } catch (err: any) {
      showToast(err.message || `Failed to perform bulk ${action}.`, 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Add Hospital
  const handleOpenAddModal = () => {
    setAddForm({
      name: '',
      name_ar: '',
      type: 'hospital',
      facility_category: 'Hospital',
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
      manager_name: '',
      manager_phone: '',
      manager_email: '',
      username: '',
      password: '',
    });
    setIsAddModalOpen(true);
  };

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      showToast('Hospital / Facility Name is required.', 'error');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const created = await realAdminService.createProvider({
        name: addForm.name.trim(),
        name_ar: addForm.name_ar.trim() || undefined,
        type: addForm.facility_category === 'Clinic' ? 'clinic' : 'hospital',
        facility_category: addForm.facility_category,
        country: addForm.country.trim() || 'United Arab Emirates',
        emirate: addForm.emirate.trim() || 'Dubai',
        location: addForm.emirate.trim() || 'Dubai',
        area: addForm.area.trim() || undefined,
        address: addForm.address.trim() || undefined,
        latitude: addForm.latitude ? parseFloat(addForm.latitude) : undefined,
        longitude: addForm.longitude ? parseFloat(addForm.longitude) : undefined,
        phone_dial_code: addForm.phone_dial_code.trim() || '+971',
        phone: addForm.phone.trim() || undefined,
        website: addForm.website.trim() || undefined,
        operating_hours: addForm.operating_hours.trim() || 'Open 24/7',
        about: addForm.about.trim() || undefined,
        photo: addForm.photo.trim() || undefined,
        logo: addForm.logo.trim() || undefined,
        insurance_plans: addForm.insurance_plans.join(', ') || undefined,
        manager_name: addForm.manager_name.trim() || undefined,
        manager_phone: addForm.manager_phone.trim() || undefined,
        manager_email: addForm.manager_email.trim() || undefined,
        username: addForm.username.trim() || undefined,
        password: addForm.password.trim() || undefined,
      });

      setProviders((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      showToast(`${created.name} added successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add hospital.', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit Hospital
  const handleOpenEditModal = (provider: ProviderItem) => {
    setHospitalToEdit(provider);
    const pType = ((provider as any).type || (provider.providerCategory === 'Clinic' ? 'clinic' : 'hospital')) as 'hospital' | 'clinic';
    const cat = ((provider as any).facility_category || (provider as any).providerCategory || (pType === 'clinic' ? 'Clinic' : 'Hospital')) as 'Hospital' | 'Clinic' | 'Wellness';
    const em = (provider as any).emirate || provider.location || 'Dubai';
    const rawIns = (provider as any).insurance_plans || (provider as any).insurancePlans || '';
    const parsedInsurances = typeof rawIns === 'string'
      ? rawIns.split(',').map((s: string) => s.trim()).filter(Boolean)
      : (Array.isArray(rawIns) ? rawIns : []);
    setEditForm({
      name: provider.name || '',
      name_ar: (provider as any).name_ar || '',
      type: pType,
      facility_category: cat,
      country: (provider as any).country || 'United Arab Emirates',
      emirate: em,
      location: em,
      area: (provider as any).area || '',
      address: provider.address || '',
      latitude: (provider as any).latitude ? String((provider as any).latitude) : '',
      longitude: (provider as any).longitude ? String((provider as any).longitude) : '',
      phone_dial_code: (provider as any).phone_dial_code || '+971',
      phone: provider.phone || '',
      website: (provider as any).website || '',
      operating_hours: (provider as any).operating_hours || (provider as any).operatingHours || 'Open 24/7',
      about: (provider as any).about || '',
      photo: (provider as any).photo || '',
      logo: (provider as any).logo || '',
      insurance_plans: parsedInsurances,
      manager_name: (provider as any).manager_name || '',
      manager_phone: (provider as any).manager_phone || '',
      manager_email: (provider as any).manager_email || '',
      username: '',
      password: '',
    });
  };

  const handleUpdateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalToEdit) return;
    if (!editForm.name.trim()) {
      showToast('Hospital / Facility Name is required.', 'error');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const updated = await realAdminService.updateProvider(hospitalToEdit.id, {
        name: editForm.name.trim(),
        name_ar: editForm.name_ar.trim() || undefined,
        type: editForm.facility_category === 'Clinic' ? 'clinic' : 'hospital',
        facility_category: editForm.facility_category,
        country: editForm.country.trim() || 'United Arab Emirates',
        emirate: editForm.emirate.trim() || 'Dubai',
        location: editForm.emirate.trim() || 'Dubai',
        area: editForm.area.trim() || undefined,
        address: editForm.address.trim() || undefined,
        latitude: editForm.latitude ? parseFloat(editForm.latitude) : undefined,
        longitude: editForm.longitude ? parseFloat(editForm.longitude) : undefined,
        phone_dial_code: editForm.phone_dial_code.trim() || '+971',
        phone: editForm.phone.trim() || undefined,
        website: editForm.website.trim() || undefined,
        operating_hours: editForm.operating_hours.trim() || undefined,
        about: editForm.about.trim() || undefined,
        photo: editForm.photo.trim() || undefined,
        logo: editForm.logo.trim() || undefined,
        insurance_plans: editForm.insurance_plans.join(', '),
        manager_name: editForm.manager_name.trim() || undefined,
        manager_phone: editForm.manager_phone.trim() || undefined,
        manager_email: editForm.manager_email.trim() || undefined,
        username: editForm.username.trim() || undefined,
        password: editForm.password.trim() || undefined,
      });

      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (viewHospitalDoctors && viewHospitalDoctors.id === updated.id) {
        setViewHospitalDoctors(updated);
      }
      setHospitalToEdit(null);
      showToast(`${updated.name} updated successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update facility.', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Toggle Hospital Active Status
  const handleToggleHospitalStatus = async (provider: ProviderItem) => {
    const isCurrentlyActive = provider.status === 'Active';
    const targetStatus = isCurrentlyActive ? 'Deactivated' : 'Active';

    try {
      await realAdminService.updateProviderStatus(provider.id, targetStatus);
      setProviders((prev) =>
        prev.map((p) => (p.id === provider.id ? { ...p, status: targetStatus } : p))
      );
      if (viewHospitalDoctors && viewHospitalDoctors.id === provider.id) {
        setViewHospitalDoctors({ ...viewHospitalDoctors, status: targetStatus });
      }
      showToast(`${provider.name} is now ${targetStatus.toLowerCase()}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to change status.', 'error');
    }
  };

  // Delete Hospital
  const handleDeleteHospital = async () => {
    if (!hospitalToDelete) return;
    setIsDeletingHospital(true);
    try {
      await realAdminService.deleteProvider(hospitalToDelete.id);
      setProviders((prev) => prev.filter((p) => p.id !== hospitalToDelete.id));
      setSelectedProviderIds((prev) => prev.filter((id) => id !== hospitalToDelete.id));
      if (viewHospitalDoctors && viewHospitalDoctors.id === hospitalToDelete.id) {
        setViewHospitalDoctors(null);
      }
      showToast(`${hospitalToDelete.name} has been deleted.`, 'success');
      setHospitalToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete hospital.', 'error');
    } finally {
      setIsDeletingHospital(false);
    }
  };

  // Facility Default Schedule Handlers
  const handleOpenFacilityScheduleModal = (facility: ProviderItem) => {
    setFacilityScheduleToEdit(facility);
    const initialDays = (facility.defaultAvailableDays && facility.defaultAvailableDays.length > 0)
      ? facility.defaultAvailableDays
      : (facility.default_available_days && facility.default_available_days.length > 0)
      ? facility.default_available_days
      : WEEK_DAYS.slice(0, 5);
    const initialSlots = (facility.defaultStandardSlots && facility.defaultStandardSlots.length > 0)
      ? facility.defaultStandardSlots
      : (facility.default_standard_slots && facility.default_standard_slots.length > 0)
      ? facility.default_standard_slots
      : DEFAULT_PRESET_SLOTS;
    setFacilityDays([...initialDays]);
    setFacilitySlots([...initialSlots]);
  };

  const handleSaveFacilitySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityScheduleToEdit) return;
    if (facilityDays.length === 0) {
      showToast('Please select at least one active weekday for the facility.', 'error');
      return;
    }
    if (facilitySlots.length === 0) {
      showToast('Please select at least one consultation time slot.', 'error');
      return;
    }

    setIsSubmittingFacilitySchedule(true);
    try {
      const updated = await realAdminService.updateProvider(facilityScheduleToEdit.id, {
        default_available_days: facilityDays,
        default_standard_slots: facilitySlots,
      });

      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (viewHospitalDoctors && viewHospitalDoctors.id === updated.id) {
        setViewHospitalDoctors(updated);
      }
      showToast(`Default weekly schedule for ${updated.name} updated! New doctors will inherit this schedule.`, 'success');
      setFacilityScheduleToEdit(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update facility schedule.', 'error');
    } finally {
      setIsSubmittingFacilitySchedule(false);
    }
  };

  // Doctor in Hospital: Add / Edit
  const handleOpenDoctorModal = (facility: ProviderItem, docToEdit?: Doctor) => {
    setDoctorModalFacility(facility);
    const defaultFacDays = (facility.defaultAvailableDays && facility.defaultAvailableDays.length > 0)
      ? facility.defaultAvailableDays
      : (facility.default_available_days && facility.default_available_days.length > 0)
      ? facility.default_available_days
      : WEEK_DAYS.slice(0, 5);
    const defaultFacSlots = (facility.defaultStandardSlots && facility.defaultStandardSlots.length > 0)
      ? facility.defaultStandardSlots
      : (facility.default_standard_slots && facility.default_standard_slots.length > 0)
      ? facility.default_standard_slots
      : DEFAULT_PRESET_SLOTS;

    if (docToEdit) {
      setEditingDoctorInHospital(docToEdit);
      setDoctorForm({
        name: docToEdit.name || '',
        name_ar: (docToEdit as any).name_ar || '',
        specialty: docToEdit.specialty || '',
        location: docToEdit.location || facility.location || 'Dubai',
        consultation_fee: docToEdit.consultationFee || 200,
        experience_years: docToEdit.experienceYears || 5,
        education: docToEdit.education || 'MBBS, MD',
        about: docToEdit.about || '',
        photo: docToEdit.photo || '',
        username: '',
        password: '',
        available_days: docToEdit.availableDays && docToEdit.availableDays.length > 0 ? [...docToEdit.availableDays] : [...defaultFacDays],
        standard_slots: docToEdit.availableSlots && docToEdit.availableSlots.length > 0 ? [...docToEdit.availableSlots] : [...defaultFacSlots],
      });
    } else {
      setEditingDoctorInHospital(null);
      setDoctorForm({
        name: '',
        name_ar: '',
        specialty: '',
        location: facility.location || 'Dubai',
        consultation_fee: '',
        experience_years: '',
        education: '',
        about: '',
        photo: '',
        username: '',
        password: '',
        available_days: [...defaultFacDays],
        standard_slots: [...defaultFacSlots],
      });
    }
  };

  const handleSaveDoctorInHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorModalFacility) return;
    if (!doctorForm.name.trim() || !doctorForm.specialty.trim()) {
      showToast('Doctor name and specialty are required.', 'error');
      return;
    }

    setIsSubmittingDoctor(true);
    try {
      const isHospital = (doctorModalFacility as any).type === 'hospital' || doctorModalFacility.providerCategory === 'Hospital';
      const isClinic = (doctorModalFacility as any).type === 'clinic' || doctorModalFacility.providerCategory === 'Clinic';

      if (editingDoctorInHospital) {
        const updated = await realAdminService.updateDoctor(editingDoctorInHospital.id, {
          name: doctorForm.name.trim(),
          name_ar: doctorForm.name_ar.trim() || undefined,
          specialty: doctorForm.specialty.trim(),
          location: doctorForm.location.trim(),
          hospital_id: isHospital ? doctorModalFacility.id : undefined,
          clinic_id: isClinic ? doctorModalFacility.id : undefined,
          consultation_fee: Number(doctorForm.consultation_fee) || 200,
          experience_years: Number(doctorForm.experience_years) || 1,
          education: doctorForm.education.trim() || 'MBBS',
          about: doctorForm.about.trim() || undefined,
          photo: doctorForm.photo.trim() || undefined,
          available_days: doctorForm.available_days,
          standard_slots: doctorForm.standard_slots,
        });
        setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        showToast(`Dr. ${updated.name} updated in ${doctorModalFacility.name}.`, 'success');
      } else {
        const created = await realAdminService.createDoctor({
          name: doctorForm.name.trim(),
          name_ar: doctorForm.name_ar.trim() || undefined,
          specialty: doctorForm.specialty.trim(),
          location: doctorForm.location.trim(),
          facility_id: doctorModalFacility.id,
          hospital_id: isHospital ? doctorModalFacility.id : undefined,
          clinic_id: isClinic ? doctorModalFacility.id : undefined,
          consultation_fee: Number(doctorForm.consultation_fee) || 200,
          experience_years: Number(doctorForm.experience_years) || 1,
          education: doctorForm.education.trim() || 'MBBS',
          about: doctorForm.about.trim() || undefined,
          photo: doctorForm.photo.trim() || undefined,
          username: doctorForm.username.trim() || undefined,
          email: doctorForm.username.trim() || undefined,
          password: doctorForm.password.trim() || undefined,
          available_days: doctorForm.available_days,
          standard_slots: doctorForm.standard_slots,
        });
        setDoctors((prev) => [created, ...prev]);
        showToast(`Dr. ${created.name} added to ${doctorModalFacility.name}!`, 'success');
      }
      setDoctorModalFacility(null);
      setEditingDoctorInHospital(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to save doctor.', 'error');
    } finally {
      setIsSubmittingDoctor(false);
    }
  };

  // Delete Doctor from Hospital
  const handleDeleteDoctorInHospital = async () => {
    if (!doctorToDelete) return;
    setIsDeletingDoctor(true);
    try {
      await realAdminService.deleteDoctor(doctorToDelete.id);
      setDoctors((prev) => prev.filter((d) => d.id !== doctorToDelete.id));
      showToast(`Dr. ${doctorToDelete.name} deleted successfully.`, 'success');
      setDoctorToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete doctor.', 'error');
    } finally {
      setIsDeletingDoctor(false);
    }
  };

  // Active hospital doctors list
  const activeHospitalDoctors = useMemo(() => {
    if (!viewHospitalDoctors) return [];
    return doctorsByProviderId.get(viewHospitalDoctors.id) || [];
  }, [viewHospitalDoctors, doctorsByProviderId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hospitals Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage medical facilities, see their affiliated doctors, add/edit/delete hospitals and doctors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Bulk Import Hospitals
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Hospital / Clinic
          </button>
        </div>
      </div>

      {/* If Viewing Specific Hospital Doctors Drilldown Banner */}
      {viewHospitalDoctors && (
        <div className="bg-teal-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-teal-300 font-bold">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">{viewHospitalDoctors.name}</h2>
                <span className="px-2 py-0.5 rounded-md bg-teal-800 text-teal-200 text-xs font-semibold">
                  {viewHospitalDoctors.providerCategory || 'Hospital'}
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {viewHospitalDoctors.location}
                </span>
                <span>•</span>
                <span>{activeHospitalDoctors.length} Doctors on Medical Roster</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenFacilityScheduleModal(viewHospitalDoctors)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-white/20"
              title="Configure default weekly working days and consultation time slots for this hospital"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-300" />
              Default Hospital Schedule
            </button>
            <button
              type="button"
              onClick={() => handleOpenDoctorModal(viewHospitalDoctors)}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Doctor to this Hospital
            </button>
            <button
              type="button"
              onClick={() => setViewHospitalDoctors(null)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to All Hospitals
            </button>
          </div>
        </div>
      )}

      {/* IF In Hospital Doctors View: Show Doctors Roster for that Hospital */}
      {viewHospitalDoctors ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Affiliated Medical Roster ({activeHospitalDoctors.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Doctors inherit {viewHospitalDoctors.name}'s default weekly schedule. You can customize any doctor's schedule below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenFacilityScheduleModal(viewHospitalDoctors)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold text-xs border border-teal-200 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Facility Schedule
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Specialty</th>
                  <th className="py-3 px-4">Experience & Fee</th>
                  <th className="py-3 px-4">Weekly Schedule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeHospitalDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-base font-bold text-slate-700">No doctors affiliated yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click "Add Doctor to this Hospital" above to add doctors to {viewHospitalDoctors.name}
                      </p>
                    </td>
                  </tr>
                ) : (
                  activeHospitalDoctors.map((doc) => {
                    const isDocActive = doc.status === 'Active' || doc.isActive;
                    const docDays = doc.availableDays && doc.availableDays.length > 0
                      ? doc.availableDays
                      : viewHospitalDoctors.defaultAvailableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                    const docSlots = doc.availableSlots && doc.availableSlots.length > 0
                      ? doc.availableSlots
                      : viewHospitalDoctors.defaultStandardSlots || [];

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={doc.photo || DEFAULT_DOCTOR_AVATAR}
                              alt={doc.name}
                              className="w-9 h-9 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_DOCTOR_AVATAR;
                              }}
                            />
                            <div>
                              <div className="font-bold text-slate-900">Dr. {doc.name}</div>
                              <div className="text-xs text-slate-400">{doc.education || 'MBBS'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold">
                            {doc.specialty}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-slate-800">{doc.experienceYears || 1} yrs exp</div>
                          <div className="text-teal-700 font-bold">AED {doc.consultationFee || 200}</div>
                        </td>

                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>
                              {docDays.slice(0, 3).map((d) => d.slice(0, 3)).join(', ')}
                              {docDays.length > 3 ? ` +${docDays.length - 3}` : ''}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{docSlots.length} slots / day</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isDocActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isDocActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenDoctorModal(viewHospitalDoctors, doc)}
                              title="Edit Doctor & Schedule"
                              className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <Calendar className="w-4 h-4 text-teal-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDoctorModal(viewHospitalDoctors, doc)}
                              title="Edit Doctor Details"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDoctorToDelete(doc)}
                              title="Delete Doctor"
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      ) : (
        /* MAIN HOSPITALS & CLINICS DIRECTORY */
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search hospital or clinic by name, address, emirate, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Type:</span>
                <select
                  aria-label="Filter hospitals by facility type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Facilities</option>
                  <option value="hospital">Hospitals</option>
                  <option value="clinic">Clinics</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                <span>Status:</span>
                <select
                  aria-label="Filter hospitals by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="Active">Active</option>
                  <option value="Deactivated">Deactivated</option>
                </select>
              </div>

              {/* Location Filter */}
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                <span>Emirate:</span>
                <select
                  aria-label="Filter hospitals by emirate"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[130px] truncate"
                >
                  <option value="all">All Emirates</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Floating Bulk Selection Bar for Hospitals */}
          {selectedProviderIds.length > 0 && (
            <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-teal-500/30 flex items-center justify-center text-xs font-bold border border-teal-400/50">
                  {selectedProviderIds.length}
                </span>
                <span className="text-sm font-semibold">
                  {selectedProviderIds.length} {selectedProviderIds.length === 1 ? 'facility' : 'facilities'} selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkAction('activate')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Bulk Activate
                </button>
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Bulk Deactivate
                </button>
                <button
                  type="button"
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkAction('delete')}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Bulk Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProviderIds([])}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Hospitals Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        aria-label={selectedProviderIds.length === filteredProviders.length && filteredProviders.length > 0 ? 'Deselect all hospitals' : 'Select all hospitals'}
                        className="text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        {selectedProviderIds.length === filteredProviders.length && filteredProviders.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-teal-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Hospital / Clinic</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Location & Address</th>
                    <th className="py-3.5 px-4 text-center">Affiliated Doctors</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="inline-flex items-center gap-2 text-slate-500 font-medium">
                          <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                          Loading facilities directory...
                        </div>
                      </td>
                    </tr>
                  ) : filteredProviders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-base font-bold text-slate-700">No facilities found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Try modifying your search or click "Add Hospital / Clinic"
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProviders.map((prov) => {
                      const isSelected = selectedProviderIds.includes(prov.id);
                      const isProvActive = prov.status === 'Active';
                      const pType = ((prov as any).type || (prov.providerCategory === 'Clinic' ? 'clinic' : 'hospital')).toLowerCase();
                      const docCount = (doctorsByProviderId.get(prov.id) || []).length;

                      return (
                        <tr
                          key={prov.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isSelected ? 'bg-teal-50/60' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectOne(prov.id)}
                              aria-label={`Select hospital ${prov.name}`}
                              className="text-slate-400 hover:text-teal-600 transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-teal-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 font-bold flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <div
                                  onClick={() => setViewHospitalDoctors(prov)}
                                  className="font-bold text-slate-900 hover:text-teal-600 transition-colors cursor-pointer"
                                >
                                  {prov.name}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  {prov.phone && (
                                    <span className="flex items-center gap-1" dir="ltr">
                                      <Phone className="w-3 h-3" />
                                      {prov.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                                pType === 'hospital'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {pType}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-xs space-y-0.5">
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {prov.location}
                              </div>
                              {prov.address && (
                                <div className="text-slate-500 truncate max-w-[200px]">{prov.address}</div>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setViewHospitalDoctors(prov)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              {docCount} {docCount === 1 ? 'Doctor' : 'Doctors'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isProvActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isProvActive ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              {isProvActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewHospitalDoctors(prov)}
                                title="See Affiliated Doctors"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-lg text-xs transition-colors border border-teal-200 mr-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                See Doctors
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenFacilityScheduleModal(prov)}
                                title="Facility Default Weekly Schedule"
                                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              >
                                <Calendar className="w-4 h-4 text-teal-600" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(prov)}
                                title="Edit Hospital"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleHospitalStatus(prov)}
                                title={isProvActive ? 'Deactivate Hospital' : 'Activate Hospital'}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isProvActive
                                    ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {isProvActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => setHospitalToDelete(prov)}
                                title="Delete Hospital"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        </>
      )}

      {/* BULK IMPORT HOSPITALS MODAL */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          loadInitialData();
        }}
        target="hospitals"
        scope="admin"
      />

      {/* ADD HOSPITAL MODAL */}
      {isAddModalOpen && (
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
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHospital} className="space-y-4 text-xs">
              {/* Category & Facility Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <SearchableSelect
                    label="Hospital / Clinic / Wellness *"
                    value={addForm.facility_category}
                    onChange={(val) => setAddForm({ ...addForm, facility_category: val as any, type: val === 'Clinic' ? 'clinic' : 'hospital' })}
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
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              {/* Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <SearchableSelect
                    label="Country *"
                    value={addForm.country}
                    onChange={(val) => setAddForm({ ...addForm, country: val })}
                    options={SUPPORTING_COUNTRIES.map((c) => ({ value: c, label: c }))}
                    placeholder="Select country"
                    allowCustom
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="Emirates / Province *"
                    value={addForm.emirate}
                    onChange={(val) => setAddForm({ ...addForm, emirate: val, location: val })}
                    options={SUPPORTING_EMIRATES.map((e) => ({ value: e, label: e }))}
                    placeholder="Select emirate"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area / Sub-district</label>
                  <input
                    type="text"
                    placeholder="e.g. Barsha / Al Faseel"
                    value={addForm.area}
                    onChange={(e) => setAddForm({ ...addForm, area: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address Of Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Barsha Heights, Street 1, Building A"
                  value={addForm.address}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
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
                    value={addForm.latitude}
                    onChange={(e) => setAddForm({ ...addForm, latitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 55.2708"
                    value={addForm.longitude}
                    onChange={(e) => setAddForm({ ...addForm, longitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              {/* Dial Code, Main Number, Website */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <SearchableSelect
                    label="Country Code (+971 - UAE)"
                    value={addForm.phone_dial_code}
                    onChange={(val) => setAddForm({ ...addForm, phone_dial_code: val })}
                    options={SUPPORTING_DIAL_CODES.map((d) => ({ value: d.code, label: d.label }))}
                    placeholder="Select dial code"
                    allowCustom
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Main Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 800 4222 / 04 123 4567"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.hospital.ae"
                    value={addForm.website}
                    onChange={(e) => setAddForm({ ...addForm, website: e.target.value })}
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
                  value={addForm.about}
                  onChange={(e) => setAddForm({ ...addForm, about: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-normal resize-none"
                />
              </div>

              {/* Hospital Image & Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Image (Photo)</label>
                  <ImageUpload
                    value={addForm.photo}
                    onChange={(url) => setAddForm({ ...addForm, photo: url })}
                    placeholder="Upload facility photo"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Logo</label>
                  <ImageUpload
                    value={addForm.logo}
                    onChange={(url) => setAddForm({ ...addForm, logo: url })}
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
                  selected={addForm.insurance_plans}
                  onChange={(vals) => setAddForm({ ...addForm, insurance_plans: vals })}
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
                      value={addForm.manager_name}
                      onChange={(e) => setAddForm({ ...addForm, manager_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Manager Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +971 50 123 4567"
                      value={addForm.manager_phone}
                      onChange={(e) => setAddForm({ ...addForm, manager_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Manager Email</label>
                    <input
                      type="email"
                      placeholder="e.g. manager@hospital.ae"
                      value={addForm.manager_email}
                      onChange={(e) => setAddForm({ ...addForm, manager_email: e.target.value })}
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
                      value={addForm.username}
                      onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Password <span className="text-rose-500">*</span></label>
<input type="password" required
                      placeholder="e.g. Hospital@12345"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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

      {/* EDIT HOSPITAL MODAL */}
      {hospitalToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Edit Healthcare Facility</h3>
                  <p className="text-xs text-slate-500">Update facility profile, location, credentials and manager details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHospitalToEdit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateHospital} className="space-y-4 text-xs">
              {/* Category & Facility Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <SearchableSelect
                    label="Hospital / Clinic / Wellness *"
                    value={editForm.facility_category}
                    onChange={(val) => setEditForm({ ...editForm, facility_category: val as any, type: val === 'Clinic' ? 'clinic' : 'hospital' })}
                    options={FACILITY_CATEGORIES.map((c) => ({ value: c, label: c }))}
                    placeholder="Select category"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Hospital / Facility Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <SearchableSelect
                    label="Country *"
                    value={editForm.country}
                    onChange={(val) => setEditForm({ ...editForm, country: val })}
                    options={SUPPORTING_COUNTRIES.map((c) => ({ value: c, label: c }))}
                    placeholder="Select country"
                    allowCustom
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="Emirates / Province *"
                    value={editForm.emirate}
                    onChange={(val) => setEditForm({ ...editForm, emirate: val, location: val })}
                    options={SUPPORTING_EMIRATES.map((e) => ({ value: e, label: e }))}
                    placeholder="Select emirate"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Area / Sub-district</label>
                  <input
                    type="text"
                    placeholder="e.g. Barsha / Al Faseel"
                    value={editForm.area}
                    onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address Of Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Barsha Heights, Street 1, Building A"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 25.2048"
                    value={editForm.latitude}
                    onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    placeholder="e.g. 55.2708"
                    value={editForm.longitude}
                    onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* Dial Code, Main Number, Website */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <SearchableSelect
                    label="Country Code (+971 - UAE)"
                    value={editForm.phone_dial_code}
                    onChange={(val) => setEditForm({ ...editForm, phone_dial_code: val })}
                    options={SUPPORTING_DIAL_CODES.map((d) => ({ value: d.code, label: d.label }))}
                    placeholder="Select dial code"
                    allowCustom
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Main Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 800 4222 / 04 123 4567"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.hospital.ae"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              {/* Hospital Profile */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hospital Profile</label>
                <textarea
                  rows={3}
                  value={editForm.about}
                  onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-normal resize-none"
                />
              </div>

              {/* Hospital Image & Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Image (Photo)</label>
                  <ImageUpload
                    value={editForm.photo}
                    onChange={(url) => setEditForm({ ...editForm, photo: url })}
                    placeholder="Upload facility photo"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hospital Logo</label>
                  <ImageUpload
                    value={editForm.logo}
                    onChange={(url) => setEditForm({ ...editForm, logo: url })}
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
                  selected={editForm.insurance_plans}
                  onChange={(vals) => setEditForm({ ...editForm, insurance_plans: vals })}
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
                      value={editForm.manager_name}
                      onChange={(e) => setEditForm({ ...editForm, manager_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Manager Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +971 50 123 4567"
                      value={editForm.manager_phone}
                      onChange={(e) => setEditForm({ ...editForm, manager_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Manager Email</label>
                    <input
                      type="email"
                      placeholder="e.g. manager@hospital.ae"
                      value={editForm.manager_email}
                      onChange={(e) => setEditForm({ ...editForm, manager_email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* User Name & Password */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Facility Admin Credentials (Leave blank to keep existing password)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">User Name (Login email/ID)</label>
                    <input
                      type="text"
                      placeholder="e.g. hospital_admin or admin@hospital.ae"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHospitalToEdit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE HOSPITAL CONFIRMATION MODAL */}
      {hospitalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Facility</h3>
                <p className="text-xs text-slate-500">Permanent action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-900">{hospitalToDelete.name}</span>? Any affiliated doctors will become independent practice and related records will be disassociated.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setHospitalToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingHospital}
                onClick={handleDeleteHospital}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeletingHospital ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT DOCTOR IN HOSPITAL MODAL */}
      {doctorModalFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingDoctorInHospital
                      ? `Edit Doctor: Dr. ${editingDoctorInHospital.name}`
                      : `Add Doctor to ${doctorModalFacility.name}`}
                  </h3>
                  <p className="text-xs text-slate-500">Affiliation: {doctorModalFacility.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDoctorModalFacility(null);
                  setEditingDoctorInHospital(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctorInHospital} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Doctor Photo</label>
                <ImageUpload
                  value={doctorForm.photo}
                  onChange={(url) => setDoctorForm({ ...doctorForm, photo: url })}
                  placeholder="Doctor portrait photo"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Name (Arabic)</label>
                  <input
                    type="text"
                    value={doctorForm.name_ar}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name_ar: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specialty *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.specialty}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.location}
                    onChange={(e) => setDoctorForm({ ...doctorForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fee (AED)</label>
                  <input
                    type="number"
                    min="50"
                    placeholder="e.g. 200"
                    value={doctorForm.consultation_fee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={doctorForm.experience_years}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experience_years: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Education</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD"
                    value={doctorForm.education}
                    onChange={(e) => setDoctorForm({ ...doctorForm, education: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bio / About</label>
                <textarea
                  rows={3}
                  value={doctorForm.about}
                  onChange={(e) => setDoctorForm({ ...doctorForm, about: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* DOCTOR WEEKLY SCHEDULE */}
              

              {!editingDoctorInHospital && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Doctor Account Credentials (Required Login Setup) *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Username / Email
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. dr.sarah or sarah@hospital.com"
                        value={doctorForm.username || ''}
                        onChange={(e) => setDoctorForm({ ...doctorForm, username: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Min. 8 characters"
                        value={doctorForm.password || ''}
                        onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDoctorModalFacility(null);
                    setEditingDoctorInHospital(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoctor}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmittingDoctor ? 'Saving...' : editingDoctorInHospital ? 'Save Changes' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FACILITY DEFAULT SCHEDULE MODAL */}
      {facilityScheduleToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Set Default Weekly Schedule
                  </h3>
                  <p className="text-xs text-slate-500">
                    {facilityScheduleToEdit.name} &bull; Inherited by new doctors added to this facility
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFacilityScheduleToEdit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Info banner */}
              <div className="p-3 bg-teal-50/70 border border-teal-200/60 rounded-xl text-teal-900">
                <p className="font-semibold text-xs mb-0.5">How this schedule works:</p>
                <p className="text-[11px] text-teal-800">
                  Whenever doctors are added to <strong>{facilityScheduleToEdit.name}</strong>, their default working days and consultation time slots automatically copy these settings. You, the doctor, or the hospital can still customize individual schedules anytime.
                </p>
              </div>

              {/* Working Days */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Hospital Working Days ({facilityDays.length} selected)
                  </label>
                  <div className="flex gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFacilityDays(WEEK_DAYS.slice(0, 5))}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      Mon - Fri
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFacilityDays(WEEK_DAYS.slice(0, 6))}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      Mon - Sat
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFacilityDays([...WEEK_DAYS])}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      All 7 Days
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WEEK_DAYS.map((day) => {
                    const active = facilityDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setFacilityDays(facilityDays.filter((d) => d !== day));
                          } else {
                            setFacilityDays([...facilityDays, day]);
                          }
                        }}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                          active
                            ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Standard Consultation Time Slots */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Default Consultation Slots ({facilitySlots.length} active)
                  </label>
                  <div className="flex gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFacilitySlots([...DEFAULT_PRESET_SLOTS])}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      All (8 AM - 6 PM)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFacilitySlots([...STANDARD_BUSINESS_SLOTS])}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      Standard (9 AM - 5 PM)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFacilitySlots([...MORNING_SLOTS])}
                      className="text-teal-600 font-bold hover:underline"
                    >
                      Morning (8 AM - 12 PM)
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setFacilitySlots([])}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl max-h-48 overflow-y-auto">
                  {DEFAULT_PRESET_SLOTS.map((slot) => {
                    const active = facilitySlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          if (active) {
                            setFacilitySlots(facilitySlots.filter((s) => s !== slot));
                          } else {
                            setFacilitySlots([...facilitySlots, slot]);
                          }
                        }}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all text-center ${
                          active
                            ? 'bg-teal-100 border-teal-400 text-teal-800 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFacilityScheduleToEdit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingFacilitySchedule}
                onClick={handleSaveFacilitySchedule}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                {isSubmittingFacilitySchedule ? 'Saving...' : 'Save Default Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DOCTOR CONFIRMATION IN HOSPITAL */}
      {doctorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Doctor</h3>
                <p className="text-xs text-slate-500">Permanent action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-slate-900">Dr. {doctorToDelete.name}</span> from this facility and platform?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingDoctor}
                onClick={handleDeleteDoctorInHospital}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeletingDoctor ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
