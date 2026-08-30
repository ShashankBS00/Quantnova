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

    # ======================================
    # 1. Get Strategy
    # ======================================

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

    # ======================================
    # 2. Get Market Data
    # ======================================

    symbol = (
        strategy.symbol
        .strip()
        .upper()
    )

    df = get_historical_data(symbol)

    if df is None or df.empty:
        raise ValueError(
            f"No market data available for {symbol}"
        )

    # ======================================
    # 3. Get Parameters
    # ======================================

    parameters = strategy.parameters or {}

    if not isinstance(parameters, dict):
        raise ValueError(
            "Invalid strategy parameters"
        )

    # ======================================
    # 4. Generate Signal
    # ======================================

    strategy_result = generate_signal(
        df=df,
        strategy_type=strategy.strategy_type,
        parameters=parameters,
    )

    if not isinstance(
        strategy_result,
        dict,
    ):
        raise ValueError(
            "Strategy engine returned invalid result"
        )

    # ======================================
    # 5. Extract Signal
    # ======================================

    signal = str(
        strategy_result.get(
            "signal",
            "HOLD",
        )
    ).upper()

    # ======================================
    # 6. Extract Price
    # ======================================

    price = strategy_result.get(
        "price"
    )

    if price is None:

        price = float(
            df["Close"].iloc[-1]
        )

    price = float(price)

    if price <= 0:
        raise ValueError(
            "Invalid market price"
        )

    # ======================================
    # 7. Risk Settings
    # ======================================

    stop_loss_percent = None

    if strategy.stop_loss_percent is not None:

        stop_loss_percent = float(
            strategy.stop_loss_percent
        )

    risk_reward_ratio = None

    if strategy.risk_reward_ratio is not None:

        risk_reward_ratio = float(
            strategy.risk_reward_ratio
        )

    # ======================================
    # 8. Result
    # ======================================

    result = {

        "strategy_id":
            strategy.id,

        "strategy":
            strategy.name,

        "symbol":
            symbol,

        "strategy_type":
            strategy.strategy_type,

        "signal":
            signal,

        "action":
            "HOLD",

        "message":
            "",

        "price":
            round(price, 2),

        "parameters":
            parameters,

        "stop_loss_percent":
            stop_loss_percent,

        "risk_reward_ratio":
            risk_reward_ratio,

        "indicators":
            {},
    }

    # ======================================
    # 9. Add Indicator Values
    # ======================================

    indicator_keys = [

        "fast_sma",

        "slow_sma",

        "fast_ema",

        "slow_ema",

        "rsi",

        "macd",

        "macd_signal",

        "bollinger_middle",

        "bollinger_upper",

        "bollinger_lower",
    ]

    for key in indicator_keys:

        if key in strategy_result:

            value = strategy_result[key]

            if value is not None:

                result["indicators"][key] = (
                    round(
                        float(value),
                        4,
                    )
                )

    # ======================================
    # 10. Calculate Stop Loss & Target
    # ======================================

    stop_loss_price = None
    target_price = None

    if (
        stop_loss_percent is not None
        and stop_loss_percent > 0
    ):

        # ----------------------------------
        # BUY
        # ----------------------------------

        if signal == "BUY":

            stop_loss_price = (
                price *
                (
                    1 -
                    stop_loss_percent / 100
                )
            )

            if (
                risk_reward_ratio is not None
                and risk_reward_ratio > 0
            ):

                risk = (
                    price -
                    stop_loss_price
                )

                target_price = (
                    price +
                    (
                        risk *
                        risk_reward_ratio
                    )
                )

        # ----------------------------------
        # SELL
        # ----------------------------------

        elif signal == "SELL":

            stop_loss_price = (
                price *
                (
                    1 +
                    stop_loss_percent / 100
                )
            )

            if (
                risk_reward_ratio is not None
                and risk_reward_ratio > 0
            ):

                risk = (
                    stop_loss_price -
                    price
                )

                target_price = (
                    price -
                    (
                        risk *
                        risk_reward_ratio
                    )
                )

    if stop_loss_price is not None:

        result["stop_loss"] = round(
            stop_loss_price,
            2,
        )

    else:

        result["stop_loss"] = None

    if target_price is not None:

        result["target"] = round(
            target_price,
            2,
        )

    else:

        result["target"] = None

    # ======================================
    # 11. BUY
    # ======================================

    if signal == "BUY":

        account = (
            db.query(TradingAccount)
            .filter(
                TradingAccount.user_id ==
                user_id
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
        # Existing Position
        # ----------------------------------

        holding = (
            db.query(Holding)
            .filter(
                Holding.account_id ==
                account.id,

                Holding.symbol ==
                symbol,
            )
            .first()
        )

        if (
            holding is not None
            and
            holding.quantity > 0
        ):

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

            stop_loss=stop_loss_price,

            target=target_price,
        )

        result["action"] = "BUY"

        result["message"] = (
            "BUY signal detected and "
            "paper order executed"
        )

        result["order"] = order

        return result

    # ======================================
    # 12. SELL
    # ======================================

    if signal == "SELL":

        account = (
            db.query(TradingAccount)
            .filter(
                TradingAccount.user_id ==
                user_id
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
        # Get Holding
        # ----------------------------------

        holding = (
            db.query(Holding)
            .filter(
                Holding.account_id ==
                account.id,

                Holding.symbol ==
                symbol,
            )
            .first()
        )

        if (
            holding is None
            or
            holding.quantity <= 0
        ):

            result["message"] = (
                "SELL signal detected, "
                "but no position exists"
            )

            return result

        # ----------------------------------
        # Sell Position
        # ----------------------------------

        quantity = holding.quantity

        order = place_paper_order(

            db=db,

            user_id=user_id,

            symbol=symbol,

            quantity=quantity,

            price=price,

            side="SELL",

            stop_loss=stop_loss_price,

            target=target_price,
        )

        result["action"] = "SELL"

        result["message"] = (
            "SELL signal detected and "
            "paper order executed"
        )

        result["order"] = order

        return result

    # ======================================
    # 13. HOLD
    # ======================================

    result["action"] = "HOLD"

    result["message"] = (
        f"{signal} signal detected"
    )

    return result