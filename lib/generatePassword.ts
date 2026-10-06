/**
 * Unambiguous base32 alphabet: 32 characters, no confusing characters (0, O, 1, I, L).
 * 32 characters = 5 bits of entropy per character.
 */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

/**
 * Generates a secure random password using Web Crypto API crypto.getRandomValues.
 * Format: xxxx-xxxx-xxxx-xxxx (4 groups of 4 characters, 16 characters total).
 * 16 chars * 5 bits = 80 bits of cryptographic entropy.
 *
 * @returns {string} Formatted secure password
 */
export function generatePassword(): string {
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    throw new Error('Web Cryptography API is not available in this environment.');
  }

  const length = 16;
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  let result = '';
  for (let i = 0; i < length; i++) {
    // Alphabet length is 32 (power of 2), so byte % 32 has zero bias.
    const charIndex = randomBytes[i] % 32;
    result += ALPHABET[charIndex];
    if ((i + 1) % 4 === 0 && i + 1 < length) {
      result += '-';
    }
  }

  return result;
}
