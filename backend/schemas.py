# backend/schemas.py
from datetime import date, datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List

# ---------- User ----------

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    gender: Optional[str] = None
    hobbies: Optional[str] = None


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


# ---------- Auth / Token ----------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ---------- Category ----------

class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---------- Expense ----------

class ExpenseBase(BaseModel):
    amount: float
    description: Optional[str] = None
    date: date
    category_id: int


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase):
    id: int
    created_at: datetime
    category: Category

    class Config:
        orm_mode = True


# ---------- Monthly Stats ----------

class MonthlyCategoryStat(BaseModel):
    category_id: int
    category_name: str
    total_amount: float


class MonthlyStatsResponse(BaseModel):
    year: int
    month: int
    total_spent: float
    per_category: List[MonthlyCategoryStat]
