INITIAL_BALANCE = 100000.0


account = {
    "cash": INITIAL_BALANCE,
    "holdings": {},
    "orders": [],

    # Trading analytics
    "realized_pnl": 0.0,
    "winning_trades": 0,
    "losing_trades": 0,
    "best_trade": None,
    "worst_trade": None,
}


def place_paper_order(
    symbol: str,
    quantity: int,
    price: float,
    side: str,
):
    symbol = symbol.upper()
    side = side.upper()

    total = quantity * price

    # -------------------------
    # BUY
    # -------------------------

    if side == "BUY":

        if total > account["cash"]:
            raise ValueError(
                "Insufficient paper trading balance"
            )

        account["cash"] -= total

        if symbol not in account["holdings"]:
            account["holdings"][symbol] = {
                "quantity": 0,
                "average_price": 0.0,
            }

        holding = account["holdings"][symbol]

        old_quantity = holding["quantity"]
        old_average = holding["average_price"]

        new_quantity = old_quantity + quantity

        new_average = (
            (old_quantity * old_average)
            + (quantity * price)
        ) / new_quantity

        holding["quantity"] = new_quantity
        holding["average_price"] = new_average

        realized_pnl = 0.0

    # -------------------------
    # SELL
    # -------------------------

    elif side == "SELL":

        if symbol not in account["holdings"]:
            raise ValueError(
                "You do not own this stock"
            )

        holding = account["holdings"][symbol]

        if holding["quantity"] < quantity:
            raise ValueError(
                "Insufficient shares to sell"
            )

        average_price = holding["average_price"]

        # Calculate realized P&L
        realized_pnl = (
            price - average_price
        ) * quantity

        # Update holding
        holding["quantity"] -= quantity

        # Add sale proceeds to cash
        account["cash"] += total

        # Update analytics
        account["realized_pnl"] += realized_pnl

        if realized_pnl > 0:
            account["winning_trades"] += 1

        elif realized_pnl < 0:
            account["losing_trades"] += 1

        # Best trade
        if (
            account["best_trade"] is None
            or realized_pnl > account["best_trade"]
        ):
            account["best_trade"] = realized_pnl

        # Worst trade
        if (
            account["worst_trade"] is None
            or realized_pnl < account["worst_trade"]
        ):
            account["worst_trade"] = realized_pnl

        # Remove holding if fully sold
        if holding["quantity"] == 0:
            del account["holdings"][symbol]

    # -------------------------
    # Invalid side
    # -------------------------

    else:
        raise ValueError(
            "Side must be BUY or SELL"
        )

    # -------------------------
    # Create order
    # -------------------------

    # Account equity after this order
    equity = account["cash"]

    for holding in account["holdings"].values():
        equity += (
            holding["quantity"]
            * holding["average_price"]
        )

    order = {
        "symbol": symbol,
        "quantity": quantity,
        "price": round(price, 2),
        "side": side,
        "total": round(total, 2),
        "realized_pnl": round(realized_pnl, 2),
        "equity": round(equity, 2),
        "status": "FILLED",
    }

    account["orders"].append(order)

    return order