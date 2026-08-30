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
# Request Model
# ==========================================

class BacktestRequest(BaseModel):

    symbol: str

    strategy_type: str = "SMA_CROSSOVER"

    parameters: Dict[str, Any] = Field(
        default_factory=dict
    )

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

        strategy_type = (
            request.strategy_type
            .strip()
            .upper()
        )

        parameters = (
            request.parameters or {}
        )

        # ----------------------------------
        # Fast / Slow periods
        # ----------------------------------

        fast_period = int(
            parameters.get(
                "fast_period",
                20,
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                50,
            )
        )

        # ----------------------------------
        # Run
        # ----------------------------------

        result = run_strategy_backtest(

            symbol=request.symbol,

            strategy_type=strategy_type,

            parameters=parameters,

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