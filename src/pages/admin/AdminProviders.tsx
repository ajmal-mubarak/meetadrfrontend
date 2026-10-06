import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Star,
  MapPin,
  Search,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  Phone,
  Clock,
  ExternalLink,
  X,
  AlertTriangle,
  Stethoscope,
  Activity,
  Plus,
  Trash2,
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { Hospital, Clinic } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminProviders: React.FC = () => {
  const { showToast } = useToast();
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [type, setType] = useState<'all' | 'hospital' | 'clinic'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Deactivated'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ProviderItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Add Facility State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    name_ar: '',
    type: 'hospital' as 'hospital' | 'clinic',
    location: 'Dubai',
    address: '',
    address_ar: '',
    phone: '',
    operating_hours: 'Open 24/7',
    about: '',
    photo: '',
    emergency_available: true,
    primary_specialty: 'General Medicine',
  });

  // Delete Facility State
  const [providerToDelete, setProviderToDelete] = useState<ProviderItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await realAdminService.getProviders();
        setProviders(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load providers';
        showToast(msg, 'error');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleToggleStatus = async (item: ProviderItem, newStatus: 'Active' | 'Deactivated') => {
    setIsUpdatingStatus(true);
    try {
      await realAdminService.updateProviderStatus(item.id, newStatus);
      setProviders((prev) =>
        prev.map((p) => (p.id === item.id ? ({ ...p, status: newStatus } as ProviderItem) : p))
      );

      if (selectedProvider && selectedProvider.id === item.id) {
        setSelectedProvider({ ...selectedProvider, status: newStatus } as ProviderItem);
      }

      showToast(
        newStatus === 'Active'
          ? `${item.name} has been activated successfully.`
          : `${item.name} has been deactivated.`,
        newStatus === 'Active' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update facility status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      showToast('Facility name is required.', 'error');
      return;
    }
    setIsSubmittingAdd(true);
    try {
      const created = await realAdminService.createProvider({
        name: addForm.name.trim(),
        name_ar: addForm.name_ar.trim() || undefined,
        type: addForm.type,
        location: addForm.location.trim() || 'Dubai',
        address: addForm.address.trim() || undefined,
        address_ar: addForm.address_ar.trim() || undefined,
        phone: addForm.phone.trim() || '+971 4 000 0000',
        operating_hours: addForm.operating_hours.trim() || 'Open 24/7',
        about: addForm.about.trim() || undefined,
        photo: addForm.photo.trim() || (addForm.type === 'hospital'
          ? 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
          : 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&q=80&w=800'),
        emergency_available: addForm.emergency_available,
        primary_specialty: addForm.primary_specialty.trim() || 'General Medicine',
      });

      setProviders((prev) => [created, ...prev]);
      showToast(`${created.providerCategory} '${created.name}' has been added successfully!`, 'success');
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        name_ar: '',
        type: 'hospital',
        location: 'Dubai',
        address: '',
        address_ar: '',
        phone: '',
        operating_hours: 'Open 24/7',
        about: '',
        photo: '',
        emergency_available: true,
        primary_specialty: 'General Medicine',
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to add facility.', 'error');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleDeleteProviderConfirm = async () => {
    if (!providerToDelete) return;
    setIsDeleting(true);
    try {
      await realAdminService.deleteProvider(providerToDelete.id);
      setProviders((prev) => prev.filter((p) => p.id !== providerToDelete.id));
      if (selectedProvider && selectedProvider.id === providerToDelete.id) {
        setSelectedProvider(null);
      }
      showToast(`${providerToDelete.providerCategory} '${providerToDelete.name}' has been deleted successfully.`, 'info');
      setProviderToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete facility.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const allProviders: ProviderItem[] = providers;

  const filtered = allProviders.filter((p) => {
    if (type !== 'all' && p.providerCategory.toLowerCase() !== type) return false;

    const pStatus = p.status || 'Active';
    if (statusFilter !== 'all' && pStatus !== statusFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = allProviders.filter((p) => (p.status || 'Active') === 'Active').length;
  const deactivatedCount = allProviders.filter((p) => p.status === 'Deactivated').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Providers Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]">
              {allProviders.length} Facilities
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered medical institutions, licensing verifications, and operational status management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Facility Type Filter */}
          <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
            {(['all', 'hospital', 'clinic'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  type === t
                    ? 'bg-white text-[#0E7490] shadow-xs font-bold border border-[#E2EBF0]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'all' ? 'All' : `${t}s`}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex rounded-xl bg-[#F1F5F9] p-1 text-xs font-semibold border border-[#E2EBF0]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allProviders.length})
            </button>
            <button
              onClick={() => setStatusFilter('Active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'Active'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('Deactivated')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === 'Deactivated'
                  ? 'bg-white text-rose-700 shadow-xs font-bold border border-[#E2EBF0]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deactivated ({deactivatedCount})
            </button>
          </div>

          {/* Add Facility Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hospital</span>
          </button>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facility..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
              <tr>
                <th className="px-5 py-3">Facility Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-[#2DA7B5] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading medical facilities...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No facilities found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isProviderActive = (item.status || 'Active') === 'Active';
                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.photo}
                            alt={item.name}
                            className="w-9 h-9 rounded-xl object-cover bg-slate-100 shrink-0 border border-[#E2EBF0]"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {item.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0]"
                        >
                          {item.providerCategory}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{item.location}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-mono">{item.phone}</td>
                      <td className="px-5 py-3.5 text-slate-800 font-bold">
                        {item.rating && item.rating > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center text-amber-600 font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                              {Number(item.rating).toFixed(1)}
                            </span>
                            {item.reviewCount ? (
                              <span className="text-slate-400 font-normal text-[11px]">
                                ({item.reviewCount})
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Unrated
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isProviderActive ? (
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
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProvider(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] text-slate-700 rounded-xl text-xs font-semibold transition-all border border-[#E2EBF0] cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setProviderToDelete(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-semibold transition-all border border-rose-200 cursor-pointer shadow-2xs whitespace-nowrap"
                            title={`Delete ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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

      {/* ========================================================================= */}
      {/* PROVIDER DETAILS & ACTIVATION / DEACTIVATION MODAL                        */}
      {/* ========================================================================= */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E2EBF0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E2EBF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2DA7B5]" />
                <h2 className="text-base font-bold text-slate-900">
                  {selectedProvider.providerCategory} Profile & Licensing
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Provider Hero Card */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] flex flex-col sm:flex-row sm:items-center gap-4">
                <img
                  src={selectedProvider.photo}
                  alt={selectedProvider.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedProvider.name}</h3>
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-[#E8F6F8] text-[#0E7490] border-[#CDEBF0]"
                    >
                      {selectedProvider.providerCategory}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      MOH Licensed
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedProvider.address || selectedProvider.location}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">Facility ID: {selectedProvider.id}</p>
                </div>
              </div>

              {/* Status Alert Banner */}
              {(selectedProvider.status || 'Active') === 'Active' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-900 space-y-0.5">
                    <span className="font-bold block text-sm">Status: Active & Verified</span>
                    <p className="text-emerald-700 leading-relaxed">
                      This medical facility is active in MeetAdr directories. Patients can browse affiliated doctors, request consultations, and book appointments.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900 space-y-0.5">
                    <span className="font-bold block text-sm">Status: Deactivated / Suspended</span>
                    <p className="text-rose-700 leading-relaxed">
                      This facility is temporarily deactivated. Doctors rostered under this facility cannot receive public bookings until reactivated by administrative staff.
                    </p>
                  </div>
                </div>
              )}

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Rostered Doctors</span>
                  <span className="font-bold text-[#0E7490] mt-0.5 block flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-[#2DA7B5]" />
                    {selectedProvider.doctorCount || selectedProvider.doctorIds.length} Specialists
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Facility Rating</span>
                  <span className="font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                    {selectedProvider.rating && selectedProvider.rating > 0 && selectedProvider.reviewCount ? (
                      <>
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {Number(selectedProvider.rating).toFixed(1)} / 5.0
                        <span className="text-[11px] text-slate-400 font-normal">({selectedProvider.reviewCount})</span>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">Unrated (0 reviews)</span>
                    )}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Emergency Care</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {'emergencyAvailable' in selectedProvider && selectedProvider.emergencyAvailable
                      ? '24/7 Available'
                      : 'Clinical Hours'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Contact Phone</span>
                  <span className="font-bold text-slate-900 mt-0.5 block font-mono">{selectedProvider.phone}</span>
                </div>
              </div>

              {/* About Section */}
              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <Activity className="w-4 h-4 text-[#2DA7B5]" />
                    <span>About Institutional Facility</span>
                  </h4>
                  <p className="text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2EBF0] leading-relaxed">
                    {selectedProvider.about}
                  </p>
                </div>

                {/* Specialties or Departments */}
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                    <Stethoscope className="w-4 h-4 text-[#2DA7B5]" />
                    <span>Clinical Specialties & Departments</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {'specialties' in selectedProvider ? (
                      selectedProvider.specialties.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 rounded-lg bg-[#E8F6F8] text-[#0E7490] text-[11px] font-semibold border border-[#CDEBF0]"
                        >
                          {s}
                        </span>
                      ))
                    ) : 'specialty' in selectedProvider ? (
                      <span className="px-2.5 py-1 rounded-lg bg-[#E8F6F8] text-[#0E7490] text-[11px] font-semibold border border-[#CDEBF0]">
                        {selectedProvider.specialty}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Operating Hours</span>
                    <span className="font-semibold text-slate-800">{selectedProvider.operatingHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer / Action Bar */}
            <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2EBF0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                to={
                  selectedProvider.providerCategory === 'Hospital'
                    ? `/hospitals/${selectedProvider.id}`
                    : `/clinics/${selectedProvider.id}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#0E7490] hover:text-[#2DA7B5] flex items-center gap-1 cursor-pointer"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = selectedProvider;
                    setSelectedProvider(null);
                    setProviderToDelete(toDel);
                  }}
                  className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Delete Facility"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="px-4 py-2.5 bg-white hover:bg-[#F8FAFC] text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-[#E2EBF0] cursor-pointer shadow-2xs"
                >
                  Close
                </button>

                {(selectedProvider.status || 'Active') === 'Active' ? (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleToggleStatus(selectedProvider, 'Deactivated')}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isUpdatingStatus ? 'Updating...' : `Deactivate ${selectedProvider.providerCategory}`}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleToggleStatus(selectedProvider, 'Active')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isUpdatingStatus ? 'Updating...' : `Activate ${selectedProvider.providerCategory}`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD FACILITY MODAL                                                        */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E2EBF0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E2EBF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2DA7B5]" />
                <h2 className="text-base font-bold text-slate-900">Add New Healthcare Facility</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProviderSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Facility Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAddForm((prev) => ({ ...prev, type: 'hospital' }))}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      addForm.type === 'hospital'
                        ? 'bg-[#E8F6F8] border-[#2DA7B5] text-[#0E7490]'
                        : 'bg-[#F8FAFC] border-[#E2EBF0] text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold">Hospital</div>
                      <div className="text-[10px] text-slate-500">24/7 Multi-specialty center</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddForm((prev) => ({ ...prev, type: 'clinic' }))}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      addForm.type === 'clinic'
                        ? 'bg-[#E8F6F8] border-[#2DA7B5] text-[#0E7490]'
                        : 'bg-[#F8FAFC] border-[#E2EBF0] text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold">Clinic</div>
                      <div className="text-[10px] text-slate-500">Specialized outpatient clinic</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Name (English & Arabic) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Facility Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Kings College Hospital London"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Facility Name (Arabic)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={addForm.name_ar}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="مثال: مستشفى كينجز كوليدج"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Location & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Emirate / City</label>
                  <select
                    value={addForm.location}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none"
                  >
                    <option value="Dubai">Dubai</option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                    <option value="Fujairah">Fujairah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+971 4 519 9999"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={addForm.address}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Dubai Hills Estate, Al Khail Road, Dubai"
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Operating Hours & Specialty/Emergency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={addForm.operating_hours}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, operating_hours: e.target.value }))}
                    placeholder="e.g. Open 24/7 or 08:00 - 22:00"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  {addForm.type === 'clinic' ? (
                    <>
                      <label className="block text-slate-700 font-semibold mb-1">Primary Specialty</label>
                      <input
                        type="text"
                        value={addForm.primary_specialty}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, primary_specialty: e.target.value }))}
                        placeholder="e.g. Dermatology, Orthopedics"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none"
                      />
                    </>
                  ) : (
                    <div className="pt-6 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="emergency_available"
                        checked={addForm.emergency_available}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, emergency_available: e.target.checked }))}
                        className="w-4 h-4 text-[#2DA7B5] rounded border-[#E2EBF0] focus:ring-[#2DA7B5]"
                      />
                      <label htmlFor="emergency_available" className="text-slate-700 font-semibold cursor-pointer">
                        24/7 Emergency Care Available
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Photo Image URL (Optional)</label>
                <input
                  type="url"
                  value={addForm.photo}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, photo: e.target.value }))}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none"
                />
              </div>

              {/* About description */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">About Facility</label>
                <textarea
                  rows={3}
                  value={addForm.about}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, about: e.target.value }))}
                  placeholder="Provide a brief clinical overview of this institution..."
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-[#E2EBF0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-slate-700 rounded-xl text-xs font-semibold border border-[#E2EBF0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingAdd ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create {addForm.type === 'hospital' ? 'Hospital' : 'Clinic'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {providerToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Medical Facility?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-800">{providerToDelete.name}</strong> ({providerToDelete.providerCategory})?
                This action will remove the facility from all MeetAdr directories.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProviderToDelete(null)}
                className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-slate-700 rounded-xl text-xs font-semibold border border-[#E2EBF0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProviderConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Facility</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
