import crypto from 'crypto';
import { resolveTxt } from 'dns/promises';
import { isHostWithinDomain, normalizeHostname } from '@/lib/scanner/hostnames';

/**
 * Domain ownership proof.
 *
 * A scanner that will hit any hostname on request is a liability for the operator: the
 * customer can point it at a competitor and the platform becomes the tool used to do it.
 * Proving control of a domain with a DNS TXT record makes the scope auditable, and gives
 * the operator a written answer to "why did you scan that host".
 */
export const VERIFY_LABEL = '_shadowsurface-verify';

export function newDomainToken(): string {
  return 'ssv-' + crypto.randomBytes(16).toString('hex');
}

export function verificationRecordName(domain: string): string {
  return `${VERIFY_LABEL}.${domain}`;
}

/** Accepts a pasted URL or a bare hostname and returns a canonical domain or null. */
export function normalizeDomainInput(raw: string): string | null {
  const value = String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '');
  const host = normalizeHostname(value);
  if (!host) return null;
  if (host.split('.').length < 2) return null;
  return host;
}

/** TXT values published under the verification record. Empty when the lookup fails. */
export async function fetchVerificationRecords(domain: string): Promise<string[]> {
  try {
    const records = await resolveTxt(verificationRecordName(domain));
    return records.map((chunks) => chunks.join('').trim());
  } catch {
    return [];
  }
}

/** True when the (already sanitized) target is the domain or one of its subdomains. */
export function targetIsCovered(target: string, domains: string[]): boolean {
  return domains.some((domain) => isHostWithinDomain(target, domain) !== null);
}
