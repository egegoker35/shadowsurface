/**
 * Server-side Tron address verification (Base58Check).
 *
 * A Tron address is 25 bytes encoded in Base58: 0x41 prefix, 20-byte account id and
 * a 4-byte double-SHA-256 checksum. Checking only the length and the leading "T" is
 * not enough: characters such as I, l, 0 and O are not in the Base58 alphabet, and a
 * single wrong character changes the checksum. This function is used to refuse
 * payments when the configured recipient is not a real address, instead of accepting
 * a transfer the operator could never receive.
 */
import crypto from 'crypto';
import {
  USDT_TRC20_ADDRESS,
  USDT_TRC20_CONTRACT,
  tronAddressFormatError,
} from './usdtAddress';

export { USDT_TRC20_ADDRESS, USDT_TRC20_CONTRACT };

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export type AddressCheck = { valid: boolean; reason?: string };

export function isValidTronAddress(address: string): AddressCheck {
  const formatError = tronAddressFormatError(address);
  if (formatError) return { valid: false, reason: formatError };

  let value = BigInt(0);
  const radix = BigInt(58);
  for (const ch of address) {
    value = value * radix + BigInt(BASE58.indexOf(ch));
  }

  const hex = value.toString(16).padStart(50, '0');
  if (hex.length !== 50) return { valid: false, reason: 'decoded length is not 25 bytes' };
  const bytes = Buffer.from(hex, 'hex');

  if (bytes[0] !== 0x41) return { valid: false, reason: 'decoded prefix is not a Tron account' };

  const payload = bytes.subarray(0, 21);
  const checksum = bytes.subarray(21);
  const expected = crypto
    .createHash('sha256')
    .update(crypto.createHash('sha256').update(payload).digest())
    .digest()
    .subarray(0, 4);

  if (!crypto.timingSafeEqual(checksum, expected)) {
    return { valid: false, reason: 'checksum does not match' };
  }
  return { valid: true };
}

export const USDT_ADDRESS_STATUS: AddressCheck = isValidTronAddress(USDT_TRC20_ADDRESS);

if (!USDT_ADDRESS_STATUS.valid) {
  console.error(
    `[payments] USDT recipient address ${USDT_TRC20_ADDRESS} is invalid (${USDT_ADDRESS_STATUS.reason}). ` +
      'Payment verification is disabled until NEXT_PUBLIC_USDT_TRC20_ADDRESS is corrected.'
  );
}
