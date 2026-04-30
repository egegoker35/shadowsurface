#!/usr/bin/env python3
"""ShadowSurface v2 - Cloud Attack Surface Intelligence Platform"""
import asyncio, aiohttp, aiofiles, aiodns, json, socket, ssl, hashlib, secrets
from datetime import datetime
from typing import List, Dict, Set, Optional, Tuple
from dataclasses import dataclass, field, asdict
from pathlib import Path
import argparse, logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SUBDOMAIN_WORDLIST = ['www','api','app','admin','dev','test','staging','portal','dashboard','secure','mail','cdn','assets','static','media','files','blog','shop','api-v1','api-v2','internal','private','webmail','remote','server','ns1','ns2','mx','web','mobile','beta','demo','support','help','docs','wiki','git','gitlab','jenkins','ci','cd','build','deploy','monitoring','grafana','prometheus','kibana','elastic','vpn','bastion','gateway','proxy','graphql','rest','ws','socket','realtime','events','queue','rabbitmq','kafka','redis','cache','db','database','mysql','postgres','mongo','mongodb','storage','s3','gcs','azure','backup','backups','archive','old','legacy','v1','v2','v3','download','upload','share','team','corp','enterprise','business','marketing','sales','hr','finance','legal','it','tech','engineering','config','settings','env','vars','secrets','key','token','auth','oauth','sso','login','signin','signup','register']

TOP_PORTS = [80,443,8080,8443,21,22,23,25,53,110,143,3306,3389,5432,6379,9200,27017,5900,8000,8081,8888,9000,9090,5000,3000,4444,5555,6666,7777,8888,9999,10000,81,82,83,84,85,88,89,90,91,92,93,94,95,96,97,98,99,101,102,103,104,105,106,107,108,109,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,144,145,146,147,148,149,150]

CVE_DATABASE = {'apache':{'2.4.49':['CVE-2021-41773'],'2.4.50':['CVE-2021-42013']},'nginx':{'1.18.0':['CVE-2021-23017']},'openssh':{'8.2':['CVE-2020-15778']},'mysql':{'5.7.0':['CVE-2020-14812']},'redis':{'5.0.0':['CVE-2021-32761']}}

@dataclass
class DiscoveredAsset:
    id: str = field(default_factory=lambda: hashlib.md5(str(datetime.now()).encode()).hexdigest()[:12])
    domain: str = ""; subdomain: str = ""; ip: Optional[str] = None
    port: int = 0; service: str = ""; banner: str = ""
    technology: Optional[str] = None; version: Optional[str] = None
    cves: List[str] = field(default_factory=list)
    cloud_provider: Optional[str] = None; risk_score: int = 0
    findings: List[Dict] = field(default_factory=list)
    headers: Dict = field(default_factory=dict)
    first_seen: str = field(default_factory=lambda: datetime.now().isoformat())
    def to_dict(self): return asdict(self)

@dataclass
class CloudAsset:
    id: str = field(default_factory=lambda: hashlib.md5(str(datetime.now()).encode()).hexdigest()[:12])
    provider: str = ""; service_type: str = ""; resource_id: str = ""
    url: str = ""; permissions: List[str] = field(default_factory=list)
    misconfigurations: List[Dict] = field(default_factory=list)
    risk_score: int = 0; severity: str = "low"
    first_seen: str = field(default_factory=lambda: datetime.now().isoformat())

@dataclass
class ScanResult:
    target: str = ""; scan_id: str = field(default_factory=lambda: secrets.token_hex(16))
    started_at: str = field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None; duration_seconds: float = 0.0
    assets: List[DiscoveredAsset] = field(default_factory=list)
    cloud_assets: List[CloudAsset] = field(default_factory=list)
    statistics: Dict = field(default_factory=dict)
    executive_summary: Dict = field(default_factory=dict)

class CertificateTransparencyScanner:
    @staticmethod
    async def query_crtsh(domain: str, timeout: int = 30) -> Set[str]:
        subdomains = set()
        try:
            async with aiohttp.ClientSession() as session:
                url = f"https://crt.sh/?q=%.{domain}&output=json"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for entry in data:
                            for line in entry.get('name_value','').split('\n'):
                                line = line.strip()
                                if line and domain in line:
                                    subdomains.add(line.replace('*.',''))
        except Exception as e: logger.warning(f"crt.sh error: {e}")
        return subdomains

class DNSBruteForcer:
    def __init__(self, timeout: float = 5.0): self.timeout = timeout; self.resolver = None
    async def setup(self):
        self.resolver = aiodns.DNSResolver()
        self.resolver.nameservers = ['8.8.8.8','8.8.4.4','1.1.1.1']
        self.resolver.timeout = self.timeout
    async def resolve(self, subdomain: str) -> Optional[Tuple[str,List[str]]]:
        try:
            result = await self.resolver.query(subdomain, 'A')
            ips = [r.host for r in result if hasattr(r,'host')]
            if ips: return subdomain, ips
        except: pass
        return None
    async def resolve_bulk(self, domains: List[str], max_concurrent: int = 100) -> Dict[str,List[str]]:
        await self.setup()
        semaphore = asyncio.Semaphore(max_concurrent); results = {}
        async def resolve_with_limit(domain):
            async with semaphore: return await self.resolve(domain)
        tasks = [resolve_with_limit(d) for d in domains]
        for result in await asyncio.gather(*tasks, return_exceptions=True):
            if isinstance(result, tuple): results[result[0]] = result[1]
        return results

class AsyncPortScanner:
    def __init__(self, timeout: float = 3.0): self.timeout = timeout
    async def scan_port(self, ip: str, port: int) -> Optional[DiscoveredAsset]:
        try:
            fut = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(fut, timeout=self.timeout)
            service = {21:'ftp',22:'ssh',23:'telnet',25:'smtp',53:'dns',80:'http',110:'pop3',143:'imap',443:'https',445:'smb',3306:'mysql',3389:'rdp',5432:'postgresql',6379:'redis',8080:'http-proxy',8443:'https-alt',9200:'elasticsearch',27017:'mongodb',5900:'vnc'}.get(port, 'unknown')
            banner = ""
            try:
                probe = {21:b'\r\n',22:b'\r\n',25:b'EHLO test\r\n',80:b'HEAD / HTTP/1.0\r\n\r\n',443:b'\x16\x03\x01'}.get(port)
                if probe: writer.write(probe); await writer.drain()
                banner_data = await asyncio.wait_for(reader.read(1024), timeout=2.0)
                banner = banner_data.decode('utf-8', errors='ignore').strip()
            except: pass
            writer.close(); await writer.wait_closed()
            tech = None
            for indicator, t in {'Apache':'Apache','nginx':'nginx','Microsoft-IIS':'IIS','OpenSSH':'OpenSSH','MySQL':'MySQL','Redis':'Redis','PostgreSQL':'PostgreSQL','Elasticsearch':'Elasticsearch','MongoDB':'MongoDB'}.items():
                if indicator in banner: tech = t; break
            return DiscoveredAsset(ip=ip, port=port, service=service, banner=banner, technology=tech)
        except: return None
    async def scan_host(self, ip: str, ports: List[int], max_concurrent: int = 50) -> List[DiscoveredAsset]:
        semaphore = asyncio.Semaphore(max_concurrent)
        async def scan_with_limit(port): async with semaphore: return await self.scan_port(ip, port)
        results = await asyncio.gather(*[scan_with_limit(p) for p in ports])
        return [r for r in results if r]

class CloudScanner:
    def __init__(self): self.session = None
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(connector=aiohttp.TCPConnector(limit=100,ssl=False),timeout=aiohttp.ClientTimeout(total=10),headers={'User-Agent':'ShadowSurface-CloudScanner/2.0'})
        return self
    async def __aexit__(self, *args): 
        if self.session: await self.session.close()
    async def scan_aws_s3(self, bucket_prefixes: List[str]) -> List[CloudAsset]:
        assets = []
        for prefix in bucket_prefixes:
            for bucket in [prefix,f"{prefix}-data",f"{prefix}-assets",f"{prefix}-uploads",f"{prefix}-backup"]:
                for endpoint in [f"https://{bucket}.s3.amazonaws.com",f"https://s3.amazonaws.com/{bucket}"]:
                    try:
                        async with self.session.get(endpoint) as resp:
                            if resp.status == 200:
                                text = await resp.text()
                                files = len(__import__('re').findall(r'<Key>([^<]+)</Key>',text))
                                assets.append(CloudAsset(provider='aws',service_type='s3',resource_id=bucket,url=endpoint,permissions=['ListBucket'],misconfigurations=[{'type':'s3_listable','severity':'critical','description':f'S3 bucket {bucket} allows public listing'}],risk_score=70,severity='critical'))
                                break
                            elif resp.status == 403 and 'AccessDenied' in await resp.text():
                                assets.append(CloudAsset(provider='aws',service_type='s3',resource_id=bucket,url=endpoint,permissions=[],risk_score=10,severity='low'))
                                break
                    except: continue
        return assets
    async def scan_google_cloud(self, bucket_prefixes: List[str]) -> List[CloudAsset]:
        assets = []
        for prefix in bucket_prefixes:
            for bucket in [prefix,f"{prefix}-data",f"{prefix}-assets"]:
                try:
                    async with self.session.get(f"https://storage.googleapis.com/{bucket}") as resp:
                        if resp.status == 200:
                            text = await resp.text()
                            if 'items' in text or 'kind' in text:
                                assets.append(CloudAsset(provider='gcp',service_type='gcs',resource_id=bucket,url=f"https://storage.googleapis.com/{bucket}",permissions=['ListObjects'],misconfigurations=[{'type':'gcs_public','severity':'high','description':f'GCS bucket {bucket} is publicly accessible'}],risk_score=75,severity='high'))
                except: continue
        return assets
    async def scan_azure(self, storage_prefixes: List[str]) -> List[CloudAsset]:
        assets = []
        for prefix in storage_prefixes:
            for storage in [f"{prefix}.blob.core.windows.net",f"{prefix}storage.blob.core.windows.net"]:
                try:
                    async with self.session.get(f"https://{storage}") as resp:
                        if resp.status == 200:
                            assets.append(CloudAsset(provider='azure',service_type='blob',resource_id=storage,url=f"https://{storage}",permissions=['ListContainers'],misconfigurations=[{'type':'azure_blob_public','severity':'high','description':f'Azure Blob {storage} may be publicly accessible'}],risk_score=70,severity='high'))
                except: continue
        return assets

class ShadowSurfaceV2:
    def __init__(self, target: str): self.target = target; self.scan_result = ScanResult(target=target); self.dns_brute_forcer = DNSBruteForcer(); self.port_scanner = AsyncPortScanner(); self.cloud_scanner = None
    async def __aenter__(self): self.cloud_scanner = CloudScanner(); await self.cloud_scanner.__aenter__(); return self
    async def __aexit__(self, *args): await self.cloud_scanner.__aexit__(*args)
    async def enumerate_subdomains(self) -> Dict[str,List[str]]:
        logger.info(f"[+] Subdomain enumeration for {self.target}")
        domains = [f"{w}.{self.target}" for w in SUBDOMAIN_WORDLIST]
        dns_results = await self.dns_brute_forcer.resolve_bulk(domains, 200)
        ct = await CertificateTransparencyScanner.query_crtsh(self.target)
        if ct: ct_results = await self.dns_brute_forcer.resolve_bulk(list(ct), 100); dns_results.update(ct_results)
        logger.info(f"[+] Found {len(dns_results)} live subdomains")
        return dns_results
    async def scan_ports_on_assets(self, subdomain_ips: Dict[str,List[str]], ports: Optional[List[int]] = None) -> List[DiscoveredAsset]:
        ports = ports or [80,443,8080,8443]; assets = []
        logger.info(f"[+] Port scanning {len(subdomain_ips)} hosts")
        for subdomain, ips in subdomain_ips.items():
            for ip in ips[:3]:
                for asset in await self.port_scanner.scan_host(ip, ports[:20], 50):
                    asset.domain = self.target; asset.subdomain = subdomain; asset.ip = ip; assets.append(asset)
        logger.info(f"[+] Found {len(assets)} open ports")
        return assets
    async def scan_cloud_infrastructure(self) -> List[CloudAsset]:
        logger.info("[+] Scanning cloud infrastructure")
        prefixes = [self.target.replace('.','-'), self.target.replace('.',''), self.target.split('.')[0]]
        all_assets = []
        all_assets.extend(await self.cloud_scanner.scan_aws_s3(prefixes))
        all_assets.extend(await self.cloud_scanner.scan_google_cloud(prefixes))
        all_assets.extend(await self.cloud_scanner.scan_azure(prefixes))
        logger.info(f"[+] Found {len(all_assets)} cloud exposures")
        return all_assets
    async def analyze_web_assets(self, assets: List[DiscoveredAsset]) -> List[DiscoveredAsset]:
        async with aiohttp.ClientSession() as session:
            for asset in assets:
                if asset.port in [80,443,8080,8443]:
                    proto = 'https' if asset.port in [443,8443] else 'http'
                    try:
                        async with session.get(f"{proto}://{asset.subdomain or asset.ip}:{asset.port}", allow_redirects=True, ssl=False, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                            asset.headers = dict(resp.headers)
                            server = resp.headers.get('Server',''); powered = resp.headers.get('X-Powered-By','')
                            if server: asset.technology = self._extract_tech(server); asset.version = self._extract_version(server)
                            if powered and not asset.technology: asset.technology = self._extract_tech(powered)
                            if asset.technology and asset.version: asset.cves = self._map_cves(asset.technology, asset.version)
                            for h in ['Strict-Transport-Security','Content-Security-Policy','X-Frame-Options','X-Content-Type-Options','Referrer-Policy']:
                                if h not in resp.headers: asset.findings.append({'type':'missing_security_headers','severity':'low','description':f'Missing {h}'})
                            body = await resp.text()
                            for p in ['/admin','/administrator','/wp-admin','/dashboard']:
                                if p in body: asset.findings.append({'type':'admin_panel_reference','severity':'medium','description':f'Admin panel ref: {p}'})
                    except: pass
        return assets
    def _extract_tech(self, h): return next((t for t in ['Apache','nginx','Microsoft-IIS','lighttpd'] if t.lower() in h.lower()), None)
    def _extract_version(self, h):
        m = __import__('re').search(r'(\d+\.\d+\.?\d*)', h)
        return m.group(1) if m else None
    def _map_cves(self, tech, ver):
        for db_tech, versions in CVE_DATABASE.items():
            if db_tech in tech.lower():
                for v, cves in versions.items():
                    if ver.startswith(v): return cves
        return []
    def calculate_risk_scores(self, assets):
        for asset in assets:
            score = {3389:80,23:85,21:40,3306:75,5432:70,6379:60,9200:50}.get(asset.port,0)
            for cve in asset.cves: score += 50
            for f in asset.findings:
                if 'admin' in f.get('type',''): score += 30
                if 'missing' in f.get('type',''): score += 15
            asset.risk_score = min(score,100)
    async def run_full_scan(self) -> ScanResult:
        start = datetime.now(); logger.info(f"\n{'='*60}\nShadowSurface v2 Scan\nTarget: {self.target}\nStarted: {start.isoformat()}\n{'='*60}\n")
        subdomain_ips = await self.enumerate_subdomains()
        assets = await self.scan_ports_on_assets(subdomain_ips, TOP_PORTS[:100])
        cloud_assets = await self.scan_cloud_infrastructure()
        assets = await self.analyze_web_assets(assets)
        self.calculate_risk_scores(assets)
        self.scan_result.assets = assets; self.scan_result.cloud_assets = cloud_assets
        self.scan_result.completed_at = datetime.now().isoformat()
        self.scan_result.duration_seconds = (datetime.now()-start).total_seconds()
        crit = len([a for a in assets if a.risk_score>=70]) + len([a for a in cloud_assets if a.severity=='critical'])
        self.scan_result.statistics = {'total_subdomains':len(subdomain_ips),'total_assets':len(assets),'total_cloud_assets':len(cloud_assets),'high_risk_count':crit,'medium_risk_count':len([a for a in assets if 40<=a.risk_score<70]),'low_risk_count':len([a for a in assets if a.risk_score<40])}
        self.scan_result.executive_summary = {'overall_risk':'CRITICAL' if crit>0 else 'HIGH' if len([a for a in assets if a.risk_score>=70])>0 else 'MEDIUM' if len([a for a in assets if a.risk_score>=40])>0 else 'LOW','critical_findings':crit,'attack_surface_size':len(subdomain_ips)+len(cloud_assets),'recommendations':self._generate_recommendations(assets,cloud_assets)}
        logger.info(f"\n{'='*60}\nSCAN COMPLETE\nDuration: {self.scan_result.duration_seconds:.2f}s\nRisk: {self.scan_result.executive_summary['overall_risk']}\n{'='*60}\n")
        return self.scan_result
    def _generate_recommendations(self, assets, cloud):
        recs = []
        writable = [a for a in cloud if 'PutObject' in a.permissions]
        if writable: recs.append(f"URGENT: {len(writable)} writable cloud bucket(s)")
        listable = [a for a in cloud if 'ListBucket' in a.permissions or 'ListObjects' in a.permissions]
        if listable: recs.append(f"HIGH: {len(listable)} publicly listable bucket(s)")
        exposed_dbs = [a for a in assets if a.port in [3306,5432,27017,6379,9200]]
        if exposed_dbs: recs.append(f"CRITICAL: {len(exposed_dbs)} exposed database port(s)")
        outdated = [a for a in assets if a.cves]
        if outdated: recs.append(f"HIGH: {len(outdated)} asset(s) with known CVEs")
        recs.extend(["Implement continuous monitoring","Review cloud storage policies","Deploy WAF for public assets"])
        return recs
    def export_json(self) -> str:
        return json.dumps({'scan_metadata':{'tool':'ShadowSurface v2','version':'2.0.0','target':self.scan_result.target,'scan_id':self.scan_result.scan_id,'started_at':self.scan_result.started_at,'completed_at':self.scan_result.completed_at,'duration_seconds':self.scan_result.duration_seconds},'executive_summary':self.scan_result.executive_summary,'statistics':self.scan_result.statistics,'assets':[a.to_dict() for a in self.scan_result.assets],'cloud_assets':[asdict(a) for a in self.scan_result.cloud_assets],'recommendations':self.scan_result.executive_summary.get('recommendations',[])},indent=2,default=str)

async def main():
    parser = argparse.ArgumentParser(description='ShadowSurface v2 - Cloud Attack Surface Intelligence')
    parser.add_argument('target', help='Target domain')
    parser.add_argument('-o','--output', default='scan_result.json')
    parser.add_argument('--top-ports', type=int, default=100)
    parser.add_argument('--full-port-scan', action='store_true')
    parser.add_argument('--no-ct', action='store_true')
    parser.add_argument('-v','--verbose', action='store_true')
    args = parser.parse_args()
    if args.verbose: logging.getLogger().setLevel(logging.DEBUG)
    async with ShadowSurfaceV2(args.target) as scanner:
        result = await scanner.run_full_scan()
        async with aiofiles.open(args.output,'w') as f: await f.write(scanner.export_json())
        print(f"\n[+] Scan complete! Saved to: {args.output}")
        print(f"[+] Assets: {result.statistics['total_assets']} | Cloud: {result.statistics['total_cloud_assets']} | Risk: {result.executive_summary['overall_risk']}")

if __name__ == '__main__': asyncio.run(main())
