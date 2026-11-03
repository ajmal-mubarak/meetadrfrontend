/**
 * Normalizes doctor display name to always have a clean, single "Dr." prefix.
 * Prevents "Dr. Dr. <Name>" when names already include the professional title.
 */
export const formatDoctorName = (name: string | null | undefined): string => {
  if (!name) return '';
  let cleaned = name.trim();

  // Strip duplicate 'Dr. Dr.', 'Dr.Dr.', 'Doctor Dr.', etc.
  cleaned = cleaned.replace(/^(Dr\.\s*)+/i, 'Dr. ');
  cleaned = cleaned.replace(/^(Doctor\s*)+/i, 'Dr. ');

  // If not already prefixed by Dr. or Arabic equivalent د., prepend Dr.
  if (!/^(Dr\.|Dr\b|Doctor\b|د\.)/i.test(cleaned)) {
    cleaned = `Dr. ${cleaned}`;
  }

  return cleaned;
};
