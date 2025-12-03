# backend/models.py
from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    full_name = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    gender = Column(String(20), nullable=True)
    hobbies = Column(String(255), nullable=True)       # comma-separated list
    file_path = Column(String(255), nullable=True)     # stored file path
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    expenses = relationship("Expense", back_populates="user")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    expenses = relationship("Expense", back_populates="category")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255), nullable=True)
    date = Column(Date, nullable=False)
    category_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    category = relationship("Category", back_populates="expenses")
    user = relationship("User", back_populates="expenses")
