#!/usr/bin/env python3
"""
ShadowSurface Email Verification Enforcement
Mandatory email verification for security and spam prevention
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import redis.asyncio as redis
import secrets
from sqlalchemy import create_engine, Column, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Config
JWT_SECRET = secrets.token_urlsafe(32)  # In production: from env
ALGORITHM = "HS256"

Base = declarative_base()
engine = create_engine("sqlite:///./shadowsurface.db")
SessionLocal = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(128))
    email_verification_sent_at = Column(DateTime)
    verification_attempts = Column(String(10), default="0")  # Count as string for SQLite
    last_verification_attempt = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    account_locked_until = Column(DateTime)  # Lock if spam

Base.metadata.create_all(engine)

# Redis
redis_client: Optional[redis.Redis] = None

async def get_redis():
    global redis_client
    if redis_client is None:
        redis_client = redis.Redis(host='localhost', port=6379, db=2, decode_responses=True)
    return redis_client

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

security = HTTPBearer()

class EmailVerificationService:
    """Mandatory email verification with anti-spam measures"""
    
    MAX_VERIFICATION_ATTEMPTS = 5  # Max attempts before lockout
    LOCKOUT_DURATION_HOURS = 24
    VERIFICATION_TOKEN_EXPIRY_HOURS = 24
    RESEND_COOLDOWN_MINUTES = 10
    
    def __init__(self, db: Session):
        self.db = db
    
    async def generate_verification_token(self, user_id: str) -> str:
        """Generate secure verification token with rate limiting"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check for lockout
        if user.account_locked_until and datetime.utcnow() < user.account_locked_until:
            remaining = (user.account_locked_until - datetime.utcnow()).total_seconds() // 3600
            raise HTTPException(
                status_code=429,
                detail=f"Account locked due to excessive attempts. Try again in {int(remaining)} hours."
            )
        
        # Check cooldown
        if user.last_verification_attempt:
            cooldown_end = user.last_verification_attempt + timedelta(minutes=self.RESEND_COOLDOWN_MINUTES)
            if datetime.utcnow() < cooldown_end:
                remaining = (cooldown_end - datetime.utcnow()).total_seconds() // 60
                raise HTTPException(
                    status_code=429,
                    detail=f"Please wait {int(remaining)} minutes before requesting another verification email."
                )
        
        # Check attempt count
        attempts = int(user.verification_attempts or 0)
        if attempts >= self.MAX_VERIFICATION_ATTEMPTS:
            # Lock account
            user.account_locked_until = datetime.utcnow() + timedelta(hours=self.LOCKOUT_DURATION_HOURS)
            self.db.commit()
            raise HTTPException(
                status_code=429,
                detail=f"Maximum verification attempts exceeded. Account locked for {self.LOCKOUT_DURATION_HOURS} hours. Contact support."
            )
        
        # Generate token
        token = secrets.token_urlsafe(32)
        
        # Update user
        user.email_verification_token = token
        user.verification_attempts = str(attempts + 1)
        user.email_verification_sent_at = datetime.utcnow()
        user.last_verification_attempt = datetime.utcnow()
        self.db.commit()
        
        # Store in Redis for additional validation
        r = await get_redis()
        await r.setex(
            f"verify_token:{token}",
            self.VERIFICATION_TOKEN_EXPIRY_HOURS * 3600,
            user_id
        )
        
        return token
    
    async def verify_email(self, token: str) -> bool:
        """Verify email with token - returns True if successful"""
        # Check Redis first
        r = await get_redis()
        user_id = await r.get(f"verify_token:{token}")
        
        if not user_id:
            # Token expired or invalid
            raise HTTPException(status_code=400, detail="Invalid or expired verification link")
        
        # Find user
        user = self.db.query(User).filter(
            User.id == user_id,
            User.email_verification_token == token
        ).first()
        
        if not user:
            raise HTTPException(status_code=400, detail="Invalid verification link")
        
        # Mark as verified
        user.email_verified = True
        user.email_verification_token = None
        user.verification_attempts = "0"
        user.account_locked_until = None
        self.db.commit()
        
        # Delete Redis key
        await r.delete(f"verify_token:{token}")
        
        return True
    
    def require_verified(self, user_id: str):
        """Check if user email is verified - raises exception if not"""
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.email_verified:
            raise HTTPException(
                status_code=403,
                detail={
                    "message": "Email verification required",
                    "verified": False,
                    "resend_url": "/api/auth/resend-verification",
                    "expires_at": (user.email_verification_sent_at + timedelta(hours=24)).isoformat() if user.email_verification_sent_at else None
                }
            )
        
        return True
    
    def get_verification_status(self, user_id: str) -> dict:
        """Get verification status for user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            return {"error": "User not found"}
        
        return {
            "verified": user.email_verified,
            "attempts_remaining": self.MAX_VERIFICATION_ATTEMPTS - int(user.verification_attempts or 0),
            "locked": user.account_locked_until is not None and datetime.utcnow() < user.account_locked_until,
            "lockout_expires": user.account_locked_until.isoformat() if user.account_locked_until else None
        }


# FastAPI dependency for verified email check
async def require_verified_email(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> str:
    """Dependency that requires verified email - blocks unverified users"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check verification
        service = EmailVerificationService(db)
        service.require_verified(user_id)
        
        return user_id
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")


# FastAPI app
def create_protected_routes(app):
    """Add protected routes to existing app"""
    
    @app.post("/api/auth/resend-verification")
    async def resend_verification(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ):
        """Resend verification email with rate limiting"""
        token = credentials.credentials
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            email = payload.get("email")
            
            service = EmailVerificationService(db)
            new_token = await service.generate_verification_token(user_id)
            
            # Send email (implement with actual email service)
            verification_url = f"https://shadowsurface.io/verify-email?token={new_token}"
            print(f"[EMAIL] Resending verification to {email}: {verification_url}")
            
            return {
                "success": True,
                "message": "Verification email sent. Check your inbox (and spam folder).",
                "cooldown_minutes": service.RESEND_COOLDOWN_MINUTES
            }
            
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid authentication")
    
    @app.get("/api/auth/verification-status")
    async def verification_status(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ):
        """Get current verification status"""
        token = credentials.credentials
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            
            service = EmailVerificationService(db)
            return service.get_verification_status(user_id)
            
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid authentication")
    
    # Example protected route - requires verified email
    @app.post("/api/scans/start")
    async def start_scan(
        user_id: str = Depends(require_verified_email),  # This blocks unverified users!
        db: Session = Depends(get_db)
    ):
        """Start a scan - requires verified email"""
        return {
            "success": True,
            "message": "Scan started",
            "user_id": user_id
        }
    
    @app.post("/api/targets/add")
    async def add_target(
        user_id: str = Depends(require_verified_email),  # This blocks unverified users!
        db: Session = Depends(get_db)
    ):
        """Add target - requires verified email"""
        return {
            "success": True,
            "message": "Target added",
            "user_id": user_id
        }


# Middleware to check verification on all protected routes
class VerificationMiddleware:
    """Middleware to enforce email verification on sensitive operations"""
    
    PROTECTED_PATHS = [
        "/api/scans/",
        "/api/targets/",
        "/api/webhooks/",
        "/api/billing/change-plan",
        "/api/settings/",
    ]
    
    EXEMPT_PATHS = [
        "/api/auth/",
        "/api/public/",
        "/api/demo/",
        "/health",
        "/docs",
    ]
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, request: Request, call_next):
        path = request.url.path
        
        # Check if path is protected
        is_protected = any(path.startswith(p) for p in self.PROTECTED_PATHS)
        is_exempt = any(path.startswith(p) for p in self.EXEMPT_PATHS)
        
        if is_protected and not is_exempt:
            # Check for Authorization header
            auth = request.headers.get("authorization")
            if auth and auth.startswith("Bearer "):
                token = auth.replace("Bearer ", "")
                
                try:
                    payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
                    user_id = payload.get("sub")
                    
                    if user_id:
                        # Get DB session and check verification
                        db = SessionLocal()
                        try:
                            service = EmailVerificationService(db)
                            user = db.query(User).filter(User.id == user_id).first()
                            
                            if user and not user.email_verified:
                                return JSONResponse(
                                    status_code=403,
                                    content={
                                        "error": "Email verification required",
                                        "verified": False,
                                        "resend_url": "/api/auth/resend-verification",
                                        "message": "Please verify your email to access this feature"
                                    }
                                )
                        finally:
                            db.close()
                            
                except JWTError:
                    pass  # Let the endpoint handle auth errors
        
        response = await call_next(request)
        return response


if __name__ == "__main__":
    print("Email Verification Enforcement Module")
    print("=====================================")
    print("Features:")
    print("  ✓ Mandatory email verification for sensitive operations")
    print("  ✓ Rate limiting on verification attempts")
    print("  ✓ Account lockout for spam prevention")
    print("  ✓ 10-minute cooldown between resends")
    print("  ✓ 24-hour token expiry")
    print("")
    print("Protected operations (require verified email):")
    print("  - Starting scans")
    print("  - Adding targets")
    print("  - Configuring webhooks")
    print("  - Changing billing plans")
