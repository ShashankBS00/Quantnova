import pandas as pd


# ==========================================
# MACD Strategy
# ==========================================
#
# Parameters:
#   fast_period   - EMA period for the fast line  (default: 12)
#   slow_period   - EMA period for the slow line  (default: 26)
#   signal_period - EMA period for signal line    (default: 9)
#
# Indicators:
#   MACD Line   = EMA(fast) - EMA(slow)
#   Signal Line = EMA(MACD Line, signal_period)
#   Histogram   = MACD Line - Signal Line
#
# Signals:
#   BUY  - MACD crosses ABOVE the signal line (bullish crossover)
#   SELL - MACD crosses BELOW the signal line (bearish crossover)
#   HOLD - No crossover detected
# ==========================================


def calculate_macd(
    history,
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
):
    """
    Calculates MACD line, signal line, and histogram
    and appends them to the history DataFrame.

    Returns the modified DataFrame with columns:
        - macd        : MACD line (fast EMA - slow EMA)
        - macd_signal : Signal line (EMA of MACD)
        - macd_hist   : Histogram (MACD - Signal)
    """

    if fast_period >= slow_period:
        raise ValueError(
            "Fast period must be smaller than slow period"
        )

    close = pd.to_numeric(
        history["Close"],
        errors="coerce",
    )

    fast_ema = (
        close
        .ewm(
            span=fast_period,
            adjust=False,
        )
        .mean()
    )

    slow_ema = (
        close
        .ewm(
            span=slow_period,
            adjust=False,
        )
        .mean()
    )

    macd_line = fast_ema - slow_ema

    signal_line = (
        macd_line
        .ewm(
            span=signal_period,
            adjust=False,
        )
        .mean()
    )

    histogram = macd_line - signal_line

    history["macd"] = macd_line
    history["macd_signal"] = signal_line
    history["macd_hist"] = histogram

    return history


def get_macd_signal(
    current_macd: float,
    current_signal: float,
    previous_macd: float,
    previous_signal: float,
) -> str:
    """
    Generates a BUY / SELL / HOLD signal based on
    a MACD line crossover with the signal line.

    BUY  : MACD crosses above the signal line
           (previous_macd <= previous_signal AND
            current_macd  >  current_signal)

    SELL : MACD crosses below the signal line
           (previous_macd >= previous_signal AND
            current_macd  <  current_signal)

    HOLD : No crossover
    """

    # BUY: bullish crossover
    if (
        previous_macd <= previous_signal
        and current_macd > current_signal
    ):
        return "BUY"

    # SELL: bearish crossover
    if (
        previous_macd >= previous_signal
        and current_macd < current_signal
    ):
        return "SELL"

    return "HOLD"
