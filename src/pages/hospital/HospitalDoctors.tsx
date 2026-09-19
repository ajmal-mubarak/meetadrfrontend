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
  Sparkles,
} from 'lucide-react';
import { doctorService } from '../../services/doctorService';
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

  // Add form fields
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [specialInterestInput, setSpecialInterestInput] = useState('');
  const [experience, setExperience] = useState('8 years');
  const [education, setEducation] = useState('MD - Internal Medicine, Board Certified');
  const [about, setAbout] = useState('');
  const [photo, setPhoto] = useState(
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
  );

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await doctorService.getAllDoctors();
      setDoctors(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      await doctorService.createDoctor({
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        specialty,
        specialInterest: specialInterest.length > 0 ? specialInterest : ['General Consultation', 'Preventive Care'],
        experience,
        education,
        about:
          about ||
          `${name} is a board-certified specialist dedicated to compassionate and evidence-based patient care.`,
        photo,
        hospitalId: 'hosp-1',
        hospitalName: 'City Care Specialty Hospital',
        location: 'Dubai Healthcare City',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        availableSlots: [
          '09:00 - 09:30',
          '09:30 - 10:00',
          '10:00 - 10:30',
          '11:00 - 11:30',
          '14:00 - 14:30',
          '15:00 - 15:30',
        ],
      });

      showToast(`Dr. ${name} added to hospital roster successfully.`, 'success');
      setShowAddModal(false);
      setName('');
      setSpecialInterestInput('');
      setAbout('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add doctor', 'error');
    }
  };

  // Export Roster as Excel (.csv)
  const handleExportExcel = () => {
    const headers = ['Doctor ID', 'Name', 'Specialty (Department)', 'Special Interest (Health Conditions)', 'Experience', 'Rating', 'Hospital', 'Active Slots'];
    const rows = doctors.map((doc) => [
      `"${doc.id}"`,
      `"${doc.name}"`,
      `"${doc.specialty}"`,
      `"${(doc.specialInterest || ['General Care']).join('; ')}"`,
      `"${doc.experience}"`,
      `"${doc.rating}"`,
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
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      (d.specialInterest && d.specialInterest.some((si) => si.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Medical Staff</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage practicing specialists, hospital affiliations, departments, and consultation schedules.
          </p>
        </div>

        {/* Action Controls: Search, View Mode, Export, Add */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search specialty, doctor, or interest..."
              className="pl-8 pr-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-xs focus:outline-none focus:border-[#2DA7B5] focus:bg-white w-56 transition-all"
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

      {/* VIEW 1: TABLE VIEW (With Specialty -> Department & Special Interest -> Health conditions) */}
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
                  <th className="py-3 px-4">Active Slots</th>
                  <th className="py-3 px-4 text-right rtl:text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDocs.map((doc) => (
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
                          <div className="flex items-center gap-1 text-[11px] text-amber-500 mt-0.5">
                            <Star className="w-3 h-3 fill-amber-500" />
                            <span>{doc.rating}</span>
                            <span className="text-slate-400">({doc.reviewCount})</span>
                          </div>
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

                    {/* Column 2: Special Interest (Linked to Health Issues / Conditions) */}
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

                    {/* Active Slots */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#0E7490] bg-[#E8F6F8] px-2.5 py-1 rounded-md border border-[#CDEBF0]">
                        {doc.availableSlots.length} Slots
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right rtl:text-left">
                      <Link
                        to={`/doctors/${doc.id}`}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-[#E2EBF0] rounded-lg text-xs font-semibold transition-colors"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
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
                    <Link to="/specialties" className="text-xs font-semibold text-[#0E7490] hover:underline block">
                      {doc.specialty}
                    </Link>
                    <h3 className="text-base font-bold text-slate-900 truncate">{doc.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Award className="w-3.5 h-3.5 text-[#2DA7B5]" />
                      <span>{doc.experience}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-800 mt-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{doc.rating}</span>
                    </div>
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

              <div className="mt-4 pt-3 border-t border-[#E2EBF0] flex items-center justify-between text-xs text-slate-500">
                <span>{doc.availableDays.length} Active Days</span>
                <span className="font-semibold text-[#0E7490] bg-[#E8F6F8] px-2.5 py-0.5 rounded-md border border-[#CDEBF0]">
                  {doc.availableSlots.length} Slots/Day
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E2EBF0] max-h-[90vh] overflow-y-auto space-y-6">
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

                {/* Changed to "Experience" as requested */}
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

                {/* Added "Special Interest" field linked to health issues / conditions */}
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
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Photo URL (Avatar)
                  </label>
                  <input
                    type="text"
                    value={photo}
                    onChange={(e) => setPhoto(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl text-sm focus:border-[#2DA7B5] focus:bg-white focus:outline-none font-mono text-xs transition-all"
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
