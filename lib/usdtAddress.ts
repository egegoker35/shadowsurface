/**
 * Tron address helpers that are safe to import from client components.
 *
 * The recipient wallet used to be copy-pasted as a literal in both the payment API
 * and the pricing page, so the two could drift apart. It now lives in exactly one
 * place and can be changed without touching code by setting
 * NEXT_PUBLIC_USDT_TRC20_ADDRESS (a wallet address is public, not a secret).
 *
 * Full Base58Check verification needs a SHA-256 implementation and lives in
 * lib/usdt.ts, which is server-only. This module only performs the cheap structural
 * checks (length, prefix, alphabet) so the UI can avoid showing a wallet that no
 * Tron wallet would accept.
 */

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export const USDT_TRC20_ADDRESS = (
  process.env.NEXT_PUBLIC_USDT_TRC20_ADDRESS ||
  'THZzRBItyb8bhGczJgSFVNGjjt6x4MC3PL'
).trim();

/** Returns a human-readable reason when the string cannot be a Tron address. */
export function tronAddressFormatError(address: string): string | null {
  if (!address) return 'address is empty';
  if (address.length !== 34) return `expected 34 characters, got ${address.length}`;
  if (!address.startsWith('T')) return 'address must start with "T"';
  for (const ch of address) {
    if (!BASE58.includes(ch)) return `"${ch}" is not a valid Base58 character`;
  }
  return null;
}

export const USDT_ADDRESS_FORMAT_OK = tronAddressFormatError(USDT_TRC20_ADDRESS) === null;
