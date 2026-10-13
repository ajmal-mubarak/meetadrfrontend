import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Calendar,
  Building2,
  User,
  Phone,
  Mail,
  Share2,
} from 'lucide-react';
import { Appointment } from '../../types';

interface BookingDetailsModalProps {
  appointment: Appointment | null;
  onClose: () => void;
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

  const locationText = appointment.location || 'United Arab Emirates';
  const dateTimeText = `${appointment.date}${
    appointment.timeSlot || appointment.time
      ? `, ${appointment.timeSlot || appointment.time}`
      : ''
  }`;
  const patientContact =
    appointment.patientPhone || appointment.patientMobile || 'Not provided';
  const patientEmail = appointment.patientEmail || '';

  const plainTextSummary = `New Booking:
Hospital: ${facilityName}
Location: ${locationText}
Date & Time: ${dateTimeText}
Patient Name: ${appointment.patientName}
Patient Contact #: ${patientContact}
Patient Email (Optional): ${patientEmail || 'Not provided'}${
    appointment.googleMapsUrl ? `\nLocation in Maps: ${appointment.googleMapsUrl}` : ''
  }

Regards
Team MeetAdr.com`;

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2EBF0] shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-[#E2EBF0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2DA7B5]" />
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

        {/* Modal Content — Structured exactly as requested */}
        <div className="p-6 space-y-5">
          {/* Booking Card / Table */}
          <div className="border-2 border-slate-900 rounded-xl overflow-hidden font-sans shadow-xs">
            {/* Table Header: "New Booking:" */}
            <div className="bg-slate-900 text-white px-4 py-2.5 font-bold text-sm sm:text-base tracking-wide flex items-center justify-between">
              <span>New Booking:</span>
              <span className="text-[11px] font-normal uppercase tracking-wider px-2 py-0.5 rounded bg-white/20 text-white">
                {appointment.status}
              </span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-300 bg-white text-xs sm:text-sm">
              {/* Row 1: Hospital */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-3 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Hospital</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-3 text-slate-700 font-medium">
                  {facilityName}
                </div>
              </div>

              {/* Row 2: Location (Explicitly Location, NOT Branch) */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-3 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" />
                  <span>Location</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-3 text-slate-700 font-medium flex flex-wrap items-center justify-between gap-2">
                  <span>{locationText}</span>
                  {appointment.googleMapsUrl && (
                    <a
                      href={appointment.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#E8F6F8] text-[#0E7490] hover:bg-[#D4EFF4] text-[11px] font-bold border border-[#CDEBF0] transition-colors"
                    >
                      <MapPin className="w-3 h-3 text-[#2DA7B5]" />
                      <span>View on Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Row 3: Date & Time */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-3 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Date & Time</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-3 text-slate-700 font-medium font-mono">
                  {dateTimeText}
                </div>
              </div>

              {/* Row 4: Patient Name */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-3 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Patient Name</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-3 text-slate-900 font-bold uppercase">
                  {appointment.patientName}
                </div>
              </div>

              {/* Row 5: Patient Contact # */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-3 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Patient Contact #</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-3 text-slate-700 font-medium font-mono" dir="ltr">
                  {patientContact}
                </div>
              </div>

              {/* Row 6: Patient Email (Optional) */}
              <div className="grid grid-cols-12">
                <div className="col-span-5 sm:col-span-4 p-3 font-bold text-slate-900 bg-slate-50 border-r border-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Patient Email (Optional)</span>
                </div>
                <div className="col-span-7 sm:col-span-8 p-3 text-slate-700 font-medium">
                  {patientEmail || <span className="text-slate-400 italic">Not provided</span>}
                </div>
              </div>

              {/* Row 7: Regards Team MeetAdr.com */}
              <div className="p-3 bg-slate-50 text-slate-800 border-t border-slate-300">
                <div className="font-semibold text-slate-900">Regards</div>
                <div className="font-bold text-[#0E7490]">Team MeetAdr.com</div>
              </div>
            </div>
          </div>

          {/* Doctor & Specialty Info pill */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs flex items-center justify-between">
            <span className="text-slate-500">
              Doctor: <strong className="text-slate-800">{appointment.doctorName}</strong>
            </span>
            <span className="text-[#0E7490] font-semibold">
              {appointment.specialty}
            </span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2EBF0] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-[#E2EBF0] text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
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
            className="px-5 py-2 bg-[#2DA7B5] hover:bg-[#23929F] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
