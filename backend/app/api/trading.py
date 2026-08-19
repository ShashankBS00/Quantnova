from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.trading_service import (
    place_paper_order,
    account,
)

router = APIRouter(prefix="/trading", tags=["Trading"])


class OrderRequest(BaseModel):
    symbol: str
    quantity: int
    price: float
    side: str


# -------------------------
# Place Paper Order
# -------------------------

@router.post("/order")
def place_order(order: OrderRequest):

    if order.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    if order.price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than 0"
        )

    try:
        result = place_paper_order(
            symbol=order.symbol,
            quantity=order.quantity,
            price=order.price,
            side=order.side,
        )

        return {
            "message": "Paper order placed successfully",
            "order": result,
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# -------------------------
# Get Trading Account
# -------------------------
@router.get("/account")
def get_account():
    return {
        "cash": round(account["cash"], 2),
        "holdings": account["holdings"],
        "orders": account["orders"],
        "realized_pnl": round(
            account["realized_pnl"], 2
        ),
        "winning_trades": account["winning_trades"],
        "losing_trades": account["losing_trades"],
        "best_trade": (
            round(account["best_trade"], 2)
            if account["best_trade"] is not None
            else None
        ),
        "worst_trade": (
            round(account["worst_trade"], 2)
            if account["worst_trade"] is not None
            else None
        ),
    }