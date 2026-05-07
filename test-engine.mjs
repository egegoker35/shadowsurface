import { ScannerEngine } from './lib/scanner/engine.ts';

const engine = new ScannerEngine('testphp.vulnweb.com');
engine.runFullScan(100).then(r => {
  console.log('Duration:', r.durationSeconds, 's');
  console.log('Assets:', r.assets.length);
  console.log('Overall Risk:', r.executiveSummary?.overallRisk);
  console.log('Risk Score:', r.executiveSummary?.riskScore);
  console.log('Findings:', r.statistics?.criticalFindings, 'crit', r.statistics?.highRiskCount, 'high');
  console.log('Techs:', r.assets.slice(0,5).map(a => ({sub:a.subdomain, tech:a.technology, port:a.port, risk:a.riskScore})));
  console.log('SSL sample:', r.assets.filter(a => a.sslInfo).slice(0,3).map(a => ({sub:a.subdomain, grade:a.sslGrade, subj:a.sslInfo?.subject?.slice(0,40), issuer:a.sslInfo?.issuer?.slice(0,40)})));
  console.log('WebVulns count:', r.assets.reduce((s,a) => s+(a.webVulns?.length||0),0));
  console.log('CloudAssets:', r.cloudAssets.length);
}).catch(e => console.error(e));
