from fastapi import APIRouter, HTTPException

from app.services.paper_trading_service import (
    run_strategy_paper_trade,
)


router = APIRouter(
    prefix="/paper-trading",
    tags=["Paper Trading"],
)


# --------------------------------
# Run Strategy Paper Trade
# --------------------------------

@router.post("/run/{strategy_id}")
def run_paper_trade(
    strategy_id: int,
):

    try:

        result = run_strategy_paper_trade(
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