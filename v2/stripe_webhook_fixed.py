#!/usr/bin/env python3
"""
Stripe Webhook Handler - FIXED with real DB updates
Handles checkout completion, subscription events, plan assignment
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import stripe
from sqlalchemy import create_engine, Column, String, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Stripe config
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

# Database setup
Base = declarative_base()
engine = create_engine(os.environ.get("DATABASE_URL", "sqlite:///shadowsurface.db"))
SessionLocal = sessionmaker(bind=engine)

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255))
    slug = Column(String(100))
    plan = Column(String(50), default="starter")
    stripe_customer_id = Column(String(100))
    stripe_subscription_id = Column(String(100))
    trial_ends_at = Column(DateTime)
    max_targets = Column(Integer, default=5)
    max_scans_per_month = Column(Integer, default=100)
    created_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True)
    organization_id = Column(String(36))
    role = Column(String(20), default="admin")

# Plan limits mapping
PLAN_LIMITS = {
    "starter": {
        "max_targets": 5,
        "max_scans_per_month": 100,
        "features": ["basic_scanning", "email_alerts"]
    },
    "professional": {
        "max_targets": 20,
        "max_scans_per_month": 500,
        "features": ["advanced_scanning", "api_access", "webhooks", "sso"]
    },
    "enterprise": {
        "max_targets": 999999,  # Unlimited
        "max_scans_per_month": 999999,
        "features": ["unlimited", "custom_integrations", "dedicated_manager", "sla"]
    }
}

# Initialize DB
Base.metadata.create_all(engine)

app = FastAPI(title="Stripe Webhooks")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_plan_from_price(price_id: str) -> str:
    """Map Stripe price ID to plan name"""
    price_map = {
        os.environ.get("STRIPE_STARTER_MONTHLY_PRICE_ID"): "starter",
        os.environ.get("STRIPE_STARTER_YEARLY_PRICE_ID"): "starter",
        os.environ.get("STRIPE_PRO_MONTHLY_PRICE_ID"): "professional",
        os.environ.get("STRIPE_PRO_YEARLY_PRICE_ID"): "professional",
        os.environ.get("STRIPE_ENT_MONTHLY_PRICE_ID"): "enterprise",
    }
    return price_map.get(price_id, "starter")

@app.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events with REAL DB UPDATES"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    event_type = event["type"]
    data_object = event["data"]["object"]
    
    # FIXED: Real DB operations for each event
    if event_type == "checkout.session.completed":
        await handle_checkout_completed(data_object, db)
    
    elif event_type == "invoice.payment_succeeded":
        await handle_payment_succeeded(data_object, db)
    
    elif event_type == "invoice.payment_failed":
        await handle_payment_failed(data_object, db)
    
    elif event_type == "customer.subscription.updated":
        await handle_subscription_updated(data_object, db)
    
    elif event_type == "customer.subscription.deleted":
        await handle_subscription_deleted(data_object, db)
    
    return JSONResponse(content={"received": True})

async def handle_checkout_completed(session: dict, db: Session):
    """FIXED: Update organization with real plan and limits"""
    
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    email = session.get("customer_email") or session.get("metadata", {}).get("email")
    
    # Get subscription to find plan
    subscription = stripe.Subscription.retrieve(subscription_id)
    price_id = subscription["items"]["data"][0]["price"]["id"]
    plan_name = get_plan_from_price(price_id)
    
    # Find or create organization
    org = db.query(Organization).filter(
        Organization.billing_email == email
    ).first()
    
    if org:
        # FIXED: Real plan assignment
        limits = PLAN_LIMITS[plan_name]
        
        org.plan = plan_name
        org.stripe_customer_id = customer_id
        org.stripe_subscription_id = subscription_id
        org.max_targets = limits["max_targets"]
        org.max_scans_per_month = limits["max_scans_per_month"]
        org.trial_ends_at = None  # End trial immediately on payment
        org.updated_at = datetime.utcnow()
        
        db.commit()
        print(f"[STRIPE] Organization {org.id} upgraded to {plan_name}")
        
        # Send welcome email for paid plan
        await send_plan_welcome_email(email, plan_name, limits)
    else:
        print(f"[STRIPE] Warning: No organization found for {email}")

async def handle_subscription_updated(subscription: dict, db: Session):
    """FIXED: Handle plan changes (upgrade/downgrade)"""
    
    subscription_id = subscription.get("id")
    status = subscription.get("status")
    
    # Find organization
    org = db.query(Organization).filter(
        Organization.stripe_subscription_id == subscription_id
    ).first()
    
    if not org:
        return
    
    # Get new plan from price
    if subscription["items"]["data"]:
        price_id = subscription["items"]["data"][0]["price"]["id"]
        new_plan = get_plan_from_price(price_id)
        
        if new_plan != org.plan:
            # FIXED: Update limits on plan change
            limits = PLAN_LIMITS[new_plan]
            
            org.plan = new_plan
            org.max_targets = limits["max_targets"]
            org.max_scans_per_month = limits["max_scans_per_month"]
            org.updated_at = datetime.utcnow()
            
            db.commit()
            print(f"[STRIPE] Organization {org.id} plan changed to {new_plan}")
            
            # Send plan change notification
            await send_plan_change_email(org.billing_email, new_plan, limits)

async def handle_subscription_deleted(subscription: dict, db: Session):
    """FIXED: Downgrade to free/starter when subscription ends"""
    
    subscription_id = subscription.get("id")
    
    org = db.query(Organization).filter(
        Organization.stripe_subscription_id == subscription_id
    ).first()
    
    if org:
        # FIXED: Downgrade to starter plan
        org.plan = "starter"
        org.stripe_subscription_id = None
        org.max_targets = 5
        org.max_scans_per_month = 100
        org.updated_at = datetime.utcnow()
        
        db.commit()
        print(f"[STRIPE] Organization {org.id} downgraded to starter (subscription ended)")
        
        await send_subscription_ended_email(org.billing_email)

async def handle_payment_succeeded(invoice: dict, db: Session):
    """Handle successful payment"""
    subscription_id = invoice.get("subscription")
    
    if subscription_id:
        org = db.query(Organization).filter(
            Organization.stripe_subscription_id == subscription_id
        ).first()
        
        if org:
            print(f"[STRIPE] Payment succeeded for {org.id}")
            # Could mark last_payment_successful timestamp

async def handle_payment_failed(invoice: dict, db: Session):
    """Handle failed payment - alert but don't disable immediately"""
    subscription_id = invoice.get("subscription")
    attempt_count = invoice.get("attempt_count", 0)
    
    if subscription_id:
        org = db.query(Organization).filter(
            Organization.stripe_subscription_id == subscription_id
        ).first()
        
        if org:
            print(f"[STRIPE] Payment failed for {org.id} (attempt {attempt_count})")
            # Send payment failure email
            await send_payment_failed_email(org.billing_email, attempt_count)

# Email helpers (implement with actual email service)
async def send_plan_welcome_email(email: str, plan: str, limits: dict):
    print(f"[EMAIL] Welcome to {plan} plan for {email}")

async def send_plan_change_email(email: str, plan: str, limits: dict):
    print(f"[EMAIL] Plan changed to {plan} for {email}")

async def send_subscription_ended_email(email: str):
    print(f"[EMAIL] Subscription ended for {email}")

async def send_payment_failed_email(email: str, attempt: int):
    print(f"[EMAIL] Payment failed (attempt {attempt}) for {email}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
