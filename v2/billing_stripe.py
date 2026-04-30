#!/usr/bin/env python3
"""ShadowSurface Stripe Billing Integration"""
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

PLAN_LIMITS = {
    "starter": {"max_targets": 5, "max_scans_per_month": 100, "name": "Starter"},
    "professional": {"max_targets": 20, "max_scans_per_month": 500, "name": "Professional"},
    "enterprise": {"max_targets": 999999, "max_scans_per_month": 999999, "name": "Enterprise"}
}

billing_app = FastAPI(title="ShadowSurface Billing")

@billing_app.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except: raise HTTPException(status_code=400, detail="Invalid")
    
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        print(f"[STRIPE] Checkout completed for {session.get('customer_email')}")
    elif event["type"] == "invoice.payment_succeeded":
        print(f"[STRIPE] Payment succeeded")
    elif event["type"] == "invoice.payment_failed":
        print(f"[STRIPE] Payment failed")
    elif event["type"] == "customer.subscription.deleted":
        print(f"[STRIPE] Subscription cancelled")
    return JSONResponse(content={"received": True})

@billing_app.get("/pricing-config")
async def get_pricing_config():
    return {"publishable_key": os.environ.get("STRIPE_PUBLISHABLE_KEY",""),"plans":{plan:{"name":config["name"],"limits":config} for plan,config in PLAN_LIMITS.items()},"trial_days":14}

if __name__ == "__main__":
    import uvicorn; uvicorn.run(billing_app, host="0.0.0.0", port=8003)
