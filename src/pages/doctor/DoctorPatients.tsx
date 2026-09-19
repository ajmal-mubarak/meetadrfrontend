import React, { useState, useEffect } from 'react';
import { User, Phone, Calendar, Search, FileText } from 'lucide-react';
import { bookingService } from '../../services/bookingService';
import { Appointment } from '../../types';

export const DoctorPatients: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const data = await bookingService.getAllAppointments();
      setAppointments(data);
    }
    load();
  }, []);

  // Group unique patients
  const patientMap = new Map<string, { name: string; phone: string; visits: number; lastDate: string; lastNotes: string }>();

  appointments.forEach((appt) => {
    const key = appt.patientName.toLowerCase();
    const existing = patientMap.get(key);
    if (!existing) {
      patientMap.set(key, {
        name: appt.patientName,
        phone: appt.patientPhone,
        visits: 1,
        lastDate: appt.date,
        lastNotes: appt.notes || 'None recorded',
      });
    } else {
      existing.visits += 1;
      if (new Date(appt.date) > new Date(existing.lastDate)) {
        existing.lastDate = appt.date;
        existing.lastNotes = appt.notes || existing.lastNotes;
      }
    }
  });

  const patientList = Array.from(patientMap.values()).filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.phone.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered patients with prior or upcoming appointments.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2EBF0] rounded-xl focus:bg-white focus:border-[#2DA7B5] focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-[#E2EBF0]">
              <tr>
                <th className="px-5 py-3">Patient Name</th>
                <th className="px-5 py-3">Contact Phone</th>
                <th className="px-5 py-3">Total Appointments</th>
                <th className="px-5 py-3">Last Visit / Scheduled</th>
                <th className="px-5 py-3">Recent Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBF0]">
              {patientList.map((p, idx) => (
                <tr key={idx} className="hover:bg-[#F8FAFC]/60 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#E8F6F8] text-[#0E7490] border border-[#CDEBF0] flex items-center justify-center font-bold text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-mono">{p.phone}</td>
                  <td className="px-5 py-3.5 text-slate-900 font-semibold">
                    {p.visits} {p.visits === 1 ? 'visit' : 'visits'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{p.lastDate}</td>
                  <td className="px-5 py-3.5 text-slate-500 max-w-xs truncate">{p.lastNotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
