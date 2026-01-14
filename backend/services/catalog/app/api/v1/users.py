from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_auth
from app.db.session import get_session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserOut


router = APIRouter()

SECURITY = [{"BearerAuth": []}]


@router.get(
    "/",
    response_model=list[UserOut],
    summary="Список пользователей",
    openapi_extra={"security": SECURITY},
)
async def list_users(session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    res = await session.execute(select(User).order_by(User.id))
    return res.scalars().all()


@router.post(
    "/",
    response_model=UserOut,
    status_code=201,
    summary="Создать пользователя",
    openapi_extra={"security": SECURITY},
)
async def create_user(
    data: UserCreate,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_auth),
):
    exists = await session.execute(select(User).where(User.email == str(data.email)))
    if exists.scalars().first():
        raise HTTPException(status_code=400, detail="User with same email already exists")

    obj = User(
        name=data.name,
        email=str(data.email),
        role=data.role,
        is_active=data.is_active,
    )
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return obj


@router.get(
    "/{user_id}",
    response_model=UserOut,
    summary="Получить пользователя",
    openapi_extra={"security": SECURITY},
)
async def get_user(user_id: int, session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    obj = await session.get(User, user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    return obj


@router.patch(
    "/{user_id}",
    response_model=UserOut,
    summary="Обновить пользователя",
    openapi_extra={"security": SECURITY},
)
async def update_user(
    user_id: int,
    data: UserUpdate,
    session: AsyncSession = Depends(get_session),
    _: dict = Depends(require_auth),
):
    obj = await session.get(User, user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")

    payload = data.model_dump(exclude_unset=True)

    if "email" in payload and payload["email"] is not None:
        new_email = str(payload["email"])
        exists = await session.execute(
            select(User).where((User.email == new_email) & (User.id != user_id))
        )
        if exists.scalars().first():
            raise HTTPException(status_code=400, detail="User with same email already exists")
        payload["email"] = new_email

    for k, v in payload.items():
        setattr(obj, k, v)

    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete(
    "/{user_id}",
    status_code=204,
    summary="Удалить пользователя",
    openapi_extra={"security": SECURITY},
)
async def delete_user(user_id: int, session: AsyncSession = Depends(get_session), _: dict = Depends(require_auth)):
    obj = await session.get(User, user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")

    await session.delete(obj)
    await session.commit()
    return None
