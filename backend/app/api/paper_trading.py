from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User

from app.utils.auth_dependency import (
    get_current_user,
)

from app.services.paper_trading_service import (
    run_strategy_paper_trade,
)


router = APIRouter(
    prefix="/paper-trading",
    tags=["Paper Trading"],
)


@router.post("/run/{strategy_id}")
def run_paper_trade(
    strategy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        result = run_strategy_paper_trade(
            db=db,
            user_id=current_user.id,
            strategy_id=strategy_id,
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Paper trading failed: {str(error)}",
        )