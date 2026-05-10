import { NextRequest, NextResponse } from 'next/server';
import { connect as tlsConnect } from 'tls';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const host = req.nextUrl.searchParams.get('host');
  if (!host) return NextResponse.json({ error: 'Missing host' }, { status: 400 });
  const port = parseInt(req.nextUrl.searchParams.get('port') || '443');
  
  try {
    const cert = await new Promise<any>((resolve, reject) => {
      const socket = tlsConnect({ host, port, rejectUnauthorized: false, servername: host, timeout: 8000 }, () => {
        const peer = socket.getPeerCertificate(true);
        const cipher = socket.getCipher ? socket.getCipher() : null;
        socket.end();
        resolve({ cert: peer, cipher });
      });
      socket.on('error', () => { try { socket.end(); } catch {} resolve(null); });
      socket.setTimeout(8000, () => { try { socket.destroy(); } catch {} resolve(null); });
    });
    
    if (!cert || !cert.cert || !cert.cert.subject) {
      return NextResponse.json({ error: 'No certificate found' }, { status: 404 });
    }
    
    const c = cert.cert;
    const subject = typeof c.subject === 'string' ? c.subject : JSON.stringify(c.subject);
    const issuer = typeof c.issuer === 'string' ? c.issuer : JSON.stringify(c.issuer);
    const validFrom = c.valid_from || '';
    const validTo = c.valid_to || '';
    let daysLeft: number | undefined;
    if (c.valid_to) {
      daysLeft = Math.max(0, Math.ceil((new Date(c.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }
    const san = c.subjectaltname ? c.subjectaltname.split(',').map((s: string) => s.trim().replace(/^DNS:/i, '')) : [];
    const fingerprint = c.fingerprint ? c.fingerprint.replace(/:/g, '') : undefined;
    const proto = cert.cipher?.version || '';
    
    return NextResponse.json({
      subject,
      issuer,
      validFrom,
      validTo,
      daysLeft,
      san,
      fingerprint,
      tlsVersion: proto.includes('1.3') ? 'TLSv1.3' : proto.includes('1.2') ? 'TLSv1.2' : proto.includes('1.1') ? 'TLSv1.1' : proto.includes('1.0') ? 'TLSv1.0' : 'Unknown',
      selfSigned: (typeof c.issuer === 'object' ? c.issuer.CN : c.issuer) === (typeof c.subject === 'object' ? c.subject.CN : c.subject),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
