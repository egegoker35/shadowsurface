export interface Finding {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  port?: number;
  service?: string;
  description: string;
  evidence?: string;
  cvss?: number;
}

export interface WebVuln {
  type: 'sqli' | 'xss' | 'lfi' | 'rfi' | 'open_redirect' | 'cors' | 'csrf' | 'idor' | 'info_disclosure' | 'weak_auth' | 'backup_file' | 'sensitive_file';
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
}

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'SOA' | 'CNAME' | 'PTR' | 'SRV';
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
}

export interface CloudAsset {
  id: string;
  provider: 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'firebase' | 'heroku';
  serviceType: string;
  resourceId: string;
  url: string;
  permissions: string[];
  misconfigurations: Finding[];
  riskScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
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
  };
  executiveSummary: {
    overallRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    riskScore: number;
    criticalFindings: number;
    attackSurfaceSize: number;
    recommendations: string[];
    threatActors: string[];
  };
  dnsAnalysis?: {
    records: DNSRecord[];
    spfPolicy?: string;
    dmarcPolicy?: string;
    dkimPresent?: boolean;
    dnssec?: boolean;
  };
}
