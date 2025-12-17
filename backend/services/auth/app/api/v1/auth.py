from fastapi import APIRouter, HTTPException, Response, Cookie
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
from app.schemas.auth import LoginIn, ConfirmIn, TokenOut

router = APIRouter()

SECURITY = [{"BearerAuth": []}]


@router.post(
    "/login/",
    summary="Запросить OTP-код",
    description=(
        "Генерирует одноразовый OTP-код и отправляет его на email.\n\n"
        "Ограничения:\n"
        "- нельзя запрашивать слишком часто (cooldown)\n"
        "- код действует ограниченное время\n\n"
        "В dev-режиме (если SMTP не настроен) код выводится в логах сервиса."
    ),
    openapi_extra={
        "responses": {
            429: {"description": "Слишком частые запросы. Подождите и попробуйте снова."},
            500: {"description": "Ошибка отправки письма (SMTP)"},
        }
    },
)
async def login(data: LoginIn):
    try:
        code = await issue_otp(data.email)
    except OtpRateLimitError:
        raise HTTPException(status_code=429, detail="Too many requests. Try later.")

    try:
        sent = await send_otp_email(data.email, code)
    except EmailSendError:
        raise HTTPException(status_code=500, detail="Failed to send OTP email.")

    return {"ok": True, "sent": sent}


@router.post(
    "/confirm/",
    response_model=TokenOut,
    summary="Подтвердить OTP-код",
    description=(
        "Проверяет OTP-код. Если код верный:\n"
        "- возвращает `access_token`\n"
        "- устанавливает `refresh_token` в httpOnly cookie\n\n"
        "Access token используется в заголовке `Authorization: Bearer <token>`."
    ),
    openapi_extra={
        "responses": {
            400: {"description": "Неверный код или код истёк"},
            429: {"description": "Слишком много попыток ввода кода"},
        }
    },
)
async def confirm(data: ConfirmIn, response: Response):
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
        secure=False,  # prod: True
        samesite="lax",
        path="/",
    )

    return {"access_token": access, "token_type": "bearer"}


@router.post(
    "/refresh/",
    response_model=TokenOut,
    summary="Обновить access token",
    description=(
        "Возвращает новый `access_token` по `refresh_token`, который хранится в httpOnly cookie.\n\n"
        "Если cookie отсутствует или токен невалиден — вернёт 401."
    ),
    openapi_extra={
        "responses": {
            401: {"description": "Нет refresh token cookie или refresh token невалиден"},
        }
    },
)
async def refresh(refresh_token: str | None = Cookie(default=None)):
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
