const crypto = require('crypto');

const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%&*';
const ALL = ALPHA + DIGITS + SYMBOLS;

/**
 * Generate a secure random password: 12+ chars, alphanumeric + symbol.
 * @param {number} length - Default 12
 * @returns {string}
 */
function generatePassword(length = 12) {
  const len = Math.max(12, length);
  const buf = crypto.randomBytes(len);
  let result = '';
  for (let i = 0; i < len; i++) {
    result += ALL[buf[i] % ALL.length];
  }
  return result;
}

module.exports = { generatePassword };
