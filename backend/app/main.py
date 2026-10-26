
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app import models
from app.models import Item
from app.schemas import ItemCreate, ItemRead


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


@app.post(
    "/items",
    response_model=ItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_item(payload: ItemCreate, db: DbSession):
    item = Item(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        location=payload.location,
        item_type=payload.item_type,
        image_url=(
            str(payload.image_url) if payload.image_url else None
        ),
        status="open",
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@app.get("/items/{item_id}", response_model=ItemRead)
def get_item(item_id: int, db: DbSession):
    item = db.get(Item, item_id)

    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    return item
