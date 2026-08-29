from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel, EmailStr

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.database.models import TradingAccount

from app.services.auth_service import (
    register_user,
    authenticate_user,
    create_access_token,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ==========================================
# Request Models
# ==========================================

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ==========================================
# Register
# ==========================================

@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    try:

        # ------------------------------
        # Create user
        # ------------------------------

        user = register_user(
            db=db,
            username=request.username,
            email=request.email,
            password=request.password,
        )

        # ------------------------------
        # Create paper trading account
        # ------------------------------

        trading_account = TradingAccount(
            user_id=user.id,

            initial_cash=100000.00,

            cash=100000.00,

            realized_pnl=0.00,

            winning_trades=0,

            losing_trades=0,
        )

        db.add(trading_account)
        db.commit()
        db.refresh(trading_account)

        # ------------------------------
        # Return response
        # ------------------------------

        return {
            "message": "Registration successful",

            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
            },

            "trading_account": {
                "initial_cash": 100000.00,
                "cash": 100000.00,
                "realized_pnl": 0.00,
                "winning_trades": 0,
                "losing_trades": 0,
            },
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


# ==========================================
# Login
# ==========================================

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
                "role": user.role,
            },
        }

    except ValueError as error:

        raise HTTPException(
            status_code=401,
            detail=str(error),
        )