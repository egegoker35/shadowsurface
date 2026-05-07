import { ScannerEngine } from './lib/scanner/engine';

async function main() {
  const engine = new ScannerEngine('testphp.vulnweb.com');
  const result = await engine.runFullScan(20);
  console.log('=== EXECUTIVE SUMMARY ===');
  console.log(JSON.stringify(result.executiveSummary, null, 2));
  console.log('\n=== STATS ===');
  console.log(JSON.stringify(result.statistics, null, 2));
  const asset = result.assets?.[0];
  if (asset) {
    console.log('\n=== SAMPLE ASSET ===');
    console.log({
      ip: asset.ip,
      port: asset.port,
      service: asset.service,
      technology: asset.technology,
      cves: asset.cves?.slice(0, 5),
      webVulns: asset.webVulns?.length,
      findings: asset.findings?.length,
    });
  }
  console.log('\n=== CLOUD ASSETS ===', result.cloudAssets?.length || 0);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
