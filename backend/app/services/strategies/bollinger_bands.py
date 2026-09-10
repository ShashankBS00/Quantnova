import pandas as pd


# ==========================================
# Bollinger Bands Strategy
# ==========================================
#
# Parameters:
#   period        - Rolling window for SMA and std dev (default: 20)
#   std_deviation - Number of standard deviations for bands (default: 2.0)
#
# Indicators:
#   Middle Band = SMA(Close, period)
#   Upper Band  = Middle + std_deviation * StdDev(Close, period)
#   Lower Band  = Middle - std_deviation * StdDev(Close, period)
#
# Signals:
#   BUY  - Price touches or falls below the lower band (oversold)
#   SELL - Price touches or rises above the upper band (overbought)
#   HOLD - Price is between the bands
# ==========================================


def calculate_bollinger_bands(
    history,
    period: int = 20,
    std_deviation: float = 2.0,
):
    """
    Calculates Bollinger Bands and appends them to the history DataFrame.

    Returns the modified DataFrame with columns:
        - bollinger_middle : Middle band (SMA)
        - bollinger_upper  : Upper band (SMA + N * StdDev)
        - bollinger_lower  : Lower band (SMA - N * StdDev)
        - bollinger_width  : Band width ((upper - lower) / middle)
        - bollinger_pct_b  : %B indicator (position within bands)
    """

    if period < 2:
        raise ValueError(
            "Bollinger Bands period must be at least 2"
        )

    if std_deviation <= 0:
        raise ValueError(
            "Standard deviation multiplier must be positive"
        )

    close = pd.to_numeric(
        history["Close"],
        errors="coerce",
    )

    middle = (
        close
        .rolling(window=period)
        .mean()
    )

    std = (
        close
        .rolling(window=period)
        .std(ddof=0)
    )

    upper = middle + (std_deviation * std)
    lower = middle - (std_deviation * std)

    # Band width: measures volatility (0 = very tight)
    band_width = (upper - lower) / middle

    # %B: where price is relative to bands
    # 1.0 = at upper band, 0.0 = at lower band
    pct_b = (close - lower) / (upper - lower)

    history["bollinger_middle"] = middle
    history["bollinger_upper"] = upper
    history["bollinger_lower"] = lower
    history["bollinger_width"] = band_width
    history["bollinger_pct_b"] = pct_b

    return history


def get_bollinger_signal(
    close: float,
    bollinger_upper: float,
    bollinger_lower: float,
) -> str:
    """
    Generates a BUY / SELL / HOLD signal based on
    price position relative to the Bollinger Bands.

    BUY  : Price is at or below the lower band (mean-reversion entry)
    SELL : Price is at or above the upper band (mean-reversion exit)
    HOLD : Price is within the bands
    """

    # BUY: price touched or pierced the lower band
    if close <= bollinger_lower:
        return "BUY"

    # SELL: price touched or pierced the upper band
    if close >= bollinger_upper:
        return "SELL"

    return "HOLD"
