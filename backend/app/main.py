from datetime import datetime, timezone
from html import escape
from uuid import uuid4

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import DemoRequestIn, DemoRequestOut

app = FastAPI(title="Syntrixa360 Demo Booking API", version="1.0.0")
# Exact origins only, no trailing slash (browsers send e.g. https://app.vercel.app without one).
origins = [o.strip().rstrip("/") for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "syntrixa360-demo-api"}

@app.post("/api/v1/demo-requests", response_model=DemoRequestOut, status_code=201)
async def create_demo_request(payload: DemoRequestIn, request: Request):
    # This focused MVP sends an email notification. Add persistent database storage,
    # rate limiting and a durable retry queue before production launch.
    if not settings.brevo_api_key or not settings.brevo_sender_email:
        raise HTTPException(status_code=503, detail="Demo booking email is not configured yet. Please contact support@syntrixa360.com.")

    request_id = f"DMO-{uuid4().hex[:10].upper()}"
    submitted_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    safe = {key: escape(str(value)) for key, value in payload.model_dump().items()}
    html = f"""<h2>New Syntrixa360 demo request</h2>
    <p><b>Request ID:</b> {request_id}</p><p><b>Submitted:</b> {submitted_at}</p>
    <p><b>Name:</b> {safe['name']}</p><p><b>Email:</b> {safe['email']}</p>
    <p><b>Company:</b> {safe['company']}</p><p><b>Phone:</b> {safe['phone']}</p>
    <p><b>Industry:</b> {safe['industry']}</p><p><b>Sales team size:</b> {safe['team_size']}</p>
    <p><b>Message:</b><br>{safe['message'] or 'Not provided'}</p>"""
    body = {
        "sender": {"name": settings.brevo_sender_name, "email": settings.brevo_sender_email},
        "to": [{"email": settings.demo_notification_to, "name": "Syntrixa360 Support"}],
        "replyTo": {"email": str(payload.email), "name": payload.name},
        "subject": f"New demo booking {request_id} — {payload.company}",
        "htmlContent": html,
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(settings.brevo_api_url, headers={"api-key": settings.brevo_api_key, "accept": "application/json", "content-type": "application/json"}, json=body)
        if response.status_code not in (200, 201, 202):
            raise RuntimeError(f"Brevo returned HTTP {response.status_code}")
    except Exception:
        # Do not log API keys or customer payloads. Email errors are intentionally generic to callers.
        raise HTTPException(status_code=502, detail="Your request could not be emailed right now. Please try again or contact support@syntrixa360.com.")
    return DemoRequestOut(request_id=request_id, status="email_sent", message="Your demo request was sent successfully. Our team will contact you shortly.")
