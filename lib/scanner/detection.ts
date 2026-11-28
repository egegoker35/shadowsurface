/**
 * Pure detection primitives shared by the scanner and its regression tests.
 *
 * Nothing here performs I/O: these functions only decide whether a piece of evidence is
 * strong enough to report. Keeping them separate from engine.ts means the rules can be
 * unit-tested without a network, a Redis connection or a database, and the tests below the
 * engine assert that known-clean input produces no finding.
 */

/**
 * Database error signatures.
 *
 * These are the only SQL-error patterns the scanner accepts. They are matched by the active
 * parameter probe, never against a page on its own: a page that quotes a database error
 * (documentation, release notes, a security blog, an archived stack trace) is not injectable.
 */
export const SQL_ERROR_SIGNATURES: Array<{ rx: RegExp; tech: string }> = [
  { rx: /SQL syntax.*MySQL/i, tech: 'MySQL' },
  { rx: /Warning.*mysql_.*\(\)/i, tech: 'MySQL' },
  { rx: /valid MySQL result/i, tech: 'MySQL' },
  { rx: /MySqlException \(0x/i, tech: 'MySQL' },
  { rx: /PostgreSQL.*ERROR/i, tech: 'PostgreSQL' },
  { rx: /Warning.*pg_.*\(\)/i, tech: 'PostgreSQL' },
  { rx: /PLS-00923.*ORACLE.*error.*ORA-00936/i, tech: 'Oracle' },
  { rx: /ORA-00933.*SQL command not properly ended/i, tech: 'Oracle' },
  { rx: /Microsoft SQL Server.*error.*80040e14/i, tech: 'MSSQL' },
  { rx: /ODBC SQL Server Driver/i, tech: 'MSSQL' },
  { rx: /SQLServer JDBC Driver/i, tech: 'MSSQL' },
  { rx: /sqlite3.*operationalerror/i, tech: 'SQLite' },
  { rx: /no such column/i, tech: 'SQLite' },
  { rx: /sqlite3_prepare/i, tech: 'SQLite' },
  { rx: /DB2 SQL error/i, tech: 'DB2' },
  { rx: /You have an error in your SQL syntax/i, tech: 'MySQL/MariaDB' },
  { rx: /sql error near/i, tech: 'Generic' },
  { rx: /syntax error.*in query expression/i, tech: 'Generic' },
  { rx: /unclosed quotation mark/i, tech: 'MSSQL' },
  { rx: /quoted string not properly terminated/i, tech: 'Oracle' },
  { rx: /pg_query \(\)\s*\[\]:\s*query failed:/i, tech: 'PostgreSQL' },
  { rx: /java\.sql\.SQLException/i, tech: 'Java/JDBC' },
  { rx: /Unexpected end of command in statement/i, tech: 'Generic' },
  { rx: /Dynamic SQL Error/i, tech: 'Firebird' },
  { rx: /Sybase message:/i, tech: 'Sybase' },
];

/**
 * The first database-error signature that appears in the payload response but not in the same
 * page fetched without the payload. This control comparison is what separates an injection
 * from a page that merely documents SQL errors, and it replaces a loose product-name regex
 * ("mysql", "oracle", "db2") that matched ordinary technology mentions.
 */
export function findNewDbError(
  payloadBody: string,
  baselineBody: string,
): { tech: string; evidence: string } | null {
  for (const sig of SQL_ERROR_SIGNATURES) {
    const hit = sig.rx.exec(payloadBody);
    if (!hit) continue;
    if (sig.rx.test(baselineBody)) continue;
    return {
      tech: sig.tech,
      evidence: payloadBody.slice(Math.max(0, hit.index - 80), hit.index + 160),
    };
  }
  return null;
}

const CMD_OUTPUT_SIGNATURE =
  /uid=\d+\([a-z0-9_.\-]+\)|gid=\d+\([a-z0-9_.\-]+\)|nt authority\\system|volume serial number is/i;

/** Same control comparison as findNewDbError, applied to operating-system command output. */
export function findNewCommandOutput(
  payloadBody: string,
  baselineBody: string,
): { evidence: string } | null {
  const hit = CMD_OUTPUT_SIGNATURE.exec(payloadBody);
  if (!hit) return null;
  if (CMD_OUTPUT_SIGNATURE.test(baselineBody)) return null;
  return { evidence: payloadBody.slice(Math.max(0, hit.index - 60), hit.index + 140) };
}

/**
 * True only when the payload survives into the response verbatim.
 *
 * The previous XSS check also accepted the HTML-encoded forms (&quot;, &lt;), so a page that
 * encoded its input correctly was reported as "reflects input without encoding" - the exact
 * opposite of what the evidence showed. An encoded reflection is the fix, not the bug.
 */
export function hasUnencodedReflection(responseBody: string, payload: string): boolean {
  if (!payload) return false;
  return responseBody.includes(payload);
}

/** The bytes around a reflection, so a report can show the actual sink context. */
export function reflectionContext(responseBody: string, payload: string): string {
  const at = responseBody.indexOf(payload);
  if (at < 0) return '';
  return responseBody.slice(Math.max(0, at - 80), at + payload.length + 80);
}

/**
 * Documentation and example credentials are not leaks. The canonical AWS sample key
 * (AKIAIOSFODNN7EXAMPLE) matches the key format, which turned documentation pages into a
 * critical credential-exposure finding.
 */
export function looksLikePlaceholderSecret(value: string): boolean {
  return /example|sample|placeholder|dummy|fake|redacted|your[-_]|xxxx|\*{4,}|0{8,}|\.{3,}|<[a-z]/i.test(
    value,
  );
}

/** Key formats that are self-evidencing: no provider issues one of these by accident. */
const SECRET_FORMATS: Array<{ rx: RegExp; kind: string }> = [
  { rx: /\bAKIA[0-9A-Z]{16}\b/, kind: 'AWS access key' },
  { rx: /\bsk_live_[0-9a-zA-Z]{16,}/, kind: 'Stripe live key' },
  { rx: /\bghp_[0-9A-Za-z]{36}\b/, kind: 'GitHub token' },
  { rx: /\bxox[baprs]-[0-9A-Za-z-]{10,}/, kind: 'Slack token' },
  { rx: /\bAIza[0-9A-Za-z_-]{35}\b/, kind: 'Google API key' },
];

/** A private key block only counts when it actually carries a body. */
const PRIVATE_KEY_RX =
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----([\s\S]{100,}?)-----END/;

const ASSIGNMENT_SECRET_RX =
  /\b((?:DB_|DATABASE_)?(?:PASSWORD|PASSWD|API_KEY|SECRET_KEY|ACCESS_KEY|PRIVATE_KEY|CLIENT_SECRET|APP_KEY|AUTH_TOKEN))\s*[:=]\s*["']([^"']{4,})["']/i;

const PLACEHOLDER_VALUE_RX =
  /^(?:your|example|sample|placeholder|change|xxx|todo|dummy|test|foo|bar|secret|password|passwd|\*{3,}|\.{3,}|<)|\$\{|process\.env/i;

/** Enough of a value to locate it in the page, never enough to use it. */
function redact(value: string): string {
  const visible = value.slice(0, 4);
  return `${visible}${'*'.repeat(Math.max(6, Math.min(24, value.length - 4)))}`;
}

export type LeakedSecret = { kind: string; display: string };

/**
 * A credential found in a response body, or null.
 *
 * Documentation pages routinely show sample credentials, so a format match alone is not a
 * leak. The canonical AWS sample key (AKIAIOSFODNN7EXAMPLE) and the well-known placeholder
 * assignment (API_KEY="your-api-key") both matched and turned ordinary docs into a critical
 * credential-exposure finding. A match now counts only when the value is not a placeholder,
 * a private key must carry a body, and the returned value is redacted so a report never
 * carries a working credential.
 */
export function findLeakedSecret(body: string): LeakedSecret | null {
  for (const { rx, kind } of SECRET_FORMATS) {
    const hit = rx.exec(body);
    if (hit && !looksLikePlaceholderSecret(hit[0])) {
      return { kind, display: redact(hit[0]) };
    }
  }

  const pk = PRIVATE_KEY_RX.exec(body);
  if (pk && !looksLikePlaceholderSecret(pk[1])) {
    return { kind: 'private key block', display: '-----BEGIN PRIVATE KEY----- (redacted)' };
  }

  const assignment = ASSIGNMENT_SECRET_RX.exec(body);
  // Group 1 is the variable name, group 2 is the value: the placeholder test belongs on the
  // value, otherwise "API_KEY=your-api-key" is reported as a leak because the NAME is real.
  if (assignment && !PLACEHOLDER_VALUE_RX.test(assignment[2].trim())) {
    return { kind: 'hardcoded credential', display: `${assignment[1]}=${redact(assignment[2])}` };
  }

  return null;
}
