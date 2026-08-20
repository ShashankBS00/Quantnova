from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.strategy_service import (
    create_strategy,
    get_strategies,
    get_strategy,
    delete_strategy,
)


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


@router.post("/")
def add_strategy(request: StrategyRequest):

    try:
        return create_strategy(
            name=request.name,
            symbol=request.symbol,
            strategy_type=request.strategy_type,
            fast_period=request.fast_period,
            slow_period=request.slow_period,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.get("/")
def list_strategies():
    return get_strategies()


@router.get("/{strategy_id}")
def read_strategy(strategy_id: int):

    try:
        return get_strategy(strategy_id)

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )


@router.delete("/{strategy_id}")
def remove_strategy(strategy_id: int):

    try:
        return delete_strategy(strategy_id)

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        )