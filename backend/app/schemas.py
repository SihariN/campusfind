
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


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
    title: str
    description: str
    category: str
    status: str
    location: str
    item_type: str
    image_url: str | None
    created_at: datetime
