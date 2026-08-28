from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.services.auth_service import (
    SECRET_KEY,
    ALGORITHM,
)


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):

    token = credentials.credentials

    print("AUTH TOKEN RECEIVED:", token[:20] + "...")

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        print("JWT USER ID:", user_id)

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token does not contain user ID",
            )

        try:
            user_id = int(user_id)

        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user ID in token",
            )

    except JWTError as error:

        print("JWT ERROR:", error)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user