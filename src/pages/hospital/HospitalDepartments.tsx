import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, Trash2, Edit3, X, Loader2, AlertTriangle, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { realFacilityAdminService, FacilityDepartment } from '../../services/realFacilityAdminService';

export const HospitalDepartments: React.FC = () => {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<FacilityDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add form fields
  const [newDepName, setNewDepName] = useState('');
  const [newDepHead, setNewDepHead] = useState('');

  // Edit modal state
  const [editingDept, setEditingDept] = useState<FacilityDepartment | null>(null);
  const [editName, setEditName] = useState('');
  const [editHead, setEditHead] = useState('');
  const [editBedCapacity, setEditBedCapacity] = useState('15');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [deletingDept, setDeletingDept] = useState<FacilityDepartment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await realFacilityAdminService.getDepartments();
      setDepartments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load departments';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepName.trim()) return;

    setIsSubmitting(true);
    try {
      const dep = await realFacilityAdminService.createDepartment({
        name: newDepName.trim(),
        head_of_department: newDepHead.trim() || undefined,
        bed_capacity: 15,
      });
      setDepartments((prev) => [...prev, dep]);
      setNewDepName('');
      setNewDepHead('');
      showToast(`Department "${dep.name}" created.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create department';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (dep: FacilityDepartment) => {
    setEditingDept(dep);
    setEditName(dep.name);
    setEditHead(dep.head_name && dep.head_name !== 'Unassigned' ? dep.head_name : '');
    setEditBedCapacity(String(dep.bedCount || 15));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !editName.trim()) return;

    setIsUpdating(true);
    try {
      const updated = await realFacilityAdminService.updateDepartment(editingDept.id, {
        name: editName.trim(),
        head_of_department: editHead.trim() || undefined,
        bed_capacity: Number(editBedCapacity) || 15,
      });
      setDepartments((prev) =>
        prev.map((d) => (d.id === editingDept.id ? updated : d))
      );
      showToast(`Department "${updated.name}" updated successfully.`, 'success');
      setEditingDept(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update department';
      showToast(msg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDept) return;

    setIsDeleting(true);
    try {
      await realFacilityAdminService.deleteDepartment(deletingDept.id);
      setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
      showToast(`Department "${deletingDept.name}" removed successfully.`, 'success');
      setDeletingDept(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete department';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">Hospital Departments</h1>
        <p className="text-xs text-slate-500 mt-1">
          Clinical units and medical specialties registered under the facility.
        </p>
      </div>

      {/* Add Department Form */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-[#E2EBF0] p-5 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-6">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Department Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={newDepName}
            onChange={(e) => setNewDepName(e.target.value)}
            placeholder="e.g. Ophthalmology & Eye Surgery"
            className="w-full p-2.5 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Department Head</label>
          <input
            type="text"
            value={newDepHead}
            onChange={(e) => setNewDepHead(e.target.value)}
            placeholder="e.g. Dr. Hessa Al-Ketbi"
            className="w-full p-2.5 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add Dept</span>
          </button>
        </div>
      </form>

      {/* Departments Table */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
            <tr>
              <th className="px-5 py-3">Department Name</th>
              <th className="px-5 py-3">Head of Department</th>
              <th className="px-5 py-3">Doctors</th>
              <th className="px-5 py-3">Capacity</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#0E7490]" />
                  <span>Loading departments...</span>
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  No registered clinical departments found.
                </td>
              </tr>
            ) : (
              departments.map((d) => (
                <tr key={d.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{d.name}</td>
                  <td className="px-5 py-3.5 text-slate-700">{d.head_name || 'Unassigned'}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] font-bold text-[11px]">
                      {d.doctorCount ?? 0} {d.doctorCount === 1 ? 'Specialist' : 'Specialists'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{d.bedCount || 15} Inpatient Beds</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F8FAFC] hover:bg-[#E8F6F8] hover:text-[#0E7490] hover:border-[#CDEBF0] text-slate-700 rounded-xl text-xs font-semibold transition-all border border-[#E2EBF0] cursor-pointer shadow-2xs"
                        title="Edit Department"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#0E7490]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingDept(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FFF5F5] hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all border border-rose-200 cursor-pointer shadow-2xs"
                        title="Delete Department"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* EDIT DEPARTMENT MODAL                                                     */}
      {/* ========================================================================= */}
      {editingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E2EBF0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E2EBF0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2DA7B5]" />
                <h2 className="text-base font-bold text-slate-900">Edit Department</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingDept(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Cardiology & Heart Care"
                  className="w-full p-2.5 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department Head / Chief of Service
                </label>
                <input
                  type="text"
                  value={editHead}
                  onChange={(e) => setEditHead(e.target.value)}
                  placeholder="e.g. Dr. Hessa Al-Ketbi"
                  className="w-full p-2.5 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bed Capacity (Inpatient Units)
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={editBedCapacity}
                  onChange={(e) => setEditBedCapacity(e.target.value)}
                  placeholder="15"
                  className="w-full p-2.5 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:border-[#2DA7B5] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-[#E2EBF0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-[#E2EBF0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E2EBF0] shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Department</h3>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2EBF0] leading-relaxed">
                Are you sure you want to remove the <strong className="text-slate-900 font-bold">{deletingDept.name}</strong> department from your facility? Associated roster information will need to be updated.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingDept(null)}
                  className="px-4 py-2 bg-white hover:bg-[#F8FAFC] text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-[#E2EBF0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>{isDeleting ? 'Deleting...' : 'Delete Department'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
