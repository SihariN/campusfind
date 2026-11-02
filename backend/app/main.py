
from contextlib import asynccontextmanager
from io import BytesIO
from typing import Annotated

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Query,
    status,
    File,
    UploadFile,
    Request,
)
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import select, text, func, or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.database import Base, engine, get_db
from app import models
from app.models import Item, User, Message, StatusHistory
from app.schemas import (
    ItemCreate,
    ItemRead,
    UserCreate,
    UserRead,
    UserLogin,
    TokenResponse,
    ItemStatusUpdate,
    MessageCreate,
    MessageRead,
    StatusHistoryRead,
    NotificationRead,
    UserProfileRead,
    UserProfileUpdate,
    ChangePasswordRequest
)
from app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_admin
)
from app.cloudinary_service import upload_image, upload_profile_picture
from app.matching import calculate_match
from datetime import datetime, timedelta, timezone

# ---------------------------------------------------------
# APPLICATION SETUP
# ---------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="CampusFind API",
    description="API for the CampusFind lost-and-found platform",
    version="0.3.0",
    lifespan=lifespan,
)

limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DbSession = Annotated[Session, Depends(get_db)]


# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------

def message_response(db, message):
    sender = db.get(User, message.sender_id)
    recipient = db.get(User, message.recipient_id)

    return {
        "id": message.id,
        "item_id": message.item_id,
        "sender_id": message.sender_id,
        "recipient_id": message.recipient_id,
        "sender_email": sender.email if sender else None,
        "recipient_email": recipient.email if recipient else None,
        "content": message.content,
        "is_read": message.is_read,
        "created_at": message.created_at,
    }


# ---------------------------------------------------------
# GENERAL ENDPOINTS
# ---------------------------------------------------------

@app.get("/")
def root():
    return {"message": "Welcome to CampusFind API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# ---------------------------------------------------------
# ADMIN DASHBOARD
# ---------------------------------------------------------

@app.get("/admin/dashboard/stats")
def get_admin_dashboard_stats(
    db: DbSession,
    current_admin: Annotated[
        User,
        Depends(get_current_admin),
    ],
):
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

    total_users = db.scalar(
        select(func.count(User.id))
    ) or 0

    total_lost_reports = db.scalar(
        select(func.count(Item.id)).where(
            Item.item_type == "lost"
        )
    ) or 0

    total_found_reports = db.scalar(
        select(func.count(Item.id)).where(
            Item.item_type == "found"
        )
    ) or 0

    open_reports = db.scalar(
        select(func.count(Item.id)).where(
            Item.status == "open"
        )
    ) or 0

    recovery_pending_reports = db.scalar(
        select(func.count(Item.id)).where(
            Item.status == "recovery_pending"
        )
    ) or 0

    resolved_reports = db.scalar(
        select(func.count(Item.id)).where(
            Item.status == "resolved"
        )
    ) or 0

    recent_reports = db.scalar(
        select(func.count(Item.id)).where(
            Item.created_at >= seven_days_ago
        )
    ) or 0

    recent_users = db.scalar(
        select(func.count(User.id)).where(
            User.created_at >= seven_days_ago
        )
    ) or 0

    return {
        "total_users": total_users,
        "total_lost_reports": total_lost_reports,
        "total_found_reports": total_found_reports,
        "open_reports": open_reports,
        "recovery_pending_reports": recovery_pending_reports,
        "resolved_reports": resolved_reports,
        "recent_reports": recent_reports,
        "recent_users": recent_users,
    }



# ---------------------------------------------------------
# ADMIN LISTING MANAGEMENT
# ---------------------------------------------------------

@app.get("/admin/listings")
def get_admin_listings(
    db: DbSession,
    current_admin: Annotated[
        User,
        Depends(get_current_admin),
    ],
    item_type: str | None = Query(
        default=None,
        pattern="^(lost|found)$",
    ),
    item_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(open|recovery_pending|resolved)$",
    ),
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
):
    statement = select(Item)

    if item_type:
        statement = statement.where(
            Item.item_type == item_type
        )

    if item_status:
        statement = statement.where(
            Item.status == item_status
        )

    if search:
        pattern = f"%{search}%"

        statement = statement.where(
            Item.title.ilike(pattern)
            | Item.description.ilike(pattern)
            | Item.location.ilike(pattern)
        )

    total = db.scalar(
        select(func.count()).select_from(
            statement.subquery()
        )
    ) or 0

    statement = (
        statement
        .order_by(Item.created_at.desc(), Item.id.desc())
        .offset(skip)
        .limit(limit)
    )

    items = db.scalars(statement).all()

    results = []

    for item in items:
        owner = db.get(User, item.user_id) if item.user_id else None

        results.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "category": item.category,
            "item_type": item.item_type,
            "status": item.status,
            "location": item.location,
            "image_url": item.image_url,
            "created_at": item.created_at,
            "user_id": item.user_id,
            "owner_email": owner.email if owner else None,
            "owner_name": owner.full_name if owner else None,
            "is_removed": item.is_removed,
            "removed_by": item.removed_by,
            "removed_at": item.removed_at,
            "removal_reason": item.removal_reason,
        })

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "listings": results,
    }

@app.delete("/admin/listings/{item_id}")
def remove_admin_listing(
    item_id: int,
    db: DbSession,
    current_admin: Annotated[
        User,
        Depends(get_current_admin),
    ],
    reason: str = Query(..., min_length=5, max_length=500),
):
    item = db.get(Item, item_id)

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found.",
        )

    if item.is_removed:
        raise HTTPException(
            status_code=400,
            detail="This listing has already been removed.",
        )

    clean_reason = reason.strip()

    if len(clean_reason) < 5:
        raise HTTPException(
            status_code=422,
            detail="Please provide a removal reason of at least 5 characters.",
        )

    item.is_removed = True
    item.removed_by = current_admin.id
    item.removed_at = datetime.now(timezone.utc)
    item.removal_reason = clean_reason

    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not remove listing.",
        )

    return {
        "message": "Listing removed successfully.",
        "item_id": item.id,
        "removed_by": current_admin.id,
        "removed_at": item.removed_at,
        "reason": item.removal_reason,
    }

@app.get("/admin/users")
def get_admin_users(
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
    role: str | None = None,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    query = db.query(User)

    # Search by name or email
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
            )
        )

    # Filter by role
    if role:
        if role not in ["user", "admin"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid role filter.",
            )

        query = query.filter(User.role == role)

    total = query.count()

    users = (
        query
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = []

    for user in users:
        lost_reports = db.query(Item).filter(
            Item.user_id == user.id,
            Item.item_type == "lost",
        ).count()

        found_reports = db.query(Item).filter(
            Item.user_id == user.id,
            Item.item_type == "found",
        ).count()

        results.append({
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "profile_picture_url": user.profile_picture_url,
            "created_at": user.created_at,
            "total_reports": lost_reports + found_reports,
            "lost_reports": lost_reports,
            "found_reports": found_reports,
        })

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "users": results,
    }


@app.patch("/admin/users/{user_id}/role")
def update_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    # Validate the requested role
    if new_role not in ["user", "admin"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be either 'user' or 'admin'.",
        )

    # Prevent administrators from changing their own role
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot change your own administrator role.",
        )

    # Find the target user
    target_user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    # Prevent demotion of the last administrator
    if target_user.role == "admin" and new_role == "user":
        admin_count = db.query(User).filter(
            User.role == "admin"
        ).count()

        if admin_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="The last administrator cannot be demoted.",
            )

    # Update the role
    target_user.role = new_role

    try:
        db.commit()
        db.refresh(target_user)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update user role.",
        )

    return {
        "message": "User role updated successfully.",
        "user_id": target_user.id,
        "email": target_user.email,
        "role": target_user.role,
    }
# ---------------------------------------------------------
# ADMIN RECENT ACTIVITY
# ---------------------------------------------------------

@app.get("/admin/dashboard/activity")
def get_admin_recent_activity(
    db: DbSession,
    current_admin: Annotated[
        User,
        Depends(get_current_admin),
    ],
    limit: int = Query(default=15, ge=1, le=50),
):
    activities = []

    # Recent user registrations
    recent_users = db.scalars(
        select(User)
        .order_by(User.created_at.desc())
        .limit(limit)
    ).all()

    for user in recent_users:
        activities.append({
            "type": "user_registered",
            "title": "New user registered",
            "description": (
                f"{user.full_name or user.email} joined CampusFind."
            ),
            "created_at": user.created_at,
            "user_id": user.id,
        })

    # Recent lost and found reports
    recent_items = db.scalars(
        select(Item)
        .order_by(Item.created_at.desc())
        .limit(limit)
    ).all()

    for item in recent_items:
        activities.append({
            "type": "listing_created",
            "title": "New listing created",
            "description": (
                f'"{item.title}" was reported as a '
                f'{item.item_type} item.'
            ),
            "created_at": item.created_at,
            "item_id": item.id,
        })

    # Recent status changes
    recent_changes = db.scalars(
        select(StatusHistory)
        .order_by(StatusHistory.created_at.desc())
        .limit(limit)
    ).all()

    for change in recent_changes:
        activities.append({
            "type": "status_changed",
            "title": "Listing status updated",
            "description": (
                f"Listing #{change.item_id} changed from "
                f"{change.old_status} to {change.new_status}."
            ),
            "created_at": change.created_at,
            "item_id": change.item_id,
            "user_id": change.changed_by,
            "note": change.note,
        })

    # Combine and sort all activity types
    activities.sort(
        key=lambda activity: activity["created_at"],
        reverse=True,
    )

    return {
        "total": len(activities),
        "activities": activities[:limit],
    }


@app.get("/admin/me")
def get_admin_profile(
    current_admin: Annotated[
        User,
        Depends(get_current_admin),
    ],
):
    return {
        "message": "Admin access verified.",
        "id": current_admin.id,
        "email": current_admin.email,
        "role": current_admin.role,
    }

@app.get("/db-check")
def database_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"database": "connected"}


# ---------------------------------------------------------
# LIST AND SEARCH ITEMS
# ---------------------------------------------------------

@app.get("/items", response_model=list[ItemRead])
def list_items(
    db: DbSession,
    item_type: str | None = Query(
        default=None,
        pattern="^(lost|found)$",
    ),
    category: str | None = Query(default=None, max_length=50),
    search: str | None = Query(default=None, max_length=100),
):
    statement = select(Item).where(
    Item.status == "open",
    Item.is_removed.is_(False),
    )

    if item_type:
        statement = statement.where(Item.item_type == item_type)

    if category:
        statement = statement.where(Item.category.ilike(category))

    if search:
        pattern = f"%{search}%"
        statement = statement.where(
            Item.title.ilike(pattern)
            | Item.description.ilike(pattern)
        )

    statement = statement.order_by(Item.created_at.desc())

    return db.scalars(statement).all()


# ---------------------------------------------------------
# SMART MATCHING
# ---------------------------------------------------------

@app.get("/items/{item_id}/matches")
def get_item_matches(
    item_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    item = db.get(Item, item_id)

    if item is None or item.is_removed:
        raise HTTPException(
        status_code=404,
        detail="Item not found.",
    )

    # Return 404 to avoid revealing another user's report.
    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Item not found.",
        )

    if item.item_type != "lost":
        raise HTTPException(
            status_code=400,
            detail="Matching is available for lost reports only.",
        )

    if item.status != "open":
        raise HTTPException(
            status_code=400,
            detail="Matching is available for open reports only.",
        )

    statement = (
        select(Item)
        .where(
            Item.item_type == "found",
            Item.status == "open",
            Item.is_removed.is_(False),
            Item.user_id != current_user.id,
        )
    )

    found_items = db.scalars(statement).all()

    matches = []

    for found_item in found_items:
        match_result = calculate_match(item, found_item)

        score = match_result["score"]
        reasons = match_result["reasons"]

        if score >= 15:
            matches.append({
                "item": ItemRead.model_validate(found_item).model_dump(),
                "score": score,
                "reasons": reasons,
            })

    matches.sort(
        key=lambda match: match["score"],
        reverse=True,
    )

    return matches


# ---------------------------------------------------------
# IMAGE UPLOAD
# ---------------------------------------------------------

@app.post("/uploads/image")
async def upload_item_image(
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed.",
        )

    contents = await file.read(5 * 1024 * 1024 + 1)

    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be 5 MB or smaller.",
        )

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    is_jpeg = contents.startswith(b"\xff\xd8\xff")
    is_png = contents.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = (
        contents.startswith(b"RIFF")
        and contents[8:12] == b"WEBP"
    )

    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(
            status_code=400,
            detail="The file is not a valid JPEG, PNG, or WebP image.",
        )

    try:
        image_url = upload_image(BytesIO(contents))
        return {"image_url": image_url}

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Image upload failed. Please try again.",
        )


# ---------------------------------------------------------
# CREATE ITEM
# ---------------------------------------------------------

@app.post(
    "/items",
    response_model=ItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_item(
    payload: ItemCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    item = Item(
        title=payload.title,
        user_id=current_user.id,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        item_type=payload.item_type,
        image_url=str(payload.image_url) if payload.image_url else None,
        status="open",
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


# ---------------------------------------------------------
# GET MY ITEMS
# ---------------------------------------------------------

@app.get("/items/mine", response_model=list[ItemRead])
def get_my_items(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    statement = (
        select(Item)
        .where(Item.user_id == current_user.id)
        .order_by(Item.created_at.desc())
    )

    return db.scalars(statement).all()


# ---------------------------------------------------------
# GET SINGLE ITEM
# ---------------------------------------------------------

@app.get("/items/{item_id}", response_model=ItemRead)
def get_item(item_id: int, db: DbSession):
    item = db.get(Item, item_id)

    if item is None or item.is_removed:
        raise HTTPException(
            status_code=404,
            detail="Item not found.",
        )

    return item


# ---------------------------------------------------------
# MESSAGING
# ---------------------------------------------------------

@app.post(
    "/items/{item_id}/messages",
    response_model=MessageRead,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    item_id: int,
    payload: MessageCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    content = payload.content.strip()

    if not content:
        raise HTTPException(
            status_code=422,
            detail="Message cannot be empty.",
        )

    item = db.get(Item, item_id)

    if item is None or item.status != "open":
        raise HTTPException(
            status_code=404,
            detail="Open listing not found.",
        )

    if item.user_id is None:
        raise HTTPException(
            status_code=400,
            detail="This listing has no associated reporter.",
        )

    if item.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot message yourself.",
        )

    message = Message(
        item_id=item.id,
        sender_id=current_user.id,
        recipient_id=item.user_id,
        content=content,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message_response(db, message)


@app.get("/messages/inbox", response_model=list[MessageRead])
def get_inbox(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    statement = (
        select(Message)
        .where(Message.recipient_id == current_user.id)
        .order_by(Message.created_at.desc())
    )

    messages = db.scalars(statement).all()

    return [
        message_response(db, message)
        for message in messages
    ]


@app.get("/messages/sent", response_model=list[MessageRead])
def get_sent_messages(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    statement = (
        select(Message)
        .where(Message.sender_id == current_user.id)
        .order_by(Message.created_at.desc())
    )

    messages = db.scalars(statement).all()

    return [
        message_response(db, message)
        for message in messages
    ]


@app.patch(
    "/messages/{message_id}/read",
    response_model=MessageRead,
)
def mark_message_read(
    message_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    message = db.get(Message, message_id)

    if message is None or message.recipient_id != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Message not found.",
        )

    message.is_read = True

    db.commit()
    db.refresh(message)

    return message_response(db, message)


# ---------------------------------------------------------
# AUTHENTICATION
# ---------------------------------------------------------

@app.post(
    "/auth/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/hour")
def register_user(
    request: Request,
    payload: UserCreate,
    db: DbSession,
):
    email = str(payload.email).strip().lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    user = User(
        email=email,
        hashed_password=hash_password(
            payload.password.get_secret_value()
        ),
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    return user


@app.post("/auth/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login_user(
    request: Request,
    payload: UserLogin,
    db: DbSession,
):
    email = str(payload.email).strip().lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    password = payload.password.get_secret_value()

    if user is None or not verify_password(
        password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
    }



# ---------------------------------------------------------
# USER PROFILE
# ---------------------------------------------------------

@app.get("/users/me", response_model=UserProfileRead)
def get_my_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@app.patch("/users/me", response_model=UserProfileRead)
def update_my_profile(
    profile_data: UserProfileUpdate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    update_data = profile_data.model_dump(exclude_unset=True)

    if "full_name" in update_data:
        full_name = update_data["full_name"]

        if full_name is not None:
            full_name = full_name.strip()

            if len(full_name) < 2:
                raise HTTPException(
                    status_code=422,
                    detail="Name must contain at least 2 characters.",
                )

        current_user.full_name = full_name

    db.commit()
    db.refresh(current_user)

    return current_user

# ---------------------------------------------------------
# PROFILE PICTURE
# ---------------------------------------------------------

@app.post("/users/me/profile-picture", response_model=UserProfileRead)
async def upload_my_profile_picture(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed.",
        )

    contents = await file.read()

    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image must be smaller than 5 MB.",
        )

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Please select an image.",
        )

    # Verify the actual image signature.
    is_jpeg = contents.startswith(b"\xff\xd8\xff")
    is_png = contents.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = (
        len(contents) >= 12
        and contents.startswith(b"RIFF")
        and contents[8:12] == b"WEBP"
    )

    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid JPEG, PNG, or WebP image.",
        )

    try:
        image_url = upload_profile_picture(BytesIO(contents))

        current_user.profile_picture_url = image_url

        db.commit()
        db.refresh(current_user)

        return current_user

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not upload profile picture. Please try again.",
        )


@app.delete("/users/me/profile-picture", response_model=UserProfileRead)
def remove_my_profile_picture(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    current_user.profile_picture_url = None

    db.commit()
    db.refresh(current_user)

    return current_user

# ---------------------------------------------------------
# CHANGE PASSWORD
# ---------------------------------------------------------

@app.patch("/users/me/change-password")
def change_my_password(
    password_data: ChangePasswordRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    # Verify the current password.
    if not verify_password(
        password_data.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    # Prevent reusing the current password.
    if verify_password(
        password_data.new_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from your current password.",
        )

    # Hash and save the new password.
    current_user.hashed_password = hash_password(
        password_data.new_password
    )

    db.commit()

    return {
        "message": "Password changed successfully."
    }


# ---------------------------------------------------------
# UPDATE ITEM
# ---------------------------------------------------------

@app.put("/items/{item_id}", response_model=ItemRead)
def update_item(
    item_id: int,
    item_data: ItemCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    item = db.get(Item, item_id)

    if item is None or item.user_id != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    update_data = item_data.model_dump()

    if update_data.get("image_url") is not None:
        update_data["image_url"] = str(update_data["image_url"])

    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    return item


# ---------------------------------------------------------
# DELETE ITEM
# ---------------------------------------------------------

@app.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    item = db.get(Item, item_id)

    if item is None or item.user_id != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    db.delete(item)
    db.commit()

    return {"message": "Report deleted successfully."}


# ---------------------------------------------------------
# RECOVERY WORKFLOW / STATUS UPDATE
# ---------------------------------------------------------

@app.patch("/items/{item_id}/status", response_model=ItemRead)
def update_item_status(
    item_id: int,
    status_data: ItemStatusUpdate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    item = db.get(Item, item_id)

    if item is None or item.user_id != current_user.id:
        raise HTTPException(
            status_code=404,
            detail="Report not found.",
        )

    old_status = item.status
    new_status = status_data.status

    allowed_transitions = {
        "open": ["recovery_pending", "resolved"],
        "recovery_pending": ["open", "resolved"],
        "resolved": ["open"],
    }

    if new_status == old_status:
        return item

    if new_status not in allowed_transitions.get(old_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from {old_status} to {new_status}.",
        )

    history = models.StatusHistory(
        item_id=item.id,
        changed_by=current_user.id,
        old_status=old_status,
        new_status=new_status,
        note=status_data.note.strip() if status_data.note else None,
    )

    db.add(history)

    item.status = new_status

    participants = (
        db.query(Message.sender_id)
        .filter(Message.item_id == item.id)
        .distinct()
        .all()
    )

    notification_message = (
        f'The status of "{item.title}" changed from '
        f"{old_status.replace('_', ' ')} to "
        f"{new_status.replace('_', ' ')}."
    )

    for participant in participants:
        participant_id = participant[0]

        if participant_id == current_user.id:
            continue

        notification = models.Notification(
            user_id=participant_id,
            item_id=item.id,
            title="Report status updated",
            message=notification_message,
        )

        db.add(notification)

    db.commit()
    db.refresh(item)

    return item


# ---------------------------------------------------------
# STATUS HISTORY
# ---------------------------------------------------------

@app.get(
    "/items/{item_id}/status-history",
    response_model=list[StatusHistoryRead],
)
def get_status_history(
    item_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    item = db.get(Item, item_id)

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found.",
        )

    if item.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only view the history of your own reports.",
        )

    return (
        db.query(models.StatusHistory)
        .filter(models.StatusHistory.item_id == item_id)
        .order_by(models.StatusHistory.created_at.desc())
        .all()
    )


# ---------------------------------------------------------
# NOTIFICATIONS
# ---------------------------------------------------------

@app.get(
    "/notifications",
    response_model=list[NotificationRead],
)
def get_notifications(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


@app.get("/notifications/unread-count")
def get_unread_notification_count(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    count = (
        db.query(models.Notification)
        .filter(
            models.Notification.user_id == current_user.id,
            models.Notification.is_read.is_(False),
        )
        .count()
    )

    return {"unread_count": count}


@app.patch(
    "/notifications/{notification_id}/read",
    response_model=NotificationRead,
)
def mark_notification_as_read(
    notification_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    notification = db.get(models.Notification, notification_id)

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot update another user's notification.",
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification
