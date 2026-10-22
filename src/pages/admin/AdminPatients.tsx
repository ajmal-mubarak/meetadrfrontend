import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Building2,
  Stethoscope,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  Eye,
  X,
  Clock,
  Download,
  Activity,
  UserCheck,
  ChevronRight,
  Filter,
  CheckSquare,
  Square,
  AlertCircle,
  Heart,
  Droplet,
  FileText,
} from 'lucide-react';
import { realAdminService, AdminPatientItem, AdminPatientDetail, ProviderItem } from '../../services/realAdminService';
import { Doctor } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminPatients: React.FC = () => {
  const { showToast } = useToast();

  const [patients, setPatients] = useState<AdminPatientItem[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View mode: 'all' | 'by-hospital' | 'by-doctor'
  const [viewMode, setViewMode] = useState<'all' | 'by-hospital' | 'by-doctor'>('all');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Bulk Selection
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);

  // Patient Detail Modal
  const [activePatient, setActivePatient] = useState<AdminPatientDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [patientsData, providersData, doctorsData] = await Promise.all([
          realAdminService.getPatients(),
          realAdminService.getProviders(),
          realAdminService.getDoctors(),
        ]);
        setPatients(patientsData);
        setProviders(providersData);
        setDoctors(doctorsData);
      } catch (err: any) {
        showToast(err.message || 'Failed to load patients data', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter patients on hospital/doctor/search change
  const fetchFilteredPatients = async (hospitalId?: string, doctorId?: string, search?: string) => {
    setIsLoading(true);
    try {
      const data = await realAdminService.getPatients({
        hospital_id: hospitalId || undefined,
        doctor_id: doctorId || undefined,
        search: search || undefined,
      });
      setPatients(data);
      setSelectedPatientIds([]);
    } catch (err: any) {
      showToast(err.message || 'Failed to filter patients', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHospitalChange = (id: string) => {
    setSelectedHospitalId(id);
    fetchFilteredPatients(id, undefined, searchQuery);
  };

  const handleDoctorChange = (id: string) => {
    setSelectedDoctorId(id);
    fetchFilteredPatients(undefined, id, searchQuery);
  };

  const handleViewModeChange = (mode: 'all' | 'by-hospital' | 'by-doctor') => {
    setViewMode(mode);
    setSelectedPatientIds([]);
    if (mode === 'all') {
      setSelectedHospitalId('');
      setSelectedDoctorId('');
      fetchFilteredPatients(undefined, undefined, searchQuery);
    } else if (mode === 'by-hospital') {
      setSelectedDoctorId('');
      if (providers.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(providers[0].id);
        fetchFilteredPatients(providers[0].id, undefined, searchQuery);
      }
    } else if (mode === 'by-doctor') {
      setSelectedHospitalId('');
      if (doctors.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(doctors[0].id);
        fetchFilteredPatients(undefined, doctors[0].id, searchQuery);
      }
    }
  };

  // Local filtered list for search & gender
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (genderFilter !== 'all') {
        const pGender = (p.gender || '').toLowerCase();
        if (genderFilter === 'male' && pGender !== 'male') return false;
        if (genderFilter === 'female' && pGender !== 'female') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesEmail = (p.email || '').toLowerCase().includes(q);
        const matchesPhone = (p.phone || '').includes(q);
        const matchesLocation = (p.location || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [patients, genderFilter, searchQuery]);

  // Bulk selection handlers
  const handleToggleSelectAll = () => {
    if (selectedPatientIds.length === filteredPatients.length) {
      setSelectedPatientIds([]);
    } else {
      setSelectedPatientIds(filteredPatients.map((p) => p.id));
    }
  };

  const handleToggleSelectPatient = (id: string) => {
    setSelectedPatientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportSelected = () => {
    const selected = filteredPatients.filter((p) => selectedPatientIds.includes(p.id));
    if (selected.length === 0) {
      showToast('Please select at least one patient to export.', 'info');
      return;
    }
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Gender', 'Blood Group', 'Total Appointments', 'Created At'];
    const rows = selected.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.email || '',
      p.phone || '',
      p.gender || '',
      p.blood_group || '',
      p.total_appointments || 0,
      p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patients_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${selected.length} patients to CSV.`, 'success');
  };

  // View patient detail
  const handleOpenDetail = async (patient: AdminPatientItem) => {
    setIsLoadingDetail(true);
    setActivePatient({ ...patient, appointments: [], dependents: [] });
    try {
      const detail = await realAdminService.getPatientDetail(patient.id);
      setActivePatient(detail);
    } catch {
      setActivePatient({ ...patient, appointments: [], dependents: [] });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Patient Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Centralized patient directory with multi-tier filtering by facility, doctor, or global records
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleViewModeChange('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'all'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Patients ({patients.length})
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('by-hospital')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'by-hospital'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            By Medical Facility
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('by-doctor')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'by-doctor'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            By Doctor
          </button>
        </div>
      </div>

      {/* Sub-Header Drilldown: Hospital or Doctor selection */}
      {viewMode === 'by-hospital' && (
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">Filter by Hospital or Clinic</h3>
                <p className="text-xs text-emerald-700">Select a healthcare facility to review all its registered and visiting patients</p>
              </div>
            </div>

            <div className="w-full md:w-80">
              <select
                aria-label="Filter patients by hospital or clinic"
                value={selectedHospitalId}
                onChange={(e) => handleHospitalChange(e.target.value)}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.providerCategory || 'Facility'}) — {p.location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'by-doctor' && (
        <div className="bg-sky-50/60 border border-sky-200/80 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-sky-950">Filter by Attending Doctor</h3>
                <p className="text-xs text-sky-700">Select a doctor to view their patient consultations and medical bookings</p>
              </div>
            </div>

            <div className="w-full md:w-80">
              <select
                aria-label="Filter patients by attending doctor"
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full bg-white border border-sky-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.specialty} ({d.hospitalName || 'Independent'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patient name, email, phone, or emirate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
          >
          </input>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Gender:</span>
            <select
              aria-label="Filter patients by gender"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {selectedPatientIds.length > 0 && (
            <button
              type="button"
              onClick={handleExportSelected}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export ({selectedPatientIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Floating / Active Bulk Selection Notice */}
      {selectedPatientIds.length > 0 && (
        <div className="bg-teal-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center text-xs font-bold border border-teal-400/50">
              {selectedPatientIds.length}
            </span>
            <span className="text-sm font-semibold">
              {selectedPatientIds.length} {selectedPatientIds.length === 1 ? 'patient' : 'patients'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSelected}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setSelectedPatientIds([])}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    aria-label={selectedPatientIds.length === filteredPatients.length && filteredPatients.length > 0 ? 'Deselect all patients' : 'Select all patients'}
                    className="text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    {selectedPatientIds.length === filteredPatients.length && filteredPatients.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Patient Profile</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Medical Demographics</th>
                <th className="py-3.5 px-4 text-center">Appointments</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500 font-medium">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      Loading patient records...
                    </div>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-base font-bold text-slate-700">No patients found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchQuery
                        ? 'Try modifying your search criteria or clearing filters'
                        : 'No patient accounts have booked with the selected filter criteria yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const isSelected = selectedPatientIds.includes(patient.id);
                  const initial = patient.name ? patient.name.charAt(0).toUpperCase() : 'P';

                  return (
                    <tr
                      key={patient.id}
                      className={`hover:bg-teal-50/40 transition-colors ${
                        isSelected ? 'bg-teal-50/70' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectPatient(patient.id)}
                          aria-label={`Select patient ${patient.name}`}
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
                          <div className="w-9 h-9 rounded-xl bg-teal-100/70 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-200 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-teal-600 transition-colors cursor-pointer" onClick={() => handleOpenDetail(patient)}>
                              {patient.name}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>ID: {patient.id.slice(0, 8)}</span>
                              {patient.is_verified && (
                                <span className="inline-flex items-center text-emerald-600 font-semibold gap-0.5 text-[10px]">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{patient.email || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span dir="ltr">{patient.phone || '—'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {patient.gender && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium capitalize">
                              {patient.gender}
                            </span>
                          )}
                          {patient.blood_group && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200">
                              {patient.blood_group}
                            </span>
                          )}
                          {patient.location && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {patient.location}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          <Activity className="w-3 h-3 text-teal-600" />
                          {patient.total_appointments} visits
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(patient)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-bold rounded-lg text-xs transition-colors border border-slate-200 hover:border-teal-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Drawer / Modal */}
      {activePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Patient Record</h3>
                  <p className="text-xs text-slate-500">ID: {activePatient.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePatient(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Banner */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-teal-600/20 shrink-0">
                  {activePatient.name ? activePatient.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 truncate">{activePatient.name}</h2>
                    {activePatient.is_verified && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Member since {activePatient.created_at ? new Date(activePatient.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Contact & Demographics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Email Address</span>
                  <div className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-teal-600" />
                    <span>{activePatient.email || '—'}</span>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Phone Number</span>
                  <div className="font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span dir="ltr">{activePatient.phone || '—'}</span>
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Gender & Blood Group</span>
                  <div className="font-bold text-slate-800 mt-1 flex items-center gap-2">
                    <span className="capitalize">{activePatient.gender || 'Not specified'}</span>
                    {activePatient.blood_group && (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-black text-[11px]">
                        {activePatient.blood_group}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Emirate / City</span>
                  <div className="font-bold text-slate-800 mt-1">
                    {activePatient.location || 'United Arab Emirates'}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {activePatient.emergency_contact && (
                <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200">
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Heart className="w-3.5 h-3.5 text-rose-600" />
                    Emergency Contact
                  </h4>
                  <div className="text-xs text-rose-950 font-semibold">
                    {activePatient.emergency_contact}
                  </div>
                </div>
              )}

              {/* Appointment History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    Consultation & Booking History ({activePatient.appointments?.length || 0})
                  </h4>
                </div>

                {isLoadingDetail ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading appointments...</div>
                ) : !activePatient.appointments || activePatient.appointments.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                    No recorded appointments yet for this patient.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activePatient.appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-teal-300 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{apt.doctor_name}</span>
                            {apt.doctor_specialty && (
                              <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded font-semibold">
                                {apt.doctor_specialty}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{apt.facility_name || 'Medical Facility'}</span>
                            <span>•</span>
                            <span className="font-mono">ID: {apt.id.slice(0, 8)}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-semibold text-slate-700">
                            {apt.date} {apt.time_slot}
                          </div>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              apt.status === 'confirmed' || apt.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : apt.status === 'cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActivePatient(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
