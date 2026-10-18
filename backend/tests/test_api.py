import httpx
import pytest
from fastapi.testclient import TestClient

from app import main
from app.config import settings

client = TestClient(main.app)

VALID = {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "company": "Acme Industries",
    "phone": "+91 98765 43210",
    "industry": "wholesale",
    "team_size": "4-10",
    "message": "<script>alert(1)</script>",
}


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_validation_rejects_bad_email_and_phone():
    r = client.post("/api/v1/demo-requests", json={**VALID, "email": "nope", "phone": "abc"})
    assert r.status_code == 422


def test_503_when_brevo_not_configured(monkeypatch):
    monkeypatch.setattr(settings, "brevo_api_key", "")
    monkeypatch.setattr(settings, "brevo_sender_email", "")
    r = client.post("/api/v1/demo-requests", json=VALID)
    assert r.status_code == 503


class _FakeClient:
    status = 201
    sent = None

    def __init__(self, *a, **k):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def post(self, url, headers=None, json=None):
        _FakeClient.sent = json
        return httpx.Response(_FakeClient.status)


def _configure(monkeypatch, status):
    monkeypatch.setattr(settings, "brevo_api_key", "test-key")
    monkeypatch.setattr(settings, "brevo_sender_email", "sender@example.com")
    _FakeClient.status = status
    monkeypatch.setattr(main.httpx, "AsyncClient", _FakeClient)


def test_success_and_html_escaping(monkeypatch):
    _configure(monkeypatch, 201)
    r = client.post("/api/v1/demo-requests", json=VALID)
    assert r.status_code == 201
    assert r.json()["status"] == "email_sent"
    html = _FakeClient.sent["htmlContent"]
    assert "<script>" not in html and "&lt;script&gt;" in html


def test_502_when_brevo_rejects(monkeypatch):
    _configure(monkeypatch, 401)
    r = client.post("/api/v1/demo-requests", json=VALID)
    assert r.status_code == 502
    assert "test-key" not in r.text


@pytest.mark.parametrize("origin,allowed", [("http://localhost:5173", True), ("https://evil.example", False)])
def test_cors(origin, allowed):
    r = client.options(
        "/api/v1/demo-requests",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"},
    )
    assert ("access-control-allow-origin" in r.headers) == allowed
