import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { ShadowSurfaceEngine } from '@/lib/scanner/engine';
import { runDemoScan } from '@/lib/scanner/demoScanner';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const SCAN_HARD_TIMEOUT_MS = 300000; // 5 minutes max per scan
const MAX_CONCURRENT_SCANS = 2;

let activeScans = 0;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processJob(raw: string, attempt = 1) {
  const job = JSON.parse(raw);
  const { scanId, payload } = job;

  // Resource guard: max concurrent scans
  if (activeScans >= MAX_CONCURRENT_SCANS && !payload.isDemo) {
    console.log(`[Worker] Max concurrent scans reached (${MAX_CONCURRENT_SCANS}), requeueing ${scanId}`);
    await redis.lpush('scan:queue', raw);
    await sleep(5000);
    return;
  }

  activeScans++;
  console.log(`[Worker] Attempt ${attempt} | Active: ${activeScans} | Scan ${scanId} target=${payload.target}`);

  const hardTimeout = setTimeout(() => {
    console.error(`[Worker] HARD TIMEOUT for scan ${scanId} after ${SCAN_HARD_TIMEOUT_MS}ms`);
    activeScans = Math.max(0, activeScans - 1);
  }, SCAN_HARD_TIMEOUT_MS);

  try {
    // === DEMO SCAN: lightweight, no DB writes ===
    if (payload.isDemo) {
      const result = await Promise.race([
        runDemoScan(payload.target),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Demo scan timeout')), 60000)
        ),
      ]);
      await redis.setex(`demo:result:${scanId}`, 3600, JSON.stringify(result));
      console.log(`[Worker] Demo scan ${scanId} completed (${result.durationSeconds.toFixed(1)}s)`);
      clearTimeout(hardTimeout);
      activeScans = Math.max(0, activeScans - 1);
      return;
    }

    // === AUTHENTICATED SCAN: full scan with DB ===
    try {
      await prisma.scan.update({ where: { id: scanId }, data: { status: 'running' } });
    } catch (e: any) {
      console.error(`[Worker] Failed to mark scan running: ${e.message}`);
    }

    const engine = new ShadowSurfaceEngine(payload.target);
    const result = await Promise.race([
      engine.runFullScan(100),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Scan hard timeout')), SCAN_HARD_TIMEOUT_MS)
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

    // Batch insert assets (more efficient)
    if (result.assets.length > 0) {
      const assetData = result.assets.map((asset) => ({
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
        sslInfo: asset.sslInfo as any,
        waf: asset.waf,
        scanId,
      }));
      await prisma.asset.createMany({ data: assetData });
    }

    if (result.cloudAssets.length > 0) {
      const cloudData = result.cloudAssets.map((ca) => ({
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

    console.log(`[Worker] Scan ${scanId} completed (${result.durationSeconds?.toFixed(1) || '?'}s) | Assets: ${result.assets.length} | Cloud: ${result.cloudAssets.length}`);
  } catch (e: any) {
    console.error(`[Worker] Scan ${scanId} failed (attempt ${attempt}): ${e.message}`);

    if (attempt < MAX_RETRIES) {
      console.log(`[Worker] Retrying scan ${scanId} in ${RETRY_DELAY_MS}ms...`);
      clearTimeout(hardTimeout);
      activeScans = Math.max(0, activeScans - 1);
      await sleep(RETRY_DELAY_MS);
      return processJob(raw, attempt + 1);
    }

    try {
      await prisma.scan.update({ where: { id: scanId }, data: { status: 'failed' } });
    } catch {}
    console.error(`[Worker] Scan ${scanId} permanently failed after ${MAX_RETRIES} attempts`);
  }

  clearTimeout(hardTimeout);
  activeScans = Math.max(0, activeScans - 1);
}

async function main() {
  console.log(`[Worker] Started | Max concurrent: ${MAX_CONCURRENT_SCANS} | Hard timeout: ${SCAN_HARD_TIMEOUT_MS}ms`);
  while (true) {
    try {
      const res = await redis.brpop('scan:queue', 5);
      if (res && res[1]) await processJob(res[1]);
    } catch (e: any) {
      console.error('[Worker] Error:', e.message);
      await sleep(2000);
    }
  }
}

main();
