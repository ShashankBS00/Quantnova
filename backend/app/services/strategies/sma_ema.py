import pandas as pd


def calculate_sma_ema(
    history,
    fast_period: int,
    slow_period: int,
):
    if fast_period >= slow_period:
        raise ValueError(
            "Fast period must be smaller than slow period"
        )

    history["fast_ema"] = (
        history["Close"]
        .ewm(
            span=fast_period,
            adjust=False,
        )
        .mean()
    )

    history["slow_sma"] = (
        history["Close"]
        .rolling(slow_period)
        .mean()
    )

    return history


def get_sma_ema_signal(
    close: float,
    fast_ema: float,
    slow_sma: float,
):
    # BUY:
    # Fast EMA is above Slow SMA
    # AND price is above Fast EMA

    if (
        fast_ema > slow_sma
        and close > fast_ema
    ):
        return "BUY"

    # SELL:
    # Fast EMA is below Slow SMA
    # OR price is below Fast EMA

    if (
        fast_ema < slow_sma
        or close < fast_ema
    ):
        return "SELL"

    return "HOLD"