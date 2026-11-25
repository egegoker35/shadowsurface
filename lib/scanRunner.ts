import { prisma } from '@/lib/prisma';
import { ScannerEngine } from '@/lib/scanner/engine';
import { dispatchScanEvent } from '@/lib/webhooks';

export function runScanWithTimeout(
  engine: ScannerEngine,
  scanType: string,
  ms = 1800000,
  portLimit = 50,
  targets?: string[],
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Scan timed out after 30 minutes')), ms);
    const work =
      scanType === 'bulk' && targets && targets.length > 1
        ? engine.runBulkScan(targets, portLimit)
        : engine.runScan(scanType, portLimit);
    work
      .then((result: any) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err: any) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export type ScanExecutionParams = {
  scanId: string;
  target: string;
  scanType: string;
  orgId: string;
  portLimit: number;
  targets?: string[];
};

/**
 * Runs one scan to completion and persists the result, its assets and its webhook event.
 * Shared by the API route and the scheduled-scan runner so both produce identical records.
 */
export function startScanExecution(params: ScanExecutionParams): void {
  const { scanId, target, scanType, orgId, portLimit, targets } = params;
  const engine = new ScannerEngine(target);

  runScanWithTimeout(engine, scanType, 1800000, portLimit, targets)
    .then(async (result: any) => {
      try {
        await prisma.scan.update({
          where: { id: scanId },
          data: {
            status: 'completed',
            resultJson: result as any,
            executiveSummary: result.executiveSummary as any,
            statistics: result.statistics as any,
            durationSeconds: typeof result.durationSeconds === 'number' ? result.durationSeconds : null,
          },
        });
        if (result.assets?.length > 0) {
          await prisma.asset.createMany({
            data: result.assets.map((a: any) => ({
              scanId,
              domain: a.subdomain || a.ip || 'unknown',
              subdomain: a.subdomain || a.ip || 'unknown',
              ip: a.ip,
              port: a.port,
              service: a.service,
              technology: a.technology,
              version: a.version,
              riskScore: a.riskScore,
              cves: a.cves,
              findings: a.findings as any,
              headers: a.headers as any,
              sslInfo: a.sslInfo as any,
              waf: a.waf,
            })),
          });
        }
        if (result.cloudAssets?.length > 0) {
          await prisma.cloudAsset.createMany({
            data: result.cloudAssets.map((c: any) => ({
              scanId,
              provider: c.provider,
              serviceType: c.serviceType,
              resourceId: c.resourceId,
              url: c.url,
              permissions: c.permissions as any,
              misconfigurations: c.misconfigurations as any,
              riskScore: c.riskScore,
              severity: c.severity,
            })),
          });
        }
        await dispatchScanEvent(orgId, {
          event: 'scan.completed',
          scanId,
          target,
          overallRisk: result.executiveSummary?.overallRisk ?? null,
          riskScore: result.executiveSummary?.riskScore ?? null,
          totalAssets: result.statistics?.totalAssets ?? 0,
          totalCVEs: result.statistics?.totalCVEs ?? 0,
          durationSeconds: Math.round(result.durationSeconds || 0),
        });
      } catch (e: any) {
        console.error('[Scan Save Error]', e);
        await prisma.scan.update({ where: { id: scanId }, data: { status: 'failed' } });
        await dispatchScanEvent(orgId, { event: 'scan.failed', scanId, target, error: String(e?.message || e) });
      }
    })
    .catch(async (err: any) => {
      console.error('[Scan Engine Error]', err?.message || err);
      await prisma.scan.update({ where: { id: scanId }, data: { status: 'failed' } });
      await dispatchScanEvent(orgId, { event: 'scan.failed', scanId, target, error: String(err?.message || err) });
    });
}
