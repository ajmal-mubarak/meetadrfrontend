import { Appointment } from '../types';

export const getAppointmentTimestamp = (
  appt: Appointment | { date?: string; time?: string; timeSlot?: string }
): number => {
  if (!appt?.date) return 0;
  const timeStr = (appt.timeSlot || ('time' in appt ? appt.time : undefined) || '09:00 AM').trim();
  let hours = 9;
  let minutes = 0;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }
  const dateParts = appt.date.split('-');
  if (dateParts.length === 3) {
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    return new Date(year, month, day, hours, minutes, 0).getTime();
  }
  const d = new Date(`${appt.date} ${timeStr}`);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export const formatCountdown = (
  appt: Appointment,
  now: number,
  isArabic: boolean
): string => {
  const target = getAppointmentTimestamp(appt);
  if (!target) return '';
  const diff = target - now;

  if (diff <= 0) {
    if (diff > -2 * 60 * 60 * 1000) {
      return isArabic ? 'جارٍ الآن' : 'In progress';
    }
    return isArabic ? 'انتهى' : 'Passed';
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (isArabic) {
    if (days > 0) {
      return `متبقي ${days}ي ${hours}س ${minutes}د ${seconds}ث`;
    }
    if (hours > 0) {
      return `متبقي ${hours}س ${minutes}د ${seconds}ث`;
    }
    return `متبقي ${minutes}د ${seconds}ث`;
  }

  if (days > 0) {
    return `in ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
  if (hours > 0) {
    return `in ${hours}h ${minutes}m ${seconds}s`;
  }
  return `in ${minutes}m ${seconds}s`;
};
