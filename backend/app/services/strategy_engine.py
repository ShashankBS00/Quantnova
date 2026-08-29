import pandas as pd


def generate_signal(
    df,
    strategy_type: str,
    fast_period: int,
    slow_period: int,
):
    if df is None or df.empty:
        return {
            "signal": "HOLD",
            "price": 0.0,
            "fast_ema": 0.0,
            "slow_sma": 0.0,
        }

    if "Close" not in df.columns:
        return {
            "signal": "HOLD",
            "price": 0.0,
            "fast_ema": 0.0,
            "slow_sma": 0.0,
        }

    close = pd.to_numeric(
        df["Close"],
        errors="coerce"
    ).dropna()

    if len(close) < slow_period:
        return {
            "signal": "HOLD",
            "price": float(close.iloc[-1]) if len(close) else 0.0,
            "fast_ema": 0.0,
            "slow_sma": 0.0,
        }

    # Current market price
    current_price = float(close.iloc[-1])

    # Fast EMA
    fast_ema = float(
        close.ewm(
            span=fast_period,
            adjust=False
        ).mean().iloc[-1]
    )

    # Slow SMA
    slow_sma = float(
        close.rolling(
            window=slow_period
        ).mean().iloc[-1]
    )

    strategy_type = strategy_type.upper()

    signal = "HOLD"

    # ==========================================
    # SMA CROSSOVER
    # ==========================================

    if strategy_type == "SMA_CROSSOVER":

        fast_sma = float(
            close.rolling(
                window=fast_period
            ).mean().iloc[-1]
        )

        slow_sma = float(
            close.rolling(
                window=slow_period
            ).mean().iloc[-1]
        )

        if fast_sma > slow_sma:
            signal = "BUY"

        elif fast_sma < slow_sma:
            signal = "SELL"

    # ==========================================
    # SMA + EMA TREND
    # ==========================================

    elif strategy_type == "SMA_EMA_TREND":

        if (
            current_price > fast_ema
            and fast_ema > slow_sma
        ):
            signal = "BUY"

        elif (
            current_price < fast_ema
            and fast_ema < slow_sma
        ):
            signal = "SELL"

    return {
        "signal": signal,
        "price": round(current_price, 2),
        "fast_ema": round(fast_ema, 2),
        "slow_sma": round(slow_sma, 2),
    }