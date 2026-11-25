import test from 'node:test';
import assert from 'node:assert/strict';
import { isVerificationTokenPresent, newDomainToken, normalizeDomainInput, targetIsCovered, verificationRecordName } from '../lib/domains';

test('domain input accepts URLs and bare hosts', () => {
  assert.equal(normalizeDomainInput('example.com'), 'example.com');
  assert.equal(normalizeDomainInput('  EXAMPLE.com  '), 'example.com');
  assert.equal(normalizeDomainInput('https://example.com/path?x=1'), 'example.com');
  assert.equal(normalizeDomainInput('http://app.example.co.uk:8443/'), 'app.example.co.uk');
});

test('domain input rejects emails, wildcards and junk', () => {
  // A wildcard certificate entry is a real-world paste; it normalizes to the apex.
  assert.equal(normalizeDomainInput('*.example.com'), 'example.com');
  for (const bad of ['', 'user@example.com', 'localhost', 'not a domain', 'example', 'a..b.com']) {
    assert.equal(normalizeDomainInput(bad), null, `${bad} should be rejected`);
  }
});

test('tokens are unique and prefixed', () => {
  const a = newDomainToken();
  const b = newDomainToken();
  assert.match(a, /^ssv-[0-9a-f]{32}$/);
  assert.notEqual(a, b);
});

test('verification record is published under the reserved label', () => {
  assert.equal(verificationRecordName('example.com'), '_shadowsurface-verify.example.com');
});

test('targets are covered only on a label boundary', () => {
  const allowed = ['example.com'];
  assert.equal(targetIsCovered('example.com', allowed), true);
  assert.equal(targetIsCovered('app.example.com', allowed), true);
  assert.equal(targetIsCovered('a.b.example.com', allowed), true);
  assert.equal(targetIsCovered('testexample.com', allowed), false);
  assert.equal(targetIsCovered('example.com.evil.net', allowed), false);
  assert.equal(targetIsCovered('other.com', allowed), false);
  assert.equal(targetIsCovered('app.example.com', []), false);
});

test('only the exact token counts as proof', () => {
  const token = 'ssv-0123456789abcdef0123456789abcdef';
  assert.equal(isVerificationTokenPresent([token], token), true);
  assert.equal(isVerificationTokenPresent(['v=spf1 -all', token], token), true);
  assert.equal(isVerificationTokenPresent(['v=spf1 -all'], token), false);
  assert.equal(isVerificationTokenPresent([], token), false);
  assert.equal(isVerificationTokenPresent([token], ''), false);
  assert.equal(isVerificationTokenPresent([` ${token} `], token), false);
});
