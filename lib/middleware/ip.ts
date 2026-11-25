/**
 * Pure address helpers with no I/O, so unit tests can import them without opening a
 * Redis connection (lib/middleware/security pulls in the rate limiter).
 */

/**
 * Real client IP.
 *
 * Every rate limiter used the raw X-Forwarded-For header as its bucket key. Any client
 * can send that header, so an attacker could rotate the value per request and never hit
 * a limit - which turned login and admin-login brute-force protection into decoration.
 * DigitalOcean App Platform sets DO-Connecting-IP itself; behind any other proxy the
 * last hop appended to X-Forwarded-For is the one that cannot be forged by the client.
 */
export function clientIp(headers: Headers): string {
  const doIp = headers.get('do-connecting-ip');
  if (doIp && doIp.trim()) return doIp.trim();
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const parts = xff.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  const realIp = headers.get('x-real-ip');
  if (realIp && realIp.trim()) return realIp.trim();
  return 'unknown';
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true; // multicast + reserved
  return false;
}

/**
 * True for loopback, private, link-local, CGNAT, multicast and reserved addresses.
 * A scanner that connects to a customer's hostname must resolve it first; without this
 * check, a hostname pointing at 10.0.0.5 or 169.254.169.254 turns the product into an
 * internal-network scanner.
 */
export function isPrivateIp(ip: string): boolean {
  let value = (ip || '').trim().toLowerCase();
  if (!value) return true;
  if (value.startsWith('[') && value.endsWith(']')) value = value.slice(1, -1);
  const zone = value.indexOf('%');
  if (zone !== -1) value = value.slice(0, zone);

  if (value === '::' || value === '::1') return true;
  if (value.startsWith('::ffff:')) return isPrivateIpv4(value.slice(7));
  if (/^[0-9.]+$/.test(value)) return isPrivateIpv4(value);
  if (value.includes(':')) {
    if (value.startsWith('fc') || value.startsWith('fd')) return true; // unique local
    if (value.startsWith('fe8') || value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb')) return true; // link-local
    if (value.startsWith('ff')) return true; // multicast
    return false;
  }
  return true; // not an address at all: treat as unusable
}
