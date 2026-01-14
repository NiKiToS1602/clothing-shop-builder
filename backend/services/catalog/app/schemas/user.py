from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200, examples=["Иван Иванов"])
    email: EmailStr = Field(examples=["user@example.com"])
    role: str = Field(default="admin", min_length=2, max_length=40, examples=["admin"])
    is_active: bool = Field(default=True, examples=[True])


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200)
    email: EmailStr | None = Field(default=None)
    role: str | None = Field(default=None, min_length=2, max_length=40)
    is_active: bool | None = Field(default=None)


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True
