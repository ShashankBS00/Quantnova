from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel, EmailStr

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.auth_service import (
    register_user,
    authenticate_user,
    create_access_token,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    try:

        user = register_user(
            db=db,
            username=request.username,
            email=request.email,
            password=request.password,
        )

        return {
            "message": "Registration successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    try:

        user = authenticate_user(
            db=db,
            email=request.email,
            password=request.password,
        )

        token = create_access_token(
            user.id
        )

        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
        }

    except ValueError as error:

        raise HTTPException(
            status_code=401,
            detail=str(error),
        )