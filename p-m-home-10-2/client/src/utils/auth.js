/**
 * Password hashing and verification using Web Crypto (SHA-256).
 * Used so we never store plain-text passwords.
 */

/**
 * @param {string} plain - Plain password
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function hashPassword(plain) {
  const encoded = new TextEncoder().encode(plain);
  const buffer = await crypto.subtle.digest('SHA-256', encoded);
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * @param {string} plain - Entered password
 * @param {string} hash - Stored hash (hex)
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  const computed = await hashPassword(plain);
  return computed === hash;
}
