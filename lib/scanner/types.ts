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
  cloudProvider: string | null;
  riskScore: number;
  findings: Record<string, unknown>[];
  headers: Record<string, string>;
  sslInfo?: { issuer?: string; subject?: string; validFrom?: string; validTo?: string; daysRemaining?: number; valid?: boolean; selfSigned?: boolean; weakCipher?: boolean } | null;
  waf?: string | null;
  firstSeen: string;
}

export interface CloudAsset {
  id: string;
  provider: 'aws' | 'gcp' | 'azure';
  serviceType: string;
  resourceId: string;
  url: string;
  permissions: string[];
  misconfigurations: Record<string, unknown>[];
  riskScore: number;
  severity: string;
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
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
  executiveSummary: {
    overallRisk: string;
    criticalFindings: number;
    attackSurfaceSize: number;
    recommendations: string[];
  };
}
