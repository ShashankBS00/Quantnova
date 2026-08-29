from sqlalchemy.orm import Session

from app.database.models import (
    Strategy,
    TradingAccount,
    Holding,
)

from app.services.market_service import (
    get_historical_data,
)

from app.services.strategy_engine import (
    generate_signal,
)

from app.services.trading_service import (
    place_paper_order,
)


# ==========================================
# Run Saved Strategy
# ==========================================

def run_strategy_paper_trade(
    db: Session,
    user_id: int,
    strategy_id: int,
):

    # --------------------------------------
    # Get strategy belonging to this user
    # --------------------------------------

    strategy = (
        db.query(Strategy)
        .filter(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id,
        )
        .first()
    )

    if strategy is None:
        raise ValueError(
            "Strategy not found or does not belong to this user"
        )

    # --------------------------------------
    # Get market data
    # --------------------------------------

    symbol = strategy.symbol

    df = get_historical_data(symbol)

    if df is None or df.empty:
        raise ValueError(
            f"No market data available for {symbol}"
        )

    # --------------------------------------
    # Generate strategy result
    # --------------------------------------

    strategy_result = generate_signal(
        df=df,
        strategy_type=strategy.strategy_type,
        fast_period=strategy.fast_period,
        slow_period=strategy.slow_period,
    )

    # --------------------------------------
    # Extract values
    # --------------------------------------

    signal = strategy_result["signal"].upper()

    price = float(
        strategy_result["price"]
    )

    fast_ema = float(
        strategy_result["fast_ema"]
    )

    slow_sma = float(
        strategy_result["slow_sma"]
    )

    # --------------------------------------
    # Result
    # --------------------------------------

    result = {
        "strategy_id": strategy.id,
        "strategy": strategy.name,
        "symbol": symbol,

        "signal": signal,
        "action": "HOLD",

        "message": "",

        "price": round(price, 2),

        "fast_ema": round(fast_ema, 2),
        "slow_sma": round(slow_sma, 2),
    }

    # ======================================
    # BUY
    # ======================================

    if signal == "BUY":

        # ----------------------------------
        # Get trading account
        # ----------------------------------

        account = (
            db.query(TradingAccount)
            .filter(
                TradingAccount.user_id == user_id
            )
            .first()
        )

        if account is None:

            result["message"] = (
                "BUY signal detected, "
                "but no trading account exists"
            )

            return result

        # ----------------------------------
        # Check existing holding
        # ----------------------------------

        holding = (
            db.query(Holding)
            .filter(
                Holding.account_id == account.id,
                Holding.symbol == symbol,
            )
            .first()
        )

        if holding and holding.quantity > 0:

            result["action"] = "HOLD"

            result["message"] = (
                "BUY signal detected, "
                "but position already exists"
            )

            return result

        # ----------------------------------
        # Execute BUY
        # ----------------------------------

        order = place_paper_order(
            db=db,
            user_id=user_id,
            symbol=symbol,
            quantity=1,
            price=price,
            side="BUY",
        )

        result["action"] = "BUY"

        result["message"] = (
            "BUY signal detected and "
            "paper order executed"
        )

        result["order"] = order

        return result

    # ======================================
    # SELL
    # ======================================

    if signal == "SELL":

        # ----------------------------------
        # Get trading account
        # ----------------------------------

        account = (
            db.query(TradingAccount)
            .filter(
                TradingAccount.user_id == user_id
            )
            .first()
        )

        if account is None:

            result["message"] = (
                "SELL signal detected, "
                "but no trading account exists"
            )

            return result

        # ----------------------------------
        # Get holding
        # ----------------------------------

        holding = (
            db.query(Holding)
            .filter(
                Holding.account_id == account.id,
                Holding.symbol == symbol,
            )
            .first()
        )

        if holding is None or holding.quantity <= 0:

            result["message"] = (
                "SELL signal detected, "
                "but no position exists"
            )

            return result

        # ----------------------------------
        # Sell complete position
        # ----------------------------------

        quantity = holding.quantity

        order = place_paper_order(
            db=db,
            user_id=user_id,
            symbol=symbol,
            quantity=quantity,
            price=price,
            side="SELL",
        )

        result["action"] = "SELL"

        result["message"] = (
            "SELL signal detected and "
            "paper order executed"
        )

        result["order"] = order

        return result

    # ======================================
    # HOLD
    # ======================================

    result["action"] = "HOLD"

    result["message"] = (
        f"{signal} signal detected"
    )

    return result