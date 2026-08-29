from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User

from app.utils.auth_dependency import (
    get_current_user,
)

from app.services.trading_service import (
    get_trading_account,
    place_paper_order,
)


router = APIRouter(
    prefix="/trading",
    tags=["Trading"],
)


# ==========================================
# Order Request
# ==========================================

class OrderRequest(BaseModel):

    symbol: str
    quantity: int
    price: float
    side: str

    stop_loss: float | None = None
    target: float | None = None


# ==========================================
# Get Trading Account
# ==========================================

@router.get("/account")
def trading_account(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):

    try:

        return get_trading_account(
            db=db,
            user_id=user.id,
        )

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


# ==========================================
# Place Paper Order
# ==========================================

@router.post("/order")
def place_order(
    request: OrderRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):

    try:

        result = place_paper_order(
            db=db,
            user_id=user.id,
            symbol=request.symbol,
            quantity=request.quantity,
            price=request.price,
            side=request.side,
            stop_loss=request.stop_loss,
            target=request.target,
        )

        return result

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )