#!/usr/bin/env python3
"""ShadowSurface Demo Endpoint - Real working demo with restrictions"""
import asyncio, json, secrets
from datetime import datetime
from typing import Dict, Optional
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import redis.asyncio as redis
from security_validator import DemoValidator, DomainValidator
from shadowsurface_v2 import ShadowSurfaceV2, ScanResult

DEMO_CONFIG = {'max_subdomains':50,'max_ports':20,'scan_timeout':60}
ALLOWED_DEMO_TARGETS = {'demo-corp.com','example.com','shadowsurface.io'}

app = FastAPI(title="ShadowSurface Demo API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["GET","POST"], allow_headers=["*"])

class DemoScanRequest(BaseModel):
    target: str = Field(..., description="Domain to scan (limited to demo targets)")
    email: str = Field(..., description="Email for results")
    @validator('target')
    def validate_target(cls, v):
        validator = DomainValidator(); sanitized = validator.sanitize(v)
        is_valid, error = validator.validate(sanitized)
        if not is_valid: raise ValueError(f"Invalid domain: {error}")
        if sanitized not in ALLOWED_DEMO_TARGETS: raise ValueError(f"Demo limited to: {', '.join(ALLOWED_DEMO_TARGETS)}")
        return sanitized

async def get_redis():
    try: return redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    except: return None

@app.post("/api/demo/scan")
async def start_demo_scan(request: DemoScanRequest, background_tasks: BackgroundTasks, req: Request):
    client_ip = req.client.host; r = await get_redis()
    if r:
        if await r.get(f"demo_scan:{client_ip}"): raise HTTPException(status_code=429, detail="Demo scans limited to 1 per hour")
        await r.setex(f"demo_scan:{client_ip}", 3600, "1")
    scan_id = f"demo-{secrets.token_hex(8)}"
    background_tasks.add_task(run_limited_demo_scan, scan_id, request.target, request.email)
    return {"scan_id": scan_id, "status": "queued", "message": "Scan started. Results will be sent to your email.", "check_status_url": f"/api/demo/scan/{scan_id}/status", "signup_url": "/signup"}

async def run_limited_demo_scan(scan_id: str, target: str, email: str):
    r = await get_redis()
    try:
        async with ShadowSurfaceV2(target) as scanner:
            result = await scanner.run_full_scan()
        if r: await r.hset(f"demo_scan:{scan_id}", mapping={'status':'completed','completed_at':datetime.utcnow().isoformat(),'result':json.dumps(simplify_for_demo(result))})
    except Exception as e:
        if r: await r.hset(f"demo_scan:{scan_id}", mapping={'status':'failed','error':str(e)})

def simplify_for_demo(result):
    return {'target':result.target,'total_assets_found':len(result.assets),'total_cloud_assets':len(result.cloud_assets),'high_risk_count':len([a for a in result.assets if a.risk_score>=70]),'top_findings':[],'notice':'Full results available with paid subscription','signup_cta':{'text':'Get complete attack surface visibility','url':'/signup'}}

@app.get("/api/demo/scan/{scan_id}/status")
async def get_demo_scan_status(scan_id: str):
    r = await get_redis()
    if not r: raise HTTPException(status_code=500, detail="Redis not available")
    scan_data = await r.hgetall(f"demo_scan:{scan_id}")
    if not scan_data: raise HTTPException(status_code=404, detail="Scan not found")
    return {"scan_id":scan_id,"status":scan_data.get('status'),"result":json.loads(scan_data.get('result','{}')) if scan_data.get('result') else None}

if __name__ == "__main__":
    import uvicorn; uvicorn.run(app, host="0.0.0.0", port=8001)
