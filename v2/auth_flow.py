#!/usr/bin/env python3
"""ShadowSurface Auth Flow - Signup, Login, Email Verification"""
import secrets, re
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Depends, Request, Form
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field, validator, EmailStr
from sqlalchemy import create_engine, Column, String, Boolean, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

Base = declarative_base()
engine = create_engine("sqlite:///./shadowsurface.db")
SessionLocal = sessionmaker(bind=engine)

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    organization_id = Column(String(36), nullable=False)
    role = Column(String(20), default='user')
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(128))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    plan = Column(String(50), default='starter')
    stripe_customer_id = Column(String(100))
    stripe_subscription_id = Column(String(100))
    trial_ends_at = Column(DateTime)
    max_targets = Column(Integer, default=5)
    max_scans_per_month = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(engine)

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    organization_name: str = Field(..., min_length=2)
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8: raise ValueError('Min 8 chars')
        if not re.search(r'[A-Z]', v): raise ValueError('Need uppercase')
        if not re.search(r'[a-z]', v): raise ValueError('Need lowercase')
        if not re.search(r'\d', v): raise ValueError('Need digit')
        return v

app = FastAPI(title="ShadowSurface Auth")

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@app.post("/api/auth/signup")
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    org_id = secrets.token_hex(16)
    slug = re.sub(r'[^a-z0-9-]', '-', request.organization_name.lower())[:50]
    org = Organization(id=org_id, name=request.organization_name, slug=slug, plan='starter', trial_ends_at=datetime.utcnow() + timedelta(days=14), max_targets=5, max_scans_per_month=100)
    user_id = secrets.token_hex(16)
    user = User(id=user_id, email=request.email, hashed_password=secrets.token_hex(32), full_name=request.full_name, organization_id=org_id, role='admin', email_verification_token=secrets.token_urlsafe(32))
    db.add(org); db.add(user); db.commit()
    return {"success": True, "message": "Account created! Please verify your email.", "user": {"id": user_id, "email": request.email, "organization_id": org_id}, "trial": {"active": True, "days_remaining": 14}}

@app.post("/api/auth/login")
async def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": secrets.token_hex(32), "token_type": "bearer", "user": {"id": user.id, "email": user.email, "role": user.role}}

if __name__ == "__main__":
    import uvicorn; uvicorn.run(app, host="0.0.0.0", port=8002)
