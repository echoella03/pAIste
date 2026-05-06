from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: str = Field(default="user")  # "user" or "admin"
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)