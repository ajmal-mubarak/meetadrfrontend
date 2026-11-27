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

export const EMIRATE_AREAS: Record<string, string[]> = {
  'Dubai': [
    'Jebel Ali',
    'Muhaisnah',
    'Al Mankhool',
    'Downtown Dubai',
    'Dubai Marina',
    'Business Bay',
    'Dubai Healthcare City',
    'Palm Jumeirah',
    'DIFC',
    'Jumeirah',
    'Al Barsha',
    'Deira',
    'Bur Dubai',
    'Al Jaddaf',
    'Oud Metha',
    'Mirdif',
    'Al Karama',
  ],
  'Abu Dhabi': [
    'Al Maryah Island',
    'Al Reem Island',
    'Abu Dhabi Corniche',
    'Al Khalidiya',
    'Al Bateen',
    'Yas Island',
    'Saadiyat Island',
    'Al Zahiyah',
    'Mussafah',
  ],
  'Sharjah': [
    'Al Majaz',
    'Al Nahda',
    'University City',
    'Al Taawun',
    'Al Qasimia',
    'Al Khan',
  ],
  'Ajman': [
    'Al Nuaimiya',
    'Al Rashidiya',
    'Ajman Downtown',
    'Al Jurf',
  ],
  'Ras Al Khaimah': [
    'Al Nakheel',
    'Al Hamra',
    'Mina Al Arab',
    'Khuzam',
  ],
  'Fujairah': [
    'Fujairah City',
    'Dibba Al Fujairah',
    'Al Faseel',
  ],
  'Umm Al Quwain': [
    'Al Salamah',
    'Umm Al Quwain Marina',
    'Al Raas',
  ],
};

export const AREAS = [
  'Jebel Ali',
  'Muhaisnah',
  'Al Mankhool',
  'Downtown Dubai',
  'Dubai Marina',
  'Business Bay',
  'Dubai Healthcare City',
  'Palm Jumeirah',
  'DIFC Gate Village',
  'Jumeirah Beach Road',
  'Al Barsha',
  'Deira',
  'Bur Dubai',
  'Mirdif',
  'Al Karama',
  'Oud Metha',
  'Al Jaddaf',
  'Al Maryah Island',
  'Al Reem Island',
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
  'jebel ali': 'dubai',
  'jabal ali': 'dubai',
  'muhaisnah': 'dubai',
  'muhasina': 'dubai',
  'al mankhool': 'dubai',
  'mankhool': 'dubai',
  'business bay': 'dubai',
  'al barsha': 'dubai',
  'barsha': 'dubai',
  'mirdif': 'dubai',
  'al karama': 'dubai',
  'karama': 'dubai',
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
  'deira': 'dubai',
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


// Auto-populate AREA_TO_EMIRATE from EMIRATE_AREAS
Object.entries(EMIRATE_AREAS).forEach(([emirate, areas]) => {
  const emKey = emirate.toLowerCase();
  areas.forEach((area) => {
    const aKey = area.toLowerCase().trim();
    if (!AREA_TO_EMIRATE[aKey]) {
      AREA_TO_EMIRATE[aKey] = emKey;
    }
    if (aKey.startsWith('al ')) {
      const stripped = aKey.replace(/^al\s+/, '');
      if (!AREA_TO_EMIRATE[stripped]) {
        AREA_TO_EMIRATE[stripped] = emKey;
      }
    }
  });
});

/**
 * Returns the list of areas for a given location/emirate, combining static predefined
 * emirate areas with any dynamically extracted areas from loaded facilities/doctors,
 * strictly filtering to ensure only areas belonging to that emirate are included.
 */
export function getAreasForLocation(
  selectedLocation?: string,
  dynamicItems?: Array<{ location?: string; area?: string }>
): string[] {
  const isSpecificEmirate = Boolean(
    selectedLocation &&
    selectedLocation !== 'All' &&
    selectedLocation !== 'current' &&
    selectedLocation !== 'divider-1' &&
    selectedLocation !== 'divider-emirates' &&
    selectedLocation !== 'divider-areas'
  );

  let emirateKey: string | undefined = undefined;
  if (isSpecificEmirate && selectedLocation) {
    emirateKey = Object.keys(EMIRATE_AREAS).find(
      (e) => e.toLowerCase() === selectedLocation.trim().toLowerCase()
    );
    // If not directly matched, check if selectedLocation is an alias or mapped emirate
    if (!emirateKey) {
      const mapped = AREA_TO_EMIRATE[selectedLocation.toLowerCase().trim()] || EMIRATE_ALIASES[selectedLocation.toLowerCase().trim()];
      if (mapped) {
        emirateKey = Object.keys(EMIRATE_AREAS).find((e) => e.toLowerCase() === mapped);
      }
    }
  }

  let baseList: string[] = [];
  if (emirateKey && EMIRATE_AREAS[emirateKey]) {
    baseList = [...EMIRATE_AREAS[emirateKey]];
  } else if (!isSpecificEmirate) {
    baseList = [...AREAS];
  }

  const dynamicSet = new Set<string>();
  if (dynamicItems && dynamicItems.length > 0) {
    dynamicItems.forEach((item) => {
      if (isSpecificEmirate && emirateKey) {
        if (!matchesLocation(item.location, emirateKey)) {
          return;
        }
      }

      if (item.area) {
        const clean = item.area.replace(/\s*\([^)]*\)\s*$/, '').trim();
        if (clean) dynamicSet.add(clean);
      }

      if (item.location && item.location.includes(' - ')) {
        const parts = item.location.split(' - ');
        const emPart = parts[0]?.trim();
        const areaPart = parts[1]?.trim();

        if (isSpecificEmirate && emirateKey) {
          if (emPart && matchesLocation(emPart, emirateKey) && areaPart) {
            dynamicSet.add(areaPart);
          }
        } else if (areaPart) {
          dynamicSet.add(areaPart);
        }
      }
    });
  }

  const result: string[] = [];
  const seen = new Set<string>();

  const candidateList = [...baseList, ...Array.from(dynamicSet)];
  for (const a of candidateList) {
    if (!a) continue;
    const aLower = a.toLowerCase().trim();
    if (seen.has(aLower)) continue;

    if (isSpecificEmirate && emirateKey) {
      const targetEm = emirateKey.toLowerCase();
      const mappedEm = AREA_TO_EMIRATE[aLower];
      if (mappedEm && mappedEm !== targetEm && !mappedEm.includes(targetEm)) {
        continue;
      }
      let belongsToOther = false;
      for (const [otherEm, otherAreas] of Object.entries(EMIRATE_AREAS)) {
        if (otherEm.toLowerCase() !== targetEm) {
          if (otherAreas.some((oa) => oa.toLowerCase() === aLower)) {
            belongsToOther = true;
            break;
          }
        }
      }
      if (belongsToOther && !baseList.some((ba) => ba.toLowerCase() === aLower)) {
        continue;
      }
    }

    seen.add(aLower);
    result.push(a);
  }

  return result;
}

export function matchesLocation(itemLocation?: string, selectedLocation?: string): boolean {
  if (!selectedLocation || selectedLocation === 'All' || selectedLocation === 'current') return true;
  if (!itemLocation) return false;

  const itemNorm = itemLocation.toLowerCase().replace(/[-–—(),]/g, ' ').replace(/\s+/g, ' ').trim();
  const selNorm = selectedLocation.toLowerCase().replace(/[-–—(),]/g, ' ').replace(/\s+/g, ' ').trim();

  // Exact or substring match
  if (itemNorm.includes(selNorm) || selNorm.includes(itemNorm)) return true;

  // Normalized phonetic / alternate spellings (e.g. Jabal/Jebel, Muhasina/Muhaisnah, Mankhool/Al Mankhool)
  const normPhonetic = (s: string) =>
    s
      .replace(/jabal/g, 'jebel')
      .replace(/muhasina/g, 'muhaisnah')
      .replace(/\bal\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  const itemPhonetic = normPhonetic(itemNorm);
  const selPhonetic = normPhonetic(selNorm);
  if (itemPhonetic && selPhonetic && (itemPhonetic.includes(selPhonetic) || selPhonetic.includes(itemPhonetic))) {
    return true;
  }

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


