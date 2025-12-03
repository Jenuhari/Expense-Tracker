# backend/auth.py
from datetime import datetime, timedelta
from typing import Optional, List

import os
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
)
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
import models, schemas

# ----- JWT CONFIG -----
JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "17e5c1889e22c1710af4ad7b051f48bde05b6e42a60041aa1abb206af1761f9d",
)
SECRET_KEY = "k2xRkvhKEqUnd0svJRL23V_88jdgqivsDnxZv-3C0QE"  # put in env in real app
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------- PASSWORD HELPERS ----------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ---------- USER LOOKUPS ----------

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_full_name(db: Session, full_name: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.full_name == full_name).first()


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[models.User]:
    """
    Try to authenticate using either email OR full_name.

    identifier = what the user typed into the 'username' field.
    """
    # 1) Try as email
    user = get_user_by_email(db, identifier)

    # 2) If no user by email, try as full_name
    if not user:
        user = get_user_by_full_name(db, identifier)

    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


# ---------- CURRENT USER DEPENDENCY ----------

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[int] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = schemas.TokenData(user_id=int(user_id))
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user


# ---------- FILE STORAGE CONFIG ----------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STORAGE_FOLDER = os.path.join(BASE_DIR, "..", "storage")
os.makedirs(STORAGE_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf", "xls", "xlsx", "csv"}
MIN_FILE_SIZE = 1 * 1024 * 1024  # 1 MB in bytes


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ---------- ROUTES ----------

@router.post("/signup", response_model=schemas.User, status_code=201)
async def signup(
    full_name: str = Form(...),
    email: Optional[str] = Form(None),
    password: str = Form(...),
    gender: Optional[str] = Form(None),
    hobbies: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # unique checks
    if full_name:
        existing_name = (
            db.query(models.User)
            .filter(models.User.full_name == full_name)
            .first()
        )
        if existing_name:
            raise HTTPException(status_code=400, detail="Username already taken")

    if email:
        existing_email = (
            db.query(models.User)
            .filter(models.User.email == email)
            .first()
        )
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")

    # ----- file validation -----
    if not allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Allowed: jpg, jpeg, png, pdf, xls, xlsx, csv",
        )

    file_bytes = await file.read()
    if len(file_bytes) < MIN_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File is too small. Minimum size is 1 MB.",
        )

    # save file to storage/ with safe unique name
    ext = file.filename.rsplit(".", 1)[1].lower()
    safe_name = f"{uuid4().hex}.{ext}"
    save_path = os.path.join(STORAGE_FOLDER, safe_name)
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # hash password + create user
    hashed = get_password_hash(password)
    new_user = models.User(
        email=email,
        full_name=full_name,
        hashed_password=hashed,
        gender=gender,
        hobbies=hobbies,
        file_path=save_path,  # or save relative path if you prefer
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    OAuth2PasswordRequestForm gives: username, password

    Here, 'username' can be EITHER:
      - the user's email
      - OR the user's full_name
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Incorrect email/username or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return schemas.Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=schemas.User)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=List[schemas.User])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),  # require auth
):
    # (for now, allow any logged-in user to see all users)
    users = db.query(models.User).order_by(models.User.id).all()
    return users
