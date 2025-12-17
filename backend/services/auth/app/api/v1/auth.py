from fastapi import APIRouter, HTTPException, Response, Cookie
from pydantic import BaseModel, EmailStr
from jose import jwt, JWTError

from app.core.jwt import create_access_token, create_refresh_token
from app.core.config import settings
from app.core.email_sender import send_otp_email, EmailSendError
from app.core.otp_service import (
    issue_otp,
    verify_otp,
    OtpRateLimitError,
    OtpNotFoundError,
    OtpInvalidError,
)

router = APIRouter()


class LoginIn(BaseModel):
    email: EmailStr


class ConfirmIn(BaseModel):
    email: EmailStr
    code: str


@router.post("/login/")
async def login(data: LoginIn):
    """
    1) rate limit (cooldown)
    2) генерируем OTP, кладем в Redis (TTL)
    3) отправляем на email (SMTP) или логируем в dev
    """
    try:
        code = await issue_otp(data.email)
    except OtpRateLimitError:
        raise HTTPException(status_code=429, detail="Too many requests. Try later.")

    try:
        sent = await send_otp_email(data.email, code)
    except EmailSendError:
        # если SMTP упал — не раскрываем детали, но дадим 500
        raise HTTPException(status_code=500, detail="Failed to send OTP email.")

    return {"ok": True, "sent": sent}


@router.post("/confirm/")
async def confirm(data: ConfirmIn, response: Response):
    """
    Проверяем OTP. Если ок — access JWT + refresh JWT cookie
    """
    try:
        await verify_otp(data.email, data.code)
    except OtpNotFoundError:
        raise HTTPException(status_code=400, detail="Code expired or not found.")
    except OtpInvalidError:
        raise HTTPException(status_code=400, detail="Invalid code.")
    except OtpRateLimitError:
        raise HTTPException(status_code=429, detail="Too many attempts. Try later.")

    access = create_access_token(subject=data.email)
    refresh = create_refresh_token(subject=data.email)

    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=False,   # prod: True (https)
        samesite="lax",
        path="/",
    )

    return {"access_token": access, "token_type": "bearer"}


@router.post("/refresh/")
async def refresh(refresh_token: str | None = Cookie(default=None)):
    """
    Обновляем access по refresh cookie
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
