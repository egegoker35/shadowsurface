import { lookup } from 'dns/promises';
import { isPrivateIp } from './middleware/ip';

export type WebhookUrlCheck = { ok: boolean; url?: string; reason?: string };

/**
 * Validate a user-supplied webhook URL before it is stored or fetched.
 *
 * Webhook delivery is a server-side request to a URL the customer controls, which is a
 * textbook SSRF sink: pointing it at 169.254.169.254 or an internal service makes the
 * platform fetch on the attacker's behalf. Only public HTTPS endpoints are allowed, the
 * hostname is resolved once and every resolved address must be public.
 */
export async function validateWebhookUrl(raw: string): Promise<WebhookUrlCheck> {
  let url: URL;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return { ok: false, reason: 'not a valid URL' };
  }

  if (url.protocol !== 'https:') return { ok: false, reason: 'webhook URLs must use https' };
  if (url.username || url.password) return { ok: false, reason: 'credentials in the URL are not allowed' };
  if (!url.hostname) return { ok: false, reason: 'missing hostname' };

  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return { ok: false, reason: 'internal hostnames are not allowed' };
  }

  // Literal address (IPv4 or IPv6): reject private ranges directly.
  if (/^[0-9.]+$/.test(host) || host.includes(':')) {
    if (isPrivateIp(host)) return { ok: false, reason: 'private or reserved address' };
    return { ok: true, url: url.toString() };
  }

  let addresses: string[] = [];
  try {
    addresses = (await lookup(host, { all: true })).map((a) => a.address);
  } catch {
    return { ok: false, reason: 'hostname does not resolve' };
  }
  if (addresses.length === 0) return { ok: false, reason: 'hostname does not resolve' };
  if (addresses.some((address) => isPrivateIp(address))) {
    return { ok: false, reason: 'hostname resolves to a private address' };
  }

  return { ok: true, url: url.toString() };
}
