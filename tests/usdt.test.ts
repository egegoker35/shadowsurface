import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { isValidTronAddress } from '../lib/usdt';
import { tronAddressFormatError } from '../lib/usdtAddress';

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function encodeBase58(bytes: Buffer): string {
  const radix = BigInt(58);
  let value = BigInt(0);
  for (let i = 0; i < bytes.length; i++) value = value * BigInt(256) + BigInt(bytes[i]);
  let out = '';
  while (value > BigInt(0)) {
    out = BASE58[Number(value % radix)] + out;
    value = value / radix;
  }
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] !== 0) break;
    out = '1' + out;
  }
  return out;
}

function makeAddress(account: Buffer): string {
  const payload = Buffer.concat([Buffer.from([0x41]), account]);
  const checksum = crypto
    .createHash('sha256')
    .update(crypto.createHash('sha256').update(payload).digest())
    .digest()
    .subarray(0, 4);
  return encodeBase58(Buffer.concat([payload, checksum]));
}

test('a real Tron contract address passes Base58Check', () => {
  assert.deepEqual(isValidTronAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'), { valid: true });
});

test('a synthetic account address round-trips through the encoder', () => {
  const address = makeAddress(crypto.randomBytes(20));
  assert.equal(address.length, 34);
  assert.deepEqual(isValidTronAddress(address), { valid: true });
});

test('a wrong character fails the checksum', () => {
  const address = makeAddress(crypto.randomBytes(20));
  const tampered = address.slice(0, 10) + (address[10] === 'A' ? 'B' : 'A') + address.slice(11);
  const result = isValidTronAddress(tampered);
  assert.equal(result.valid, false);
});

test('characters outside the Base58 alphabet are rejected', () => {
  // The wallet shipped in earlier builds contained a capital I, which Base58 omits.
  const bad = 'THZzRBItyb8bhGczJgSFVNGjjt6x4MC3PL';
  assert.match(tronAddressFormatError(bad) || '', /not a valid Base58 character/);
  assert.equal(isValidTronAddress(bad).valid, false);
});

test('length, prefix and empty input are rejected', () => {
  assert.equal(isValidTronAddress('').valid, false);
  assert.equal(isValidTronAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6').valid, false);
  assert.equal(isValidTronAddress('AR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t').valid, false);
});
