from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.backtest_service import run_sma_backtest


router = APIRouter(
    prefix="/backtest",
    tags=["Backtest"],
)


class BacktestRequest(BaseModel):
    symbol: str
    fast_period: int
    slow_period: int
    initial_cash: float = 100000.0


@router.post("/run")
def run_backtest(request: BacktestRequest):

    try:
        result = run_sma_backtest(
            symbol=request.symbol,
            fast_period=request.fast_period,
            slow_period=request.slow_period,
            initial_cash=request.initial_cash,
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
            detail=f"Backtest failed: {str(error)}",
        )