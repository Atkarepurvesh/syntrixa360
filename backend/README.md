# Syntrixa360 Demo Booking API (FastAPI + Brevo)

## What this does
- Accepts demo requests at `POST /api/v1/demo-requests`.
- Validates name, email, company, phone, industry, team size and message.
- Sends an email notification to `support@syntrixa360.com` through the Brevo transactional email API.
- Includes a generated request ID in the notification.
- Does **not** yet persist bookings to a database; add PostgreSQL storage, rate limiting/CAPTCHA, durable retries and monitoring before production.

## Local setup (Windows PowerShell)
1. Install Python 3.11+.
2. From the `backend` directory, create a venv:
   `py -m venv .venv`
3. Activate it: `\.venv\Scripts\Activate.ps1`
4. Install: `python -m pip install -r requirements.txt`
5. Copy `.env.example` to `.env` and set `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`.
6. In Brevo, verify your sender/domain and configure its required DNS records. Use an email address that Brevo permits as a verified sender.
7. Start: `uvicorn app.main:app --reload --port 8000`
8. Check `http://localhost:8000/health` and `http://localhost:8000/docs`.

## Frontend setup
In `frontend/.env.example`, copy values to `frontend/.env` if needed. `VITE_API_URL=http://localhost:8000/api/v1`.
Run `npm install` then `npm run dev` from `frontend`.

## Brevo settings
- `BREVO_API_KEY`: secret, backend only. Never use a `VITE_` prefix.
- `BREVO_SENDER_EMAIL`: verified sender address/domain.
- `DEMO_NOTIFICATION_TO`: notification recipient, defaults to `support@syntrixa360.com`.

## Production checklist
- Deploy API on HTTPS and set exact production frontend origin in `CORS_ORIGINS`.
- Set secrets in hosting provider environment variables; never commit `.env`.
- Add PostgreSQL persistence before claiming bookings are stored.
- Add rate limiting and CAPTCHA/honeypot, request size limits, durable email retry/outbox, health monitoring and privacy/retention policy.
- Test real submission and check Brevo logs, inbox and spam folder.
