import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Plus,
  Star,
  MapPin,
  Calendar,
  Clock,
  X,
  Check,
  Award,
  Download,
  FileSpreadsheet,
  LayoutGrid,
  Table as TableIcon,
  Search,
  ExternalLink,
  Eye,
  Edit3,
  Trash2,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Loader2,
  Building2,
} from 'lucide-react';
import { realFacilityAdminService } from '../../services/realFacilityAdminService';
import { Doctor } from '../../types';
import { SPECIALTIES } from '../../data/mockSpecialties';
import { useToast } from '../../context/ToastContext';

export const HospitalDoctors: React.FC = () => {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Deactivated'>('all');

  // View modal state (like in admin page)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Edit modal state
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editName, setEditName] = useState('');
  const [editSpecialty, setEditSpecialty] = useState(SPECIALTIES[0]);
  const [editSpecialInterest, setEditSpecialInterest] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [editFee, setEditFee] = useState('500');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Deactivated'>('Active');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [isUpdatingDoctor, setIsUpdatingDoctor] = useState(false);

  // Delete modal state
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [isDeletingDoctor, setIsDeletingDoctor] = useState(false);

  // Add form fields
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [specialInterestInput, setSpecialInterestInput] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [about, setAbout] = useState('');
  const [consultationFee, setConsultationFee] = useState('500');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await realFacilityAdminService.getDoctors();
      setDoctors(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load doctors roster', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (doctor: Doctor, newStatus: 'Active' | 'Deactivated') => {
    setIsUpdatingStatus(true);
    try {
      await realFacilityAdminService.updateDoctorStatus(doctor.id, newStatus);
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, status: newStatus } : d))
      );
      if (selectedDoctor && selectedDoctor.id === doctor.id) {
        setSelectedDoctor({ ...selectedDoctor, status: newStatus });
      }
      showToast(
        newStatus === 'Active'
          ? `${doctor.name} has been activated successfully.`
          : `${doctor.name} has been deactivated.`,
        newStatus === 'Active' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update doctor status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter the doctor name.', 'error');
      return;
    }

    const specialInterest = specialInterestInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });
      }

      await realFacilityAdminService.addDoctor({
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        specialty,
        special_interests: specialInterest.length > 0 ? specialInterest : ['General Consultation', 'Preventive Care'],
        experience_text: experience || '5 years',
        education: education || 'MD, Board Certified',
        consultation_fee: Number(consultationFee) || 500,
        about:
          about ||
          `${name} is a board-certified specialist dedicated to compassionate and evidence-based patient care.`,
        photo: photoUrl,
        location: 'Dubai Healthcare City',
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        standard_slots: [
          '09:00 - 09:30',
          '09:30 - 10:00',
          '10:00 - 10:30',
          '11:00 - 11:30',
          '14:00 - 14:30',
          '15:00 - 15:30',
        ],
        ...(doctorEmail ? { email: doctorEmail } : {}),
        ...(doctorPassword ? { password: doctorPassword } : {}),
      });

      showToast(`Dr. ${name} added to hospital roster successfully.`, 'success');
      setShowAddModal(false);
      setName('');
      setSpecialInterestInput('');
      setAbout('');
      setExperience('');
      setEducation('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setDoctorEmail('');
      setDoctorPassword('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add doctor', 'error');
    }
  };

  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setEditName(doctor.name);
    setEditSpecialty(doctor.specialty || SPECIALTIES[0]);
    setEditSpecialInterest((doctor.specialInterest || []).join(', '));
    setEditExperience(doctor.experience || '');
    setEditEducation(doctor.education || '');
    setEditAbout(doctor.about || '');
    setEditFee(String(doctor.consultationFee || 500));
    setEditLocation(doctor.location || '');
    setEditStatus((doctor.status as 'Active' | 'Deactivated') || 'Active');
    setEditPhotoFile(null);
    setEditPhotoPreview(doctor.photo || null);
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor || !editName.trim()) return;

    setIsUpdatingDoctor(true);
    try {
      let photoUrl: string | undefined;
      if (editPhotoFile) {
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(editPhotoFile);
        });
      }

      const specialInterest = editSpecialInterest
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await realFacilityAdminService.updateDoctor(editingDoctor.id, {
        name: editName.trim(),
        specialty: editSpecialty,
        special_interests: specialInterest,
        experience_text: editExperience.trim(),
        education: editEducation.trim(),
        about: editAbout.trim(),
        consultation_fee: Number(editFee) || 500,
        status: editStatus,
        ...(photoUrl ? { photo: photoUrl } : {}),
      });

      setDoctors((prev) =>
        prev.map((d) => (d.id === editingDoctor.id ? updated : d))
      );

      if (selectedDoctor && selectedDoctor.id === editingDoctor.id) {
        setSelectedDoctor(updated);
      }

      showToast(`Doctor ${updated.name} updated successfully.`, 'success');
      setEditingDoctor(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update doctor', 'error');
    } finally {
      setIsUpdatingDoctor(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!deletingDoctor) return;

    setIsDeletingDoctor(true);
    try {
      await realFacilityAdminService.deleteDoctor(deletingDoctor.id);
      setDoctors((prev) => prev.filter((d) => d.id !== deletingDoctor.id));

      if (selectedDoctor && selectedDoctor.id === deletingDoctor.id) {
        setSelectedDoctor(null);
      }

      showToast(`Doctor ${deletingDoctor.name} removed from roster.`, 'success');
      setDeletingDoctor(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete doctor', 'error');
    } finally {
      setIsDeletingDoctor(false);
    }
  };

  // Export Roster as Excel (.csv)
  const handleExportExcel = () => {
    const headers = ['Doctor ID', 'Name', 'Specialty (Department)', 'Special Interest (Health Conditions)', 'Experience', 'Rating', 'Status', 'Hospital', 'Active Slots'];
    const rows = doctors.map((doc) => [
      `"${doc.id}"`,
      `"${doc.name}"`,
      `"${doc.specialty}"`,
      `"${(doc.specialInterest || ['General Care']).join('; ')}"`,
      `"${doc.experience}"`,
      `"${doc.rating}"`,
      `"${doc.status || 'Active'}"`,
      `"${doc.hospitalName || 'Hospital Network'}"`,
      `"${doc.availableSlots.length} slots"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Hospital_Doctors_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Excel/CSV roster downloaded successfully.', 'success');
  };

  // Export Roster as Printable PDF
  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocked. Please allow popups to download PDF.', 'error');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hospital Medical Staff Roster - PDF Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; }
            h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; color: #0891b2; }
            p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; font-weight: 700; color: #475569; }
            td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600; }
            .badge-interest { display: inline-block; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #334155; margin-right: 4px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>Hospital Medical Staff Roster</h1>
          <p>Official Specialist Registry & Clinical Departments • Generated: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Specialty (Department)</th>
                <th>Special Interest (Health Conditions)</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Active Slots</th>
              </tr>
            </thead>
            <tbody>
              ${doctors
                .map(
                  (doc) => `
                <tr>
                  <td><strong>${doc.name}</strong></td>
                  <td><span class="badge">${doc.specialty}</span></td>
                  <td>${(doc.specialInterest || ['General Practice']).map((si) => `<span class="badge-interest">${si}</span>`).join(' ')}</td>
                  <td>${doc.experience}</td>
                  <td>${doc.status || 'Active'}</td>
                  <td>${doc.availableSlots.length} daily slots</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    showToast('Hospital PDF report opened for printing/saving.', 'info');
  };

  const filteredDocs = doctors.filter((d) => {
    const docStatus = d.status || 'Active';
    if (statusFilter !== 'all' && docStatus !== statusFilter) return false;

    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      (d.specialInterest && d.specialInterest.some((si) => si.toLowerCase().includes(q))) ||
      d.id.toLowerCase().includes(q)
    );
  });

  const activeCount = doctors.filter((d) => (d.status || 'Active') === 'Active').length;
  const deactivatedCount = doctors.filter((d) => d.status === 'Deactivated').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Hospital Medical Staff</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
              {doctors.length} Doctors
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage practicing specialists, hospital affiliations, departments, and consultation schedules.
          </p>
        </div>

        {/* Action Controls: Status filter, Search, View Mode, Export, Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Pills Filter */}
          <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({doctors.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'Active'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Deactivated')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'Deactivated'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deactivated ({deactivatedCount})
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search doctor, specialty, conditions..."
              className="pl-8 pr-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-xs focus:outline-none focus:border-[#2DA7B5] focus:bg-white w-52 transition-all"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2EBF0]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#0E7490] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#0E7490] shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Download Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white hover:bg-[#F8FAFC] border border-[#E2EBF0] text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download Roster Excel (CSV)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3 py-2 bg-white hover:bg-[#F8FAFC] border border-[#E2EBF0] text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download/Print PDF"
          >
            <Download className="w-3.5 h-3.5 text-[#2DA7B5]" />
            <span>PDF</span>
          </button>

          {/* Add Doctor Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="border-b border-[#E2EBF0] text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Specialty (Department)</th>
                  <th className="py-3 px-4">Special Interest (Health Conditions)</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Fee (AED)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rtl:text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading medical staff roster...
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No doctors found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    const isDocActive = (doc.status || 'Active') === 'Active';
                    return (
                      <tr key={doc.id} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* Doctor Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={doc.photo}
                              alt={doc.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#E2EBF0] shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">{doc.name}</p>
                              {doc.reviewCount > 0 ? (
                                <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5">
                                  <Star className="w-3 h-3 fill-amber-500" />
                                  <span className="font-bold">{Number(doc.rating).toFixed(1)}</span>
                                  <span className="text-slate-400">({doc.reviewCount})</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                  <span>No reviews yet</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 1: Specialty (Linked to Department) */}
                        <td className="py-3.5 px-4">
                          <Link
                            to="/specialties"
                            className="inline-flex items-center gap-1 font-bold text-[#0E7490] hover:text-[#08596F] bg-[#E8F6F8] border border-[#CDEBF0] px-2.5 py-1 rounded-lg transition-colors group"
                            title="View Department"
                          >
                            <span>{doc.specialty}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                          </Link>
                        </td>

                        {/* Column 2: Special Interest */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                            {(doc.specialInterest && doc.specialInterest.length > 0
                              ? doc.specialInterest
                              : ['General Wellness', 'Preventive Care']
                            ).map((interest, idx) => (
                              <Link
                                key={idx}
                                to={`/conditions`}
                                className="inline-block px-2 py-0.5 rounded-md bg-[#F1F5F9] text-slate-700 hover:bg-[#E8F6F8] hover:text-[#0E7490] text-[11px] font-medium border border-[#E2EBF0] transition-colors"
                                title={`Search condition: ${interest}`}
                              >
                                {interest}
                              </Link>
                            ))}
                          </div>
                        </td>

                        {/* Column: Experience */}
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-[#2DA7B5]" />
                            <span>{doc.experience}</span>
                          </div>
                        </td>

                        {/* Column: Consultation Fee */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-extrabold text-[#0E7490] bg-[#E8F6F8] px-2.5 py-1 rounded-md border border-[#CDEBF0]">
                            AED {doc.consultationFee || 500}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {isDocActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        {/* Actions: View, Edit, Delete */}
                        <td className="py-3.5 px-4 text-right rtl:text-left whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => setSelectedDoctor(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] text-slate-700 rounded-xl text-xs font-semibold transition-all border border-[#E2EBF0] cursor-pointer shadow-2xs"
                              title="View Doctor Details Modal"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] text-slate-700 rounded-xl text-xs font-semibold transition-all border border-[#E2EBF0] cursor-pointer shadow-2xs"
                              title="Edit Doctor"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#0E7490]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingDoctor(doc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FFF5F5] hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all border border-rose-200 cursor-pointer shadow-2xs"
                              title="Delete Doctor"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
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
      )}

      {/* VIEW 2: CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => {
            const isDocActive = (doc.status || 'Active') === 'Active';
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs flex flex-col justify-between hover:border-[#2DA7B5] transition-all"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <img
                      src={doc.photo}
                      alt={doc.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#E2EBF0] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <Link to="/specialties" className="text-xs font-semibold text-[#0E7490] hover:underline block truncate">
                          {doc.specialty}
                        </Link>
                        {isDocActive ? (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                            Deactivated
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 truncate">{doc.name}</h3>
                      <div className="flex items-center justify-between gap-1 text-xs text-slate-500 mt-0.5">
                        <div className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-[#2DA7B5]" />
                          <span>{doc.experience}</span>
                        </div>
                        <span className="font-extrabold text-[#0E7490] text-xs">
                          AED {doc.consultationFee || 500}
                        </span>
                      </div>
                      {doc.reviewCount > 0 ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800 mt-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{Number(doc.rating).toFixed(1)}</span>
                          <span className="text-slate-400 font-normal text-[11px]">({doc.reviewCount})</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 mt-1">No reviews yet</div>
                      )}
                    </div>
                  </div>

                  {/* Special Interests Badges */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(doc.specialInterest || ['General Healthcare']).map((interest, i) => (
                      <Link
                        key={i}
                        to={`/conditions`}
                        className="text-[10px] font-semibold bg-[#F8FAFC] border border-[#E2EBF0] px-2 py-0.5 rounded-md text-slate-600 hover:text-[#0E7490]"
                      >
                        {interest}
                      </Link>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {doc.about}
                  </p>
                </div>

                {/* Card Footer with Details + Actions */}
                <div className="mt-4 pt-3 border-t border-[#E2EBF0] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="font-semibold text-[#0E7490] bg-[#E8F6F8] px-2 py-0.5 rounded-md border border-[#CDEBF0] text-[11px]">
                      {doc.availableSlots.length} Slots
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(doc)}
                      className="p-1.5 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:text-[#0E7490] text-slate-600 rounded-lg text-xs font-semibold border border-[#E2EBF0] cursor-pointer"
                      title="View Details Modal"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(doc)}
                      className="p-1.5 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:text-[#0E7490] text-slate-600 rounded-lg text-xs font-semibold border border-[#E2EBF0] cursor-pointer"
                      title="Edit Doctor"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0E7490]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingDoctor(doc)}
                      className="p-1.5 bg-[#FFF5F5] hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 cursor-pointer"
                      title="Delete Doctor"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VIEW DOCTOR MODAL (Matches Admin Page Design & Verification)           */}
      {/* ========================================================================= */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E2EBF0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2EBF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[#2DA7B5]" />
                <h2 className="text-base font-bold text-slate-900">Doctor Profile & Overview</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Doctor Hero Card */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] flex flex-col sm:flex-row sm:items-center gap-4">
                <img
                  src={selectedDoctor.photo}
                  alt={selectedDoctor.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedDoctor.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
                      <ShieldCheck className="w-3 h-3 text-[#2DA7B5]" />
                      Licensed Specialist
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#0E7490]">{selectedDoctor.specialty}</p>
                  {(selectedDoctor.hospitalName || selectedDoctor.clinicName) && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedDoctor.hospitalName || selectedDoctor.clinicName}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 font-mono">System ID: {selectedDoctor.id}</p>
                </div>
              </div>

              {/* Status Alert Banner */}
              {(selectedDoctor.status || 'Active') === 'Active' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 space-y-0.5">
                    <span className="font-bold block text-sm">Status: Active</span>
                    <p className="text-emerald-700 leading-relaxed">
                      This doctor is actively listed in search results, accepts in-person patient bookings, and can receive consultation inquiries.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 space-y-0.5">
                    <span className="font-bold block text-sm">Status: Deactivated / Suspended</span>
                    <p className="text-rose-700 leading-relaxed">
                      Public appointment bookings are suspended for this practitioner. They will not accept new bookings until reactivated.
                    </p>
                  </div>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Experience</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{selectedDoctor.experience}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Patient Rating</span>
                  <span className="font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {selectedDoctor.rating} ({selectedDoctor.reviewCount} reviews)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Consultation Fee</span>
                  <span className="font-bold text-[#0E7490] mt-0.5 block">AED {selectedDoctor.consultationFee || 500}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Location</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{selectedDoctor.location || 'Dubai, UAE'}</span>
                </div>
              </div>

              {/* Education & Bio */}
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <GraduationCap className="w-4 h-4 text-[#2DA7B5]" />
                    <span>Education & Board Certification</span>
                  </h4>
                  <p className="text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2EBF0] leading-relaxed">
                    {selectedDoctor.education || 'MD, Board Certified in Specialist Medicine'}
                  </p>
                </div>

                {/* Special Interests */}
                {selectedDoctor.specialInterest && selectedDoctor.specialInterest.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                      <Award className="w-4 h-4 text-[#2DA7B5]" />
                      <span>Clinical Focus & Health Interests</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDoctor.specialInterest.map((interest, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-[#E8F6F8] text-[#0E7490] font-semibold text-[11px] border border-[#CDEBF0]"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <Award className="w-4 h-4 text-[#2DA7B5]" />
                    <span>About & Clinical Bio</span>
                  </h4>
                  <p className="text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2EBF0] leading-relaxed">
                    {selectedDoctor.about}
                  </p>
                </div>

                {/* Available Slots Preview */}
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-4 h-4 text-[#2DA7B5]" />
                    <span>Rostered Slots Preview</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDoctor.availableSlots.slice(0, 8).map((slot) => (
                      <span
                        key={slot}
                        className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] text-slate-700 text-[11px] font-mono font-medium border border-[#E2EBF0]"
                      >
                        {slot}
                      </span>
                    ))}
                    {selectedDoctor.availableSlots.length > 8 && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] text-slate-500 text-[11px] font-mono border border-[#E2EBF0]">
                        +{selectedDoctor.availableSlots.length - 8} more slots
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer / Action Bar */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2EBF0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                to={`/doctors/${selectedDoctor.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#0E7490] hover:text-[#2DA7B5] flex items-center gap-1 cursor-pointer"
              >
                <span>View Public Profile Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const docToEdit = selectedDoctor;
                    setSelectedDoctor(null);
                    openEditModal(docToEdit);
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-[#0E7490] rounded-xl text-xs font-bold transition-colors border border-[#CDEBF0] cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Doctor</span>
                </button>

                {(selectedDoctor.status || 'Active') === 'Active' ? (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleToggleStatus(selectedDoctor, 'Deactivated')}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isUpdatingStatus ? 'Updating...' : 'Deactivate'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleToggleStatus(selectedDoctor, 'Active')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isUpdatingStatus ? 'Updating...' : 'Activate'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="px-3.5 py-2 bg-white hover:bg-[#F8FAFC] text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-[#E2EBF0] cursor-pointer shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT DOCTOR MODAL                                                      */}
      {/* ========================================================================= */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E2EBF0] max-h-[90vh] overflow-y-auto space-y-6 my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E2EBF0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E8F6F8] border border-[#CDEBF0] flex items-center justify-center text-[#0E7490]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Edit Doctor Profile</h3>
                  <p className="text-xs text-slate-500">
                    Update credentials, specialties, consultation fee, and clinical information.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDoctor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Dr. Hessa Al-Ketbi"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialty (Department) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editSpecialty}
                    onChange={(e) => setEditSpecialty(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                    placeholder="e.g. 10 years"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Consultation Fee (AED) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 rtl:left-auto rtl:right-3 text-xs font-bold text-slate-400">AED</span>
                    <input
                      type="number"
                      min="50"
                      max="5000"
                      step="10"
                      required
                      value={editFee}
                      onChange={(e) => setEditFee(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full pl-12 pr-3 rtl:pl-3 rtl:pr-12 p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm font-bold text-slate-900 focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Deactivated')}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="Active">Active</option>
                    <option value="Deactivated">Deactivated</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Interest <span className="text-slate-400 font-normal">(Health conditions & clinical focus, comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={editSpecialInterest}
                    onChange={(e) => setEditSpecialInterest(e.target.value)}
                    placeholder="e.g. Heart Failure, Hypertension, Arrhythmia"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Education & Credentials
                  </label>
                  <input
                    type="text"
                    value={editEducation}
                    onChange={(e) => setEditEducation(e.target.value)}
                    placeholder="e.g. MD - Internal Medicine, Board Certified"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Photo Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Photo / Avatar
                  </label>
                  <div className="flex items-center gap-3">
                    {editPhotoPreview ? (
                      <img
                        src={editPhotoPreview}
                        alt="Preview"
                        className="w-14 h-14 rounded-xl object-cover border border-[#E2EBF0] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] flex items-center justify-center text-slate-400 shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="edit-doctor-photo-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setEditPhotoFile(file);
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setEditPhotoPreview(url);
                          }
                        }}
                      />
                      <label
                        htmlFor="edit-doctor-photo-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2EBF0] rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] cursor-pointer transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span>Change Photo</span>
                      </label>
                      {editPhotoFile && (
                        <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[180px]">{editPhotoFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Professional Biography
                  </label>
                  <textarea
                    rows={3}
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    placeholder="Brief background and clinical focus..."
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none resize-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2EBF0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#F8FAFC] rounded-xl transition-colors cursor-pointer border border-[#E2EBF0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingDoctor}
                  className="px-5 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUpdatingDoctor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isUpdatingDoctor ? 'Saving...' : 'Save Doctor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE DOCTOR CONFIRMATION MODAL                                       */}
      {/* ========================================================================= */}
      {deletingDoctor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E2EBF0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Remove Doctor</h3>
                  <p className="text-xs text-slate-500">De-register practitioner from facility roster.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2EBF0]">
                <img
                  src={deletingDoctor.photo}
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 rounded-lg object-cover border border-[#E2EBF0]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <p className="font-bold text-slate-900 text-xs">{deletingDoctor.name}</p>
                  <p className="text-[11px] text-[#0E7490]">{deletingDoctor.specialty}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-900 font-bold">{deletingDoctor.name}</strong> from your hospital roster? All associated scheduled slots will be revoked.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingDoctor(null)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-[#E2EBF0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingDoctor}
                  onClick={handleDeleteDoctor}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingDoctor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isDeletingDoctor ? 'Removing...' : 'Confirm Remove'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADD DOCTOR MODAL                                                       */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E2EBF0] max-h-[90vh] overflow-y-auto space-y-6 my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E2EBF0] pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Doctor to Roster</h3>
                <p className="text-xs text-slate-500">
                  Register a specialist with consultation credentials, department specialty, and health focus.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Hessa Al-Ketbi"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialty (Department) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 10 years"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Consultation Fee (AED) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 rtl:left-auto rtl:right-3 text-xs font-bold text-slate-400">AED</span>
                    <input
                      type="number"
                      min="50"
                      max="5000"
                      step="10"
                      required
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full pl-12 pr-3 rtl:pl-3 rtl:pr-12 p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm font-bold text-slate-900 focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Interest <span className="text-slate-400 font-normal">(Health conditions & clinical focus, comma-separated)</span>
                  </label>
                  <input
                    type="text"
                    value={specialInterestInput}
                    onChange={(e) => setSpecialInterestInput(e.target.value)}
                    placeholder="e.g. Heart Failure, Hypertension, Arrhythmia"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Education & Credentials
                  </label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="e.g. MD - Internal Medicine, Board Certified"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Photo Upload */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Photo / Avatar
                  </label>
                  <div className="flex items-center gap-3">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-14 h-14 rounded-xl object-cover border border-[#E2EBF0] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#F8FAFC] border border-dashed border-[#CBD5E1] flex items-center justify-center text-slate-400 shrink-0">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        id="doctor-photo-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setPhotoFile(file);
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setPhotoPreview(url);
                          } else {
                            setPhotoPreview(null);
                          }
                        }}
                      />
                      <label
                        htmlFor="doctor-photo-upload"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-[#E2EBF0] rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#F8FAFC] cursor-pointer transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {photoFile ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      {photoFile && (
                        <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[180px]">{photoFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider: Credentials */}
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px flex-1 bg-[#E2EBF0]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Login Credentials</span>
                    <div className="h-px flex-1 bg-[#E2EBF0]" />
                  </div>
                  <p className="text-[10px] text-slate-400">Email & password for this doctor to log in to the doctor portal.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    placeholder="e.g. dr.hessa@hospital.ae"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Professional Biography
                  </label>
                  <textarea
                    rows={3}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Brief background and clinical focus..."
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none resize-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2EBF0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-[#F8FAFC] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Save Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
