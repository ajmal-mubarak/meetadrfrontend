import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { Appointment } from '../../types';

interface CancelModalProps {
  isOpen?: boolean;
  appointment?: Appointment | null;
  appointmentId?: string;
  doctorName?: string;
  date?: string;
  time?: string;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => Promise<void> | void;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  appointment,
  appointmentId,
  doctorName,
  date,
  time,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState<string>('Unforeseen Event');
  const [otherNote, setOtherNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const effectiveIsOpen = isOpen !== undefined ? isOpen : Boolean(appointment);
  if (!effectiveIsOpen) return null;

  const apptId = appointmentId || appointment?.id || '';
  const docName = doctorName || appointment?.doctorName || '';
  const apptDate = date || appointment?.date || '';
  const apptTime = time || appointment?.timeSlot || appointment?.time || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason === 'Others' && !otherNote.trim()) {
      setError(t('appointment.cancelReasonRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onConfirm(reason, reason === 'Others' ? otherNote : undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reasonOptions = [
    { value: 'Unforeseen Event', label: t('appointment.reasonUnforeseen') },
    { value: 'Wrongly Scheduled', label: t('appointment.reasonWrongTime') },
    { value: 'Others', label: t('appointment.reasonOther') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div
        id="cancel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="p-2 bg-rose-50 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="cancel-modal-title" className="font-semibold text-slate-900 text-lg">
              {t('appointment.cancelTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 text-sm text-slate-600">
          <p className="mb-3">
            {t('appointment.cancelConfirmQuestion', { doctor: docName, date: apptDate, time: apptTime })}
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            {t('appointment.cancelWarning', { id: apptId })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              {t('appointment.cancelReasonLabel')} <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {reasonOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                    reason === opt.value
                      ? 'border-[#007B8A] bg-[#0C1A22] text-white'
                      : 'border-slate-700 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={opt.value}
                    checked={reason === opt.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-[#007B8A] border-slate-700 focus:ring-slate-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === 'Others' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                {t('appointment.pleaseSpecify')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={otherNote}
                onChange={(e) => setOtherNote(e.target.value)}
                placeholder={t('appointment.pleaseSpecify')}
                className="w-full rounded-xl border border-slate-700 bg-[#0C1A22] text-slate-200 p-3 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none"
              />
            </div>
          )}

          {error && <div className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {t('appointment.keepAppointment')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? t('appointment.cancelling') : t('appointment.confirmCancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
