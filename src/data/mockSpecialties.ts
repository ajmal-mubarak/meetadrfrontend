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
  'Dental',
  'Physiotherapy',
  'Radiology',
  'Laboratory',
  'Urology',
  'Home Care',
];

export const EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
];

export const AREAS = [
  'Downtown Dubai',
  'Dubai Marina',
  'Dubai Healthcare City',
  'Palm Jumeirah',
  'DIFC Gate Village',
  'Jumeirah Beach Road',
  'Oud Metha',
  'Al Jaddaf',
  'Bur Dubai',
  'Deira',
  'Al Maryah Island',
  'Abu Dhabi Corniche',
  'Al Majaz (Sharjah)',
  'University City (Sharjah)',
];

export const LOCATIONS = [
  ...EMIRATES,
  ...AREAS,
];

export const CITIES = EMIRATES;

const AREA_TO_EMIRATE: Record<string, string> = {
  'downtown dubai': 'dubai',
  'palm jumeirah': 'dubai',
  'difc': 'dubai',
  'difc gate village': 'dubai',
  'jumeirah': 'dubai',
  'jumeirah beach road': 'dubai',
  'dubai marina': 'dubai',
  'dubai healthcare city': 'dubai',
  'dhcc': 'dubai',
  'oud metha': 'dubai',
  'al jaddaf': 'dubai',
  'bur dubai': 'dubai',
  'mankhool': 'dubai',
  'deira': 'dubai',
  'al barsha': 'dubai',
  'al maryah island': 'abu dhabi',
  'abu dhabi corniche': 'abu dhabi',
  'tourist club area': 'abu dhabi',
  'al reem island': 'abu dhabi',
  'khalifa city': 'abu dhabi',
  'al majaz': 'sharjah',
  'al majaz (sharjah)': 'sharjah',
  'university city': 'sharjah',
  'university city (sharjah)': 'sharjah',
  'al nahda': 'sharjah',
};

const EMIRATE_ALIASES: Record<string, string> = {
  'dxb': 'dubai',
  'dubai': 'dubai',
  'auh': 'abu dhabi',
  'abu dhabi': 'abu dhabi',
  'abudhabi': 'abu dhabi',
  'shj': 'sharjah',
  'sharjah': 'sharjah',
  'ajm': 'ajman',
  'ajman': 'ajman',
  'rak': 'ras al khaimah',
  'ras al khaimah': 'ras al khaimah',
  'fuj': 'fujairah',
  'fujairah': 'fujairah',
  'uaq': 'umm al quwain',
  'umm al quwain': 'umm al quwain',
};

export function matchesLocation(itemLocation?: string, selectedLocation?: string): boolean {
  if (!selectedLocation || selectedLocation === 'All' || selectedLocation === 'current') return true;
  if (!itemLocation) return false;

  const itemNorm = itemLocation.toLowerCase().replace(/[-–—(),]/g, ' ').replace(/\s+/g, ' ').trim();
  const selNorm = selectedLocation.toLowerCase().replace(/[-–—(),]/g, ' ').replace(/\s+/g, ' ').trim();

  // Exact or substring match
  if (itemNorm.includes(selNorm) || selNorm.includes(itemNorm)) return true;

  // Normalize aliases (e.g. 'dxb' -> 'dubai')
  const selEmirate = EMIRATE_ALIASES[selNorm] || selNorm;
  const itemEmirate = EMIRATE_ALIASES[itemNorm] || itemNorm;

  if (selEmirate && (itemNorm.includes(selEmirate) || selEmirate.includes(itemNorm))) return true;
  if (itemEmirate && (selNorm.includes(itemEmirate) || itemEmirate.includes(selNorm))) return true;

  // Check area-to-emirate mapping
  const mappedItemEmirate =
    AREA_TO_EMIRATE[itemNorm] ||
    Object.entries(AREA_TO_EMIRATE).find(([k]) => itemNorm.includes(k))?.[1];
  const mappedSelEmirate =
    AREA_TO_EMIRATE[selNorm] ||
    Object.entries(AREA_TO_EMIRATE).find(([k]) => selNorm.includes(k))?.[1];

  if (mappedItemEmirate && (mappedItemEmirate === selEmirate || mappedItemEmirate === selNorm)) return true;
  if (mappedSelEmirate && (mappedSelEmirate === itemEmirate || mappedSelEmirate === itemNorm)) return true;

  // Significant keywords matching
  const keywords = selNorm.split(' ').filter((w) => w.length >= 4 || w === 'difc');
  return keywords.some((kw) => itemNorm.includes(kw));
}


