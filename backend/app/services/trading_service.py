INITIAL_BALANCE = 100000.0

account = {
    "cash": INITIAL_BALANCE,
    "holdings": {},
    "orders": [],
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

    if side == "BUY":

        if total > account["cash"]:
            raise ValueError("Insufficient paper trading balance")

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
            (old_quantity * old_average) +
            (quantity * price)
        ) / new_quantity

        holding["quantity"] = new_quantity
        holding["average_price"] = new_average

    elif side == "SELL":

        if symbol not in account["holdings"]:
            raise ValueError("You do not own this stock")

        holding = account["holdings"]

        if holding[symbol]["quantity"] < quantity:
            raise ValueError("Insufficient shares to sell")

        holding[symbol]["quantity"] -= quantity

        account["cash"] += total

        if holding[symbol]["quantity"] == 0:
            del holding[symbol]

    else:
        raise ValueError("Side must be BUY or SELL")

    order = {
        "symbol": symbol,
        "quantity": quantity,
        "price": price,
        "side": side,
        "total": round(total, 2),
        "status": "FILLED",
    }

    account["orders"].append(order)

    return order