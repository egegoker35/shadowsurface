#!/usr/bin/env python3
"""ShadowSurface Security Validator - SSRF Protection, Input Validation, Abuse Prevention"""
import re, ipaddress, socket
from urllib.parse import urlparse
from typing import Optional, Tuple, List

class SSRFProtector:
    BLOCKED_IP_NETWORKS = [ipaddress.ip_network(n) for n in ["0.0.0.0/8","10.0.0.0/8","127.0.0.0/8","169.254.0.0/16","172.16.0.0/12","192.0.2.0/24","192.168.0.0/16","198.18.0.0/15","203.0.113.0/24","224.0.0.0/4"]]
    BLOCKED_HOSTS = {'localhost','0.0.0.0','127.0.0.1'}
    def is_blocked_ip(self, ip: str) -> bool:
        try:
            ip_obj = ipaddress.ip_address(ip)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_multicast: return True
            return any(ip_obj in net for net in self.BLOCKED_IP_NETWORKS)
        except: return True
    def is_blocked_host(self, hostname: str) -> bool:
        return hostname.lower() in self.BLOCKED_HOSTS or any(hostname.lower().endswith(t) for t in ['.internal','.local','.localhost'])
    def validate_url(self, url: str) -> Tuple[bool, Optional[str]]:
        try:
            parsed = urlparse(url)
            if parsed.scheme not in ('http','https'): return False, f"Invalid scheme: {parsed.scheme}"
            if not parsed.hostname: return False, "No hostname"
            if self.is_blocked_host(parsed.hostname): return False, f"Blocked hostname"
            try:
                ip = socket.getaddrinfo(parsed.hostname, None, socket.AF_INET)[0][4][0]
                if self.is_blocked_ip(ip): return False, f"Blocked IP: {ip}"
            except: return False, "Cannot resolve"
            return True, None
        except Exception as e: return False, str(e)

class DomainValidator:
    DOMAIN_REGEX = re.compile(r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])$')
    MAX_DOMAIN_LENGTH = 253
    SUSPICIOUS_PATTERNS = [re.compile(p) for p in [r'[<>&]','\x00','\.\./','[/\\\\]','`|\$|\||;']]
    def __init__(self, ssrf: Optional[SSRFProtector]=None): self.ssrf = ssrf or SSRFProtector()
    def sanitize(self, domain: str) -> str:
        domain = domain.replace('http://','').replace('https://','')
        domain = domain.split('/')[0].split('?')[0].split('#')[0].split(':')[0]
        return domain.strip().rstrip('.').lower()
    def validate(self, domain: str) -> Tuple[bool, Optional[str]]:
        domain = self.sanitize(domain)
        if not domain: return False, "Empty"
        if len(domain) > self.MAX_DOMAIN_LENGTH: return False, "Too long"
        for p in self.SUSPICIOUS_PATTERNS:
            if p.search(domain): return False, "Suspicious characters"
        if not self.DOMAIN_REGEX.match(domain): return False, "Invalid format"
        if self.ssrf.is_blocked_host(domain): return False, "Blocked host"
        return True, None

class AbuseDetector:
    def __init__(self): self.blocklist = set()
    def check_scan_abuse(self, ip: str, target: str) -> Tuple[bool, Optional[str]]:
        if ip in self.blocklist: return False, "IP blocked"
        return True, None

class DemoValidator:
    ALLOWED_DEMO_DOMAINS = {'demo-corp.com','example.com','shadowsurface.io'}
    def __init__(self): self._attempts = {}; self.domain_validator = DomainValidator()
    async def validate_demo_target(self, domain: str, ip: str) -> Tuple[bool, Optional[str]]:
        domain = self.domain_validator.sanitize(domain)
        if domain not in self.ALLOWED_DEMO_DOMAINS:
            return False, f"Demo limited to: {', '.join(self.ALLOWED_DEMO_DOMAINS)}"
        return True, None

if __name__ == "__main__":
    print("Security Validator loaded")
