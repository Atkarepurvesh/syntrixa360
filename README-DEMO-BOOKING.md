# Syntrixa360 Marketing + Book Demo + Brevo Email

This package keeps the marketing frontend and adds a small FastAPI email-notification backend.

1. Start backend using `backend/README.md`.
2. Configure Brevo sender verification and `.env` before testing submission.
3. Start frontend with `VITE_API_URL=http://localhost:8000/api/v1`.
4. Submit the Book a Demo form. On successful Brevo API acceptance, the UI shows success and notification goes to `support@syntrixa360.com`.

Important: this first version sends an email but does not save bookings in a database. Production readiness requires persistent storage, anti-spam/rate limiting and retry queue.
