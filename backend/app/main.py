
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app import models
from app.models import Item, User
from app.schemas import ItemCreate, ItemRead, UserCreate, UserRead, UserLogin, TokenResponse, ItemStatusUpdate
from sqlalchemy.exc import IntegrityError
from app.auth import hash_password, verify_password, create_access_token, get_current_user

from app.cloudinary_service import upload_image

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="CampusFind API",
    description="API for the CampusFind lost-and-found platform",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DbSession = Annotated[Session, Depends(get_db)]


@app.get("/")
def root():
    return {"message": "Welcome to CampusFind API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/db-check")
def database_check():
    from sqlalchemy import text

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {"database": "connected"}


@app.get("/items", response_model=list[ItemRead])
def list_items(
    db: DbSession,
    item_type: str | None = Query(
        default=None, pattern="^(lost|found)$"
    ),
    category: str | None = Query(default=None, max_length=50),
    search: str | None = Query(default=None, max_length=100),
):
    statement = select(Item).where(Item.status == "open")

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


@app.post("/uploads/image")
async def upload_item_image(
    current_user: Annotated[User, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}

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

    # Check the actual file signature, not just its claimed MIME type.
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
        from io import BytesIO

        image_url = upload_image(BytesIO(contents))
        return {"image_url": image_url}
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Image upload failed. Please try again.",
        )


@app.post("/items", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
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

@app.get("/items/{item_id}", response_model=ItemRead)
def get_item(item_id: int, db: DbSession):
    item = db.get(Item, item_id)

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    return item

@app.post(
    "/auth/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def register_user(payload: UserCreate, db: DbSession):
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
def login_user(payload: UserLogin, db: DbSession):
    email = str(payload.email).strip().lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    password = payload.password.get_secret_value()

    if user is None or not verify_password(
        password, user.hashed_password
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

    # Convert Pydantic HttpUrl to a regular string for PostgreSQL.
    if update_data.get("image_url") is not None:
        update_data["image_url"] = str(update_data["image_url"])

    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    return item



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

    item.status = status_data.status
    db.commit()
    db.refresh(item)

    return item
