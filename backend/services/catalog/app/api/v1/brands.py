from __future__ import annotations

import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_auth
from app.db.session import get_session
from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate, BrandOut


router = APIRouter()

SECURITY = [{"BearerAuth": []}]


_slug_re = re.compile(r"[^a-z0-9]+")


def _slugify(value: str) -> str:
    """Простейший slugify (латиница/цифры/дефисы).

    Если нужны русские слуги — лучше подключить python-slugify, но для учебного MVP
    этого достаточно.
    """
    v = value.strip().lower()
    v = v.replace("_", "-")
    v = _slug_re.sub("-", v)
    v = re.sub(r"-+", "-", v).strip("-")
    return v or "brand"


@router.get(
    "/",
    response_model=list[BrandOut],
    summary="Список брендов",
    openapi_extra={"security": SECURITY},
)
async def list_brands(session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    res = await session.execute(select(Brand).order_by(Brand.id))
    return res.scalars().all()


@router.post(
    "/",
    response_model=BrandOut,
    status_code=201,
    summary="Создать бренд",
    openapi_extra={"security": SECURITY},
)
async def create_brand(
    data: BrandCreate,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_auth),
):
    slug = data.slug.strip() if data.slug else _slugify(data.name)
    if not slug:
        slug = _slugify(data.name)

    exists = await session.execute(
        select(Brand).where((Brand.name == data.name) | (Brand.slug == slug))
    )
    if exists.scalars().first():
        raise HTTPException(status_code=400, detail="Brand with same name or slug already exists")

    obj = Brand(name=data.name, slug=slug, is_active=data.is_active)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get(
    "/{brand_id}",
    response_model=BrandOut,
    summary="Получить бренд",
    openapi_extra={"security": SECURITY},
)
async def get_brand(brand_id: int, session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    obj = await session.get(Brand, brand_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Brand not found")
    return obj


@router.patch(
    "/{brand_id}",
    response_model=BrandOut,
    summary="Обновить бренд",
    openapi_extra={"security": SECURITY},
)
async def update_brand(
    brand_id: int,
    data: BrandUpdate,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_auth),
):
    obj = await session.get(Brand, brand_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Brand not found")

    payload = data.model_dump(exclude_unset=True)
    if "name" in payload and "slug" not in payload:
        # если обновили name, но slug не передали — генерим новый
        payload["slug"] = _slugify(payload["name"])

    if "slug" in payload and payload["slug"]:
        payload["slug"] = _slugify(payload["slug"])

    # проверка уникальности
    if ("name" in payload) or ("slug" in payload):
        name = payload.get("name", obj.name)
        slug = payload.get("slug", obj.slug)
        exists = await session.execute(
            select(Brand).where(
                ((Brand.name == name) | (Brand.slug == slug)) & (Brand.id != brand_id)
            )
        )
        if exists.scalars().first():
            raise HTTPException(status_code=400, detail="Brand with same name or slug already exists")

    for k, v in payload.items():
        setattr(obj, k, v)

    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete(
    "/{brand_id}",
    status_code=204,
    summary="Удалить бренд",
    openapi_extra={"security": SECURITY},
)
async def delete_brand(brand_id: int, session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    obj = await session.get(Brand, brand_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Brand not found")

    await session.delete(obj)
    await session.commit()
    return None
