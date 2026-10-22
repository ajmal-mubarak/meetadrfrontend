import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  Calendar,
  Clock,
  X,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  GraduationCap,
  Users,
  CheckSquare,
  Square,
  Filter,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { Doctor } from '../../types';
import { useToast } from '../../context/ToastContext';
import { ImageUpload } from '../../components/common/ImageUpload';
import { DEFAULT_DOCTOR_AVATAR } from '../../utils/avatar';

import {
  WEEK_DAYS,
  DEFAULT_PRESET_SLOTS,
  MORNING_SLOTS,
  STANDARD_BUSINESS_SLOTS,
} from '../../constants/schedule';

export const AdminDoctorsManage: React.FC = () => {
  const { showToast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Deactivated' | 'Pending'>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');

  // Bulk Selection
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Modals
  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);

  // Add Doctor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    name_ar: '',
    specialty: '',
    location: 'Dubai',
    facilityId: '',
    consultation_fee: '' as string | number,
    experience_years: '' as string | number,
    education: '',
    about: '',
    photo: '',
    username: '',
    password: '',
    available_days: WEEK_DAYS.slice(0, 5) as string[],
    standard_slots: DEFAULT_PRESET_SLOTS as string[],
  });

  // Edit Doctor Modal
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    name_ar: '',
    specialty: '',
    location: 'Dubai',
    facilityId: '',
    consultation_fee: 200,
    experience_years: 5,
    education: '',
    about: '',
    photo: '',
    available_days: WEEK_DAYS.slice(0, 5) as string[],
    standard_slots: DEFAULT_PRESET_SLOTS as string[],
  });

  // Delete Confirmation Modal
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load doctors & facilities
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docs, provs] = await Promise.all([
        realAdminService.getDoctors(),
        realAdminService.getProviders(),
      ]);
      setDoctors(docs);
      setProviders(provs);
    } catch (err: any) {
      showToast(err.message || 'Failed to load doctors list', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Specialties list for filter
  const specialties = useMemo(() => {
    const set = new Set<string>();
    doctors.forEach((d) => {
      if (d.specialty) set.add(d.specialty);
    });
    return Array.from(set).sort();
  }, [doctors]);

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Status
      if (statusFilter !== 'all') {
        const isDocActive = doc.status === 'Active' || doc.isActive;
        if (statusFilter === 'Active' && !isDocActive) return false;
        if (statusFilter === 'Deactivated' && (isDocActive || !doc.isVerified)) return false;
        if (statusFilter === 'Pending' && doc.isVerified) return false;
      }

      // Facility
      if (facilityFilter !== 'all') {
        if (facilityFilter === 'independent') {
          if (doc.hospitalId || doc.hospitalName) return false;
        } else {
          if (doc.hospitalId !== facilityFilter && doc.hospitalName !== facilityFilter) return false;
        }
      }

      // Specialty
      if (specialtyFilter !== 'all') {
        if (doc.specialty !== specialtyFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesSpecialty = (doc.specialty || '').toLowerCase().includes(q);
        const matchesLocation = (doc.location || '').toLowerCase().includes(q);
        const matchesFacility = (doc.hospitalName || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSpecialty && !matchesLocation && !matchesFacility) {
          return false;
        }
      }

      return true;
    });
  }, [doctors, statusFilter, facilityFilter, specialtyFilter, searchQuery]);

  // Bulk Selection
  const handleToggleSelectAll = () => {
    if (selectedDoctorIds.length === filteredDoctors.length) {
      setSelectedDoctorIds([]);
    } else {
      setSelectedDoctorIds(filteredDoctors.map((d) => d.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'verify' | 'deactivate' | 'delete') => {
    if (selectedDoctorIds.length === 0) return;

    if (action === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete ${selectedDoctorIds.length} doctors? This action cannot be undone.`
      );
      if (!confirmDelete) return;
    }

    setIsBulkProcessing(true);
    try {
      const res = await realAdminService.bulkDoctorAction(selectedDoctorIds, action);
      showToast(res.message || `Bulk ${action} completed successfully.`, 'success');
      setSelectedDoctorIds([]);
      await loadData();
    } catch (err: any) {
      showToast(err.message || `Failed to perform bulk ${action}.`, 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Add Doctor
  const handleOpenAddModal = () => {
    setAddForm({
      name: '',
      name_ar: '',
      specialty: '',
      location: 'Dubai',
      facilityId: '',
      consultation_fee: '',
      experience_years: '',
      education: '',
      about: '',
      photo: '',
      username: '',
      password: '',
      available_days: WEEK_DAYS.slice(0, 5),
      standard_slots: [...DEFAULT_PRESET_SLOTS],
    });
    setIsAddModalOpen(true);
  };

  const handleFacilityChangeInAdd = (facilityId: string) => {
    const prov = providers.find((p) => p.id === facilityId);
    const defDays = prov?.defaultAvailableDays || prov?.default_available_days || WEEK_DAYS.slice(0, 5);
    const defSlots = prov?.defaultStandardSlots || prov?.default_standard_slots || DEFAULT_PRESET_SLOTS;
    setAddForm((prev) => ({
      ...prev,
      facilityId,
      available_days: [...defDays],
      standard_slots: [...defSlots],
    }));
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.specialty.trim() || !addForm.location.trim()) {
      showToast('Doctor name, specialty, and location are required.', 'error');
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const selectedFacilityItem = providers.find((p) => p.id === addForm.facilityId);
      const isHospital = (selectedFacilityItem as any)?.type === 'hospital' || selectedFacilityItem?.providerCategory === 'Hospital';
      const isClinic = (selectedFacilityItem as any)?.type === 'clinic' || selectedFacilityItem?.providerCategory === 'Clinic';

      const created = await realAdminService.createDoctor({
        name: addForm.name.trim(),
        name_ar: addForm.name_ar.trim() || undefined,
        specialty: addForm.specialty.trim(),
        location: addForm.location.trim(),
        facility_id: addForm.facilityId || undefined,
        hospital_id: isHospital ? addForm.facilityId : undefined,
        clinic_id: isClinic ? addForm.facilityId : undefined,
        consultation_fee: Number(addForm.consultation_fee) || 200,
        experience_years: Number(addForm.experience_years) || 1,
        education: addForm.education.trim() || 'MBBS',
        about: addForm.about.trim() || undefined,
        photo: addForm.photo.trim() || undefined,
        username: addForm.username.trim() || undefined,
        email: addForm.username.trim() || undefined,
        password: addForm.password.trim() || undefined,
        available_days: addForm.available_days,
        standard_slots: addForm.standard_slots,
      });

      setDoctors((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      showToast(`Doctor Dr. ${created.name} added successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to add doctor.', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit Doctor
  const handleOpenEditModal = (doctor: Doctor) => {
    setDoctorToEdit(doctor);
    const docDays = (doctor as any).availableDays || (doctor as any).available_days;
    const docSlots = (doctor as any).standardSlots || (doctor as any).standard_slots || (doctor as any).availableSlots;

    setEditForm({
      name: doctor.name || '',
      name_ar: (doctor as any).name_ar || '',
      specialty: doctor.specialty || '',
      location: doctor.location || 'Dubai',
      facilityId: doctor.hospitalId || (doctor as any).facility_id || '',
      consultation_fee: doctor.consultationFee || 200,
      experience_years: doctor.experienceYears || 5,
      education: doctor.education || '',
      about: doctor.about || '',
      photo: doctor.photo || '',
      available_days: Array.isArray(docDays) && docDays.length > 0 ? [...docDays] : WEEK_DAYS.slice(0, 5),
      standard_slots: Array.isArray(docSlots) && docSlots.length > 0 ? [...docSlots] : [...DEFAULT_PRESET_SLOTS],
    });
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorToEdit) return;
    if (!editForm.name.trim() || !editForm.specialty.trim()) {
      showToast('Doctor name and specialty are required.', 'error');
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const selectedFacilityItem = providers.find((p) => p.id === editForm.facilityId);
      const isHospital = (selectedFacilityItem as any)?.type === 'hospital' || selectedFacilityItem?.providerCategory === 'Hospital';
      const isClinic = (selectedFacilityItem as any)?.type === 'clinic' || selectedFacilityItem?.providerCategory === 'Clinic';

      const updated = await realAdminService.updateDoctor(doctorToEdit.id, {
        name: editForm.name.trim(),
        name_ar: editForm.name_ar.trim() || undefined,
        specialty: editForm.specialty.trim(),
        location: editForm.location.trim(),
        hospital_id: isHospital ? editForm.facilityId : (editForm.facilityId ? editForm.facilityId : null),
        clinic_id: isClinic ? editForm.facilityId : null,
        consultation_fee: Number(editForm.consultation_fee) || 200,
        experience_years: Number(editForm.experience_years) || 1,
        education: editForm.education.trim() || 'MBBS',
        about: editForm.about.trim() || undefined,
        photo: editForm.photo.trim() || undefined,
        available_days: editForm.available_days,
        standard_slots: editForm.standard_slots,
      });

      setDoctors((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      if (viewDoctor && viewDoctor.id === updated.id) {
        setViewDoctor(updated);
      }
      setDoctorToEdit(null);
      showToast(`Dr. ${updated.name} updated successfully.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update doctor.', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Toggle Doctor Active / Deactivate
  const handleToggleDoctorStatus = async (doctor: Doctor) => {
    const isCurrentlyActive = doctor.status === 'Active' || doctor.isActive;
    const targetStatus = isCurrentlyActive ? 'Deactivated' : 'Active';

    try {
      await realAdminService.updateDoctorStatus(doctor.id, targetStatus);
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctor.id
            ? { ...d, status: targetStatus, isActive: targetStatus === 'Active' }
            : d
        )
      );
      if (viewDoctor && viewDoctor.id === doctor.id) {
        setViewDoctor({ ...viewDoctor, status: targetStatus, isActive: targetStatus === 'Active' });
      }
      showToast(`Doctor has been ${targetStatus.toLowerCase()}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to change status.', 'error');
    }
  };

  // Delete Single Doctor
  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    try {
      await realAdminService.deleteDoctor(doctorToDelete.id);
      setDoctors((prev) => prev.filter((d) => d.id !== doctorToDelete.id));
      setSelectedDoctorIds((prev) => prev.filter((id) => id !== doctorToDelete.id));
      if (viewDoctor && viewDoctor.id === doctorToDelete.id) {
        setViewDoctor(null);
      }
      showToast(`Dr. ${doctorToDelete.name} has been deleted.`, 'success');
      setDoctorToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete doctor.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Doctors Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Add, edit, deactivate, or delete doctors with bulk management tools
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-teal-600/20"
        >
          <Plus className="w-4 h-4" />
          Add New Doctor
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, specialty, facility, or emirate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              aria-label="Filter doctors by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="Active">Active</option>
              <option value="Deactivated">Deactivated</option>
              <option value="Pending">Pending Verification</option>
            </select>
          </div>

          {/* Specialty Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <span>Specialty:</span>
            <select
              aria-label="Filter doctors by specialty"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">All Specialties</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Facility Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <span>Practice:</span>
            <select
              aria-label="Filter doctors by facility practice"
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Practices</option>
              <option value="independent">Independent</option>
              {providers.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Floating / Active Bulk Selection Bar */}
      {selectedDoctorIds.length > 0 && (
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-teal-500/30 flex items-center justify-center text-xs font-bold border border-teal-400/50">
              {selectedDoctorIds.length}
            </span>
            <span className="text-sm font-semibold">
              {selectedDoctorIds.length} {selectedDoctorIds.length === 1 ? 'doctor' : 'doctors'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBulkProcessing}
              onClick={() => handleBulkAction('verify')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Bulk Verify / Activate
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
              onClick={() => setSelectedDoctorIds([])}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Doctors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    aria-label={selectedDoctorIds.length === filteredDoctors.length && filteredDoctors.length > 0 ? 'Deselect all doctors' : 'Select all doctors'}
                    className="text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    {selectedDoctorIds.length === filteredDoctors.length && filteredDoctors.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Specialty</th>
                <th className="py-3.5 px-4">Affiliation / Facility</th>
                <th className="py-3.5 px-4">Experience & Fee</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500 font-medium">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      Loading doctors directory...
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-base font-bold text-slate-700">No doctors match your criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try broadening your search query or reset the filters
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSelected = selectedDoctorIds.includes(doc.id);
                  const isDocActive = doc.status === 'Active' || doc.isActive;

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-teal-50/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectOne(doc.id)}
                          aria-label={`Select doctor ${doc.name}`}
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
                          <img
                            src={doc.photo || DEFAULT_DOCTOR_AVATAR}
                            alt={doc.name}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_DOCTOR_AVATAR;
                            }}
                          />
                          <div>
                            <div
                              onClick={() => setViewDoctor(doc)}
                              className="font-bold text-slate-900 hover:text-teal-600 transition-colors cursor-pointer"
                            >
                              Dr. {doc.name}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{doc.location || 'Dubai'}</span>
                              {doc.isVerified && (
                                <span className="text-emerald-600 flex items-center gap-0.5 text-[10px] font-bold ml-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                          {doc.specialty}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs">
                          {doc.hospitalName ? (
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[160px]">{doc.hospitalName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium italic">Independent</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            {doc.experienceYears || 1} yrs experience
                          </div>
                          <div className="text-teal-700 font-bold">
                            AED {doc.consultationFee || 200}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isDocActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDocActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {isDocActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewDoctor(doc)}
                            title="View Doctor Details"
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(doc)}
                            title="Edit Doctor"
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleDoctorStatus(doc)}
                            title={isDocActive ? 'Deactivate Doctor' : 'Activate Doctor'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDocActive
                                ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {isDocActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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

      {/* VIEW DOCTOR MODAL */}
      {viewDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={viewDoctor.photo || DEFAULT_DOCTOR_AVATAR}
                  alt={viewDoctor.name}
                  className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                />
                <div>
                  <h3 className="text-xl font-black text-slate-900">Dr. {viewDoctor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold">
                      {viewDoctor.specialty}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {viewDoctor.location}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDoctor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Practice Affiliation</span>
                <div className="font-bold text-slate-800 mt-1">
                  {viewDoctor.hospitalName || 'Independent Practice'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Consultation Fee</span>
                <div className="font-bold text-teal-700 mt-1">AED {viewDoctor.consultationFee || 200}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Experience</span>
                <div className="font-bold text-slate-800 mt-1">{viewDoctor.experienceYears || 1} Years</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Verification Status</span>
                <div className="font-bold text-slate-800 mt-1">
                  {viewDoctor.isVerified ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">Pending Verification</span>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Schedule info */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Weekly Consultation Schedule</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(((viewDoctor as any).availableDays || (viewDoctor as any).available_days) || WEEK_DAYS.slice(0, 5)).map(
                  (day: string) => (
                    <span
                      key={day}
                      className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-semibold"
                    >
                      {day.slice(0, 3)}
                    </span>
                  )
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                {(((viewDoctor as any).standardSlots || (viewDoctor as any).standard_slots || (viewDoctor as any).availableSlots) || []).length > 0 ? (
                  <span>
                    Consulting hours:{' '}
                    <strong className="text-slate-700">
                      {(((viewDoctor as any).standardSlots || (viewDoctor as any).standard_slots || (viewDoctor as any).availableSlots) || []).length} active slots per day
                    </strong>
                  </span>
                ) : (
                  <span>Standard 9:00 AM - 5:00 PM consultations</span>
                )}
              </div>
            </div>

            {viewDoctor.about && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-medium block mb-1">Biography / About</span>
                <p className="text-slate-700 leading-relaxed">{viewDoctor.about}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const doc = viewDoctor;
                  setViewDoctor(null);
                  handleOpenEditModal(doc);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setViewDoctor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD DOCTOR MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
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
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Doctor Photo</label>
                <ImageUpload
                  value={addForm.photo}
                  onChange={(url) => setAddForm({ ...addForm, photo: url })}
                  placeholder="Upload professional doctor portrait"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Full Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Name (Arabic)</label>
                  <input
                    type="text"
                    placeholder="e.g. د. سارة جنكينز"
                    value={addForm.name_ar}
                    onChange={(e) => setAddForm({ ...addForm, name_ar: e.target.value })}
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
                    placeholder="e.g. Cardiology"
                    value={addForm.specialty}
                    onChange={(e) => setAddForm({ ...addForm, specialty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emirate / City *</label>
                  <select
                    value={addForm.location}
                    onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation</label>
                <select
                  value={addForm.facilityId}
                  onChange={(e) => handleFacilityChangeInAdd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                >
                  <option value="">Independent</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.providerCategory || 'Facility'}) — {p.location}
                    </option>
                  ))}
                </select>
                {addForm.facilityId && (
                  <p className="text-[11px] text-teal-600 font-medium mt-1">
                    Default schedule inherited from selected facility. You can customize below.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultation Fee (AED)</label>
                  <input
                    type="number"
                    min="50"
                    placeholder="e.g. 200"
                    value={addForm.consultation_fee}
                    onChange={(e) => setAddForm({ ...addForm, consultation_fee: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={addForm.experience_years}
                    onChange={(e) => setAddForm({ ...addForm, experience_years: e.target.value === '' ? '' : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Degrees / Education</label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD"
                    value={addForm.education}
                    onChange={(e) => setAddForm({ ...addForm, education: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">About Doctor</label>
                <textarea
                  rows={3}
                  placeholder="Doctor's clinical background and subspecialties..."
                  value={addForm.about}
                  onChange={(e) => setAddForm({ ...addForm, about: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Weekly Availability Schedule */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    Doctor Weekly Schedule & Consultation Slots
                  </span>
                  {addForm.facilityId && (
                    <button
                      type="button"
                      onClick={() => handleFacilityChangeInAdd(addForm.facilityId)}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      Reset to Facility Default
                    </button>
                  )}
                </div>

                {/* Days */}
                <div className="mb-3">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Available Days
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEK_DAYS.map((day) => {
                      const selected = (addForm.available_days || []).includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const cur = addForm.available_days || [];
                            const next = selected ? cur.filter((d) => d !== day) : [...cur, day];
                            setAddForm({ ...addForm, available_days: next });
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                            selected
                              ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slots */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Consultation Slots ({(addForm.standard_slots || []).length} active)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setAddForm({ ...addForm, standard_slots: [...DEFAULT_PRESET_SLOTS] })}
                        className="text-[10px] text-teal-700 hover:underline font-semibold"
                      >
                        All (8 AM - 6 PM)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setAddForm({ ...addForm, standard_slots: [...STANDARD_BUSINESS_SLOTS] })}
                        className="text-[10px] text-teal-700 hover:underline font-semibold"
                      >
                        Standard (9 AM - 5 PM)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setAddForm({ ...addForm, standard_slots: [...MORNING_SLOTS] })}
                        className="text-[10px] text-teal-700 hover:underline font-semibold"
                      >
                        Morning (8 AM - 12 PM)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setAddForm({ ...addForm, standard_slots: [] })}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {DEFAULT_PRESET_SLOTS.map((slot) => {
                      const active = (addForm.standard_slots || []).includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            const cur = addForm.standard_slots || [];
                            const next = active ? cur.filter((s) => s !== slot) : [...cur, slot];
                            setAddForm({ ...addForm, standard_slots: next });
                          }}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors ${
                            active
                              ? 'bg-teal-100 border-teal-300 text-teal-800 font-bold'
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

              {/* Login Credentials */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Doctor Account Credentials (Optional login setup)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Username / Email
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. dr.sarah or sarah@hospital.com"
                      value={addForm.username}
                      onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
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

      {/* EDIT DOCTOR MODAL */}
      {doctorToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Edit Doctor: Dr. {doctorToEdit.name}</h3>
                  <p className="text-xs text-slate-500">Update medical credentials, affiliation, and fee</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDoctorToEdit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Doctor Photo</label>
                <ImageUpload
                  value={editForm.photo}
                  onChange={(url) => setEditForm({ ...editForm, photo: url })}
                  placeholder="Update doctor portrait"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Full Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Name (Arabic)</label>
                  <input
                    type="text"
                    value={editForm.name_ar}
                    onChange={(e) => setEditForm({ ...editForm, name_ar: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
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
                    value={editForm.specialty}
                    onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Emirate / City *</label>
                  <select
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  >
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Umm Al Quwain">Umm Al Quwain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation</label>
                <select
                  value={editForm.facilityId}
                  onChange={(e) => setEditForm({ ...editForm, facilityId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  <option value="">Independent</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.providerCategory || 'Facility'}) — {p.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consultation Fee (AED)</label>
                  <input
                    type="number"
                    min="50"
                    value={editForm.consultation_fee}
                    onChange={(e) => setEditForm({ ...editForm, consultation_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.experience_years}
                    onChange={(e) => setEditForm({ ...editForm, experience_years: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Degrees / Education</label>
                  <input
                    type="text"
                    value={editForm.education}
                    onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">About Doctor</label>
                <textarea
                  rows={3}
                  value={editForm.about}
                  onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Weekly Availability Schedule */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Doctor Weekly Schedule & Consultation Slots
                  </span>
                  {editForm.facilityId && (
                    <button
                      type="button"
                      onClick={() => {
                        const prov = providers.find((p) => p.id === editForm.facilityId);
                        const defDays = prov?.defaultAvailableDays || prov?.default_available_days || WEEK_DAYS.slice(0, 5);
                        const defSlots = prov?.defaultStandardSlots || prov?.default_standard_slots || DEFAULT_PRESET_SLOTS;
                        setEditForm({ ...editForm, available_days: [...defDays], standard_slots: [...defSlots] });
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      Reset to Facility Default
                    </button>
                  )}
                </div>

                {/* Days */}
                <div className="mb-3">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Available Days
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEK_DAYS.map((day) => {
                      const selected = (editForm.available_days || []).includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const cur = editForm.available_days || [];
                            const next = selected ? cur.filter((d) => d !== day) : [...cur, day];
                            setEditForm({ ...editForm, available_days: next });
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                            selected
                              ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slots */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Consultation Slots ({(editForm.standard_slots || []).length} active)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, standard_slots: [...DEFAULT_PRESET_SLOTS] })}
                        className="text-[10px] text-amber-700 hover:underline font-semibold"
                      >
                        All (8 AM - 6 PM)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, standard_slots: [...STANDARD_BUSINESS_SLOTS] })}
                        className="text-[10px] text-amber-700 hover:underline font-semibold"
                      >
                        Standard (9 AM - 5 PM)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, standard_slots: [...MORNING_SLOTS] })}
                        className="text-[10px] text-amber-700 hover:underline font-semibold"
                      >
                        Morning (8 AM - 12 PM)
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setEditForm({ ...editForm, standard_slots: [] })}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {DEFAULT_PRESET_SLOTS.map((slot) => {
                      const active = (editForm.standard_slots || []).includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            const cur = editForm.standard_slots || [];
                            const next = active ? cur.filter((s) => s !== slot) : [...cur, slot];
                            setEditForm({ ...editForm, standard_slots: next });
                          }}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors ${
                            active
                              ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
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
                  onClick={() => setDoctorToEdit(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
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
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-900">Dr. {doctorToDelete.name}</span>? This will remove their profile and disassociate all booking references.
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
                disabled={isDeleting}
                onClick={handleDeleteDoctor}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
