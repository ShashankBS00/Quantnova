from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User

from app.services.strategy_service import (
    create_strategy,
    get_strategies,
    get_strategy,
    delete_strategy,
)

from app.utils.auth_dependency import get_current_user


router = APIRouter(
    prefix="/strategy",
    tags=["Strategy"],
)


class StrategyRequest(BaseModel):
    name: str
    symbol: str
    strategy_type: str
    fast_period: int
    slow_period: int
    asset_type: str = "STOCK"
    timeframe: str = "1d"


# --------------------------------
# Create Strategy
# --------------------------------

@router.post("/")
def add_strategy(
    request: StrategyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        return create_strategy(
            db=db,
            user_id=current_user.id,
            name=request.name,
            symbol=request.symbol,
            strategy_type=request.strategy_type,
            fast_period=request.fast_period,
            slow_period=request.slow_period,
            asset_type=request.asset_type,
            timeframe=request.timeframe,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


# --------------------------------
# Get User Strategies
# --------------------------------

@router.get("/")
def list_strategies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return get_strategies(
        db=db,
        user_id=current_user.id,
    )


# --------------------------------
# Get Single Strategy
# --------------------------------

@router.get("/{strategy_id}")
def read_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        return get_strategy(
            db=db,
            user_id=current_user.id,
            strategy_id=strategy_id,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=404,
            detail=str(error),
        )


# --------------------------------
# Delete Strategy
# --------------------------------

@router.delete("/{strategy_id}")
def remove_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    try:

        return delete_strategy(
            db=db,
            user_id=current_user.id,
            strategy_id=strategy_id,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=404,
            detail=str(error),
        )