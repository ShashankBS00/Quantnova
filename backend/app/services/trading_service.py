from decimal import Decimal

from sqlalchemy.orm import Session

from app.database.models import (
    TradingAccount,
    Holding,
    Order,
)


# ==========================================
# Get or create user's trading account
# ==========================================

def get_or_create_trading_account(
    db: Session,
    user_id: int,
):
    account = (
        db.query(TradingAccount)
        .filter(
            TradingAccount.user_id == user_id
        )
        .first()
    )

    if account:
        return account

    account = TradingAccount(
        user_id=user_id,
        initial_cash=100000.00,
        cash=100000.00,
        realized_pnl=0.00,
        winning_trades=0,
        losing_trades=0,
    )

    db.add(account)
    db.commit()
    db.refresh(account)

    return account


# ==========================================
# Place Paper Order
# ==========================================

def place_paper_order(
    db: Session,
    user_id: int,
    symbol: str,
    quantity: int,
    price: float,
    side: str,
    stop_loss: float | None = None,
    target: float | None = None,
):
    symbol = symbol.strip().upper()
    side = side.strip().upper()

    # --------------------------------------
    # Validation
    # --------------------------------------

    if not symbol:
        raise ValueError(
            "Stock symbol is required"
        )

    if quantity <= 0:
        raise ValueError(
            "Quantity must be greater than 0"
        )

    if price <= 0:
        raise ValueError(
            "Price must be greater than 0"
        )

    if side not in ("BUY", "SELL"):
        raise ValueError(
            "Side must be BUY or SELL"
        )

    if stop_loss is not None and stop_loss <= 0:
        raise ValueError(
            "Stop loss must be greater than 0"
        )

    if target is not None and target <= 0:
        raise ValueError(
            "Target must be greater than 0"
        )

    # --------------------------------------
    # Get trading account
    # --------------------------------------

    account = get_or_create_trading_account(
        db=db,
        user_id=user_id,
    )

    total = Decimal(
        str(quantity)
    ) * Decimal(
        str(price)
    )

    # --------------------------------------
    # BUY
    # --------------------------------------

    if side == "BUY":

        if total > account.cash:
            raise ValueError(
                "Insufficient paper trading balance"
            )

        # Reduce cash
        account.cash -= total

        # Find existing holding
        holding = (
            db.query(Holding)
            .filter(
                Holding.account_id == account.id,
                Holding.symbol == symbol,
            )
            .first()
        )

        if holding is None:

            holding = Holding(
                account_id=account.id,
                symbol=symbol,
                quantity=quantity,
                average_price=price,
            )

            db.add(holding)

        else:

            old_quantity = holding.quantity
            old_average = Decimal(
                str(holding.average_price)
            )

            new_quantity = (
                old_quantity + quantity
            )

            new_average = (
                (
                    Decimal(old_quantity)
                    * old_average
                )
                + total
            ) / Decimal(new_quantity)

            holding.quantity = new_quantity
            holding.average_price = (
                new_average
            )

        realized_pnl = Decimal("0.00")

    # --------------------------------------
    # SELL
    # --------------------------------------

    else:

        holding = (
            db.query(Holding)
            .filter(
                Holding.account_id == account.id,
                Holding.symbol == symbol,
            )
            .first()
        )

        if holding is None:
            raise ValueError(
                "You do not own this stock"
            )

        if holding.quantity < quantity:
            raise ValueError(
                "Insufficient shares to sell"
            )

        average_price = Decimal(
            str(holding.average_price)
        )

        realized_pnl = (
            Decimal(str(price))
            - average_price
        ) * Decimal(quantity)

        # Reduce holding
        holding.quantity -= quantity

        # Add sale proceeds
        account.cash += total

        # Update P&L
        account.realized_pnl += realized_pnl

        # Trade statistics
        if realized_pnl > 0:
            account.winning_trades += 1

        elif realized_pnl < 0:
            account.losing_trades += 1

        # Remove completely sold holding
        if holding.quantity == 0:
            db.delete(holding)

    # --------------------------------------
    # Create order
    # --------------------------------------

    order = Order(
        account_id=account.id,
        symbol=symbol,
        side=side,
        quantity=quantity,
        price=price,
        total_amount=total,
        stop_loss=stop_loss,
        target=target,
        status="FILLED",
        realized_pnl=realized_pnl,
    )

    db.add(order)

    db.commit()

    db.refresh(order)
    db.refresh(account)

    # --------------------------------------
    # Calculate equity
    # --------------------------------------

    holdings = (
        db.query(Holding)
        .filter(
            Holding.account_id == account.id
        )
        .all()
    )

    equity = Decimal(
        str(account.cash)
    )

    for holding in holdings:

        equity += (
            Decimal(holding.quantity)
            * Decimal(
                str(holding.average_price)
            )
        )

    # --------------------------------------
    # Return same format as old service
    # --------------------------------------

    return {
        "id": order.id,
        "symbol": order.symbol,
        "quantity": order.quantity,
        "price": round(
            float(order.price),
            2,
        ),
        "side": order.side,
        "total": round(
            float(order.total_amount),
            2,
        ),
        "realized_pnl": round(
            float(order.realized_pnl),
            2,
        ),
        "equity": round(
            float(equity),
            2,
        ),
        "status": order.status,
        "stop_loss": (
            round(
                float(order.stop_loss),
                2,
            )
            if order.stop_loss is not None
            else None
        ),
        "target": (
            round(
                float(order.target),
                2,
            )
            if order.target is not None
            else None
        ),
    }


# ==========================================
# Get Trading Account
# ==========================================

def get_trading_account(
    db: Session,
    user_id: int,
):
    account = get_or_create_trading_account(
        db=db,
        user_id=user_id,
    )

    # --------------------------------------
    # Holdings
    # --------------------------------------

    holdings = (
        db.query(Holding)
        .filter(
            Holding.account_id == account.id
        )
        .order_by(Holding.symbol)
        .all()
    )

    holdings_data = {}

    for holding in holdings:

        holdings_data[holding.symbol] = {
            "quantity": holding.quantity,
            "average_price": round(
                float(
                    holding.average_price
                ),
                2,
            ),
        }

    # --------------------------------------
    # Orders
    # --------------------------------------

    orders = (
        db.query(Order)
        .filter(
            Order.account_id == account.id
        )
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )

    orders_data = []

    for order in orders:

        orders_data.append({
            "id": order.id,
            "symbol": order.symbol,
            "quantity": order.quantity,
            "price": round(
                float(order.price),
                2,
            ),
            "side": order.side,
            "total": round(
                float(order.total_amount),
                2,
            ),
            "realized_pnl": round(
                float(order.realized_pnl),
                2,
            ),
            "status": order.status,
            "stop_loss": (
                round(
                    float(order.stop_loss),
                    2,
                )
                if order.stop_loss is not None
                else None
            ),
            "target": (
                round(
                    float(order.target),
                    2,
                )
                if order.target is not None
                else None
            ),
            "created_at": (
                order.created_at.isoformat()
                if order.created_at
                else None
            ),
        })

    # --------------------------------------
    # Best / Worst Trade
    # --------------------------------------

    sell_orders = [
        order
        for order in orders
        if order.side == "SELL"
    ]

    best_trade = None
    worst_trade = None

    for order in sell_orders:

        pnl = float(
            order.realized_pnl
        )

        if (
            best_trade is None
            or pnl > best_trade
        ):
            best_trade = pnl

        if (
            worst_trade is None
            or pnl < worst_trade
        ):
            worst_trade = pnl

    # --------------------------------------
    # Return account
    # --------------------------------------

    return {
        "initial_cash": round(
            float(account.initial_cash),
            2,
        ),
        "cash": round(
            float(account.cash),
            2,
        ),
        "holdings": holdings_data,
        "orders": orders_data,
        "realized_pnl": round(
            float(account.realized_pnl),
            2,
        ),
        "winning_trades": account.winning_trades,
        "losing_trades": account.losing_trades,
        "best_trade": (
            round(best_trade, 2)
            if best_trade is not None
            else None
        ),
        "worst_trade": (
            round(worst_trade, 2)
            if worst_trade is not None
            else None
        ),
    }
