/**
 * Normalizes password string:
 * - Trims leading and trailing whitespace
 * - Applies Unicode Normalization Form KC (NFKC)
 * - Preserves case-sensitivity
 */
export function normalizePassword(password: string): string {
  return password.trim().normalize('NFKC');
}

/**
 * Derives a deterministic room name from the meeting password using PBKDF2-SHA256.
 *
 * Algorithm specifications:
 * - PBKDF2 with SHA-256
 * - Salt: NEXT_PUBLIC_ROOM_SALT (falls back to a default salt if omitted)
 * - Iterations: 200,000
 * - Key length: 128 bits (16 bytes)
 * - Prefix: "m-"
 * - Format: "m-" + hex(derivedKey)
 *
 * Security note: The derived room name must never be logged or displayed to the user.
 *
 * @param password The user-supplied meeting password
 * @param saltSuffix Optional salt suffix to derive separate keys (e.g. for room locking)
 * @returns Deterministic hex-encoded room name string
 */
export async function deriveRoomName(password: string, saltSuffix: string = ''): Promise<string> {
  const normalized = normalizePassword(password);
  if (!normalized) {
    throw new Error('Password cannot be empty');
  }

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Cryptography API (crypto.subtle) is not available');
  }

  const baseSalt = process.env.NEXT_PUBLIC_ROOM_SALT || 'default-jitsi-room-salt-key-2024';
  const effectiveSalt = baseSalt + saltSuffix;

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(normalized),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(effectiveSalt),
      iterations: 200000,
      hash: 'SHA-256',
    },
    passwordKey,
    128 // 128 bits
  );

  const byteArray = new Uint8Array(derivedBits);
  const hexString = Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `m-${hexString}`;
}

/**
 * Derives a separate secret lock key for optional defense-in-depth room locking.
 * Uses a different PBKDF2 salt suffix ("lock").
 */
export async function deriveLockKey(password: string): Promise<string> {
  const normalized = normalizePassword(password);
  if (!normalized) {
    throw new Error('Password cannot be empty');
  }

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Cryptography API (crypto.subtle) is not available');
  }

  const baseSalt = process.env.NEXT_PUBLIC_ROOM_SALT || 'default-jitsi-room-salt-key-2024';
  const lockSalt = `${baseSalt}:lock`;

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(normalized),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(lockSalt),
      iterations: 200000,
      hash: 'SHA-256',
    },
    passwordKey,
    128
  );

  const byteArray = new Uint8Array(derivedBits);
  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Computes SHA-256 hash in hexadecimal.
 */
export async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Cryptography API is not available');
  }
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode(text));
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies if the provided password matches the configured admin password hash.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const adminHash =
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH ||
    // Default fallback hash for 'admin-secret-passphrase'
    '0937b275bfb7eb00c85b5d19a27e7bebeafba6d3e8958b431766a5e173e6cf1e';

  const hash = await sha256Hex(password.trim());
  return hash.toLowerCase() === adminHash.trim().toLowerCase();
}
