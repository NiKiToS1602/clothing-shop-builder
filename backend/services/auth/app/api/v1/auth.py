from fastapi import APIRouter, HTTPException, Response, Cookie
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError
import secrets

from app.core.redis_client import get_redis
from app.core.jwt import create_access_token, create_refresh_token
from app.core.config import settings

router = APIRouter()


class LoginIn(BaseModel):
    email: EmailStr


class ConfirmIn(BaseModel):
    email: EmailStr
    code: str


@router.post("/login/")
async def login(data: LoginIn):
    """
    Генерируем OTP код, кладём в Redis с TTL.
    Отправку email добавим позже.
    """
    redis = get_redis()
    code = f"{secrets.randbelow(1_000_000):06d}"
    await redis.set(f"otp:{data.email}", code, ex=300)  # 5 минут
    return {"ok": True}


@router.post("/confirm/")
async def confirm(data: ConfirmIn, response: Response):
    """
    Проверяем OTP в Redis.
    Если ок — выдаём access JWT и ставим refresh JWT в httpOnly cookie.
    """
    redis = get_redis()
    saved = await redis.get(f"otp:{data.email}")

    if not saved or saved.decode("utf-8") != data.code:
        raise HTTPException(status_code=400, detail="Invalid code")

    await redis.delete(f"otp:{data.email}")

    access = create_access_token(subject=data.email)
    refresh = create_refresh_token(subject=data.email)

    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=False,   # dev: False, prod: True
        samesite="lax",
        path="/",
    )

    return {"access_token": access, "token_type": "bearer"}


@router.post("/refresh/")
async def refresh(refresh_token: str | None = Cookie(default=None)):
    """
    Обновление access token по refresh token из httpOnly cookie.
    """
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        payload = jwt.decode(
            refresh_token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        subject = payload.get("sub")
        if not subject:
            raise HTTPException(status_code=401, detail="Invalid token subject")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access = create_access_token(subject=subject)
    return {"access_token": new_access, "token_type": "bearer"}
