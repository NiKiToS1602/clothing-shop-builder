from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.errors import make_error
from app.api.v1.routes import router as v1_router

# DB init (для учебного проекта: создаём таблицы при старте)
from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401  # важно: чтобы Base.metadata увидела модели


# ✅ ВАЖНО: создаём директорию ДО app.mount, иначе StaticFiles может упасть при старте
MEDIA_ROOT = Path("/app/media")
BRANDS_MEDIA_DIR = MEDIA_ROOT / "brands"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
BRANDS_MEDIA_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Clothing Builder — Catalog Service", version="0.1.0")

# Статика для загруженных изображений (бренды и т.д.)
# ✅ check_dir=False на всякий случай (чтобы не падало даже если окружение странное)
app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT), check_dir=False), name="media")


@app.on_event("startup")
async def _startup_create_tables():
    # ✅ Создаём таблицы, если их ещё нет
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # 🔧 Мини-миграции для учебного проекта:
        # Добавляем поля description и image_path к таблице brands, если их ещё нет.
        try:
            await conn.exec_driver_sql(
                "ALTER TABLE brands ADD COLUMN IF NOT EXISTS description TEXT"
            )
            await conn.exec_driver_sql(
                "ALTER TABLE brands ADD COLUMN IF NOT EXISTS image_path VARCHAR(500)"
            )
        except Exception:
            # если БД ещё не готова/таблица не создана - create_all сделает своё
            pass


# CORS (для dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    return JSONResponse(make_error(exc.status_code, exc.detail), status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(make_error(400, "Validation error", errors=exc.errors()), status_code=400)


app.include_router(v1_router, prefix="/api/v1")


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description="Catalog API для конструктора интернет-магазинов одежды.",
        routes=app.routes,
    )

    schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schema["components"]["securitySchemes"]["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }

    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi
