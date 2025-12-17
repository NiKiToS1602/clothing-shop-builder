from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes import router as v1_router
from fastapi.openapi.utils import get_openapi


app = FastAPI(title="Auth Service", version="0.1.0")

# Разрешаем запросы с админки (Vite) и клиента (на будущее)
origins = [
    "http://localhost:3001",  # admin (Vite)
    "http://127.0.0.1:3001",
    "http://localhost:3000",  # client (Next dev, если понадобится)
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,   # важно для cookie refresh_token
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description="Auth API для конструктора интернет-магазинов одежды.",
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


@app.get("/health")
def health():
    return {"status": "ok"}
