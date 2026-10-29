
from fastapi.testclient import TestClient

from app.main import app, limiter
from test_api import client as test_client_fixture


def test_login_rate_limit(test_client_fixture):
    limiter.reset()

    responses = [
        test_client_fixture.post(
            "/auth/login",
            json={
                "email": "ratelimit-test@example.com",
                "password": "DefinitelyWrongPassword123!",
            },
        )
        for _ in range(6)
    ]

    assert [r.status_code for r in responses[:5]] == [401] * 5
    assert responses[5].status_code == 429

    limiter.reset()


def test_registration_rate_limit(test_client_fixture):
    limiter.reset()

    responses = [
        test_client_fixture.post(
            "/auth/register",
            json={
                "email": f"ratelimit-test-{i}@example.com",
                "password": "CampusFindTest123!",
            },
        )
        for i in range(6)
    ]

    assert [r.status_code for r in responses[:5]] == [201] * 5
    assert responses[5].status_code == 429

    limiter.reset()
