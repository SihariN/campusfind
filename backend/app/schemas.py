
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, SecretStr, EmailStr


class ItemCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=5, max_length=2000)
    category: str = Field(min_length=2, max_length=50)
    location: str = Field(min_length=2, max_length=120)
    item_type: Literal["lost", "found"]
    image_url: HttpUrl | None = None


class ItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None = None
    title: str
    description: str
    category: str
    status: str
    location: str
    item_type: str
    image_url: str | None
    created_at: datetime
    
class UserCreate(BaseModel):
    email: EmailStr
    password: SecretStr = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime


class UserProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None = None
    profile_picture_url: str | None = None
    created_at: datetime


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)
    
class UserLogin(BaseModel):
    email: EmailStr
    password: SecretStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    

class ItemStatusUpdate(BaseModel):
    status: Literal["open", "recovery_pending", "resolved"]
    note: str | None = Field(default=None, max_length=500)


class StatusHistoryRead(BaseModel):
    id: int
    item_id: int
    changed_by: int
    old_status: str
    new_status: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationRead(BaseModel):
    id: int
    user_id: int
    item_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}



class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)



class MessageRead(BaseModel):
    id: int
    item_id: int
    sender_id: int
    recipient_id: int
    sender_email: str | None = None
    recipient_email: str | None = None
    content: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
