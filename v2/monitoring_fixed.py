#!/usr/bin/env python3
"""ShadowSurface Monitoring - Continuous monitoring with fixes"""
import asyncio, aiohttp, json, secrets, hashlib, hmac
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    CRITICAL = "critical"; HIGH = "high"; MEDIUM = "medium"; LOW = "low"; INFO = "info"
class AlertType(Enum):
    NEW_CRITICAL_ASSET = "new_critical_asset"; NEW_CLOUD_EXPOSURE = "new_cloud_exposure"; SCHEDULED_SCAN_COMPLETE = "scheduled_scan_complete"

@dataclass
class Alert:
    id: str; organization_id: str; target_id: str; scan_id: str
    alert_type: AlertType; severity: AlertSeverity; title: str; description: str
    asset_details: Dict; timestamp: datetime; acknowledged: bool = False
    def to_dict(self): return {"id":self.id,"alert_type":self.alert_type.value,"severity":self.severity.value,"title":self.title,"description":self.description,"asset_details":self.asset_details,"timestamp":self.timestamp.isoformat()}

class NotificationEngine:
    def __init__(self): self.webhook_configs = {}; self.alert_history = []
    def register_webhook(self, config): 
        if config.organization_id not in self.webhook_configs: self.webhook_configs[config.organization_id] = []
        self.webhook_configs[config.organization_id].append(config)
    async def send_alert(self, alert: Alert):
        self.alert_history.append(alert)
        # Send to webhooks

class ContinuousMonitor:
    def __init__(self, scanner, notifications):
        self.scanner = scanner; self.notifications = notifications
        self.monitored_targets = {}; self.is_running = False
    def add_target(self, target_id, domain, org_id, interval_minutes=240):
        self.monitored_targets[target_id] = {"domain":domain,"org_id":org_id,"interval":timedelta(minutes=interval_minutes),"next_scan":datetime.utcnow()}
    async def start(self):
        self.is_running = True
        while self.is_running:
            now = datetime.utcnow()
            for tid, config in self.monitored_targets.items():
                if config["next_scan"] <= now:
                    config["next_scan"] = now + config["interval"]
                    print(f"[MONITOR] Scanning {config['domain']}")
            await asyncio.sleep(60)
    async def stop(self): self.is_running = False

if __name__ == "__main__":
    print("Monitoring module loaded")
