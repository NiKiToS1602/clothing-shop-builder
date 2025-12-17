from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200, examples=["Футболки"])
    slug: str = Field(min_length=2, max_length=200, examples=["t-shirts"])
    is_active: bool = Field(default=True, examples=[True])


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=200, examples=["Худи"])
    slug: str | None = Field(default=None, min_length=2, max_length=200, examples=["hoodies"])
    is_active: bool | None = Field(default=None, examples=[True])


class CategoryOut(BaseModel):
    id: int = Field(examples=[1])
    name: str = Field(examples=["Футболки"])
    slug: str = Field(examples=["t-shirts"])
    is_active: bool = Field(examples=[True])

    class Config:
        from_attributes = True
