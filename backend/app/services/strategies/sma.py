import pandas as pd


def calculate_sma(
    history,
    fast_period: int = 20,
    slow_period: int = 50,
):
    if fast_period <= 0 or slow_period <= 0:
        raise ValueError("SMA periods must be greater than 0")

    if fast_period >= slow_period:
        raise ValueError(
            "Fast SMA period must be smaller than slow SMA period"
        )

    history = history.copy()

    close = pd.to_numeric(
        history["Close"],
        errors="coerce",
    )

    history["fast_sma"] = (
        close
        .rolling(fast_period)
        .mean()
    )

    history["slow_sma"] = (
        close
        .rolling(slow_period)
        .mean()
    )

    return history


def get_sma_signal(
    close: float,
    fast_sma: float,
    slow_sma: float,
    previous_fast_sma: float,
    previous_slow_sma: float,
) -> str:

    if any(
        pd.isna(v)
        for v in [
            fast_sma,
            slow_sma,
            previous_fast_sma,
            previous_slow_sma,
        ]
    ):
        return "HOLD"

    # Bullish crossover
    if (
        previous_fast_sma <= previous_slow_sma
        and fast_sma > slow_sma
    ):
        return "BUY"

    # Bearish crossover
    if (
        previous_fast_sma >= previous_slow_sma
        and fast_sma < slow_sma
    ):
        return "SELL"

    return "HOLD"