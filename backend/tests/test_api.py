
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db


# A separate in-memory database used only for testing.
TEST_DATABASE_URL = "sqlite://"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture
def client():
    # Create a clean database for each test.
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Do not use TestClient as a context manager here:
    # we don't want the app lifespan to create tables
    # in your real PostgreSQL database.
    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def register_user(client, email):
    return client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "CampusFindTest123!",
        },
    )


def login_user(client, email):
    return client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "CampusFindTest123!",
        },
    )


def create_report(client, token, title="Test wallet"):
    return client.post(
        "/items",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": title,
            "description": "A wallet reported for testing.",
            "category": "Accessories",
            "location": "Campus library",
            "item_type": "lost",
            "image_url": None,
        },
    )


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Welcome to CampusFind API"


def test_register_user(client):
    response = register_user(client, "student@example.com")

    assert response.status_code == 201
    assert response.json()["email"] == "student@example.com"
    assert "hashed_password" not in response.json()


def test_duplicate_registration_is_rejected(client):
    register_user(client, "student@example.com")

    response = register_user(client, "student@example.com")

    assert response.status_code == 409


def test_login_returns_access_token(client):
    register_user(client, "student@example.com")

    response = login_user(client, "student@example.com")

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["token_type"] == "bearer"


def test_wrong_password_is_rejected(client):
    register_user(client, "student@example.com")

    response = client.post(
        "/auth/login",
        json={
            "email": "student@example.com",
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401


def test_create_report_requires_authentication(client):
    response = client.post(
        "/items",
        json={
            "title": "Lost keys",
            "description": "Keys near the lecture hall.",
            "category": "Accessories",
            "location": "Lecture hall",
            "item_type": "lost",
            "image_url": None,
        },
    )

    assert response.status_code == 401


def test_user_can_create_and_view_own_report(client):
    register_user(client, "student@example.com")
    token = login_user(client, "student@example.com").json()["access_token"]

    created = create_report(client, token)

    assert created.status_code == 201
    report = created.json()
    assert report["title"] == "Test wallet"
    assert report["status"] == "open"

    mine = client.get(
        "/items/mine",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert mine.status_code == 200
    assert any(item["id"] == report["id"] for item in mine.json())


def test_user_can_resolve_and_reopen_own_report(client):
    register_user(client, "student@example.com")
    token = login_user(client, "student@example.com").json()["access_token"]
    report = create_report(client, token).json()

    headers = {"Authorization": f"Bearer {token}"}

    resolved = client.patch(
        f"/items/{report['id']}/status",
        headers=headers,
        json={"status": "resolved"},
    )

    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"

    reopened = client.patch(
        f"/items/{report['id']}/status",
        headers=headers,
        json={"status": "open"},
    )

    assert reopened.status_code == 200
    assert reopened.json()["status"] == "open"


def test_user_cannot_modify_another_users_report(client):
    register_user(client, "owner@example.com")
    register_user(client, "other@example.com")

    owner_token = login_user(
        client, "owner@example.com"
    ).json()["access_token"]

    other_token = login_user(
        client, "other@example.com"
    ).json()["access_token"]

    report = create_report(client, owner_token).json()
    other_headers = {"Authorization": f"Bearer {other_token}"}

    update = client.put(
        f"/items/{report['id']}",
        headers=other_headers,
        json={
            "title": "Changed title",
            "description": "Trying to change another user's report.",
            "category": "Accessories",
            "location": "Campus library",
            "item_type": "lost",
            "image_url": None,
        },
    )

    delete = client.delete(
        f"/items/{report['id']}",
        headers=other_headers,
    )

    resolve = client.patch(
        f"/items/{report['id']}/status",
        headers=other_headers,
        json={"status": "resolved"},
    )

    assert update.status_code == 404
    assert delete.status_code == 404
    assert resolve.status_code == 404


def test_invalid_status_is_rejected(client):
    register_user(client, "student@example.com")
    token = login_user(client, "student@example.com").json()["access_token"]
    report = create_report(client, token).json()

    response = client.patch(
        f"/items/{report['id']}/status",
        headers={"Authorization": f"Bearer {token}"},
        json={"status": "pending"},
    )

    assert response.status_code == 422
