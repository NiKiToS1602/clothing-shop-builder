import secrets
from app.core.redis_client import get_redis
from app.core.config import settings


class OtpRateLimitError(Exception):
    pass


class OtpNotFoundError(Exception):
    pass


class OtpInvalidError(Exception):
    pass


def _key_otp(email: str) -> str:
    return f"otp:{email}"


def _key_cooldown(email: str) -> str:
    return f"otp:cooldown:{email}"


def _key_attempts(email: str) -> str:
    return f"otp:attempts:{email}"


def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


async def issue_otp(email: str) -> str:
    """
    - ограничение частоты отправки (cooldown)
    - записываем OTP с TTL
    - сбрасываем счетчик попыток confirm
    """
    r = get_redis()

    # cooldown: если ключ есть — недавно уже отправляли
    cooldown_key = _key_cooldown(email)
    if await r.exists(cooldown_key):
        raise OtpRateLimitError("Too many requests")

    code = generate_code()
    await r.set(_key_otp(email), code, ex=settings.otp_ttl_seconds)

    # cooldown ключ на N секунд
    await r.set(cooldown_key, "1", ex=settings.otp_send_cooldown_seconds)

    # попытки подтверждения (TTL такой же, как у OTP)
    await r.set(_key_attempts(email), "0", ex=settings.otp_ttl_seconds)

    return code


async def verify_otp(email: str, code: str) -> None:
    """
    - проверяем OTP
    - учитываем попытки
    - при успехе удаляем OTP и attempts
    """
    r = get_redis()
    otp = await r.get(_key_otp(email))
    if not otp:
        raise OtpNotFoundError("OTP expired or not found")

    # попытки
    attempts_key = _key_attempts(email)
    attempts = await r.incr(attempts_key)  # увеличиваем на каждую попытку
    # выставим TTL на всякий случай, если ключа не было
    await r.expire(attempts_key, settings.otp_ttl_seconds)

    if attempts > settings.otp_confirm_max_attempts:
        # блокируем: удаляем OTP, чтобы нельзя было дальше подбирать
        await r.delete(_key_otp(email))
        await r.delete(attempts_key)
        raise OtpRateLimitError("Too many attempts")

    if otp.decode("utf-8") != code:
        raise OtpInvalidError("Invalid code")

    # успех — очищаем
    await r.delete(_key_otp(email))
    await r.delete(attempts_key)
