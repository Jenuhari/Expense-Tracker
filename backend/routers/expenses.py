# backend/routers/expenses.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

import models, schemas
from database import get_db
from auth import get_current_user  # ⬅ bring current user

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=List[schemas.Expense])
def list_expenses(
    db: Session = Depends(get_db),
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.Expense).filter(models.Expense.user_id == current_user.id)

    if year and month:
        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1)
        else:
            last_day = date(year, month + 1, 1)
        query = query.filter(models.Expense.date >= first_day, models.Expense.date < last_day)

    return query.order_by(models.Expense.date.desc()).all()


@router.post("/", response_model=schemas.Expense, status_code=201)
def create_expense(
    exp: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    category = db.query(models.Category).filter(models.Category.id == exp.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Category does not exist")

    new_exp = models.Expense(
        amount=exp.amount,
        description=exp.description,
        date=exp.date,
        category_id=exp.category_id,
        user_id=current_user.id,   # ⬅ link to logged-in user
    )
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    return new_exp


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    exp = (
        db.query(models.Expense)
        .filter(models.Expense.id == expense_id, models.Expense.user_id == current_user.id)
        .first()
    )
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(exp)
    db.commit()
    return


@router.get("/stats/monthly", response_model=schemas.MonthlyStatsResponse)
def get_monthly_stats(
    year: int = Query(...),
    month: int = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year + 1, 1, 1)
    else:
        last_day = date(year, month + 1, 1)

    total = (
        db.query(func.coalesce(func.sum(models.Expense.amount), 0))
        .filter(
            models.Expense.user_id == current_user.id,
            models.Expense.date >= first_day,
            models.Expense.date < last_day,
        )
        .scalar()
    )

    rows = (
        db.query(
            models.Category.id.label("category_id"),
            models.Category.name.label("category_name"),
            func.coalesce(func.sum(models.Expense.amount), 0).label("total_amount"),
        )
        .join(models.Expense, models.Expense.category_id == models.Category.id)
        .filter(
            models.Expense.user_id == current_user.id,
            models.Expense.date >= first_day,
            models.Expense.date < last_day,
        )
        .group_by(models.Category.id, models.Category.name)
        .all()
    )

    per_category = [
        schemas.MonthlyCategoryStat(
            category_id=row.category_id,
            category_name=row.category_name,
            total_amount=float(row.total_amount),
        )
        for row in rows
    ]

    return schemas.MonthlyStatsResponse(
        year=year,
        month=month,
        total_spent=float(total),
        per_category=per_category,
    )
