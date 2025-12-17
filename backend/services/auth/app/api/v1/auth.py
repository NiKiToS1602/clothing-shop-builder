from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, EmailStr

from app.core.redis_client import get_redis
from app.core.jwt import create_access_token, create_refresh_token

router = APIRouter()


class LoginIn(BaseModel):
    email: EmailStr


class ConfirmIn(BaseModel):
    email: EmailStr
    code: str


@router.post("/login/")
async def login(data: LoginIn):
    redis = get_redis()
    code = "123456"  # временно фиксированный код
    await redis.set(f"otp:{data.email}", code, ex=300)
    return {"ok": True}


@router.post("/confirm/")
async def confirm(data: ConfirmIn, response: Response):
    redis = get_redis()
    saved = await redis.get(f"otp:{data.email}")

    if not saved or saved.decode() != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    await redis.delete(f"otp:{data.email}")

    access = create_access_token(subject=data.email)
    refresh = create_refresh_token(subject=data.email)

    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=False,   # позже сделаем True
        samesite="lax",
        path="/",
    )

    return {"access_token": access, "token_type": "bearer"}
