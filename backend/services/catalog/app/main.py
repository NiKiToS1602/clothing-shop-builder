from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from app.api.v1.routes import router as v1_router

app = FastAPI(title="Clothing Builder — Catalog Service", version="0.1.0")

app.include_router(v1_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description="Catalog API для конструктора интернет-магазинов одежды.",
        routes=app.routes,
    )

    # 🔒 Добавляем security scheme для Bearer токена
    schema.setdefault("components", {}).setdefault("securitySchemes", {})
    schema["components"]["securitySchemes"]["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }

    # Можно включить глобально, но мы уже защищаем роуты dependency
    # Тогда Swagger покажет замок на эндпоинтах, где security указан
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi
