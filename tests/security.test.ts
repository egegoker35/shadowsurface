import test from 'node:test';
import assert from 'node:assert/strict';
import { clientIp, isPrivateIp } from '../lib/middleware/ip';

test('private, loopback and metadata addresses are rejected', () => {
  for (const ip of [
    '127.0.0.1', '10.1.2.3', '172.16.0.5', '172.31.255.255', '192.168.1.1',
    '169.254.169.254', '0.0.0.0', '100.64.0.1', '224.0.0.1', '255.255.255.255',
    '::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1', '::ffff:10.0.0.1',
  ]) {
    assert.equal(isPrivateIp(ip), true, `${ip} should be private`);
  }
});

test('public addresses are accepted', () => {
  for (const ip of ['8.8.8.8', '1.1.1.1', '104.18.32.7', '2606:4700:4700::1111', '::ffff:8.8.8.8']) {
    assert.equal(isPrivateIp(ip), false, `${ip} should be public`);
  }
});

test('client IP prefers DO-Connecting-IP over a spoofable header', () => {
  const headers = new Headers({
    'x-forwarded-for': '6.6.6.6, 203.0.113.9',
    'do-connecting-ip': '203.0.113.9',
  });
  assert.equal(clientIp(headers), '203.0.113.9');
});

test('client IP falls back to the last X-Forwarded-For hop', () => {
  const headers = new Headers({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' });
  assert.equal(clientIp(headers), '203.0.113.9');
});

test('client IP falls back to X-Real-IP', () => {
  assert.equal(clientIp(new Headers({ 'x-real-ip': '198.51.100.4' })), '198.51.100.4');
  assert.equal(clientIp(new Headers()), 'unknown');
});
