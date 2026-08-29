from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from jose import jwt, JWTError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User


# ==========================================
# JWT Configuration
# ==========================================

SECRET_KEY = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ==========================================
# Password Hashing
# ==========================================

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:

    return password_hash.verify(
        password,
        hashed_password,
    )


# ==========================================
# Create Access Token
# ==========================================

def create_access_token(
    user_id: int,
) -> str:

    expire = datetime.now(
        timezone.utc
    ) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ==========================================
# Authentication Security
# ==========================================

security = HTTPBearer()


# ==========================================
# Get Current Logged-in User
# ==========================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token",
            )

        user_id = int(user_id)

    except (JWTError, ValueError, TypeError):

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    return user


# ==========================================
# Register User
# ==========================================

def register_user(
    db: Session,
    username: str,
    email: str,
    password: str,
):

    username = username.strip()
    email = email.strip().lower()

    if not username:
        raise ValueError(
            "Username is required"
        )

    if not email:
        raise ValueError(
            "Email is required"
        )

    if len(password) < 6:
        raise ValueError(
            "Password must be at least 6 characters"
        )

    # --------------------------------------
    # Check Username
    # --------------------------------------

    existing_username = (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )

    if existing_username:

        raise ValueError(
            "Username already exists"
        )

    # --------------------------------------
    # Check Email
    # --------------------------------------

    existing_email = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_email:

        raise ValueError(
            "Email already registered"
        )

    # --------------------------------------
    # Create User
    # --------------------------------------

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role="USER",
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return user


# ==========================================
# Authenticate User
# ==========================================

def authenticate_user(
    db: Session,
    email: str,
    password: str,
):

    email = email.strip().lower()

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if not user:

        raise ValueError(
            "Invalid email or password"
        )

    if not verify_password(
        password,
        user.password_hash,
    ):

        raise ValueError(
            "Invalid email or password"
        )

    return user