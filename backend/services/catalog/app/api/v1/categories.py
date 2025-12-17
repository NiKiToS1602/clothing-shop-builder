from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.core.auth import require_auth
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut

router = APIRouter()

SECURITY = [{"BearerAuth": []}]  # имя должно совпадать с securitySchemes в OpenAPI


@router.get(
    "/",
    response_model=list[CategoryOut],
    summary="Список категорий",
    description="Возвращает список категорий каталога. Требуется Bearer access token.",
    openapi_extra={"security": SECURITY},
)
async def list_categories(session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    res = await session.execute(select(Category).order_by(Category.id))
    return res.scalars().all()


@router.post(
    "/",
    response_model=CategoryOut,
    status_code=201,
    summary="Создать категорию",
    description="Создаёт новую категорию. `name` и `slug` должны быть уникальны.",
    openapi_extra={
        "security": SECURITY,
        "responses": {
            400: {"description": "Категория с таким name или slug уже существует"},
            401: {"description": "Нет или неверный Bearer токен"},
        },
    },
)
async def create_category(data: CategoryCreate, session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    exists = await session.execute(
        select(Category).where((Category.name == data.name) | (Category.slug == data.slug))
    )
    if exists.scalars().first():
        raise HTTPException(status_code=400, detail="Category with same name or slug already exists")

    obj = Category(**data.model_dump())
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get(
    "/{category_id}",
    response_model=CategoryOut,
    summary="Получить категорию",
    description="Возвращает категорию по идентификатору.",
    openapi_extra={
        "security": SECURITY,
        "responses": {
            404: {"description": "Категория не найдена"},
            401: {"description": "Нет или неверный Bearer токен"},
        },
    },
)
async def get_category(category_id: int, session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    obj = await session.get(Category, category_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Category not found")
    return obj


@router.patch(
    "/{category_id}",
    response_model=CategoryOut,
    summary="Обновить категорию",
    description="Частично обновляет категорию (PATCH). Передавайте только поля, которые нужно изменить.",
    openapi_extra={
        "security": SECURITY,
        "responses": {
            404: {"description": "Категория не найдена"},
            401: {"description": "Нет или неверный Bearer токен"},
        },
    },
)
async def update_category(category_id: int, data: CategoryUpdate, session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    obj = await session.get(Category, category_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Category not found")

    payload = data.model_dump(exclude_unset=True)
    for k, v in payload.items():
        setattr(obj, k, v)

    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete(
    "/{category_id}",
    status_code=204,
    summary="Удалить категорию",
    description="Удаляет категорию. Если категория используется товарами — удаление может быть запрещено политикой БД.",
    openapi_extra={
        "security": SECURITY,
        "responses": {
            404: {"description": "Категория не найдена"},
            401: {"description": "Нет или неверный Bearer токен"},
        },
    },
)
async def delete_category(category_id: int, session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    obj = await session.get(Category, category_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Category not found")

    await session.delete(obj)
    await session.commit()
    return None
