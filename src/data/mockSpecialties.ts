export const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'General Medicine',
  'Orthopedics',
  'Pediatrics',
  'ENT',
  'Neurology',
  'Gynecology',
  'Ophthalmology',
  'Pulmonology',
  'Gastroenterology',
  'Endocrinology',
  'Skin Care',
  'Dental',
  'Physiotherapy',
  'Radiology',
  'Laboratory',
  'Urology',
  'Home Care',
];

export const LOCATIONS = [
  'Downtown Dubai',
  'Palm Jumeirah',
  'DIFC Gate Village',
  'Jumeirah Beach Road',
  'Dubai Marina',
  'Dubai Healthcare City',
  'Oud Metha',
  'Al Jaddaf',
  'Al Maryah Island',
  'Abu Dhabi Corniche',
  'Al Majaz (Sharjah)',
  'University City (Sharjah)',
];

export const CITIES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
];

export const AREAS = LOCATIONS;

export function matchesLocation(itemLocation?: string, selectedLocation?: string): boolean {
  if (!selectedLocation || selectedLocation === 'All') return true;
  if (!itemLocation) return false;

  const itemNorm = itemLocation.toLowerCase().replace(/[-–—(),]/g, ' ').replace(/\s+/g, ' ').trim();
  const selNorm = selectedLocation.toLowerCase().replace(/[-–—(),]/g, ' ').replace(/\s+/g, ' ').trim();

  if (itemNorm.includes(selNorm) || selNorm.includes(itemNorm)) return true;

  // Significant keywords matching
  const keywords = selNorm.split(' ').filter((w) => w.length >= 4 || w === 'difc');
  return keywords.some((kw) => itemNorm.includes(kw));
}


