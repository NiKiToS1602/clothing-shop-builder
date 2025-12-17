from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes import router as v1_router

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


@app.get("/health")
def health():
    return {"status": "ok"}
