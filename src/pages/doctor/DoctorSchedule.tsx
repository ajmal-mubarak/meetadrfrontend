import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, Plus, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { realDoctorPortalService } from '../../services/realDoctorPortalService';

const ALL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const STANDARD_SLOTS = [
  '09:00 - 09:30',
  '09:30 - 10:00',
  '10:00 - 10:30',
  '10:30 - 11:00',
  '11:00 - 11:30',
  '11:30 - 12:00',
  '14:00 - 14:30',
  '14:30 - 15:00',
  '15:00 - 15:30',
  '15:30 - 16:00',
  '16:00 - 16:30',
  '16:30 - 17:00',
];

export const DoctorSchedule: React.FC = () => {
  const { showToast } = useToast();
  const [activeDays, setActiveDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Saturday',
  ]);

  const [activeSlots, setActiveSlots] = useState<string[]>([
    '09:00 - 09:30',
    '09:30 - 10:00',
    '10:00 - 10:30',
    '10:30 - 11:00',
    '11:00 - 11:30',
    '14:00 - 14:30',
    '14:30 - 15:00',
    '15:00 - 15:30',
    '16:00 - 16:30',
  ]);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const data = await realDoctorPortalService.getSchedule();
        if (data && Array.isArray(data.available_days) && data.available_days.length > 0) {
          setActiveDays(data.available_days);
        }
        if (data && Array.isArray(data.standard_slots) && data.standard_slots.length > 0) {
          setActiveSlots(data.standard_slots);
        }
      } catch (err) {
        console.warn('Unable to load doctor schedule from backend:', err);
      }
    }
    loadSchedule();
  }, []);

  const toggleDay = (day: string) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleSlot = (slot: string) => {
    setActiveSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await realDoctorPortalService.updateSchedule({
        available_days: activeDays,
        standard_slots: activeSlots,
        slot_duration_minutes: 30,
      });
      showToast('Consultation schedule updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update schedule.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly Schedule & Slot Availability</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure practicing days and standard 30-minute consultation slots.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#2DA7B5] hover:bg-[#23929F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Days configuration */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#0E7490] uppercase tracking-wider">
          Practicing Days
        </h3>
        <p className="text-xs text-slate-500">
          Click to enable or disable days you are available for patient booking.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
          {ALL_DAYS.map((day) => {
            const isActive = activeDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#2DA7B5] bg-[#E8F6F8] text-[#0E7490] font-bold shadow-xs'
                    : 'border-[#E2EBF0] text-slate-500 hover:bg-[#F8FAFC]'
                }`}
              >
                <span>{day.slice(0, 3)}</span>
                <span className="block text-[10px] mt-1 font-normal">
                  {isActive ? 'Available' : 'Off'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 30-min Slots configuration */}
      <div className="bg-white rounded-2xl border border-[#E2EBF0] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-[#0E7490] uppercase tracking-wider">
          Standard 30-Minute Consultation Slots
        </h3>
        <p className="text-xs text-slate-500">
          Select time intervals when patients can schedule an appointment.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
          {STANDARD_SLOTS.map((slot) => {
            const isSelected = activeSlots.includes(slot);
            return (
              <button
                key={slot}
                type="button"
                onClick={() => toggleSlot(slot)}
                className={`py-2 px-3 rounded-xl border text-xs font-mono font-medium transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#2DA7B5] bg-[#E8F6F8] text-[#0E7490] font-bold shadow-xs'
                    : 'border-[#E2EBF0] text-slate-500 hover:bg-[#F8FAFC]'
                }`}
              >
                <span>{slot}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#2DA7B5]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
