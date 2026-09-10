import pandas as pd


# ==========================================
# ADX + EMA Strategy
# ==========================================
#
# Parameters:
#   adx_period    - period for ADX / DI calculation  (default: 14)
#   ema_period    - period for EMA trend filter       (default: 20)
#   adx_threshold - minimum ADX for a valid signal   (default: 25)
#
# Indicators:
#   +DM  = max(High - prev_High, 0)  if > abs(Low - prev_Low) else 0
#   -DM  = max(prev_Low - Low, 0)    if > abs(High - prev_High) else 0
#   TR   = max(High-Low, |High-prev_Close|, |Low-prev_Close|)
#   ATR  = Wilder smoothed TR
#   +DI  = 100 * Wilder(+DM) / ATR
#   -DI  = 100 * Wilder(-DM) / ATR
#   DX   = 100 * |+DI - -DI| / (+DI + -DI)
#   ADX  = Wilder smoothed DX
#   EMA  = Exponential Moving Average of Close
#
# Signals:
#   BUY  - ADX > threshold  AND  Close > EMA  (strong uptrend)
#   SELL - ADX > threshold  AND  Close < EMA  (strong downtrend)
#   HOLD - ADX <= threshold (weak/no trend) or no crossover
# ==========================================


def _wilder_smooth(series, period):
    """Wilder smoothing (equivalent to EMA with span = 2*period - 1)."""
    return series.ewm(
        span=(2 * period - 1),
        adjust=False,
        min_periods=period,
    ).mean()


def calculate_adx_ema(
    history,
    adx_period: int = 14,
    ema_period: int = 20,
):
    """
    Calculates ADX, +DI, -DI, and EMA, appending them to
    the history DataFrame.

    Returns the modified DataFrame with columns:
        - adx      : Average Directional Index
        - plus_di  : +Directional Indicator
        - minus_di : -Directional Indicator
        - ema      : Exponential Moving Average of Close
    """

    df = history.copy()

    # ------------------------------------------
    # Coerce numeric columns
    # ------------------------------------------

    for col in ("High", "Low", "Close"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    high = df["High"]
    low = df["Low"]
    close = df["Close"]
    prev_close = close.shift(1)
    prev_high = high.shift(1)
    prev_low = low.shift(1)

    # ------------------------------------------
    # Directional Movement
    # ------------------------------------------

    up_move = high - prev_high
    down_move = prev_low - low

    plus_dm = up_move.where(
        (up_move > down_move) & (up_move > 0), 0.0
    )

    minus_dm = down_move.where(
        (down_move > up_move) & (down_move > 0), 0.0
    )

    # ------------------------------------------
    # True Range
    # ------------------------------------------

    tr = pd.concat(
        [
            high - low,
            (high - prev_close).abs(),
            (low - prev_close).abs(),
        ],
        axis=1,
    ).max(axis=1)

    # ------------------------------------------
    # Wilder Smoothed ATR, +DM, -DM
    # ------------------------------------------

    atr = _wilder_smooth(tr, adx_period)
    smooth_plus_dm = _wilder_smooth(plus_dm, adx_period)
    smooth_minus_dm = _wilder_smooth(minus_dm, adx_period)

    # ------------------------------------------
    # Directional Indicators
    # ------------------------------------------

    plus_di = 100.0 * smooth_plus_dm / atr
    minus_di = 100.0 * smooth_minus_dm / atr

    # ------------------------------------------
    # DX and ADX
    # ------------------------------------------

    di_sum = plus_di + minus_di
    di_diff = (plus_di - minus_di).abs()

    dx = (100.0 * di_diff / di_sum).where(di_sum != 0, 0.0)
    adx = _wilder_smooth(dx, adx_period)

    # ------------------------------------------
    # EMA
    # ------------------------------------------

    ema = close.ewm(span=ema_period, adjust=False).mean()

    df["adx"] = adx
    df["plus_di"] = plus_di
    df["minus_di"] = minus_di
    df["ema"] = ema

    return df


def get_adx_ema_signal(
    close: float,
    adx: float,
    ema: float,
    previous_close: float,
    previous_ema: float,
    adx_threshold: float = 25.0,
) -> str:
    """
    Generates a BUY / SELL / HOLD signal.

    ADX must exceed the threshold (trend is strong enough),
    then EMA crossover by price determines direction:

    BUY  : ADX > threshold  AND  previous_close <= previous_ema
           AND  close > ema  (price crosses above EMA in strong uptrend)

    SELL : ADX > threshold  AND  previous_close >= previous_ema
           AND  close < ema  (price crosses below EMA in strong downtrend)

    HOLD : ADX <= threshold (weak trend) or no EMA crossover
    """

    if adx <= adx_threshold:
        return "HOLD"

    crossed_above_ema = (
        previous_close <= previous_ema
        and close > ema
    )

    crossed_below_ema = (
        previous_close >= previous_ema
        and close < ema
    )

    if crossed_above_ema:
        return "BUY"

    if crossed_below_ema:
        return "SELL"

    return "HOLD"
