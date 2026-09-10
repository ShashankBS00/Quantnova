import pandas as pd
import numpy as np


# ==========================================
# Supertrend Strategy
# ==========================================
#
# Parameters:
#   period     - ATR period              (default: 10)
#   multiplier - ATR band multiplier     (default: 3.0)
#
# Indicators:
#   ATR         = Average True Range over `period` bars
#   Upper Band  = (High + Low) / 2 + multiplier * ATR
#   Lower Band  = (High + Low) / 2 - multiplier * ATR
#   Supertrend  = adaptive line that flips between
#                 Upper/Lower band on price crossover
#
# Signals:
#   BUY  - Price crosses ABOVE the Supertrend line
#          (trend flips from bearish to bullish)
#   SELL - Price crosses BELOW the Supertrend line
#          (trend flips from bullish to bearish)
#   HOLD - No crossover this bar
# ==========================================


def calculate_supertrend(
    history,
    period: int = 10,
    multiplier: float = 3.0,
):
    """
    Calculates the Supertrend indicator and appends it
    to the history DataFrame.

    Returns the modified DataFrame with columns:
        - supertrend       : Supertrend line value
        - supertrend_trend : 1 = bullish, -1 = bearish
    """

    df = history.copy()

    # ------------------------------------------
    # Coerce columns
    # ------------------------------------------

    for col in ("High", "Low", "Close"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # ------------------------------------------
    # True Range
    # ------------------------------------------

    high = df["High"]
    low = df["Low"]
    prev_close = df["Close"].shift(1)

    tr = pd.concat(
        [
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)

    # ------------------------------------------
    # ATR  (Wilder smoothing = EMA with span = 2*period - 1)
    # ------------------------------------------

    atr = tr.ewm(
        span=(2 * period - 1),
        adjust=False,
        min_periods=period,
    ).mean()

    # ------------------------------------------
    # Basic Bands
    # ------------------------------------------

    hl2 = (high + low) / 2.0

    basic_upper = hl2 + multiplier * atr
    basic_lower = hl2 - multiplier * atr

    # ------------------------------------------
    # Final Bands & Supertrend (iterative)
    # ------------------------------------------

    n = len(df)
    final_upper = np.full(n, np.nan)
    final_lower = np.full(n, np.nan)
    supertrend = np.full(n, np.nan)
    trend = np.zeros(n, dtype=int)

    close = df["Close"].to_numpy()

    for i in range(period, n):

        bu = basic_upper.iloc[i]
        bl = basic_lower.iloc[i]

        # Final upper band
        if np.isnan(final_upper[i - 1]):
            final_upper[i] = bu
        else:
            final_upper[i] = (
                bu if bu < final_upper[i - 1] or close[i - 1] > final_upper[i - 1]
                else final_upper[i - 1]
            )

        # Final lower band
        if np.isnan(final_lower[i - 1]):
            final_lower[i] = bl
        else:
            final_lower[i] = (
                bl if bl > final_lower[i - 1] or close[i - 1] < final_lower[i - 1]
                else final_lower[i - 1]
            )

        # Supertrend direction
        prev_st = supertrend[i - 1]
        prev_trend = trend[i - 1]

        if np.isnan(prev_st):
            # Initialise: below close = bullish
            if close[i] > final_upper[i]:
                supertrend[i] = final_lower[i]
                trend[i] = 1
            else:
                supertrend[i] = final_upper[i]
                trend[i] = -1
        elif prev_st == final_upper[i - 1]:
            # Was bearish
            if close[i] > final_upper[i]:
                supertrend[i] = final_lower[i]
                trend[i] = 1
            else:
                supertrend[i] = final_upper[i]
                trend[i] = -1
        else:
            # Was bullish
            if close[i] < final_lower[i]:
                supertrend[i] = final_upper[i]
                trend[i] = -1
            else:
                supertrend[i] = final_lower[i]
                trend[i] = 1

    df["supertrend"] = supertrend
    df["supertrend_trend"] = trend

    return df


def get_supertrend_signal(
    trend: int,
    previous_trend: int,
) -> str:
    """
    Generates a BUY / SELL / HOLD signal based on
    a Supertrend direction crossover.

    BUY  : trend flips from bearish (-1) to bullish (1)
    SELL : trend flips from bullish (1) to bearish (-1)
    HOLD : no trend change
    """

    if previous_trend != 1 and trend == 1:
        return "BUY"

    if previous_trend != -1 and trend == -1:
        return "SELL"

    return "HOLD"
