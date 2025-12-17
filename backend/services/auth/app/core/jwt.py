from datetime import datetime, timedelta
from jose import jwt

from app.core.config import settings


def create_access_token(subject: str) -> str:
    payload = {
        "sub": subject,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(seconds=settings.access_token_ttl),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    payload = {
        "sub": subject,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(seconds=settings.refresh_token_ttl),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
