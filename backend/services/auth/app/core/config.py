from pydantic import BaseModel
import os


class Settings(BaseModel):
    # JWT
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret")
    jwt_algorithm: str = "HS256"
    access_token_ttl: int = int(os.getenv("ACCESS_TOKEN_TTL", "900"))  # 15 минут
    refresh_token_ttl: int = int(os.getenv("REFRESH_TOKEN_TTL", str(60 * 60 * 24 * 7)))  # 7 дней

    # OTP
    otp_ttl_seconds: int = int(os.getenv("OTP_TTL_SECONDS", "300"))  # 5 минут
    otp_send_cooldown_seconds: int = int(os.getenv("OTP_SEND_COOLDOWN_SECONDS", "30"))  # 30 сек
    otp_confirm_max_attempts: int = int(os.getenv("OTP_CONFIRM_MAX_ATTEMPTS", "5"))  # 5 попыток

    # SMTP (если не задано — dev режим: логируем код)
    smtp_host: str | None = os.getenv("SMTP_HOST")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_user: str | None = os.getenv("SMTP_USER")
    smtp_password: str | None = os.getenv("SMTP_PASSWORD")
    smtp_from: str = os.getenv("SMTP_FROM", "no-reply@example.com")
    smtp_tls: bool = os.getenv("SMTP_TLS", "true").lower() == "true"


settings = Settings()
