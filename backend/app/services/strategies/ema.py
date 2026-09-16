import pandas as pd


def calculate_ema(
    history,
    fast_period: int = 20,
    slow_period: int = 50,
):
    if fast_period <= 0 or slow_period <= 0:
        raise ValueError("EMA periods must be greater than 0")

    if fast_period >= slow_period:
        raise ValueError(
            "Fast EMA period must be smaller than slow EMA period"
        )

    history = history.copy()

    close = pd.to_numeric(
        history["Close"],
        errors="coerce",
    )

    history["fast_ema"] = (
        close
        .ewm(
            span=fast_period,
            adjust=False,
        )
        .mean()
    )

    history["slow_ema"] = (
        close
        .ewm(
            span=slow_period,
            adjust=False,
        )
        .mean()
    )

    return history


def get_ema_signal(
    close: float,
    fast_ema: float,
    slow_ema: float,
    previous_fast_ema: float,
    previous_slow_ema: float,
) -> str:

    if any(
        pd.isna(v)
        for v in [
            fast_ema,
            slow_ema,
            previous_fast_ema,
            previous_slow_ema,
        ]
    ):
        return "HOLD"

    # Bullish crossover
    if (
        previous_fast_ema <= previous_slow_ema
        and fast_ema > slow_ema
    ):
        return "BUY"

    # Bearish crossover
    if (
        previous_fast_ema >= previous_slow_ema
        and fast_ema < slow_ema
    ):
        return "SELL"

    return "HOLD"