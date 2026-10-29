
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    user_id: Mapped[int | None] = mapped_column(
    ForeignKey("users.id"),
    nullable=True,
    )

    owner: Mapped["User | None"] = relationship()

    title: Mapped[str] = mapped_column(
        String(120), nullable=False
    )

    description: Mapped[str] = mapped_column(
        Text, nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="open"
    )

    location: Mapped[str] = mapped_column(
        String(120), nullable=False
    )

    item_type: Mapped[str] = mapped_column(
        String(10), nullable=False
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )

    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id"),
        nullable=False,
        index=True,
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    recipient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_read: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )