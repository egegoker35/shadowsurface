import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findLeakedSecret,
  findNewCommandOutput,
  findNewDbError,
  hasUnencodedReflection,
  looksLikePlaceholderSecret,
  reflectionContext,
} from '../lib/scanner/detection';

/**
 * Regression tests for false positives.
 *
 * Each case below is a real page type that used to produce a critical finding. They run
 * without network access because they test the decision rules, which are the only place a
 * finding can be created.
 */

// ── Error-based SQL injection ───────────────────────────────────────────────
test('a page that quotes a SQL error is not reported as injectable', () => {
  const docs =
    '<h1>Debugging MySQL</h1><pre>You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version</pre>';
  // The payload response is the same page: the signature is already in the control.
  assert.equal(findNewDbError(docs, docs), null);
});

test('mentioning database products is not a SQL error', () => {
  // The old regex matched the bare words mysql/postgresql/oracle/db2/sqlite.
  const stack = 'Our stack: MySQL, PostgreSQL, Oracle, DB2, SQLite, MSSQL and Sybase.';
  assert.equal(findNewDbError(stack, ''), null);
});

test('an error that only appears with the payload is a real finding', () => {
  const injected =
    "You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''' at line 1";
  const hit = findNewDbError(injected, '<h1>Product search</h1>');
  assert.ok(hit, 'a new database error must be reported');
  assert.ok(hit!.tech.length > 0);
  assert.match(hit!.evidence, /SQL syntax/i, 'evidence must contain the error text');
});

// ── Command injection ──────────────────────────────────────────────────────
test('ordinary words are not command output', () => {
  const page = 'Run as root or daemon. Binaries live in /usr/bin and Windows NT notes are below.';
  assert.equal(findNewCommandOutput(page, ''), null);
});

test('command output already present in the control is not injection', () => {
  const page = 'Example shell session: uid=33(www-data) gid=33(www-data) groups=33(www-data)';
  assert.equal(findNewCommandOutput(page, page), null);
});

test('command output that only appears with the payload is reported', () => {
  const out = 'uid=33(www-data) gid=33(www-data) groups=33(www-data)';
  const hit = findNewCommandOutput(out, '<h1>Ping tool</h1>');
  assert.ok(hit);
  assert.match(hit!.evidence, /uid=33/);
});

// ── Reflected XSS ─────────────────────────────────────────────────────────
test('HTML-encoded reflection is not XSS', () => {
  // This is the exact inversion the old check had: encoded input was reported as
  // "reflects input without encoding".
  assert.equal(hasUnencodedReflection('&lt;svg/onload=ssx9z(1)&gt;', '<svg/onload=ssx9z(1)>'), false);
  assert.equal(hasUnencodedReflection('&quot;&gt;&lt;ssx9z&gt;', '"><ssx9z>'), false);
  assert.equal(
    hasUnencodedReflection('value="&lt;script&gt;alert(1)&lt;/script&gt;"', '<script>alert(1)</script>'),
    false,
  );
});

test('a verbatim reflection in markup is reported with its context', () => {
  const body = '<div class="result">You searched for <svg/onload=ssx9z(1)></div>';
  const payload = '<svg/onload=ssx9z(1)>';
  assert.equal(hasUnencodedReflection(body, payload), true);
  const ctx = reflectionContext(body, payload);
  assert.match(ctx, /You searched for/);
  assert.match(ctx, /svg\/onload/);
});

test('reflection helpers are safe on empty input', () => {
  assert.equal(hasUnencodedReflection('', '<b>'), false);
  assert.equal(hasUnencodedReflection('<b>', ''), false);
  assert.equal(reflectionContext('<b>', '<i>'), '');
});

// ── Credential exposure ───────────────────────────────────────────────────
test('the canonical AWS sample key is documentation, not a leak', () => {
  const docs = 'Example: <code>aws_access_key_id = AKIAIOSFODNN7EXAMPLE</code>';
  assert.equal(findLeakedSecret(docs), null);
});

test('placeholder assignments are documentation, not a leak', () => {
  assert.equal(findLeakedSecret('<code>API_KEY="your-api-key-here"</code>'), null);
  assert.equal(findLeakedSecret('<code>DB_PASSWORD="changeme"</code>'), null);
  assert.equal(findLeakedSecret('<code>SECRET_KEY="${process.env.SECRET_KEY}"</code>'), null);
});

test('a real key format is reported and redacted', () => {
  const hit = findLeakedSecret('const key = "AKIA3XQ7Z2LMNOPQR4TW";');
  assert.ok(hit, 'a non-placeholder key must be reported');
  assert.equal(hit!.kind, 'AWS access key');
  assert.equal(hit!.display.includes('AKIA3XQ7Z2LMNOPQR4TW'), false, 'the full key must never appear');
  assert.match(hit!.display, /^AKIA\*+$/);
});

test('a hardcoded password is reported with the name only', () => {
  const hit = findLeakedSecret('DB_PASSWORD="hunter2real"');
  assert.ok(hit);
  assert.match(hit!.display, /^DB_PASSWORD=/);
  assert.equal(hit!.display.includes('hunter2real'), false);
});

test('a private key header without a body is not an exposure', () => {
  assert.equal(findLeakedSecret('<pre>-----BEGIN RSA PRIVATE KEY-----</pre>'), null);
});

test('a private key block with a body is an exposure', () => {
  // Realistic base64 body: long enough to count, without any placeholder marker.
  const body = 'MIIEowIBAAKCAQEA' + 'aB3dE6gH9jK2mN5pQ8rS1tV4wX7yZ0cF'.repeat(4);
  const hit = findLeakedSecret(`<pre>-----BEGIN RSA PRIVATE KEY-----\n${body}\n-----END RSA PRIVATE KEY-----</pre>`);
  assert.ok(hit);
  assert.equal(hit!.kind, 'private key block');
});

test('placeholder detection does not flag ordinary values', () => {
  assert.equal(looksLikePlaceholderSecret('AKIA3XQ7Z2LMNOPQR4TW'), false);
  assert.equal(looksLikePlaceholderSecret('hunter2real'), false);
  assert.equal(looksLikePlaceholderSecret('AKIAIOSFODNN7EXAMPLE'), true);
  assert.equal(looksLikePlaceholderSecret('***'), false); // three stars are a normal value
  assert.equal(looksLikePlaceholderSecret('********'), true);
});
