from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.backtest_service import (
    run_strategy_backtest,
)


router = APIRouter(
    prefix="/backtest",
    tags=["Backtest"],
)


# ==========================================
# Supported Timeframes
# ==========================================

VALID_TIMEFRAMES = {
    "1m",
    "3m",
    "5m",
    "10m",
    "15m",
    "30m",
    "1h",
    "2h",
    "4h",
    "1d",
    "1wk",
    "1mo",
}


# ==========================================
# Request Model
# ==========================================

class BacktestRequest(BaseModel):

    symbol: str

    strategy_type: str = "SMA_CROSSOVER"

    parameters: Dict[str, Any] = Field(
        default_factory=dict
    )

    timeframe: str = "1d"

    initial_cash: float = 100000.0

    stop_loss_percent: Optional[float] = None

    risk_reward_ratio: Optional[float] = None


# ==========================================
# Run Backtest
# ==========================================

@router.post("/run")
def run_backtest(
    request: BacktestRequest,
):

    try:

        # ----------------------------------
        # Normalize
        # ----------------------------------

        symbol = (
            request.symbol
            .strip()
            .upper()
        )

        strategy_type = (
            request.strategy_type
            .strip()
            .upper()
        )

        timeframe = (
            request.timeframe
            .strip()
            .lower()
        )

        parameters = (
            request.parameters or {}
        )

        # ----------------------------------
        # Validation
        # ----------------------------------

        if not symbol:

            raise ValueError(
                "Stock symbol is required"
            )

        if timeframe not in VALID_TIMEFRAMES:

            raise ValueError(
                "Invalid timeframe. "
                f"Supported: "
                f"{', '.join(VALID_TIMEFRAMES)}"
            )

        if request.initial_cash <= 0:

            raise ValueError(
                "Initial cash must be greater than 0"
            )

        # ----------------------------------
        # Fast / Slow periods
        # ----------------------------------
        # Kept for compatibility with the
        # existing request structure.
        # The actual validation is handled
        # inside the backtest service.

        if "fast_period" in parameters:

            int(
                parameters["fast_period"]
            )

        if "slow_period" in parameters:

            int(
                parameters["slow_period"]
            )

        # ----------------------------------
        # Run Backtest
        # ----------------------------------

        result = run_strategy_backtest(

            symbol=symbol,

            strategy_type=strategy_type,

            parameters=parameters,

            timeframe=timeframe,

            initial_cash=request.initial_cash,

            stop_loss_percent=
                request.stop_loss_percent,

            risk_reward_ratio=
                request.risk_reward_ratio,
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except HTTPException:

        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Backtest failed: "
                f"{str(error)}"
            ),
        )