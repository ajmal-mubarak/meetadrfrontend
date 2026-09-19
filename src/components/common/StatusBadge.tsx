import React from 'react';
import { AppointmentStatus } from '../../types';
import { useTranslation } from '../../i18n';

interface StatusBadgeProps {
  status: AppointmentStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { translateStatus } = useTranslation();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-bold';
  const s = (status || '').toLowerCase();
  const label = translateStatus(s);

  switch (s) {
    case 'confirmed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-[#EFF3EC] text-[#6C7A5B] border border-[#BAC7AD] ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#8D9B7B]" />
          {label}
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-stone-100 text-stone-600 border border-stone-300 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
          {label}
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-black text-white ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          {label}
        </span>
      );
    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          {label}
        </span>
      );
  }
};
