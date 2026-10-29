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

  FileSpreadsheet,



} from 'lucide-react';



import { realAdminService, ProviderItem } from '../../services/realAdminService';



import { Doctor } from '../../types';



import { useToast } from '../../context/ToastContext';



import { ImageUpload } from '../../components/common/ImageUpload';



import { DEFAULT_DOCTOR_AVATAR } from '../../utils/avatar';



import { SearchableSelect } from '../../components/common/SearchableSelect';

import { BulkImportModal } from '../../components/common/BulkImportModal';



import { SearchableMultiSelect } from '../../components/common/SearchableMultiSelect';



import {



  SUPPORTING_DEPARTMENTS,



  SUPPORTING_SPECIALTIES,



  SUPPORTING_QUALIFICATIONS,



  SUPPORTING_SPECIAL_INTERESTS,



  SUPPORTING_COUNTRIES,



  SUPPORTING_LANGUAGES,



  SUPPORTING_EMIRATES,



  GENDERS,



  SUPPORTING_DIAL_CODES,



} from '../../data/supportingKeys';







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

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);



  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);



  const [addForm, setAddForm] = useState({



    first_name: '',



    last_name: '',



    name: '',



    name_ar: '',



    gender: 'Male',



    department: '',



    qualifications: [] as string[],



    specialty: 'Cardiology',



    special_interests: [] as string[],



    experience_years: '' as string | number,



    country_of_origin: 'United Arab Emirates',



    languages: ['English', 'Arabic'] as string[],



    phone_dial_code: '+971',



    contact_number: '',



    email: '',



    location: 'Dubai',



    facilityId: '',



    consultation_fee: '' as string | number,



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



    first_name: '',



    last_name: '',



    name: '',



    name_ar: '',



    gender: 'Male',



    department: '',



    qualifications: [] as string[],



    specialty: 'Cardiology',



    special_interests: [] as string[],



    experience_years: 5 as string | number,



    country_of_origin: 'United Arab Emirates',



    languages: ['English', 'Arabic'] as string[],



    phone_dial_code: '+971',



    contact_number: '',



    email: '',



    location: 'Dubai',



    facilityId: '',



    consultation_fee: 200 as string | number,



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



      first_name: '',



      last_name: '',



      name: '',



      name_ar: '',



      gender: 'Male',



      department: '',



      qualifications: [],



      specialty: 'Cardiology',



      special_interests: [],



      experience_years: '',



      country_of_origin: 'United Arab Emirates',



      languages: ['English', 'Arabic'],



      phone_dial_code: '+971',



      contact_number: '',



      email: '',



      location: 'Dubai',



      facilityId: '',



      consultation_fee: '',



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







    const rawAny = doctor as any;



    setEditForm({



      first_name: rawAny.firstName || rawAny.first_name || '',



      last_name: rawAny.lastName || rawAny.last_name || '',



      name: doctor.name || '',



      name_ar: rawAny.name_ar || '',



      gender: rawAny.gender || 'Male',



      department: rawAny.department || '',



      qualifications: Array.isArray(rawAny.qualifications) ? rawAny.qualifications : [],



      specialty: doctor.specialty || 'Cardiology',



      special_interests: Array.isArray(doctor.specialInterest) ? doctor.specialInterest : (Array.isArray(rawAny.special_interests) ? rawAny.special_interests : []),



      location: doctor.location || 'Dubai',



      facilityId: doctor.hospitalId || rawAny.facility_id || '',



      consultation_fee: doctor.consultationFee || 200,



      experience_years: doctor.experienceYears || 5,



      country_of_origin: rawAny.countryOfOrigin || rawAny.country_of_origin || 'United Arab Emirates',



      languages: Array.isArray(rawAny.languages) && rawAny.languages.length > 0 ? rawAny.languages : ['English', 'Arabic'],



      phone_dial_code: rawAny.phoneDialCode || rawAny.phone_dial_code || '+971',



      contact_number: rawAny.contactNumber || rawAny.contact_number || '',



      email: rawAny.email || '',



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







      const fullName = editForm.name.trim() || (editForm.first_name.trim() || editForm.last_name.trim() ? `Dr. ${editForm.first_name.trim()} ${editForm.last_name.trim()}`.trim() : '');



      const eduStr = editForm.qualifications.length > 0 ? editForm.qualifications.join(', ') : (editForm.education.trim() || 'MBBS');







      const updated = await realAdminService.updateDoctor(doctorToEdit.id, {



        name: fullName,



        name_ar: editForm.name_ar.trim() || undefined,



        first_name: editForm.first_name.trim(),



        last_name: editForm.last_name.trim(),



        gender: editForm.gender,



        department: editForm.department,



        qualifications: editForm.qualifications,



        special_interests: editForm.special_interests,



        country_of_origin: editForm.country_of_origin,



        languages: editForm.languages,



        phone_dial_code: editForm.phone_dial_code,



        contact_number: editForm.contact_number.trim(),



        email: editForm.email.trim(),



        specialty: editForm.specialty.trim(),



        location: editForm.location.trim(),



        hospital_id: isHospital ? editForm.facilityId : (editForm.facilityId ? editForm.facilityId : null),



        clinic_id: isClinic ? editForm.facilityId : null,



        consultation_fee: Number(editForm.consultation_fee) || 200,



        experience_years: Number(editForm.experience_years) || 1,



        education: eduStr,



        about: editForm.about.trim() || undefined,



        photo: editForm.photo.trim() || undefined,



        available_days: editForm.available_days,



        standard_slots: editForm.standard_slots,



      } as any);







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







        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Bulk Import Doctors
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm shadow-teal-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Doctor
          </button>
        </div>



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



          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">



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







      <BulkImportModal

        isOpen={isImportModalOpen}

        onClose={() => setIsImportModalOpen(false)}

        onSuccess={loadData}

        target="doctors"

        scope="admin"

      />



      {/* ADD DOCTOR MODAL */}



      {isAddModalOpen && (



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







              <div>



                <label className="block font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation *</label>



                <select



                  value={addForm.facilityId}



                  onChange={(e) => handleFacilityChangeInAdd(e.target.value)}



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



                  value={addForm.department}



                  onChange={(val) => setAddForm({ ...addForm, department: val })}



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



                    value={addForm.first_name}



                    onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Last Name *</label>



                  <input



                    type="text"



                    required



                    placeholder="e.g. Refaat"



                    value={addForm.last_name}



                    onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



                <div>



                  <SearchableSelect



                    label="Gender *"



                    placeholder="Select gender"



                    options={[...GENDERS]}



                    value={addForm.gender}



                    onChange={(val) => setAddForm({ ...addForm, gender: val })}



                    required



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Display Title / Full Name (English)</label>



                  <input



                    type="text"



                    placeholder={addForm.first_name || addForm.last_name ? `Dr. ${addForm.first_name} ${addForm.last_name}`.trim() : 'e.g. Dr. Ahmed Refaat'}



                    value={addForm.name}



                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Doctor Name (Arabic)</label>



                  <input



                    type="text"



                    placeholder="e.g. د. أحمد رفعت"



                    value={addForm.name_ar}



                    onChange={(e) => setAddForm({ ...addForm, name_ar: e.target.value })}



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



                    value={addForm.specialty}



                    onChange={(val) => setAddForm({ ...addForm, specialty: val })}



                    allowCustom



                    required



                  />



                </div>



                <div>



                  <SearchableSelect



                    label="Emirate / Location *"



                    placeholder="Select emirate..."



                    options={SUPPORTING_EMIRATES}



                    value={addForm.location}



                    onChange={(val) => setAddForm({ ...addForm, location: val })}



                    required



                  />



                </div>



              </div>







              <div>



                <SearchableMultiSelect



                  label="Qualifications & Degrees (Multi-select from Supporting Keys)"



                  placeholder="Select qualifications (e.g. MBBS, American Board, MD, CCT)..."



                  options={SUPPORTING_QUALIFICATIONS}



                  selected={addForm.qualifications}



                  onChange={(quals) => setAddForm({ ...addForm, qualifications: quals })}



                  allowCustom



                />



              </div>







              <div>



                <SearchableMultiSelect



                  label="Special Interests / Conditions (Multi-select from Health Conditions)"



                  placeholder="Select conditions or symptoms (e.g. Stroke, Arrhythmia, Heart Attack)..."



                  options={SUPPORTING_SPECIAL_INTERESTS}



                  selected={addForm.special_interests}



                  onChange={(interests) => setAddForm({ ...addForm, special_interests: interests })}



                  allowCustom



                />



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



                <div>



                  <SearchableSelect



                    label="Country of Origin"



                    placeholder="Select nationality/origin..."



                    options={SUPPORTING_COUNTRIES}



                    value={addForm.country_of_origin}



                    onChange={(val) => setAddForm({ ...addForm, country_of_origin: val })}



                    allowCustom



                  />



                </div>



                <div>



                  <SearchableMultiSelect



                    label="Languages Spoken (Multi-select)"



                    placeholder="Select languages..."



                    options={SUPPORTING_LANGUAGES}



                    selected={addForm.languages}



                    onChange={(langs) => setAddForm({ ...addForm, languages: langs })}



                    allowCustom



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">



                <div className="sm:col-span-1">



                  <SearchableSelect



                    label="Country Code+ Area (+971 - UAE)"



                    value={addForm.phone_dial_code}



                    onChange={(val) => setAddForm({ ...addForm, phone_dial_code: val })}



                    options={SUPPORTING_DIAL_CODES.map((d) => ({ value: d.code, label: d.label }))}



                    placeholder="Select dial code"



                    allowCustom



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Contact Number</label>



                  <input



                    type="text"



                    placeholder="e.g. 50 123 4567"



                    value={addForm.contact_number}



                    onChange={(e) => setAddForm({ ...addForm, contact_number: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Doctor Email</label>



                  <input



                    type="email"



                    placeholder="e.g. doctor@meetadr.ae"



                    value={addForm.email}



                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



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



                  <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>



                  <input



                    type="number"



                    min="0"



                    placeholder="e.g. 10"



                    value={addForm.experience_years}



                    onChange={(e) => setAddForm({ ...addForm, experience_years: e.target.value === '' ? '' : Number(e.target.value) })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"



                  />



                </div>



              </div>







              <div>



                <label className="block font-bold text-slate-700 mb-1">Doctor Profile / Biography</label>



                <textarea



                  rows={3}



                  placeholder="Detailed summary of doctor's clinical background and subspecialties..."



                  value={addForm.about}



                  onChange={(e) => setAddForm({ ...addForm, about: e.target.value })}



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

                      value={addForm.username}

                      onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}

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



          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">



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







              <div>



                <label className="block font-bold text-slate-700 mb-1">Hospital / Clinic Affiliation</label>



                <select



                  value={editForm.facilityId}



                  onChange={(e) => setEditForm({ ...editForm, facilityId: e.target.value })}



                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"



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



                  value={editForm.department}



                  onChange={(val) => setEditForm({ ...editForm, department: val })}



                  allowCustom



                />



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">



                <div>



                  <label className="block font-bold text-slate-700 mb-1">First Name</label>



                  <input



                    type="text"



                    placeholder="e.g. Ahmed"



                    value={editForm.first_name}



                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>



                  <input



                    type="text"



                    placeholder="e.g. Refaat"



                    value={editForm.last_name}



                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"



                  />



                </div>



                <div>



                  <SearchableSelect



                    label="Gender"



                    placeholder="Select gender"



                    options={[...GENDERS]}



                    value={editForm.gender}



                    onChange={(val) => setEditForm({ ...editForm, gender: val })}



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Display Title / Full Name (English) *</label>



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



                  <SearchableSelect



                    label="Specialty *"



                    placeholder="Select clinical specialty..."



                    options={SUPPORTING_SPECIALTIES}



                    value={editForm.specialty}



                    onChange={(val) => setEditForm({ ...editForm, specialty: val })}



                    allowCustom



                    required



                  />



                </div>



                <div>



                  <SearchableSelect



                    label="Emirate / Location *"



                    placeholder="Select emirate..."



                    options={SUPPORTING_EMIRATES}



                    value={editForm.location}



                    onChange={(val) => setEditForm({ ...editForm, location: val })}



                    required



                  />



                </div>



              </div>







              <div>



                <SearchableMultiSelect



                  label="Qualifications & Degrees (Multi-select from Supporting Keys)"



                  placeholder="Select qualifications..."



                  options={SUPPORTING_QUALIFICATIONS}



                  selected={editForm.qualifications}



                  onChange={(quals) => setEditForm({ ...editForm, qualifications: quals })}



                  allowCustom



                />



              </div>







              <div>



                <SearchableMultiSelect



                  label="Special Interests / Conditions (Multi-select from Health Conditions)"



                  placeholder="Select conditions or symptoms..."



                  options={SUPPORTING_SPECIAL_INTERESTS}



                  selected={editForm.special_interests}



                  onChange={(interests) => setEditForm({ ...editForm, special_interests: interests })}



                  allowCustom



                />



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



                <div>



                  <SearchableSelect



                    label="Country of Origin"



                    placeholder="Select nationality/origin..."



                    options={SUPPORTING_COUNTRIES}



                    value={editForm.country_of_origin}



                    onChange={(val) => setEditForm({ ...editForm, country_of_origin: val })}



                    allowCustom



                  />



                </div>



                <div>



                  <SearchableMultiSelect



                    label="Languages Spoken (Multi-select)"



                    placeholder="Select languages..."



                    options={SUPPORTING_LANGUAGES}



                    selected={editForm.languages}



                    onChange={(langs) => setEditForm({ ...editForm, languages: langs })}



                    allowCustom



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">



                <div className="sm:col-span-1">



                  <SearchableSelect



                    label="Country Code+ Area (+971 - UAE)"



                    value={editForm.phone_dial_code}



                    onChange={(val) => setEditForm({ ...editForm, phone_dial_code: val })}



                    options={SUPPORTING_DIAL_CODES.map((d) => ({ value: d.code, label: d.label }))}



                    placeholder="Select dial code"



                    allowCustom



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Contact Number</label>



                  <input



                    type="text"



                    placeholder="e.g. 50 123 4567"



                    value={editForm.contact_number}



                    onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"



                  />



                </div>



                <div>



                  <label className="block font-bold text-slate-700 mb-1">Doctor Email</label>



                  <input



                    type="email"



                    placeholder="e.g. doctor@meetadr.ae"



                    value={editForm.email}



                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}



                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"



                  />



                </div>



              </div>







              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">



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



                  <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>



                  <input



                    type="number"



                    min="0"



                    value={editForm.experience_years}



                    onChange={(e) => setEditForm({ ...editForm, experience_years: Number(e.target.value) })}



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



