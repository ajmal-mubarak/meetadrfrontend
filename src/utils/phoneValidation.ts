/**
 * Phone Number Rules, Country Code Mapping, and Length Validation
 */

export interface PhoneCountryRule {
  dialCode: string;
  countryName: string;
  expectedLength: number;
  minLength?: number;
  maxLength: number;
  example: string;
}

export const COUNTRY_PHONE_RULES: Record<string, PhoneCountryRule> = {
  '+971': { dialCode: '+971', countryName: 'United Arab Emirates', expectedLength: 9, minLength: 8, maxLength: 9, example: '50 123 4567' },
  '+91': { dialCode: '+91', countryName: 'India', expectedLength: 10, minLength: 10, maxLength: 10, example: '98765 43210' },
  '+966': { dialCode: '+966', countryName: 'Saudi Arabia', expectedLength: 9, minLength: 9, maxLength: 9, example: '50 123 4567' },
  '+968': { dialCode: '+968', countryName: 'Oman', expectedLength: 8, minLength: 8, maxLength: 8, example: '9123 4567' },
  '+974': { dialCode: '+974', countryName: 'Qatar', expectedLength: 8, minLength: 8, maxLength: 8, example: '3312 3456' },
  '+965': { dialCode: '+965', countryName: 'Kuwait', expectedLength: 8, minLength: 8, maxLength: 8, example: '9123 4567' },
  '+973': { dialCode: '+973', countryName: 'Bahrain', expectedLength: 8, minLength: 8, maxLength: 8, example: '3912 3456' },
  '+20': { dialCode: '+20', countryName: 'Egypt', expectedLength: 10, minLength: 10, maxLength: 10, example: '10 1234 5678' },
  '+44': { dialCode: '+44', countryName: 'United Kingdom', expectedLength: 10, minLength: 10, maxLength: 10, example: '7123 456789' },
  '+1': { dialCode: '+1', countryName: 'United States', expectedLength: 10, minLength: 10, maxLength: 10, example: '202 555 0123' },
  '+92': { dialCode: '+92', countryName: 'Pakistan', expectedLength: 10, minLength: 10, maxLength: 10, example: '300 1234567' },
  '+63': { dialCode: '+63', countryName: 'Philippines', expectedLength: 10, minLength: 10, maxLength: 10, example: '917 123 4567' },
  '+962': { dialCode: '+962', countryName: 'Jordan', expectedLength: 9, minLength: 9, maxLength: 9, example: '7 9123 4567' },
  '+961': { dialCode: '+961', countryName: 'Lebanon', expectedLength: 8, minLength: 7, maxLength: 8, example: '70 123 456' },
  '+963': { dialCode: '+963', countryName: 'Syria', expectedLength: 9, minLength: 9, maxLength: 9, example: '944 123 456' },
  '+964': { dialCode: '+964', countryName: 'Iraq', expectedLength: 10, minLength: 10, maxLength: 10, example: '770 123 4567' },
  '+49': { dialCode: '+49', countryName: 'Germany', expectedLength: 10, minLength: 10, maxLength: 11, example: '151 12345678' },
  '+33': { dialCode: '+33', countryName: 'France', expectedLength: 9, minLength: 9, maxLength: 9, example: '6 12 34 56 78' },
  '+39': { dialCode: '+39', countryName: 'Italy', expectedLength: 10, minLength: 10, maxLength: 10, example: '312 345 6789' },
  '+34': { dialCode: '+34', countryName: 'Spain', expectedLength: 9, minLength: 9, maxLength: 9, example: '612 34 56 78' },
  '+86': { dialCode: '+86', countryName: 'China', expectedLength: 11, minLength: 11, maxLength: 11, example: '138 0013 8000' },
  '+81': { dialCode: '+81', countryName: 'Japan', expectedLength: 10, minLength: 10, maxLength: 10, example: '90 1234 5678' },
  '+82': { dialCode: '+82', countryName: 'South Korea', expectedLength: 10, minLength: 10, maxLength: 10, example: '10 1234 5678' },
  '+7': { dialCode: '+7', countryName: 'Russia', expectedLength: 10, minLength: 10, maxLength: 10, example: '912 345 67 89' },
  '+61': { dialCode: '+61', countryName: 'Australia', expectedLength: 9, minLength: 9, maxLength: 9, example: '412 345 678' },
  '+90': { dialCode: '+90', countryName: 'Turkey', expectedLength: 10, minLength: 10, maxLength: 10, example: '532 123 45 67' },
  '+880': { dialCode: '+880', countryName: 'Bangladesh', expectedLength: 10, minLength: 10, maxLength: 10, example: '1712 345678' },
  '+94': { dialCode: '+94', countryName: 'Sri Lanka', expectedLength: 9, minLength: 9, maxLength: 9, example: '71 234 5678' },
  '+977': { dialCode: '+977', countryName: 'Nepal', expectedLength: 10, minLength: 10, maxLength: 10, example: '984 1234567' },
  '+27': { dialCode: '+27', countryName: 'South Africa', expectedLength: 9, minLength: 9, maxLength: 9, example: '82 123 4567' },
  '+234': { dialCode: '+234', countryName: 'Nigeria', expectedLength: 10, minLength: 10, maxLength: 10, example: '802 123 4567' },
  '+254': { dialCode: '+254', countryName: 'Kenya', expectedLength: 9, minLength: 9, maxLength: 9, example: '712 345678' },
};

export const COUNTRY_TO_DIAL_CODE: Record<string, string> = {
  'United Arab Emirates': '+971',
  'India': '+91',
  'Saudi Arabia': '+966',
  'Oman': '+968',
  'Qatar': '+974',
  'Kuwait': '+965',
  'Bahrain': '+973',
  'Egypt': '+20',
  'United Kingdom': '+44',
  'United States': '+1',
  'USA': '+1',
  'Pakistan': '+92',
  'Philippines': '+63',
  'Jordan': '+962',
  'Lebanon': '+961',
  'Syria': '+963',
  'Iraq': '+964',
  'Germany': '+49',
  'France': '+33',
  'Italy': '+39',
  'Spain': '+34',
  'China': '+86',
  'Japan': '+81',
  'South Korea': '+82',
  'Russia': '+7',
  'Australia': '+61',
  'Turkey': '+90',
  'Bangladesh': '+880',
  'Sri Lanka': '+94',
  'Nepal': '+977',
  'South Africa': '+27',
  'Nigeria': '+234',
  'Kenya': '+254',
};

export const DIAL_CODE_TO_COUNTRY: Record<string, string> = {
  '+971': 'United Arab Emirates',
  '+91': 'India',
  '+966': 'Saudi Arabia',
  '+968': 'Oman',
  '+974': 'Qatar',
  '+965': 'Kuwait',
  '+973': 'Bahrain',
  '+20': 'Egypt',
  '+44': 'United Kingdom',
  '+1': 'United States',
  '+92': 'Pakistan',
  '+63': 'Philippines',
  '+962': 'Jordan',
  '+961': 'Lebanon',
  '+963': 'Syria',
  '+964': 'Iraq',
  '+49': 'Germany',
  '+33': 'France',
  '+39': 'Italy',
  '+34': 'Spain',
  '+86': 'China',
  '+81': 'Japan',
  '+82': 'South Korea',
  '+7': 'Russia',
  '+61': 'Australia',
  '+90': 'Turkey',
  '+880': 'Bangladesh',
  '+94': 'Sri Lanka',
  '+977': 'Nepal',
  '+27': 'South Africa',
  '+234': 'Nigeria',
  '+254': 'Kenya',
};

export function getPhoneRule(dialCode: string): PhoneCountryRule {
  const cleanCode = (dialCode || '').trim();
  return (
    COUNTRY_PHONE_RULES[cleanCode] || {
      dialCode: cleanCode || '+971',
      countryName: 'Other',
      expectedLength: 10,
      minLength: 7,
      maxLength: 12,
      example: '123 456789',
    }
  );
}

/**
 * Sanitizes phone input:
 * 1. Keeps only digits
 * 2. Enforces maximum length based on dial code rule (e.g. 10 for India, 9 for UAE)
 */
export function sanitizePhoneNumber(raw: string, dialCode: string): string {
  const digitsOnly = (raw || '').replace(/\D/g, '');
  const rule = getPhoneRule(dialCode);

  let maxDigits = rule.maxLength;
  // If UAE and entered with leading 0, allow 10 digits
  if (rule.dialCode === '+971' && digitsOnly.startsWith('0')) {
    maxDigits = 10;
  }

  return digitsOnly.slice(0, maxDigits);
}

/**
 * Validates phone length and formatting against country rules.
 * Returns error string or null if valid.
 */
export function validatePhoneNumber(raw: string, dialCode: string): string | null {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) {
    return 'Please enter a contact phone number.';
  }

  const rule = getPhoneRule(dialCode);
  const isUAEWithLeadingZero = rule.dialCode === '+971' && digits.startsWith('0');
  const min = isUAEWithLeadingZero ? 10 : (rule.minLength ?? rule.expectedLength);
  const max = isUAEWithLeadingZero ? 10 : rule.maxLength;

  if (min === max) {
    if (digits.length !== max) {
      return `${rule.countryName} phone numbers must be exactly ${max} digits (e.g. ${rule.example}).`;
    }
  } else {
    if (digits.length < min || digits.length > max) {
      return `${rule.countryName} phone numbers must be between ${min} and ${max} digits.`;
    }
  }

  return null;
}

/**
 * Splits a phone number that might already include a dial code (e.g. "+971501234567" or "+91 9876543210")
 * into { dialCode, localNumber }.
 */
export function splitPhoneNumber(raw: string, defaultDialCode = '+971'): { dialCode: string; localNumber: string } {
  if (!raw) return { dialCode: defaultDialCode, localNumber: '' };
  const trimmed = raw.trim();
  // Sort known dial codes descending by length to match e.g. +971 before +9
  const dialCodes = Object.keys(COUNTRY_PHONE_RULES).sort((a, b) => b.length - a.length);
  for (const code of dialCodes) {
    if (trimmed.startsWith(code)) {
      const rest = trimmed.slice(code.length).trim().replace(/^[\s-]+/, '');
      return { dialCode: code, localNumber: rest };
    }
  }
  return { dialCode: defaultDialCode, localNumber: trimmed };
}

/**
 * Cleanly formats a phone number for display, stripping any duplicate dial codes
 * (e.g. "+971 +971501234567" -> "+971 501234567")
 */
export function formatDisplayPhone(raw: string): string {
  if (!raw) return 'Not provided';
  let cleaned = raw.trim();
  // Remove duplicate dial codes like "+971 +971501234567" or "+971+971"
  cleaned = cleaned.replace(/^(\+\d{1,4})\s*\+?\d{1,4}/, '$1');
  return cleaned;
}

