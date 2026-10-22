import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Stethoscope,
  MapPin,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Phone,
  Clock,
  Calendar,
  X,
  AlertTriangle,
  Trash2,
  Filter,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { realAdminService, ProviderItem } from '../../services/realAdminService';
import { Doctor } from '../../types';
import { useToast } from '../../context/ToastContext';
import { DEFAULT_DOCTOR_AVATAR } from '../../utils/avatar';

interface UnifiedProviderItem {
  id: string;
  name: string;
  name_ar?: string;
  kind: 'facility' | 'doctor';
  categoryLabel: 'Hospital' | 'Clinic' | 'Individual Doctor';
  specialtyOrType?: string;
  location: string;
  address?: string;
  phone?: string;
  photo?: string;
  status: 'Active' | 'Deactivated' | 'Pending';
  createdAt?: string;
  rating?: number;
  consultationFee?: number;
  experienceYears?: number;
  operatingHours?: string;
  about?: string;
  raw: ProviderItem | Doctor;
}

export const AdminProviders: React.FC = () => {
  const { showToast } = useToast();

  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'facilities' | 'doctors'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Pending' | 'Deactivated'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals: strictly View or Delete/Reject
  const [viewItem, setViewItem] = useState<UnifiedProviderItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<UnifiedProviderItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Load data
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
      showToast(err.message || 'Failed to load provider directory', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Transform and unify list
  const unifiedList = useMemo<UnifiedProviderItem[]>(() => {
    const list: UnifiedProviderItem[] = [];

    // Facilities (Hospitals and Clinics)
    providers.forEach((p) => {
      const pType = ((p as any).type || (p.providerCategory === 'Clinic' ? 'clinic' : 'hospital')).toLowerCase();
      const catLabel = pType === 'clinic' ? 'Clinic' : 'Hospital';
      const status: 'Active' | 'Deactivated' | 'Pending' =
        p.status === 'Active' ? 'Active' : p.status === 'Deactivated' ? 'Deactivated' : 'Pending';

      list.push({
        id: p.id,
        name: p.name,
        name_ar: (p as any).name_ar,
        kind: 'facility',
        categoryLabel: catLabel,
        specialtyOrType: (p as any).primary_specialty || (catLabel === 'Hospital' ? 'General & Specialized' : 'Polyclinic'),
        location: p.location || 'Dubai',
        address: p.address,
        phone: p.phone,
        photo: (p as any).photo,
        status,
        createdAt: (p as any).created_at || (p as any).createdAt,
        rating: p.rating,
        operatingHours: (p as any).operating_hours || (p as any).operatingHours || 'Open 24/7',
        about: (p as any).about,
        raw: p,
      });
    });

    // Individual & Affiliated Doctors
    doctors.forEach((d) => {
      const status: 'Active' | 'Deactivated' | 'Pending' = !d.isVerified
        ? 'Pending'
        : d.status === 'Active' || d.isActive
        ? 'Active'
        : 'Deactivated';

      list.push({
        id: d.id,
        name: `Dr. ${d.name}`,
        name_ar: (d as any).name_ar ? `د. ${(d as any).name_ar}` : undefined,
        kind: 'doctor',
        categoryLabel: 'Individual Doctor',
        specialtyOrType: d.specialty,
        location: d.location || 'Dubai',
        address: d.hospitalName ? `Affiliated: ${d.hospitalName}` : 'Independent Practice',
        phone: (d as any).phone,
        photo: d.photo,
        status,
        createdAt: (d as any).created_at || (d as any).createdAt,
        rating: d.rating,
        consultationFee: d.consultationFee,
        experienceYears: d.experienceYears,
        about: d.about,
        raw: d,
      });
    });

    return list;
  }, [providers, doctors]);

  // Unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>();
    unifiedList.forEach((item) => {
      if (item.location) set.add(item.location);
    });
    return Array.from(set).sort();
  }, [unifiedList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return unifiedList.filter((item) => {
      // Type filter
      if (typeFilter === 'facilities' && item.kind !== 'facility') return false;
      if (typeFilter === 'doctors' && item.kind !== 'doctor') return false;

      // Location filter
      if (locationFilter !== 'all' && item.location.toLowerCase() !== locationFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Date Range filter (created at)
      if (item.createdAt) {
        const itemDate = new Date(item.createdAt);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          if (itemDate < fromDate) return false;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (itemDate > toDate) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesLocation = item.location.toLowerCase().includes(q);
        const matchesAddress = (item.address || '').toLowerCase().includes(q);
        const matchesSpecialty = (item.specialtyOrType || '').toLowerCase().includes(q);
        if (!matchesName && !matchesLocation && !matchesAddress && !matchesSpecialty) {
          return false;
        }
      }

      return true;
    });
  }, [unifiedList, typeFilter, locationFilter, statusFilter, dateFrom, dateTo, searchQuery]);

  // Accept / Activate Provider
  const handleAcceptProvider = async (item: UnifiedProviderItem) => {
    setIsUpdatingStatus(true);
    try {
      if (item.kind === 'facility') {
        await realAdminService.updateProviderStatus(item.id, 'Active');
        setProviders((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'Active' } : p))
        );
      } else {
        await realAdminService.updateDoctorStatus(item.id, 'Active');
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === item.id
              ? { ...d, isVerified: true, status: 'Active', isActive: true }
              : d
          )
        );
      }
      showToast(`${item.name} has been accepted and activated.`, 'success');
      if (viewItem && viewItem.id === item.id) {
        setViewItem({ ...viewItem, status: 'Active' });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to activate provider.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Reject / Deactivate Provider
  const handleDeactivateProvider = async (item: UnifiedProviderItem) => {
    setIsUpdatingStatus(true);
    try {
      if (item.kind === 'facility') {
        await realAdminService.updateProviderStatus(item.id, 'Deactivated');
        setProviders((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: 'Deactivated' } : p))
        );
      } else {
        await realAdminService.updateDoctorStatus(item.id, 'Deactivated');
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === item.id
              ? { ...d, isVerified: false, status: 'Deactivated', isActive: false }
              : d
          )
        );
      }
      showToast(`${item.name} status set to deactivated.`, 'info');
      if (viewItem && viewItem.id === item.id) {
        setViewItem({ ...viewItem, status: 'Deactivated' });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to deactivate provider.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete Provider Permanently
  const handleDeleteProvider = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.kind === 'facility') {
        await realAdminService.deleteProvider(itemToDelete.id);
        setProviders((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      } else {
        await realAdminService.deleteDoctor(itemToDelete.id);
        setDoctors((prev) => prev.filter((d) => d.id !== itemToDelete.id));
      }
      showToast(`${itemToDelete.name} has been deleted.`, 'success');
      if (viewItem && viewItem.id === itemToDelete.id) {
        setViewItem(null);
      }
      setItemToDelete(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete provider.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setTypeFilter('all');
    setLocationFilter('all');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Providers Directory</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Comprehensive directory of all medical providers (Hospitals, Clinics, and Individual Doctors) with multi-criteria filtering
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          Showing <span className="font-bold text-slate-800">{filteredList.length}</span> of{' '}
          <span className="font-bold text-slate-800">{unifiedList.length}</span> Total Providers
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Row 1: Search & Type Tabs */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search provider by name, specialty, address, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === 'all'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Providers ({unifiedList.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('facilities')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                typeFilter === 'facilities'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Hospitals & Clinics ({providers.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('doctors')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                typeFilter === 'doctors'
                  ? 'bg-white text-teal-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Doctors ({doctors.length})
            </button>
          </div>
        </div>

        {/* Row 2: Location, Date Range, Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Location Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location:</span>
              <select
                aria-label="Filter providers by location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Emirates</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Status:</span>
              <select
                aria-label="Filter providers by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All</option>
                <option value="Active">Active / Approved</option>
                <option value="Pending">Pending Application</option>
                <option value="Deactivated">Deactivated</option>
              </select>
            </div>

            {/* Date Range: From */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Registered From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              />
            </div>

            {/* Date Range: To */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-600">
              <span>To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {(locationFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo || searchQuery || typeFilter !== 'all') && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-bold hover:underline transition-colors ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Specialty / Scope</th>
                <th className="py-3.5 px-4">Location & Address</th>
                <th className="py-3.5 px-4">Registered Date</th>
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
                      Loading providers directory...
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-base font-bold text-slate-700">No providers match your filter criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing or loosening the date range, location, or type filter
                    </p>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isItemActive = item.status === 'Active';
                  const isItemPending = item.status === 'Pending';

                  return (
                    <tr key={`${item.kind}-${item.id}`} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {item.kind === 'facility' ? (
                            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 font-bold flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                          ) : (
                            <img
                              src={item.photo || DEFAULT_DOCTOR_AVATAR}
                              alt={item.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_DOCTOR_AVATAR;
                              }}
                            />
                          )}
                          <div>
                            <div
                              onClick={() => setViewItem(item)}
                              className="font-bold text-slate-900 hover:text-teal-600 transition-colors cursor-pointer"
                            >
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              {item.phone && (
                                <span className="flex items-center gap-1" dir="ltr">
                                  <Phone className="w-3 h-3" />
                                  {item.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            item.categoryLabel === 'Hospital'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : item.categoryLabel === 'Clinic'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {item.categoryLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                        {item.specialtyOrType || 'General Practice'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs space-y-0.5">
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location}
                          </div>
                          {item.address && (
                            <div className="text-slate-500 truncate max-w-[190px]">{item.address}</div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isItemActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isItemPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isItemActive ? 'bg-emerald-500' : isItemPending ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* STRICTLY VIEW */}
                          <button
                            type="button"
                            onClick={() => setViewItem(item)}
                            title="View Details"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors border border-slate-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>

                          {/* STRICTLY ACCEPT OR REJECT/DELETE */}
                          {!isItemActive ? (
                            <button
                              type="button"
                              onClick={() => handleAcceptProvider(item)}
                              title="Accept / Activate Provider"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accept
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeactivateProvider(item)}
                              title="Deactivate Provider"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            title="Delete / Reject Application"
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

      {/* VIEW PROVIDER MODAL (Strictly View Only) */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {viewItem.kind === 'facility' ? (
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 font-bold flex items-center justify-center">
                    <Building2 className="w-8 h-8" />
                  </div>
                ) : (
                  <img
                    src={viewItem.photo || DEFAULT_DOCTOR_AVATAR}
                    alt={viewItem.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200"
                  />
                )}
                <div>
                  <h3 className="text-xl font-black text-slate-900">{viewItem.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-xs font-bold">
                      {viewItem.categoryLabel}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {viewItem.location}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status overview */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                viewItem.status === 'Active'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : viewItem.status === 'Pending'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-bold uppercase tracking-wider">
                  Status: {viewItem.status === 'Active' ? 'Active / Approved Provider' : viewItem.status === 'Pending' ? 'Pending Approval' : 'Deactivated'}
                </span>
              </div>
              <span>Registered: {viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Specialty / Scope</span>
                <div className="font-bold text-slate-800 mt-1">{viewItem.specialtyOrType || 'General'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Contact Phone</span>
                <div className="font-bold text-slate-800 mt-1" dir="ltr">{viewItem.phone || 'N/A'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium">Address / Affiliation</span>
                <div className="font-bold text-slate-800 mt-1">{viewItem.address || viewItem.location}</div>
              </div>

              {viewItem.operatingHours && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Operating Hours</span>
                  <div className="font-bold text-slate-800 mt-1">{viewItem.operatingHours}</div>
                </div>
              )}

              {viewItem.consultationFee && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Consultation Fee</span>
                  <div className="font-bold text-teal-700 mt-1">AED {viewItem.consultationFee}</div>
                </div>
              )}

              {viewItem.experienceYears && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium">Experience</span>
                  <div className="font-bold text-slate-800 mt-1">{viewItem.experienceYears} Years</div>
                </div>
              )}
            </div>

            {viewItem.about && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-400 font-medium block mb-1">About</span>
                <p className="text-slate-700 leading-relaxed">{viewItem.about}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {viewItem.status !== 'Active' ? (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleAcceptProvider(viewItem)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Accept / Activate
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleDeactivateProvider(viewItem)}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE / REJECT MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Provider</h3>
                <p className="text-xs text-slate-500">Permanent directory removal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-900">{itemToDelete.name}</span>? This will remove this{' '}
              {itemToDelete.categoryLabel} from the platform.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteProvider}
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
