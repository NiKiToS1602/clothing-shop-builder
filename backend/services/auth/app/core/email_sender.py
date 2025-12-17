from aiosmtplib import SMTP
from email.message import EmailMessage

from app.core.config import settings


class EmailSendError(Exception):
    pass


async def send_otp_email(to_email: str, code: str) -> bool:
    """
    Возвращает True, если письмо реально отправлено.
    Возвращает False в dev-режиме (SMTP не настроен) — код логируем.
    """
    if not settings.smtp_host:
        # dev режим
        print(f"[DEV] OTP for {to_email}: {code}")
        return False

    msg = EmailMessage()
    msg["From"] = settings.smtp_from
    msg["To"] = to_email
    msg["Subject"] = "Ваш код для входа"
    msg.set_content(
        f"Ваш одноразовый код для входа: {code}\n"
        f"Код действует {settings.otp_ttl_seconds // 60} минут.\n"
        f"Если вы не запрашивали код — просто игнорируйте это письмо."
    )

    try:
        smtp = SMTP(hostname=settings.smtp_host, port=settings.smtp_port, start_tls=settings.smtp_tls)
        await smtp.connect()

        if settings.smtp_user and settings.smtp_password:
            await smtp.login(settings.smtp_user, settings.smtp_password)

        await smtp.send_message(msg)
        await smtp.quit()
        return True

    except Exception as e:
        raise EmailSendError(str(e)) from e
