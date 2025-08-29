import { validateVerhoeff } from './verhoeff';

/**
 * validateAadhaar(aadhaarString)
 * Returns { valid: boolean, reason?: string, masked?: string }
 */
export function validateAadhaar(aadhaarString) {
  if (!aadhaarString) return { valid: false, reason: 'Empty input' };

  const clean = aadhaarString.replace(/\s|-/g, '');
  if (!/^\d{12}$/.test(clean)) {
    return { valid: false, reason: 'Aadhaar must be exactly 12 digits' };
  }

  if (!/^[2-9]/.test(clean)) {
    return { valid: false, reason: 'Aadhaar must start with digits 2-9 (cannot start with 0 or 1)' };
  }

  // checksum check via Verhoeff
  if (!validateVerhoeff(clean)) {
    return { valid: false, reason: 'Invalid Aadhaar checksum' };
  }

  // masked version for display
  const masked = `XXXX-XXXX-${clean.slice(-4)}`;
  return { valid: true, masked };
}
