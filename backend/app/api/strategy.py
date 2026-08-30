from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

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


# ==========================================
# Strategy Request
# ==========================================

class StrategyRequest(BaseModel):

    # --------------------------------------
    # Basic Information
    # --------------------------------------

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    symbol: str = Field(
        ...,
        min_length=1,
        max_length=30,
    )

    asset_type: str = "STOCK"

    trading_style: str = "INTRADAY"

    timeframe: str = "1d"

    # --------------------------------------
    # Strategy
    # --------------------------------------

    strategy_type: str

    # Strategy-specific settings
    #
    # SMA:
    # {
    #   "fast_period": 20,
    #   "slow_period": 50
    # }
    #
    # RSI:
    # {
    #   "period": 14,
    #   "oversold": 30,
    #   "overbought": 70
    # }

    parameters: Optional[Dict[str, Any]] = None

    # --------------------------------------
    # Risk Management
    # --------------------------------------

    stop_loss_percent: Optional[float] = None

    risk_reward_ratio: Optional[float] = None


# ==========================================
# Create Strategy
# ==========================================

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

            asset_type=request.asset_type,
            trading_style=request.trading_style,
            timeframe=request.timeframe,

            strategy_type=request.strategy_type,

            parameters=request.parameters,

            stop_loss_percent=request.stop_loss_percent,
            risk_reward_ratio=request.risk_reward_ratio,
        )

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


# ==========================================
# Get User Strategies
# ==========================================

@router.get("/")
def list_strategies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return get_strategies(
        db=db,
        user_id=current_user.id,
    )


# ==========================================
# Get Single Strategy
# ==========================================

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


# ==========================================
# Delete Strategy
# ==========================================

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