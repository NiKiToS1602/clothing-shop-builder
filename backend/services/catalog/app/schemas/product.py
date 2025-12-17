from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    category_id: int = Field(examples=[1])
    name: str = Field(min_length=2, max_length=250, examples=["Футболка базовая"])
    description: str | None = Field(default=None, examples=["100% хлопок, прямой крой"])
    sku: str = Field(min_length=2, max_length=64, examples=["TSHIRT-BASIC-BLK-M"])
    price: float = Field(gt=0, examples=[1990.0])
    is_active: bool = Field(default=True, examples=[True])


class ProductUpdate(BaseModel):
    category_id: int | None = Field(default=None, examples=[1])
    name: str | None = Field(default=None, min_length=2, max_length=250, examples=["Футболка oversize"])
    description: str | None = Field(default=None, examples=["Плотный хлопок, свободный крой"])
    sku: str | None = Field(default=None, min_length=2, max_length=64, examples=["TSHIRT-OVR-WHT-L"])
    price: float | None = Field(default=None, gt=0, examples=[2490.0])
    is_active: bool | None = Field(default=None, examples=[True])


class ProductOut(BaseModel):
    id: int = Field(examples=[10])
    category_id: int = Field(examples=[1])
    name: str = Field(examples=["Футболка базовая"])
    description: str | None = Field(examples=["100% хлопок, прямой крой"])
    sku: str = Field(examples=["TSHIRT-BASIC-BLK-M"])
    price: float = Field(examples=[1990.0])
    is_active: bool = Field(examples=[True])

    class Config:
        from_attributes = True
