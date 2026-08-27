import yfinance as yf
import pandas as pd

from app.services.strategy_service import get_strategy
from app.services.strategies.sma_ema import (
    calculate_sma_ema,
    get_sma_ema_signal,
)
from app.services.trading_service import (
    place_paper_order,
)


def run_strategy_paper_trade(
    strategy_id: int,
    capital_per_trade: float = 100000.0,
):
    # --------------------------------
    # Get saved strategy
    # --------------------------------

    strategy = get_strategy(strategy_id)

    symbol = strategy["symbol"]
    strategy_type = strategy["strategy_type"]

    fast_period = strategy["fast_period"]
    slow_period = strategy["slow_period"]

    # --------------------------------
    # Currently supported strategies
    # --------------------------------

    if strategy_type != "SMA_EMA_TREND":
        raise ValueError(
            "Paper trading currently supports "
            "SMA_EMA_TREND only"
        )

    # --------------------------------
    # Download latest market data
    # --------------------------------

    history = yf.download(
        symbol,
        period="3mo",
        interval="1d",
        auto_adjust=False,
        progress=False,
    )

    if history.empty:
        raise ValueError(
            f"No market data found for {symbol}"
        )

    # Handle yfinance MultiIndex
    if isinstance(
        history.columns,
        pd.MultiIndex,
    ):
        history.columns = (
            history.columns
            .get_level_values(0)
        )

    history = history.dropna(
        subset=["Close"]
    )

    if len(history) < slow_period:
        raise ValueError(
            "Not enough market data for this strategy"
        )

    # --------------------------------
    # Calculate indicators
    # --------------------------------

    history = calculate_sma_ema(
        history=history,
        fast_period=fast_period,
        slow_period=slow_period,
    )

    # --------------------------------
    # Latest market data
    # --------------------------------

    latest = history.iloc[-1]

    close = float(latest["Close"])
    fast_ema = float(latest["fast_ema"])
    slow_sma = float(latest["slow_sma"])

    if (
        pd.isna(fast_ema)
        or pd.isna(slow_sma)
    ):
        raise ValueError(
            "Indicators are not ready"
        )

    # --------------------------------
    # Generate signal
    # --------------------------------

    signal = get_sma_ema_signal(
        close=close,
        fast_ema=fast_ema,
        slow_sma=slow_sma,
    )

    # --------------------------------
    # Determine existing holding
    # --------------------------------

    from app.services.trading_service import (
        account,
    )

    holding = account["holdings"].get(
        symbol
    )

    current_quantity = (
        holding["quantity"]
        if holding
        else 0
    )

    # --------------------------------
    # BUY
    # --------------------------------

    if signal == "BUY":

        if current_quantity > 0:

            return {
                "strategy_id": strategy_id,
                "strategy": strategy["name"],
                "symbol": symbol,
                "signal": "BUY",
                "action": "HOLD",
                "message": (
                    "BUY signal detected, "
                    "but position already exists"
                ),
                "price": round(close, 2),
                "fast_ema": round(
                    fast_ema,
                    2,
                ),
                "slow_sma": round(
                    slow_sma,
                    2,
                ),
            }

        quantity = int(
            capital_per_trade // close
        )

        if quantity <= 0:
            raise ValueError(
                "Capital is insufficient "
                "to buy one share"
            )

        order = place_paper_order(
            symbol=symbol,
            quantity=quantity,
            price=close,
            side="BUY",
        )

        return {
            "strategy_id": strategy_id,
            "strategy": strategy["name"],
            "symbol": symbol,
            "signal": "BUY",
            "action": "BUY",
            "price": round(close, 2),
            "fast_ema": round(
                fast_ema,
                2,
            ),
            "slow_sma": round(
                slow_sma,
                2,
            ),
            "quantity": quantity,
            "order": order,
        }

    # --------------------------------
    # SELL
    # --------------------------------

    if signal == "SELL":

        if current_quantity <= 0:

            return {
                "strategy_id": strategy_id,
                "strategy": strategy["name"],
                "symbol": symbol,
                "signal": "SELL",
                "action": "HOLD",
                "message": (
                    "SELL signal detected, "
                    "but no position exists"
                ),
                "price": round(close, 2),
                "fast_ema": round(
                    fast_ema,
                    2,
                ),
                "slow_sma": round(
                    slow_sma,
                    2,
                ),
            }

        order = place_paper_order(
            symbol=symbol,
            quantity=current_quantity,
            price=close,
            side="SELL",
        )

        return {
            "strategy_id": strategy_id,
            "strategy": strategy["name"],
            "symbol": symbol,
            "signal": "SELL",
            "action": "SELL",
            "price": round(close, 2),
            "fast_ema": round(
                fast_ema,
                2,
            ),
            "slow_sma": round(
                slow_sma,
                2,
            ),
            "quantity": current_quantity,
            "order": order,
        }

    # --------------------------------
    # HOLD
    # --------------------------------

    return {
        "strategy_id": strategy_id,
        "strategy": strategy["name"],
        "symbol": symbol,
        "signal": "HOLD",
        "action": "HOLD",
        "price": round(close, 2),
        "fast_ema": round(
            fast_ema,
            2,
        ),
        "slow_sma": round(
            slow_sma,
            2,
        ),
    }