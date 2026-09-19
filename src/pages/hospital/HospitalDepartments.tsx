import React, { useState } from 'react';
import { Building2, Plus, Users, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Department {
  id: string;
  name: string;
  head: string;
  doctorCount: number;
  bedCount: number;
}

export const HospitalDepartments: React.FC = () => {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([
    { id: 'dep-1', name: 'Cardiology & Cardiovascular Surgery', head: 'Dr. Tariq Al-Mansoor', doctorCount: 4, bedCount: 30 },
    { id: 'dep-2', name: 'Dermatology & Cosmetology', head: 'Dr. Fatima Zahra', doctorCount: 3, bedCount: 12 },
    { id: 'dep-3', name: 'Pediatrics & Neonatal Care', head: 'Dr. Mariam Al-Nuaimi', doctorCount: 5, bedCount: 40 },
    { id: 'dep-4', name: 'Orthopedics & Sports Medicine', head: 'Dr. Marcus Vance', doctorCount: 3, bedCount: 25 },
    { id: 'dep-5', name: 'Neurology & Neurosurgery', head: 'Dr. James Wilson', doctorCount: 2, bedCount: 18 },
  ]);

  const [newDepName, setNewDepName] = useState('');
  const [newDepHead, setNewDepHead] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepName.trim()) return;

    const dep: Department = {
      id: `dep-${Date.now()}`,
      name: newDepName.trim(),
      head: newDepHead.trim() || 'Unassigned',
      doctorCount: 1,
      bedCount: 15,
    };
    setDepartments([...departments, dep]);
    setNewDepName('');
    setNewDepHead('');
    showToast(`Department "${dep.name}" created.`, 'success');
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
            className="w-full py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((d) => (
              <tr key={d.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-5 py-3.5 font-bold text-slate-900">{d.name}</td>
                <td className="px-5 py-3.5 text-slate-700">{d.head}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] font-bold text-[11px]">
                    {d.doctorCount} Specialists
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500">{d.bedCount} Inpatient Beds</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
