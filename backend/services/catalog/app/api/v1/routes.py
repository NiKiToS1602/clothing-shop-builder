from fastapi import APIRouter
from app.api.v1.categories import router as categories_router
from app.api.v1.products import router as products_router
from app.api.v1.brands import router as brands_router
from app.api.v1.users import router as users_router

router = APIRouter()
router.include_router(categories_router, prefix="/categories", tags=["categories"])
router.include_router(products_router, prefix="/products", tags=["products"])
router.include_router(brands_router, prefix="/brands", tags=["brands"])
router.include_router(users_router, prefix="/users", tags=["users"])
