from pydantic import BaseModel, Field, EmailStr


class LoginIn(BaseModel):
    email: EmailStr = Field(examples=["user@example.com"])


class ConfirmIn(BaseModel):
    email: EmailStr = Field(examples=["user@example.com"])
    code: str = Field(min_length=6, max_length=6, examples=["123456"])


class TokenOut(BaseModel):
    access_token: str = Field(examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."])
    token_type: str = Field(examples=["bearer"])
