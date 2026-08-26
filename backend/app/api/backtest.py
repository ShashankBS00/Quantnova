from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.backtest_service import (
    run_sma_backtest,
    run_ema_backtest,
)


router = APIRouter(
    prefix="/backtest",
    tags=["Backtest"],
)


class BacktestRequest(BaseModel):
    symbol: str
    strategy_type: str = "SMA_CROSSOVER"
    fast_period: int
    slow_period: int
    initial_cash: float = 100000.0


@router.post("/run")
def run_backtest(request: BacktestRequest):

    try:

        strategy_type = request.strategy_type.upper()

        if strategy_type == "SMA_CROSSOVER":

            result = run_sma_backtest(
                symbol=request.symbol,
                fast_period=request.fast_period,
                slow_period=request.slow_period,
                initial_cash=request.initial_cash,
            )

        elif strategy_type == "EMA_CROSSOVER":

            result = run_ema_backtest(
                symbol=request.symbol,
                fast_period=request.fast_period,
                slow_period=request.slow_period,
                initial_cash=request.initial_cash,
            )

        else:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported strategy type: "
                    f"{request.strategy_type}"
                ),
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
            detail=f"Backtest failed: {str(error)}",
        )