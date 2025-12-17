from pydantic import BaseModel
import os


class Settings(BaseModel):
    jwt_secret: str = os.getenv("JWT_SECRET", "dev-secret")
    jwt_algorithm: str = "HS256"
    access_token_ttl: int = 900        # 15 минут
    refresh_token_ttl: int = 60 * 60 * 24 * 7  # 7 дней


settings = Settings()
