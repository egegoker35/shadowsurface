export interface Finding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  port?: number;
  service?: string;
  description: string;
  evidence?: string;
  cvss?: number;
  cwe?: string;
  owasp?: string;
  remediation?: string;
  references?: string[];
  exploitAvailable?: boolean;
}

export type WebVulnType =
  | 'sqli'
  | 'xss'
  | 'lfi'
  | 'rfi'
  | 'open_redirect'
  | 'cors'
  | 'csrf'
  | 'idor'
  | 'info_disclosure'
  | 'weak_auth'
  | 'backup_file'
  | 'sensitive_file'
  | 'xxe'
  | 'ssrf'
  | 'rce'
  | 'command_injection'
  | 'file_upload'
  | 'path_traversal'
  | 'missing_header'
  | 'cookie_issue'
  | 'insecure_method'
  | 'api_exposure'
  | 'directory_listing'
  | 'brute_force'
  | 'wordpress_issue'
  | 'graphql_issue';

export interface WebVuln {
  type: WebVulnType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  url: string;
  parameter?: string;
  payload?: string;
  description: string;
  evidence?: string;
  confidence: 'confirmed' | 'likely' | 'potential';
}

export interface SSLInfo {
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  valid?: boolean;
  selfSigned?: boolean;
  weakCipher?: boolean;
  tlsVersion?: string;
  cipherSuite?: string;
  hsts?: boolean;
  certificateTransparency?: boolean;
  sni?: boolean;
  beastPoodle?: boolean;
  heartbleed?: boolean;
  logjam?: boolean;
  crime?: boolean;
  breach?: boolean;
  renegotiationSecure?: boolean;
  ocspStapling?: boolean;
  tls13?: boolean;
  tls12?: boolean;
  tls11?: boolean;
  tls10?: boolean;
  weakProtocols?: string[];
  certSubject?: string;
  certIssuer?: string;
  certValidFrom?: string;
  certValidTo?: string;
  certDaysLeft?: number;
  certExpired?: boolean;
  certFingerprint?: string;
  certSANs?: string[];
}

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'CNAME' | 'PTR' | 'SRV' | 'CAA';
  value: string;
  priority?: number;
}

export interface DiscoveredAsset {
  id: string;
  domain: string;
  subdomain: string;
  ip: string | null;
  port: number;
  service: string;
  banner: string;
  technology: string | null;
  version: string | null;
  cves: string[];
  cveConfidence: 'high' | 'medium' | 'low';
  cloudProvider: string | null;
  riskScore: number;
  findings: Finding[];
  headers: Record<string, string>;
  sslInfo?: SSLInfo | null;
  sslGrade?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'T' | 'X';
  waf?: string | null;
  dnsRecords?: DNSRecord[];
  webVulns?: WebVuln[];
  title?: string;
  redirects?: string[];
  firstSeen: string;
  osFingerprint?: string;
  uptime?: string;
  traceroute?: string[];
  complianceStatus?: {
    owasp?: string[];
    pciDss?: string[];
    gdpr?: string[];
  };
  exploitAvailable?: boolean;
  cvssMax?: number;
}

export interface CloudAsset {
  id: string;
  provider: 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'firebase' | 'heroku' | 'oracle' | 'ibm' | 'alibaba';
  serviceType: string;
  resourceId: string;
  url: string;
  permissions: string[];
  misconfigurations: Finding[];
  riskScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  exposureLevel?: 'public' | 'authenticated' | 'private';
}

export interface ScanResult {
  scanId: string;
  target: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  assets: DiscoveredAsset[];
  cloudAssets: CloudAsset[];
  statistics: {
    totalSubdomains: number;
    totalAssets: number;
    totalCloudAssets: number;
    criticalFindings: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    infoCount: number;
    totalCVEs: number;
    totalWebVulns: number;
    sslIssues: number;
    totalExploits: number;
    weakSSLCount: number;
    missingHeaderCount: number;
    exposedDBCount: number;
    exposedAdminCount: number;
  };
  executiveSummary: {
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    riskScore: number;
    criticalFindings: number;
    attackSurfaceSize: number;
    recommendations: string[];
    threatActors: string[];
    mitreTactics?: string[];
    complianceStatus?: {
      owaspCompliant: boolean;
      pciDssCompliant: boolean;
      gdprCompliant: boolean;
    };
  };
  dnsAnalysis?: {
    records: DNSRecord[];
    spfPolicy?: string;
    dmarcPolicy?: string;
    dkimPresent?: boolean;
    dnssec?: boolean;
    caa?: string[];
    subdomainTakeover?: string[];
    zoneTransfer?: boolean;
  };
}
