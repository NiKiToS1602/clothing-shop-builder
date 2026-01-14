from pydantic import BaseModel, Field


class BrandCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200, examples=["Nike"])
    # slug может не отправляться фронтом (мы сгенерируем его на бэке)
    slug: str | None = Field(default=None, min_length=2, max_length=200, examples=["nike"])
    is_active: bool = Field(default=True, examples=[True])


class BrandUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200, examples=["Adidas"])
    slug: str | None = Field(default=None, min_length=2, max_length=200, examples=["adidas"])
    is_active: bool | None = Field(default=None, examples=[True])


class BrandOut(BaseModel):
    id: int = Field(examples=[1])
    name: str = Field(examples=["Nike"])
    slug: str = Field(examples=["nike"])
    is_active: bool = Field(examples=[True])

    class Config:
        from_attributes = True
