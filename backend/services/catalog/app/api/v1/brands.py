from __future__ import annotations

import re
from pathlib import Path
import time

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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
    v = v.strip("-")
    return v


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

    obj = Brand(name=data.name, slug=slug, is_active=data.is_active, description=data.description)
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
        slug = payload["slug"].strip().lower()
        payload["slug"] = slug

    # проверяем уникальность (если изменяется name/slug)
    name = payload.get("name")
    slug = payload.get("slug")
    if name or slug:
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


@router.post(
    "/{brand_id}/image",
    response_model=BrandOut,
    summary="Загрузить изображение бренда",
    openapi_extra={"security": SECURITY},
)
async def upload_brand_image(
    brand_id: int,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_auth),
):
    obj = await session.get(Brand, brand_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Brand not found")

    # Простая валидация типа
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    media_root = Path("/app/media/brands")
    media_root.mkdir(parents=True, exist_ok=True)

    # сохраняем с расширением из имени файла (если есть)
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}:
        suffix = ".png"

    filename = f"brand_{brand_id}_{int(time.time())}{suffix}"
    out_path = media_root / filename

    content = await file.read()
    out_path.write_bytes(content)

    obj.image_path = f"/media/brands/{filename}"
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
