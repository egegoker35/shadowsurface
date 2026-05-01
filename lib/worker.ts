import { prisma } from './prisma';
import { ShadowSurfaceEngine } from './scanner/engine';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;
const SCAN_TIMEOUT_MS = 60000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runScanJob(scanId: string, payload: any, attempt = 1): Promise<void> {
  console.log(`[Worker] Attempt ${attempt} | Scan ${scanId} target=${payload.target}`);

  try {
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'running' } });

    const engine = new ShadowSurfaceEngine(payload.target);
    const result = await Promise.race([
      engine.runFullScan(20),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Scan timeout')), SCAN_TIMEOUT_MS)
      ),
    ]);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        resultJson: result as any,
        statistics: result.statistics as any,
        executiveSummary: result.executiveSummary as any,
        durationSeconds: result.durationSeconds,
      },
    });

    if (result.assets.length > 0) {
      const assetData = result.assets.map((asset: any) => ({
        domain: asset.domain,
        subdomain: asset.subdomain,
        ip: asset.ip,
        port: asset.port,
        service: asset.service,
        banner: asset.banner,
        technology: asset.technology,
        version: asset.version,
        cves: asset.cves,
        riskScore: asset.riskScore,
        findings: asset.findings as any,
        headers: asset.headers as any,
        scanId,
      }));
      await prisma.asset.createMany({ data: assetData });
    }

    if (result.cloudAssets.length > 0) {
      const cloudData = result.cloudAssets.map((ca: any) => ({
        provider: ca.provider,
        serviceType: ca.serviceType,
        resourceId: ca.resourceId,
        url: ca.url,
        permissions: ca.permissions,
        misconfigurations: ca.misconfigurations as any,
        riskScore: ca.riskScore,
        severity: ca.severity,
        scanId,
      }));
      await prisma.cloudAsset.createMany({ data: cloudData });
    }

    console.log(`[Worker] Scan ${scanId} completed | Assets: ${result.assets.length} | Cloud: ${result.cloudAssets.length}`);
  } catch (e: any) {
    console.error(`[Worker] Scan ${scanId} failed (attempt ${attempt}): ${e.message}`);
    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY_MS);
      return runScanJob(scanId, payload, attempt + 1);
    }
    await prisma.scan.update({ where: { id: scanId }, data: { status: 'failed' } });
  }
}

export async function runScan(scanId: string, payload: any): Promise<void> {
  await runScanJob(scanId, payload);
}
