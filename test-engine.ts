import { ScannerEngine } from './lib/scanner/engine';

async function main() {
  const engine = new ScannerEngine('testphp.vulnweb.com');
  const r = await engine.runFullScan(100);
  console.log('Duration:', r.durationSeconds, 's');
  console.log('Assets:', r.assets.length);
  console.log('Overall Risk:', r.executiveSummary?.overallRisk);
  console.log('Risk Score:', r.executiveSummary?.riskScore);
  console.log('Findings:', r.statistics?.criticalFindings, 'crit', r.statistics?.highRiskCount, 'high', r.statistics?.mediumRiskCount, 'med');
  console.log('Techs (first 8):', r.assets.slice(0,8).map(a => ({sub:a.subdomain, tech:a.technology, port:a.port, risk:a.riskScore, cves:a.cves.length, wv:a.webVulns?.length||0})));
  console.log('SSL sample:', r.assets.filter(a => a.sslInfo).slice(0,3).map(a => ({sub:a.subdomain, grade:a.sslGrade, subj:a.sslInfo?.certSubject?.slice(0,40), issuer:a.sslInfo?.certIssuer?.slice(0,40), days:a.sslInfo?.certDaysLeft})));
  console.log('WebVulns total:', r.assets.reduce((s,a) => s+(a.webVulns?.length||0),0));
  console.log('CloudAssets:', r.cloudAssets.length);
}
main().catch(e => console.error(e));
