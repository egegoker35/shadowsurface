import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHostname, isHostWithinDomain } from '../lib/scanner/hostnames';

test('normalizeHostname strips wildcards, schemes and paths', () => {
  assert.equal(normalizeHostname('*.Example.COM'), 'example.com');
  assert.equal(normalizeHostname('https://api.example.com/v1/login'), 'api.example.com');
  assert.equal(normalizeHostname('  api.example.com.  '), null); // trailing dot is not a bare hostname
});

test('normalizeHostname rejects emails and free text', () => {
  assert.equal(normalizeHostname('user@example.com'), null);
  assert.equal(normalizeHostname('John Doe Corp'), null);
  assert.equal(normalizeHostname(''), null);
});

test('a lookalike suffix is not treated as a subdomain', () => {
  assert.equal(isHostWithinDomain('m.testexample.com', 'example.com'), null);
  assert.equal(isHostWithinDomain('notexample.com', 'example.com'), null);
});

test('emails from certificate transparency are rejected', () => {
  assert.equal(isHostWithinDomain('user@example.com', 'example.com'), null);
});

test('the apex and real subdomains are accepted', () => {
  assert.equal(isHostWithinDomain('example.com', 'example.com'), 'example.com');
  assert.equal(isHostWithinDomain('api.example.com', 'example.com'), 'api.example.com');
  assert.equal(isHostWithinDomain('a.b.c.example.com', 'example.com'), 'a.b.c.example.com');
});

test('absurdly deep names are rejected', () => {
  assert.equal(isHostWithinDomain('a.b.c.d.e.example.com', 'example.com'), 'a.b.c.d.e.example.com');
  assert.equal(isHostWithinDomain('a.b.c.d.e.f.example.com', 'example.com'), null);
});
