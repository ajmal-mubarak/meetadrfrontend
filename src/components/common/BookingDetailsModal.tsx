import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { Appointment } from '../../types';
import { formatDisplayPhone } from '../../utils/phoneValidation';

interface BookingDetailsModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

/**
 * Generates the exact plain text format requested for booking sharing:
 * 
 * New Booking:
 * Hospital: Aster Hospital
 * Branch: Al Qusais
 * Date & Time: August 03,2025, 15.30
 * Patient Name: ABDULLAH MUTHAIRI
 * Patient Contact #: 0501234567
 * Patient Email (Optional): Abd_1@gmail.com
 * 
 * Regards
 * Team MeetAdr.com
 */
export function formatBookingTemplate(appointment: Appointment): string {
  const facility =
    appointment.hospitalName ||
    appointment.facilityName ||
    appointment.providerName ||
    'Medical Facility';

  const branch = (appointment as any).branch || appointment.location || 'Main Branch';
  const time = appointment.timeSlot || appointment.time || '';
  const dateTime = time ? `${appointment.date}, ${time}` : appointment.date;
  const rawPhone = appointment.patientPhone || appointment.patientMobile || '';
  const phone = formatDisplayPhone(rawPhone);
  const email = appointment.patientEmail || '';

  return `New Booking:
Hospital: ${facility}
Branch: ${branch}
Date & Time: ${dateTime}
Patient Name: ${appointment.patientName}
Patient Contact #: ${phone}
Patient Email (Optional): ${email}

Regards
Team MeetAdr.com`;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  appointment,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!appointment) return null;

  const facilityName =
    appointment.hospitalName ||
    appointment.facilityName ||
    appointment.providerName ||
    'Medical Facility';

  const branchText = (appointment as any).branch || appointment.location || 'Main Branch';
  const time = appointment.timeSlot || appointment.time || '';
  const dateTimeText = time ? `${appointment.date}, ${time}` : appointment.date;
  const rawPhone = appointment.patientPhone || appointment.patientMobile || '';
  const patientContact = formatDisplayPhone(rawPhone);
  const patientEmail = appointment.patientEmail || '';

  const plainTextSummary = formatBookingTemplate(appointment);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(plainTextSummary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-[#E2EBF0] shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-[#E2EBF0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2DA7B5]" />
            <span className="text-sm font-bold text-slate-800">
              Booking Details #{appointment.id}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content — Exact Template */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain">
          {/* Booking Card / Table */}
          <div className="border-2 border-slate-900 rounded-xl overflow-hidden font-sans shadow-xs">
            {/* Table Header: "New Booking:" */}
            <div className="bg-slate-900 text-white px-3.5 py-2.5 font-bold text-xs sm:text-sm tracking-wide flex items-center justify-between">
              <span>New Booking:</span>
              <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                {appointment.status}
              </span>
            </div>

            {/* Table Rows — Exact requested template with NO extra fields */}
            <div className="divide-y divide-slate-300 bg-white text-xs">
              {/* Row 1: Hospital */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-2.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Hospital</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-2.5 text-slate-800 font-medium">
                  {facilityName}
                </div>
              </div>

              {/* Row 2: Branch */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-2.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Branch</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-2.5 text-slate-800 font-medium">
                  {branchText}
                </div>
              </div>

              {/* Row 3: Date & Time */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-2.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Date & Time</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-2.5 text-slate-800 font-medium font-mono">
                  {dateTimeText}
                </div>
              </div>

              {/* Row 4: Patient Name */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-2.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Patient Name</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-2.5 text-slate-900 font-bold uppercase">
                  {appointment.patientName}
                </div>
              </div>

              {/* Row 5: Patient Contact # */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-2.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Patient Contact #</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-2.5 text-slate-800 font-medium font-mono" dir="ltr">
                  {patientContact}
                </div>
              </div>

              {/* Row 6: Patient Email (Optional) */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-2.5 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Patient Email (Optional)</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-2.5 text-slate-700 font-medium">
                  {patientEmail || <span className="text-slate-400 italic">Not provided</span>}
                </div>
              </div>

              {/* Row 7: Regards Team MeetAdr.com */}
              <div className="p-3 bg-slate-50 text-slate-800 border-t border-slate-300">
                <div className="font-semibold text-slate-900 text-xs">Regards</div>
                <div className="font-bold text-[#0E7490] text-xs">Team MeetAdr.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2EBF0] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied Template!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Details</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0E7490] hover:bg-[#08596F] text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
