#!/usr/bin/env python3
"""
ShadowSurface Dashboard API
Basic dashboard endpoints: scan list, findings list, statistics
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, DateTime, Integer, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from enum import Enum as PyEnum

Base = declarative_base()
engine = create_engine("sqlite:///./shadowsurface.db")
SessionLocal = sessionmaker(bind=engine)

# Models
class ScanStatus(PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Scan(Base):
    __tablename__ = "scans"
    
    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), index=True)
    target_id = Column(String(36), ForeignKey("targets.id"))
    status = Column(SQLEnum(ScanStatus), default=ScanStatus.PENDING)
    target_domain = Column(String(255))
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration_seconds = Column(Integer)
    total_assets = Column(Integer, default=0)
    total_findings = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    findings = relationship("Finding", back_populates="scan")
    target = relationship("Target", back_populates="scans")

class FindingSeverity(PyEnum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class FindingStatus(PyEnum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"

class Finding(Base):
    __tablename__ = "findings"
    
    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), index=True)
    scan_id = Column(String(36), ForeignKey("scans.id"))
    asset_id = Column(String(36), ForeignKey("assets.id"))
    severity = Column(SQLEnum(FindingSeverity))
    status = Column(SQLEnum(FindingStatus), default=FindingStatus.OPEN)
    title = Column(String(500))
    description = Column(Text)
    asset_type = Column(String(50))  # subdomain, cloud, service
    asset_identifier = Column(String(500))  # domain or IP:port
    cvss_score = Column(Integer)
    cve_ids = Column(Text)  # JSON array
    remediation = Column(Text)
    first_seen = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    
    scan = relationship("Scan", back_populates="findings")
    asset = relationship("Asset", back_populates="findings")

class Target(Base):
    __tablename__ = "targets"
    
    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), index=True)
    domain = Column(String(255), nullable=False)
    is_active = Column(String(10), default="true")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_scan_at = Column(DateTime)
    
    scans = relationship("Scan", back_populates="target")

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), index=True)
    asset_type = Column(String(50))  # subdomain, cloud_bucket, ip_port
    identifier = Column(String(500))  # domain, S3 bucket, IP:port
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    is_active = Column(String(10), default="true")
    
    findings = relationship("Finding", back_populates="asset")

Base.metadata.create_all(engine)

# Pydantic Schemas
class ScanListItem(BaseModel):
    id: str
    target_domain: str
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]
    total_assets: int
    total_findings: int
    critical_count: int
    high_count: int

class ScanDetail(ScanListItem):
    medium_count: int
    low_count: int
    target_id: str

class FindingListItem(BaseModel):
    id: str
    title: str
    severity: str
    status: str
    asset_type: str
    asset_identifier: str
    first_seen: datetime
    cvss_score: Optional[int]

class FindingDetail(FindingListItem):
    description: str
    cve_ids: List[str]
    remediation: Optional[str]
    scan_id: str

class DashboardStats(BaseModel):
    total_targets: int
    total_scans_30d: int
    active_findings: int
    critical_open: int
    high_open: int
    scans_by_day: List[Dict]
    findings_by_severity: Dict[str, int]

# Security
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Mock auth - replace with real JWT verification
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # In production: verify JWT and extract user_id + org_id
    return {
        "id": "user-123",
        "organization_id": "org-123",
        "email": "user@example.com"
    }

# FastAPI app
dashboard_app = FastAPI(title="ShadowSurface Dashboard API")

# ============================================================================
# SCAN LIST ENDPOINTS
# ============================================================================

@dashboard_app.get("/api/scans", response_model=List[ScanListItem])
async def list_scans(
    status: Optional[str] = Query(None, description="Filter by status: pending, running, completed, failed"),
    target_id: Optional[str] = Query(None),
    days: int = Query(30, ge=1, le=90),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """List scans for organization with filtering"""
    
    org_id = user["organization_id"]
    
    query = db.query(Scan).filter(Scan.organization_id == org_id)
    
    # Apply filters
    if status:
        query = query.filter(Scan.status == status)
    
    if target_id:
        query = query.filter(Scan.target_id == target_id)
    
    # Date filter
    since = datetime.utcnow() - timedelta(days=days)
    query = query.filter(Scan.created_at >= since)
    
    # Order by newest first
    query = query.order_by(Scan.created_at.desc())
    
    # Pagination
    total = query.count()
    scans = query.offset(offset).limit(limit).all()
    
    return [
        ScanListItem(
            id=s.id,
            target_domain=s.target_domain,
            status=s.status.value,
            started_at=s.started_at,
            completed_at=s.completed_at,
            duration_seconds=s.duration_seconds,
            total_assets=s.total_assets,
            total_findings=s.total_findings,
            critical_count=s.critical_count,
            high_count=s.high_count
        )
        for s in scans
    ]

@dashboard_app.get("/api/scans/{scan_id}", response_model=ScanDetail)
async def get_scan_detail(
    scan_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Get detailed scan information"""
    
    org_id = user["organization_id"]
    
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.organization_id == org_id
    ).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    return ScanDetail(
        id=scan.id,
        target_domain=scan.target_domain,
        status=scan.status.value,
        started_at=scan.started_at,
        completed_at=scan.completed_at,
        duration_seconds=scan.duration_seconds,
        total_assets=scan.total_assets,
        total_findings=scan.total_findings,
        critical_count=scan.critical_count,
        high_count=scan.high_count,
        medium_count=scan.medium_count,
        low_count=scan.low_count,
        target_id=scan.target_id
    )

@dashboard_app.get("/api/scans/{scan_id}/findings", response_model=List[FindingListItem])
async def get_scan_findings(
    scan_id: str,
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Get findings for a specific scan"""
    
    org_id = user["organization_id"]
    
    # Verify scan belongs to org
    scan = db.query(Scan).filter(
        Scan.id == scan_id,
        Scan.organization_id == org_id
    ).first()
    
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    query = db.query(Finding).filter(
        Finding.scan_id == scan_id,
        Finding.organization_id == org_id
    )
    
    if severity:
        query = query.filter(Finding.severity == severity)
    
    if status:
        query = query.filter(Finding.status == status)
    
    query = query.order_by(Finding.severity.desc(), Finding.first_seen.desc())
    
    findings = query.all()
    
    return [
        FindingListItem(
            id=f.id,
            title=f.title,
            severity=f.severity.value,
            status=f.status.value,
            asset_type=f.asset_type,
            asset_identifier=f.asset_identifier,
            first_seen=f.first_seen,
            cvss_score=f.cvss_score
        )
        for f in findings
    ]

# ============================================================================
# FINDINGS LIST ENDPOINTS
# ============================================================================

@dashboard_app.get("/api/findings", response_model=List[FindingListItem])
async def list_findings(
    severity: Optional[str] = Query(None, description="Filter by severity: critical, high, medium, low, info"),
    status: Optional[str] = Query(None, description="Filter by status: open, acknowledged, in_progress, resolved, false_positive"),
    asset_type: Optional[str] = Query(None),
    days: int = Query(90, ge=1, le=365),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("severity", regex="^(severity|first_seen|status)$"),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """List all findings across scans with filtering"""
    
    org_id = user["organization_id"]
    
    query = db.query(Finding).filter(Finding.organization_id == org_id)
    
    if severity:
        query = query.filter(Finding.severity == severity)
    
    if status:
        query = query.filter(Finding.status == status)
    else:
        # Default: show only open findings
        query = query.filter(Finding.status.in_([FindingStatus.OPEN, FindingStatus.ACKNOWLEDGED, FindingStatus.IN_PROGRESS]))
    
    if asset_type:
        query = query.filter(Finding.asset_type == asset_type)
    
    # Date filter
    since = datetime.utcnow() - timedelta(days=days)
    query = query.filter(Finding.first_seen >= since)
    
    # Sorting
    if sort_by == "severity":
        query = query.order_by(Finding.severity.desc(), Finding.first_seen.desc())
    elif sort_by == "first_seen":
        query = query.order_by(Finding.first_seen.desc())
    elif sort_by == "status":
        query = query.order_by(Finding.status, Finding.severity.desc())
    
    total = query.count()
    findings = query.offset(offset).limit(limit).all()
    
    return [
        FindingListItem(
            id=f.id,
            title=f.title,
            severity=f.severity.value,
            status=f.status.value,
            asset_type=f.asset_type,
            asset_identifier=f.asset_identifier,
            first_seen=f.first_seen,
            cvss_score=f.cvss_score
        )
        for f in findings
    ]

@dashboard_app.get("/api/findings/{finding_id}", response_model=FindingDetail)
async def get_finding_detail(
    finding_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Get detailed finding information"""
    
    org_id = user["organization_id"]
    
    finding = db.query(Finding).filter(
        Finding.id == finding_id,
        Finding.organization_id == org_id
    ).first()
    
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    return FindingDetail(
        id=finding.id,
        title=finding.title,
        severity=finding.severity.value,
        status=finding.status.value,
        asset_type=finding.asset_type,
        asset_identifier=finding.asset_identifier,
        first_seen=finding.first_seen,
        cvss_score=finding.cvss_score,
        description=finding.description,
        cve_ids=finding.cve_ids.split(",") if finding.cve_ids else [],
        remediation=finding.remediation,
        scan_id=finding.scan_id
    )

@dashboard_app.patch("/api/findings/{finding_id}/status")
async def update_finding_status(
    finding_id: str,
    status: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Update finding status (acknowledge, mark in progress, resolve, false positive)"""
    
    org_id = user["organization_id"]
    
    finding = db.query(Finding).filter(
        Finding.id == finding_id,
        Finding.organization_id == org_id
    ).first()
    
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    valid_statuses = ["open", "acknowledged", "in_progress", "resolved", "false_positive"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {', '.join(valid_statuses)}")
    
    finding.status = status
    if status == "resolved" or status == "false_positive":
        finding.resolved_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "finding_id": finding_id,
        "new_status": status
    }

# ============================================================================
# DASHBOARD STATS ENDPOINT
# ============================================================================

@dashboard_app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """Get dashboard statistics for organization"""
    
    org_id = user["organization_id"]
    
    # Total targets
    total_targets = db.query(Target).filter(
        Target.organization_id == org_id,
        Target.is_active == "true"
    ).count()
    
    # Scans in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    scans_30d = db.query(Scan).filter(
        Scan.organization_id == org_id,
        Scan.created_at >= thirty_days_ago
    ).count()
    
    # Active findings (not resolved/false positive)
    active_findings = db.query(Finding).filter(
        Finding.organization_id == org_id,
        Finding.status.in_([FindingStatus.OPEN, FindingStatus.ACKNOWLEDGED, FindingStatus.IN_PROGRESS])
    ).count()
    
    # Critical open
    critical_open = db.query(Finding).filter(
        Finding.organization_id == org_id,
        Finding.severity == FindingSeverity.CRITICAL,
        Finding.status.in_([FindingStatus.OPEN, FindingStatus.ACKNOWLEDGED, FindingStatus.IN_PROGRESS])
    ).count()
    
    # High open
    high_open = db.query(Finding).filter(
        Finding.organization_id == org_id,
        Finding.severity == FindingSeverity.HIGH,
        Finding.status.in_([FindingStatus.OPEN, FindingStatus.ACKNOWLEDGED, FindingStatus.IN_PROGRESS])
    ).count()
    
    # Scans by day (last 14 days)
    scans_by_day = []
    for i in range(14):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        count = db.query(Scan).filter(
            Scan.organization_id == org_id,
            Scan.created_at >= day_start,
            Scan.created_at < day_end
        ).count()
        
        scans_by_day.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "count": count
        })
    
    scans_by_day.reverse()  # Oldest first
    
    # Findings by severity
    findings_by_severity = {}
    for severity in FindingSeverity:
        count = db.query(Finding).filter(
            Finding.organization_id == org_id,
            Finding.severity == severity,
            Finding.status.in_([FindingStatus.OPEN, FindingStatus.ACKNOWLEDGED])
        ).count()
        findings_by_severity[severity.value] = count
    
    return DashboardStats(
        total_targets=total_targets,
        total_scans_30d=scans_30d,
        active_findings=active_findings,
        critical_open=critical_open,
        high_open=high_open,
        scans_by_day=scans_by_day,
        findings_by_severity=findings_by_severity
    )

# ============================================================================
# TARGET LIST ENDPOINT
# ============================================================================

@dashboard_app.get("/api/targets")
async def list_targets(
    is_active: Optional[bool] = Query(True),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """List all targets for organization"""
    
    org_id = user["organization_id"]
    
    query = db.query(Target).filter(Target.organization_id == org_id)
    
    if is_active is not None:
        query = query.filter(Target.is_active == ("true" if is_active else "false"))
    
    query = query.order_by(Target.created_at.desc())
    targets = query.all()
    
    return [
        {
            "id": t.id,
            "domain": t.domain,
            "is_active": t.is_active == "true",
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "last_scan_at": t.last_scan_at.isoformat() if t.last_scan_at else None,
            "total_scans": db.query(Scan).filter(Scan.target_id == t.id).count()
        }
        for t in targets
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(dashboard_app, host="0.0.0.0", port=8005)
