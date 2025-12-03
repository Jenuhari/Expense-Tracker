# backend/routers/categories.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=List[schemas.Category])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).order_by(models.Category.name).all()


@router.post("/", response_model=schemas.Category, status_code=201)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Category).filter(models.Category.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    new_cat = models.Category(name=category.name)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat
