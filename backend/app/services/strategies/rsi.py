import pandas as pd


def calculate_rsi(
    history,
    period: int = 14,
):
    if period <= 0:
        raise ValueError(
            "RSI period must be greater than 0"
        )

    history = history.copy()

    close = pd.to_numeric(
        history["Close"],
        errors="coerce",
    )

    delta = close.diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    average_gain = (
        gain
        .rolling(period)
        .mean()
    )

    average_loss = (
        loss
        .rolling(period)
        .mean()
    )

    rs = average_gain / average_loss

    history["rsi"] = (
        100 - (100 / (1 + rs))
    )

    return history


def get_rsi_signal(
    rsi: float,
    oversold: float = 30,
    overbought: float = 70,
) -> str:

    if pd.isna(rsi):
        return "HOLD"

    if rsi <= oversold:
        return "BUY"

    if rsi >= overbought:
        return "SELL"

    return "HOLD"