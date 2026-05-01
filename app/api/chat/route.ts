import { NextRequest, NextResponse } from 'next/server';

const KNOWLEDGE_BASE: Record<string, string> = {
  'sql injection': 'SQL Injection occurs when untrusted input is concatenated into SQL queries. Prevention: use parameterized queries/prepared statements, ORM frameworks, input validation, and least-privilege DB accounts.',
  'xss': 'Cross-Site Scripting (XSS) allows attackers to inject client-side scripts. Prevention: encode output, use Content-Security-Policy, validate/sanitize input, and use modern frameworks with automatic escaping.',
  'csrf': 'CSRF tricks users into performing unwanted actions. Prevention: use anti-CSRF tokens, SameSite cookies, and verify Origin/Referer headers.',
  'ssrf': 'SSRF forces servers to make requests to unintended destinations. Prevention: whitelist URLs, disable unnecessary URL schemes, and use network segmentation.',
  'cve': 'Common Vulnerabilities and Exposures (CVE) is a dictionary of publicly known security vulnerabilities. Keep software updated and subscribe to vulnerability feeds.',
  'port scan': 'Port scanning identifies open ports/services. Nmap is the gold standard. Always get written authorization before scanning any target.',
  'subdomain takeover': 'Occurs when a subdomain points to a deprovisioned resource. Prevention: audit DNS records, remove unused CNAMEs, and monitor subdomain configurations.',
  'cloud misconfiguration': 'S3 buckets, GCS, Azure Blobs left public are common. Prevention: enforce IAM policies, enable logging, use SCPs, and run automated compliance checks.',
  'zero trust': 'Zero Trust assumes breach and verifies every access request. Principles: never trust, always verify, least privilege, assume breach.',
  'ransomware': 'Ransomware encrypts files for extortion. Defense: offline backups, EDR, email filtering, patch management, and user awareness training.',
  'penetration testing': 'Penetration testing simulates attacks to find weaknesses. Types: black-box, white-box, gray-box. Always have a signed scope and rules of engagement.',
  'owasp top 10': 'OWASP Top 10: 1) Broken Access Control 2) Cryptographic Failures 3) Injection 4) Insecure Design 5) Security Misconfiguration 6) Vulnerable Components 7) Auth Failures 8) Integrity Failures 9) Logging Failures 10) SSRF.',
  'rate limit': 'Rate limiting prevents brute-force and DoS. Implement sliding windows, token buckets, or leaky buckets. Add exponential backoff for retries.',
  'jwt': 'JWT security: use strong signing algorithms (RS256/ES256), short expiry, secure HttpOnly cookies, validate iss/aud, and never put secrets in the payload.',
  'report': 'A good security report includes: Executive Summary, Scope, Methodology, Findings (severity, evidence, impact, remediation), Risk Ratings, and Appendices.',
  'risk score': 'Risk Score = Likelihood × Impact. Critical (90+): immediate action. High (70-89): fix within days. Medium (40-69): fix within weeks. Low (<40): scheduled maintenance.',
};

function findKnowledgeAnswer(question: string): string | null {
  const q = question.toLowerCase();
  for (const [keyword, answer] of Object.entries(KNOWLEDGE_BASE)) {
    if (q.includes(keyword)) return answer;
  }
  return null;
}

async function askOpenAI(message: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are ShadowAI, a cybersecurity expert assistant for the ShadowSurface attack surface management platform. You help users understand security vulnerabilities, scan results, and best practices. Be concise and actionable.' },
          { role: 'user', content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    // Try OpenAI first
    let reply = await askOpenAI(message);

    // Fallback to knowledge base
    if (!reply) {
      reply = findKnowledgeAnswer(message);
    }

    // Generic fallback
    if (!reply) {
      reply = 'I can help with cybersecurity topics like vulnerabilities (SQLi, XSS, CSRF), scanning techniques, cloud security, report writing, and risk scoring. Ask me anything specific!';
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
