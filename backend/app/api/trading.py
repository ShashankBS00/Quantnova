from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import yfinance as yf

from app.services.trading_service import (
    place_paper_order,
    account,
)


router = APIRouter(
    prefix="/trading",
    tags=["Trading"],
)


class OrderRequest(BaseModel):
    symbol: str
    quantity: int
    price: float
    side: str


# --------------------------------
# Place Paper Order
# --------------------------------

@router.post("/order")
def place_order(order: OrderRequest):

    if order.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0",
        )

    if order.price <= 0:
        raise HTTPException(
            status_code=400,
            detail="Price must be greater than 0",
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
            detail=str(error),
        )


# --------------------------------
# Get Current Market Price
# --------------------------------

def get_current_market_price(symbol: str):

    try:

        data = yf.download(
            symbol,
            period="1d",
            interval="1m",
            auto_adjust=False,
            progress=False,
        )

        if data.empty:
            return None

        if hasattr(data.columns, "levels"):

            data.columns = (
                data.columns
                .get_level_values(0)
            )

        data = data.dropna(
            subset=["Close"]
        )

        if data.empty:
            return None

        return float(
            data["Close"].iloc[-1]
        )

    except Exception:
        return None


# --------------------------------
# Get Trading Account
# --------------------------------

@router.get("/account")
def get_account():

    holdings = {}

    total_current_value = 0.0
    total_invested_value = 0.0
    total_unrealized_pnl = 0.0

    # --------------------------------
    # Calculate holding values
    # --------------------------------

    for symbol, holding in account[
        "holdings"
    ].items():

        quantity = holding["quantity"]

        average_price = holding[
            "average_price"
        ]

        current_price = (
            get_current_market_price(
                symbol
            )
        )

        invested_value = (
            quantity * average_price
        )

        # If market price unavailable,
        # use average price temporarily.
        if current_price is None:
            current_price = average_price

        current_value = (
            quantity * current_price
        )

        unrealized_pnl = (
            current_value - invested_value
        )

        total_invested_value += (
            invested_value
        )

        total_current_value += (
            current_value
        )

        total_unrealized_pnl += (
            unrealized_pnl
        )

        holdings[symbol] = {
            "quantity": quantity,

            "average_price": round(
                average_price,
                2,
            ),

            "current_price": round(
                current_price,
                2,
            ),

            "invested_value": round(
                invested_value,
                2,
            ),

            "current_value": round(
                current_value,
                2,
            ),

            "unrealized_pnl": round(
                unrealized_pnl,
                2,
            ),
        }

    # --------------------------------
    # Total account equity
    # --------------------------------

    total_equity = (
        account["cash"]
        + total_current_value
    )

    # --------------------------------
    # Return account
    # --------------------------------

    return {

        "cash": round(
            account["cash"],
            2,
        ),

        "holdings": holdings,

        "orders": account["orders"],

        "realized_pnl": round(
            account["realized_pnl"],
            2,
        ),

        "unrealized_pnl": round(
            total_unrealized_pnl,
            2,
        ),

        "total_pnl": round(
            account["realized_pnl"]
            + total_unrealized_pnl,
            2,
        ),

        "invested_value": round(
            total_invested_value,
            2,
        ),

        "current_value": round(
            total_current_value,
            2,
        ),

        "total_equity": round(
            total_equity,
            2,
        ),

        "winning_trades": (
            account["winning_trades"]
        ),

        "losing_trades": (
            account["losing_trades"]
        ),

        "best_trade": (
            round(
                account["best_trade"],
                2,
            )
            if account["best_trade"]
            is not None
            else None
        ),

        "worst_trade": (
            round(
                account["worst_trade"],
                2,
            )
            if account["worst_trade"]
            is not None
            else None
        ),
    }