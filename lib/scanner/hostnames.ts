/**
 * Hostname validation for discovery sources.
 *
 * Certificate transparency logs are a text feed, not a hostname feed: they contain email
 * addresses (user@example.com), free-text CN values, wildcards and occasionally names that
 * belong to an unrelated domain. A plain `endsWith(domain)` check accepts
 * `m.testexample.com` for target `example.com`, because the string does end with the target.
 * Every name therefore has to be parsed and matched on a label boundary before it is used.
 */

const HOSTNAME = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Lowercase, strip a wildcard prefix, and reject anything that is not a bare hostname. */
export function normalizeHostname(raw: string): string | null {
  const value = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '') // accidental scheme
    .replace(/\/.*$/, '')        // accidental path
    .replace(/^\*\./, '');       // wildcard certificate

  if (!value) return null;
  if (value.includes('@')) return null;      // email address, not a hostname
  if (value.includes(' ')) return null;      // free-text CN
  if (!HOSTNAME.test(value)) return null;    // must be a syntactically valid hostname
  return value;
}

/**
 * True only when `raw` is the apex itself or a real subdomain of it.
 * The leading dot in the suffix comparison is what keeps `testexample.com` out of
 * a scan of `example.com`.
 */
export function isHostWithinDomain(raw: string, domain: string): string | null {
  const host = normalizeHostname(raw);
  const apex = normalizeHostname(domain);
  if (!host || !apex) return null;
  if (host === apex) return host;
  if (!host.endsWith(`.${apex}`)) return null;
  // Reject hosts deeper than five labels below the apex (broken CT entries, junk CNs).
  const depth = host.slice(0, -apex.length - 1).split('.').length;
  return depth <= 5 ? host : null;
}
