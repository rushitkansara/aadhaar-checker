import { validateVerhoeff } from './verhoeff';

/**
 * Validates an Aadhaar number.
 *
 * @param {string} aadhaarString The Aadhaar number to validate.
 * @returns {{valid: boolean, reason?: string, masked?: string}} An object with the validation result.
 */
export function validateAadhaar(aadhaarString) {
  // 1. Check for empty input
  if (!aadhaarString) {
    return { valid: false, reason: 'Aadhaar number cannot be empty.' };
  }

  // 2. Remove any whitespace or hyphens
  const cleanAadhaar = unmaskAadhaar(aadhaarString).replace(/\s|-/g, '');

  // 3. Check if the Aadhaar number is exactly 12 digits
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return { valid: false, reason: 'Aadhaar number must be exactly 12 digits long.' };
  }

  // 4. Check if the Aadhaar number starts with a digit from 2 to 9
  if (!/^[2-9]/.test(cleanAadhaar)) {
    return { valid: false, reason: 'Aadhaar number cannot start with 0 or 1.' };
  }

  // 5. Validate the checksum using the Verhoeff algorithm
  if (!validateVerhoeff(cleanAadhaar)) {
    return { valid: false, reason: 'Invalid Aadhaar number. Please check the digits and try again.' };
  }

  // 6. If all checks pass, the Aadhaar number is valid
  const masked = `XXXX-XXXX-${cleanAadhaar.slice(-4)}`;


/**
 * Unmasks an Aadhaar number.
 *
 * @param {string} aadhaarString The Aadhaar number to unmask.
 * @returns {string} The unmasked Aadhaar number.
 */
export function unmaskAadhaar(aadhaarString) {
  if (!aadhaarString) {
    return '';
  }

  return aadhaarString.replace(/X/g, '0');
}
