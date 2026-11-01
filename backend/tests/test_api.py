
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app, limiter


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
    limiter.reset()

    # Create a clean in-memory test database.
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Do not enter TestClient as a context manager:
    # entering it would start the app lifespan and connect to the real DB.
    test_client = TestClient(app)

    try:
        yield test_client
    finally:
        test_client.close()
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


def test_image_upload_requires_authentication(client):
    response = client.post(
        "/uploads/image",
        files={
            "file": (
                "test.png",
                b"\x89PNG\r\n\x1a\nfake-image-content",
                "image/png",
            )
        },
    )

    assert response.status_code == 401



def test_image_upload_rejects_oversized_file(client):
    register_user(client, "large-image-test@example.com")
    token = login_user(client, "large-image-test@example.com").json()["access_token"]

    oversized_content = b"\x89PNG\r\n\x1a\n" + b"x" * (5 * 1024 * 1024)

    response = client.post(
        "/uploads/image",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "large.png",
                oversized_content,
                "image/png",
            )
        },
    )

    assert response.status_code == 413



def test_image_upload_rejects_fake_png(client):
    register_user(client, "fake-image-test@example.com")
    token = login_user(client, "fake-image-test@example.com").json()["access_token"]

    response = client.post(
        "/uploads/image",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "not-really-a-png.png",
                b"This is a text file, not an image.",
                "image/png",
            )
        },
    )

    assert response.status_code == 400



def test_image_upload_rejects_unsupported_format(client):
    register_user(client, "unsupported-image-test@example.com")
    token = login_user(
        client, "unsupported-image-test@example.com"
    ).json()["access_token"]

    response = client.post(
        "/uploads/image",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "animation.gif",
                b"GIF89a fake image content",
                "image/gif",
            )
        },
    )

    assert response.status_code == 400


def test_image_upload_rejects_empty_file(client):
    register_user(client, "empty-image-test@example.com")
    token = login_user(
        client, "empty-image-test@example.com"
    ).json()["access_token"]

    response = client.post(
        "/uploads/image",
        headers={"Authorization": f"Bearer {token}"},
        files={
            "file": (
                "empty.png",
                b"",
                "image/png",
            )
        },
    )

    assert response.status_code == 400


def test_image_upload_rejects_invalid_token(client):
    response = client.post(
        "/uploads/image",
        headers={"Authorization": "Bearer invalid-token"},
        files={
            "file": (
                "test.png",
                b"\x89PNG\r\n\x1a\nfake-image-content",
                "image/png",
            )
        },
    )

    assert response.status_code == 401


def test_create_report_rejects_invalid_token(client):
    response = client.post(
        "/items",
        headers={"Authorization": "Bearer invalid-token"},
        json={
            "title": "Lost student wallet",
            "description": "A black wallet was lost near the library.",
            "category": "Accessories",
            "location": "University library",
            "item_type": "lost",
            "image_url": None,
        },
    )

    assert response.status_code == 401


# ---------------------------------------------------------
# ADDITIONAL CAMPUSFIND API TESTS
# ---------------------------------------------------------


def get_token(client, email):
    """Register and log in a test user, then return their token."""
    register_response = register_user(client, email)
    assert register_response.status_code == 201

    login_response = login_user(client, email)
    assert login_response.status_code == 200

    return login_response.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


# -------------------------
# AUTHENTICATION TESTS
# -------------------------


def test_inbox_requires_authentication(client):
    response = client.get("/messages/inbox")

    assert response.status_code == 401


def test_sent_messages_require_authentication(client):
    response = client.get("/messages/sent")

    assert response.status_code == 401


def test_invalid_token_cannot_access_protected_endpoints(client):
    headers = auth_headers("invalid-token")

    inbox = client.get("/messages/inbox", headers=headers)
    sent = client.get("/messages/sent", headers=headers)
    mine = client.get("/items/mine", headers=headers)

    assert inbox.status_code == 401
    assert sent.status_code == 401
    assert mine.status_code == 401


def test_registration_rejects_invalid_email(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "not-an-email",
            "password": "CampusFindTest123!",
        },
    )

    assert response.status_code == 422


def test_registration_rejects_short_password(client):
    response = client.post(
        "/auth/register",
        json={
            "email": "short@example.com",
            "password": "123",
        },
    )

    assert response.status_code == 422


def test_login_email_is_case_insensitive(client):
    register_user(client, "student@example.com")

    response = client.post(
        "/auth/login",
        json={
            "email": "STUDENT@EXAMPLE.COM",
            "password": "CampusFindTest123!",
        },
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


# -------------------------
# LISTING TESTS
# -------------------------


def test_user_can_view_single_listing(client):
    token = get_token(client, "listing-owner@example.com")
    report = create_report(client, token).json()

    response = client.get(f"/items/{report['id']}")

    assert response.status_code == 200
    assert response.json()["id"] == report["id"]
    assert response.json()["title"] == "Test wallet"


def test_nonexistent_listing_returns_404(client):
    response = client.get("/items/99999")

    assert response.status_code == 404


def test_listing_filters_by_type(client):
    token = get_token(client, "type-filter@example.com")
    headers = auth_headers(token)

    lost_response = create_report(client, token, "Lost wallet")
    assert lost_response.status_code == 201

    found_response = client.post(
        "/items",
        headers=headers,
        json={
            "title": "Found phone",
            "description": "A phone found near the library.",
            "category": "Electronics",
            "location": "Campus library",
            "item_type": "found",
            "image_url": None,
        },
    )
    assert found_response.status_code == 201

    response = client.get("/items", params={"item_type": "found"})

    assert response.status_code == 200
    assert all(item["item_type"] == "found" for item in response.json())


def test_listing_search_finds_matching_title(client):
    token = get_token(client, "search-test@example.com")

    create_report(client, token, "Blue student wallet")

    response = client.get("/items", params={"search": "wallet"})

    assert response.status_code == 200
    assert any(
        "wallet" in item["title"].lower()
        for item in response.json()
    )


def test_listing_filter_rejects_invalid_item_type(client):
    response = client.get(
        "/items",
        params={"item_type": "stolen"},
    )

    assert response.status_code == 422


def test_listing_filter_rejects_too_long_search(client):
    response = client.get(
        "/items",
        params={"search": "x" * 101},
    )

    assert response.status_code == 422


def test_user_cannot_see_another_users_private_reports(client):
    owner_token = get_token(client, "private-owner@example.com")
    other_token = get_token(client, "private-viewer@example.com")

    report = create_report(client, owner_token).json()

    response = client.get(
        "/items/mine",
        headers=auth_headers(other_token),
    )

    assert response.status_code == 200
    assert all(item["id"] != report["id"] for item in response.json())


def test_owner_can_update_own_report(client):
    token = get_token(client, "update-owner@example.com")
    report = create_report(client, token).json()

    response = client.put(
        f"/items/{report['id']}",
        headers=auth_headers(token),
        json={
            "title": "Updated wallet",
            "description": "The wallet is black and has a student card.",
            "category": "Accessories",
            "location": "Main library",
            "item_type": "lost",
            "image_url": None,
        },
    )

    assert response.status_code == 200
    assert response.json()["title"] == "Updated wallet"
    assert response.json()["location"] == "Main library"


def test_owner_can_delete_own_report(client):
    token = get_token(client, "delete-owner@example.com")
    report = create_report(client, token).json()

    response = client.delete(
        f"/items/{report['id']}",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Report deleted successfully."

    missing = client.get(f"/items/{report['id']}")
    assert missing.status_code == 404


def test_user_cannot_delete_nonexistent_report(client):
    token = get_token(client, "delete-missing@example.com")

    response = client.delete(
        "/items/99999",
        headers=auth_headers(token),
    )

    assert response.status_code == 404


def test_item_creation_rejects_invalid_item_type(client):
    token = get_token(client, "invalid-type@example.com")

    response = client.post(
        "/items",
        headers=auth_headers(token),
        json={
            "title": "Test item",
            "description": "A description for testing.",
            "category": "Accessories",
            "location": "Library",
            "item_type": "stolen",
            "image_url": None,
        },
    )

    assert response.status_code == 422


def test_item_creation_rejects_too_short_title(client):
    token = get_token(client, "short-title@example.com")

    response = client.post(
        "/items",
        headers=auth_headers(token),
        json={
            "title": "AB",
            "description": "A description for testing.",
            "category": "Accessories",
            "location": "Library",
            "item_type": "lost",
            "image_url": None,
        },
    )

    assert response.status_code == 422


# -------------------------
# MESSAGING TESTS
# -------------------------


def create_message(client, sender_token, item_id, content="Hello, I think this is mine."):
    return client.post(
        f"/items/{item_id}/messages",
        headers=auth_headers(sender_token),
        json={"content": content},
    )


def test_user_can_send_message_to_listing_owner(client):
    owner_token = get_token(client, "message-owner@example.com")
    sender_token = get_token(client, "message-sender@example.com")

    report = create_report(client, owner_token).json()

    response = create_message(
        client,
        sender_token,
        report["id"],
    )

    assert response.status_code == 201
    assert response.json()["content"] == "Hello, I think this is mine."
    assert response.json()["sender_email"] == "message-sender@example.com"
    assert response.json()["recipient_email"] == "message-owner@example.com"
    assert response.json()["is_read"] is False


def test_message_sending_requires_authentication(client):
    owner_token = get_token(client, "message-auth-owner@example.com")
    report = create_report(client, owner_token).json()

    response = client.post(
        f"/items/{report['id']}/messages",
        json={"content": "Hello"},
    )

    assert response.status_code == 401


def test_user_cannot_message_themselves(client):
    token = get_token(client, "self-message@example.com")
    report = create_report(client, token).json()

    response = create_message(client, token, report["id"])

    assert response.status_code == 400


def test_user_cannot_message_closed_listing(client):
    owner_token = get_token(client, "closed-owner@example.com")
    sender_token = get_token(client, "closed-sender@example.com")

    report = create_report(client, owner_token).json()

    close_response = client.patch(
        f"/items/{report['id']}/status",
        headers=auth_headers(owner_token),
        json={"status": "resolved"},
    )
    assert close_response.status_code == 200

    response = create_message(client, sender_token, report["id"])

    assert response.status_code == 404


def test_message_to_nonexistent_listing_returns_404(client):
    sender_token = get_token(client, "missing-listing-sender@example.com")

    response = create_message(client, sender_token, 99999)

    assert response.status_code == 404


def test_message_rejects_whitespace_only_content(client):
    owner_token = get_token(client, "blank-owner@example.com")
    sender_token = get_token(client, "blank-sender@example.com")

    report = create_report(client, owner_token).json()

    response = create_message(
        client,
        sender_token,
        report["id"],
        "     ",
    )

    assert response.status_code == 422


def test_message_rejects_content_over_2000_characters(client):
    owner_token = get_token(client, "long-owner@example.com")
    sender_token = get_token(client, "long-sender@example.com")

    report = create_report(client, owner_token).json()

    response = create_message(
        client,
        sender_token,
        report["id"],
        "x" * 2001,
    )

    assert response.status_code == 422


def test_recipient_can_view_received_message_in_inbox(client):
    owner_token = get_token(client, "inbox-owner@example.com")
    sender_token = get_token(client, "inbox-sender@example.com")

    report = create_report(client, owner_token).json()
    sent = create_message(client, sender_token, report["id"]).json()

    response = client.get(
        "/messages/inbox",
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == sent["id"]
    assert response.json()[0]["sender_email"] == "inbox-sender@example.com"


def test_sender_can_view_sent_message(client):
    owner_token = get_token(client, "sent-owner@example.com")
    sender_token = get_token(client, "sent-sender@example.com")

    report = create_report(client, owner_token).json()
    sent = create_message(client, sender_token, report["id"]).json()

    response = client.get(
        "/messages/sent",
        headers=auth_headers(sender_token),
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == sent["id"]
    assert response.json()[0]["recipient_email"] == "sent-owner@example.com"


def test_unrelated_user_cannot_view_another_users_inbox(client):
    owner_token = get_token(client, "inbox-private-owner@example.com")
    sender_token = get_token(client, "inbox-private-sender@example.com")
    unrelated_token = get_token(client, "inbox-unrelated@example.com")

    report = create_report(client, owner_token).json()
    create_message(client, sender_token, report["id"])

    response = client.get(
        "/messages/inbox",
        headers=auth_headers(unrelated_token),
    )

    assert response.status_code == 200
    assert response.json() == []


def test_unrelated_user_cannot_view_another_users_sent_messages(client):
    owner_token = get_token(client, "sent-private-owner@example.com")
    sender_token = get_token(client, "sent-private-sender@example.com")
    unrelated_token = get_token(client, "sent-unrelated@example.com")

    report = create_report(client, owner_token).json()
    create_message(client, sender_token, report["id"])

    response = client.get(
        "/messages/sent",
        headers=auth_headers(unrelated_token),
    )

    assert response.status_code == 200
    assert response.json() == []


def test_recipient_can_mark_message_as_read(client):
    owner_token = get_token(client, "read-owner@example.com")
    sender_token = get_token(client, "read-sender@example.com")

    report = create_report(client, owner_token).json()
    sent = create_message(client, sender_token, report["id"]).json()

    response = client.patch(
        f"/messages/{sent['id']}/read",
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 200
    assert response.json()["is_read"] is True


def test_sender_cannot_mark_own_message_as_read(client):
    owner_token = get_token(client, "read-private-owner@example.com")
    sender_token = get_token(client, "read-private-sender@example.com")

    report = create_report(client, owner_token).json()
    sent = create_message(client, sender_token, report["id"]).json()

    response = client.patch(
        f"/messages/{sent['id']}/read",
        headers=auth_headers(sender_token),
    )

    assert response.status_code == 404


def test_unrelated_user_cannot_mark_message_as_read(client):
    owner_token = get_token(client, "read-unrelated-owner@example.com")
    sender_token = get_token(client, "read-unrelated-sender@example.com")
    unrelated_token = get_token(client, "read-unrelated-user@example.com")

    report = create_report(client, owner_token).json()
    sent = create_message(client, sender_token, report["id"]).json()

    response = client.patch(
        f"/messages/{sent['id']}/read",
        headers=auth_headers(unrelated_token),
    )

    assert response.status_code == 404


def test_marking_nonexistent_message_as_read_returns_404(client):
    token = get_token(client, "read-missing@example.com")

    response = client.patch(
        "/messages/99999/read",
        headers=auth_headers(token),
    )

    assert response.status_code == 404


# -------------------------
# IMAGE UPLOAD TESTS
# -------------------------


def test_valid_png_upload_returns_image_url(client, monkeypatch):
    token = get_token(client, "valid-upload@example.com")

    # Mock Cloudinary so this test never makes a real external upload.
    monkeypatch.setattr(
        "app.main.upload_image",
        lambda image_file: "https://example.com/test-image.png",
    )

    response = client.post(
        "/uploads/image",
        headers=auth_headers(token),
        files={
            "file": (
                "test.png",
                b"\x89PNG\r\n\x1a\n" + b"test-image-data",
                "image/png",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["image_url"] == "https://example.com/test-image.png"


def test_image_upload_returns_502_when_cloudinary_fails(client, monkeypatch):
    token = get_token(client, "failed-upload@example.com")

    def failed_upload(image_file):
        raise Exception("Simulated upload failure")

    monkeypatch.setattr(
        "app.main.upload_image",
        failed_upload,
    )

    response = client.post(
        "/uploads/image",
        headers=auth_headers(token),
        files={
            "file": (
                "test.png",
                b"\x89PNG\r\n\x1a\n" + b"test-image-data",
                "image/png",
            )
        },
    )

    assert response.status_code == 502
    assert response.json()["detail"] == (
        "Image upload failed. Please try again."
    )

    # ---------------------------------------------------------
# SMART MATCHING TESTS
# ---------------------------------------------------------


def test_matching_engine_gives_high_score_to_similar_items():
    from app.matching import calculate_match
    from types import SimpleNamespace
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)

    lost = SimpleNamespace(
        title="Black leather wallet",
        description="Black leather wallet containing a student ID card.",
        category="Accessories",
        location="Campus library",
        created_at=now,
    )

    found = SimpleNamespace(
        title="Black leather wallet found",
        description="Found a black leather wallet with a student ID card.",
        category="Accessories",
        location="Campus library",
        created_at=now,
    )

    result = calculate_match(lost, found)

    assert result["score"] >= 80
    assert "Same category" in result["reasons"]
    assert "Same location" in result["reasons"]


def test_matching_engine_gives_low_score_to_unrelated_items():
    from app.matching import calculate_match
    from types import SimpleNamespace
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)

    lost = SimpleNamespace(
        title="Black leather wallet",
        description="A black wallet containing a student ID card.",
        category="Accessories",
        location="Campus library",
        created_at=now,
    )

    found = SimpleNamespace(
        title="Silver mobile phone",
        description="A silver smartphone found near the sports ground.",
        category="Electronics",
        location="Sports ground",
        created_at=now,
    )

    result = calculate_match(lost, found)

    assert result["score"] < 15


def test_matching_endpoint_returns_ranked_found_items(client):
    owner_token = get_token(client, "matching-owner@example.com")
    first_token = get_token(client, "matching-first@example.com")
    second_token = get_token(client, "matching-second@example.com")

    lost_report = client.post(
        "/items",
        headers=auth_headers(owner_token),
        json={
            "title": "Black leather wallet",
            "description": "Black wallet containing a student ID card.",
            "category": "Accessories",
            "location": "Campus library",
            "item_type": "lost",
            "image_url": None,
        },
    ).json()

    matching_report = client.post(
        "/items",
        headers=auth_headers(first_token),
        json={
            "title": "Black leather wallet found",
            "description": "Found black wallet with student ID card.",
            "category": "Accessories",
            "location": "Campus library",
            "item_type": "found",
            "image_url": None,
        },
    ).json()

    unrelated_report = client.post(
        "/items",
        headers=auth_headers(second_token),
        json={
            "title": "Silver mobile phone",
            "description": "A smartphone found near the sports ground.",
            "category": "Electronics",
            "location": "Sports ground",
            "item_type": "found",
            "image_url": None,
        },
    ).json()

    response = client.get(
        f"/items/{lost_report['id']}/matches",
        headers=auth_headers(owner_token),
    )

    assert response.status_code == 200

    results = response.json()

    assert len(results) == 1
    assert results[0]["item"]["id"] == matching_report["id"]
    assert results[0]["score"] >= 80

    assert all(
        result["item"]["id"] != unrelated_report["id"]
        for result in results
    )


def test_matching_endpoint_requires_authentication(client):
    response = client.get("/items/1/matches")

    assert response.status_code == 401


def test_user_cannot_request_matches_for_another_users_report(client):
    owner_token = get_token(client, "match-private-owner@example.com")
    other_token = get_token(client, "match-private-other@example.com")

    report = create_report(client, owner_token).json()

    response = client.get(
        f"/items/{report['id']}/matches",
        headers=auth_headers(other_token),
    )

    assert response.status_code == 404


def test_matching_endpoint_rejects_found_item_report(client):
    token = get_token(client, "match-found-owner@example.com")

    found_report = client.post(
        "/items",
        headers=auth_headers(token),
        json={
            "title": "Found phone",
            "description": "A phone found near the library.",
            "category": "Electronics",
            "location": "Campus library",
            "item_type": "found",
            "image_url": None,
        },
    ).json()

    response = client.get(
        f"/items/{found_report['id']}/matches",
        headers=auth_headers(token),
    )

    assert response.status_code == 400


def test_matching_endpoint_rejects_resolved_lost_report(client):
    token = get_token(client, "match-resolved-owner@example.com")
    report = create_report(client, token).json()

    client.patch(
        f"/items/{report['id']}/status",
        headers=auth_headers(token),
        json={"status": "resolved"},
    )

    response = client.get(
        f"/items/{report['id']}/matches",
        headers=auth_headers(token),
    )

    assert response.status_code == 400


def test_matching_endpoint_excludes_own_found_reports(client):
    token = get_token(client, "match-own-reports@example.com")

    lost_report = create_report(client, token).json()

    client.post(
        "/items",
        headers=auth_headers(token),
        json={
            "title": "Black wallet",
            "description": "A black wallet found near the library.",
            "category": "Accessories",
            "location": "Campus library",
            "item_type": "found",
            "image_url": None,
        },
    )

    response = client.get(
        f"/items/{lost_report['id']}/matches",
        headers=auth_headers(token),
    )

    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------
# RECOVERY WORKFLOW, STATUS HISTORY & NOTIFICATION TESTS
# ---------------------------------------------------------


def test_owner_can_move_report_to_recovery_pending(client):
    owner_token = get_token(client, "recovery-owner@example.com")
    report = create_report(client, owner_token).json()

    response = client.patch(
        f"/items/{report['id']}/status",
        headers=auth_headers(owner_token),
        json={
            "status": "recovery_pending",
            "note": "Arranging to collect the item.",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "recovery_pending"


def test_recovery_pending_report_can_be_resolved(client):
    token = get_token(client, "recovery-resolve@example.com")
    report = create_report(client, token).json()
    headers = auth_headers(token)

    pending = client.patch(
        f"/items/{report['id']}/status",
        headers=headers,
        json={"status": "recovery_pending"},
    )
    assert pending.status_code == 200

    resolved = client.patch(
        f"/items/{report['id']}/status",
        headers=headers,
        json={"status": "resolved"},
    )

    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved"


def test_recovery_pending_report_can_be_reopened(client):
    token = get_token(client, "recovery-reopen@example.com")
    report = create_report(client, token).json()
    headers = auth_headers(token)

    client.patch(
        f"/items/{report['id']}/status",
        headers=headers,
        json={"status": "recovery_pending"},
    )

    response = client.patch(
        f"/items/{report['id']}/status",
        headers=headers,
        json={
            "status": "open",
            "note": "The handover could not be completed.",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "open"


def test_status_change_creates_history_record(client):
    token = get_token(client, "history-owner@example.com")
    report = create_report(client, token).json()
    headers = auth_headers(token)

    response = client.patch(
        f"/items/{report['id']}/status",
        headers=headers,
        json={
            "status": "recovery_pending",
            "note": "Contacted the finder.",
        },
    )
    assert response.status_code == 200

    history_response = client.get(
        f"/items/{report['id']}/status-history",
        headers=headers,
    )

    assert history_response.status_code == 200

    history = history_response.json()
    assert len(history) == 1
    assert history[0]["item_id"] == report["id"]
    assert history[0]["changed_by"] is not None
    assert history[0]["old_status"] == "open"
    assert history[0]["new_status"] == "recovery_pending"
    assert history[0]["note"] == "Contacted the finder."
    assert history[0]["created_at"] is not None


def test_same_status_does_not_create_history(client):
    token = get_token(client, "history-noop@example.com")
    report = create_report(client, token).json()
    headers = auth_headers(token)

    response = client.patch(
        f"/items/{report['id']}/status",
        headers=headers,
        json={"status": "open"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "open"

    history = client.get(
        f"/items/{report['id']}/status-history",
        headers=headers,
    )

    assert history.status_code == 200
    assert history.json() == []


def test_only_owner_can_view_status_history(client):
    owner_token = get_token(client, "history-private-owner@example.com")
    other_token = get_token(client, "history-private-other@example.com")

    report = create_report(client, owner_token).json()

    response = client.get(
        f"/items/{report['id']}/status-history",
        headers=auth_headers(other_token),
    )

    assert response.status_code == 403


def test_status_history_requires_authentication(client):
    token = get_token(client, "history-auth@example.com")
    report = create_report(client, token).json()

    response = client.get(
        f"/items/{report['id']}/status-history"
    )

    assert response.status_code == 401


def test_status_change_notifies_message_sender(client):
    owner_token = get_token(client, "notification-owner@example.com")
    sender_token = get_token(client, "notification-sender@example.com")

    report = create_report(client, owner_token).json()

    message = create_message(
        client,
        sender_token,
        report["id"],
    )
    assert message.status_code == 201

    update = client.patch(
        f"/items/{report['id']}/status",
        headers=auth_headers(owner_token),
        json={"status": "recovery_pending"},
    )

    assert update.status_code == 200

    notifications = client.get(
        "/notifications",
        headers=auth_headers(sender_token),
    )

    assert notifications.status_code == 200
    assert len(notifications.json()) == 1

    notification = notifications.json()[0]

    assert notification["user_id"] is not None
    assert notification["item_id"] == report["id"]
    assert notification["title"] == "Report status updated"
    assert "recovery pending" in notification["message"]
    assert notification["is_read"] is False


def test_status_change_does_not_notify_report_owner(client):
    owner_token = get_token(client, "notification-owner-only@example.com")
    sender_token = get_token(client, "notification-sender-only@example.com")

    report = create_report(client, owner_token).json()
    create_message(client, sender_token, report["id"])

    client.patch(
        f"/items/{report['id']}/status",
        headers=auth_headers(owner_token),
        json={"status": "recovery_pending"},
    )

    owner_notifications = client.get(
        "/notifications",
        headers=auth_headers(owner_token),
    )

    assert owner_notifications.status_code == 200
    assert owner_notifications.json() == []


def test_notification_unread_count_and_mark_as_read(client):
    owner_token = get_token(client, "notification-count-owner@example.com")
    sender_token = get_token(client, "notification-count-sender@example.com")

    report = create_report(client, owner_token).json()
    create_message(client, sender_token, report["id"])

    client.patch(
        f"/items/{report['id']}/status",
        headers=auth_headers(owner_token),
        json={"status": "recovery_pending"},
    )

    headers = auth_headers(sender_token)

    count_before = client.get(
        "/notifications/unread-count",
        headers=headers,
    )

    assert count_before.status_code == 200
    assert count_before.json()["unread_count"] == 1

    notification = client.get(
        "/notifications",
        headers=headers,
    ).json()[0]

    marked = client.patch(
        f"/notifications/{notification['id']}/read",
        headers=headers,
    )

    assert marked.status_code == 200
    assert marked.json()["is_read"] is True

    count_after = client.get(
        "/notifications/unread-count",
        headers=headers,
    )

    assert count_after.status_code == 200
    assert count_after.json()["unread_count"] == 0


def test_user_cannot_mark_another_users_notification_as_read(client):
    owner_token = get_token(client, "notification-private-owner@example.com")
    sender_token = get_token(client, "notification-private-sender@example.com")
    other_token = get_token(client, "notification-private-other@example.com")

    report = create_report(client, owner_token).json()
    create_message(client, sender_token, report["id"])

    client.patch(
        f"/items/{report['id']}/status",
        headers=auth_headers(owner_token),
        json={"status": "recovery_pending"},
    )

    notification = client.get(
        "/notifications",
        headers=auth_headers(sender_token),
    ).json()[0]

    response = client.patch(
        f"/notifications/{notification['id']}/read",
        headers=auth_headers(other_token),
    )

    assert response.status_code == 403


def test_notifications_require_authentication(client):
    notifications = client.get("/notifications")
    count = client.get("/notifications/unread-count")

    assert notifications.status_code == 401
    assert count.status_code == 401


def test_same_status_does_not_create_notifications(client):
    owner_token = get_token(client, "notification-noop-owner@example.com")
    sender_token = get_token(client, "notification-noop-sender@example.com")

    report = create_report(client, owner_token).json()
    create_message(client, sender_token, report["id"])

    response = client.patch(
        f"/items/{report['id']}/status",
        headers=auth_headers(owner_token),
        json={"status": "open"},
    )

    assert response.status_code == 200

    notifications = client.get(
        "/notifications",
        headers=auth_headers(sender_token),
    )

    assert notifications.status_code == 200
    assert notifications.json() == []
