import pandas as pd


def calculate_camarilla_ema20(
    history,
    ema_period: int = 20,
):
    """Calculate previous-candle Camarilla levels and the EMA filter."""

    df = history.copy()

    for column in ("High", "Low", "Close"):
        df[column] = pd.to_numeric(df[column], errors="coerce")

    previous_high = df["High"].shift(1)
    previous_low = df["Low"].shift(1)
    previous_close = df["Close"].shift(1)
    price_range = previous_high - previous_low

    df["pivot"] = (previous_high + previous_low + previous_close) / 3.0
    df["r1"] = previous_close + 1.1 * price_range / 12.0
    df["s1"] = previous_close - 1.1 * price_range / 12.0
    df["r2"] = previous_close + 1.1 * price_range / 6.0
    df["s2"] = previous_close - 1.1 * price_range / 6.0
    df["r3"] = previous_close + 1.1 * price_range / 4.0
    df["s3"] = previous_close - 1.1 * price_range / 4.0
    df["r4"] = previous_close + 1.1 * price_range / 2.0
    df["s4"] = previous_close - 1.1 * price_range / 2.0

    # TradingView Camarilla R5/S5.
    safe_previous_low = previous_low.replace(0, pd.NA)
    df["r5"] = (previous_high / safe_previous_low) * previous_close
    df["s5"] = previous_close - (df["r5"] - previous_close)

    df["ema20"] = df["Close"].ewm(
        span=ema_period,
        adjust=False,
        min_periods=ema_period,
    ).mean()

    return df


def _bullish_ema_cross(history, index):
    if index < 1:
        return False

    previous_close = float(history.iloc[index - 1]["Close"])
    current_close = float(history.iloc[index]["Close"])
    previous_ema = history.iloc[index - 1]["ema20"]
    current_ema = history.iloc[index]["ema20"]

    if pd.isna(previous_ema) or pd.isna(current_ema):
        return False

    return previous_close <= float(previous_ema) and current_close > float(current_ema)


def _bearish_ema_cross(history, index):
    if index < 1:
        return False

    previous_close = float(history.iloc[index - 1]["Close"])
    current_close = float(history.iloc[index]["Close"])
    previous_ema = history.iloc[index - 1]["ema20"]
    current_ema = history.iloc[index]["ema20"]

    if pd.isna(previous_ema) or pd.isna(current_ema):
        return False

    return previous_close >= float(previous_ema) and current_close < float(current_ema)


def _support_touch(history, index):
    row = history.iloc[index]
    low = float(row["Low"])

    return any(
        pd.notna(row[level]) and low <= float(row[level])
        for level in ("s2", "s3", "s4", "s5")
    )


def _resistance_touch(history, index):
    row = history.iloc[index]
    high = float(row["High"])

    return any(
        pd.notna(row[level]) and high >= float(row[level])
        for level in ("r2", "r3", "r4", "r5")
    )


def get_camarilla_ema20_signal(
    history,
    index,
    confirmation_bars: int = 3,
):
    """
    Entry:
      BUY  = S2/S3/S4/S5 touched, then bullish EMA20 cross
             within the same candle or next N candles.
      SELL = R2/R3/R4/R5 touched, then bearish EMA20 cross
             within the same candle or next N candles.

    Exit:
      A bearish EMA20 cross is returned as SELL, allowing the
      current long-only backtester to close a long position.
    """

    if index < 1:
        return "HOLD"

    confirmation_bars = max(0, int(confirmation_bars))

    if pd.isna(history.iloc[index]["ema20"]):
        return "HOLD"

    bullish_cross = _bullish_ema_cross(history, index)
    bearish_cross = _bearish_ema_cross(history, index)

    start = max(0, index - confirmation_bars)

    if bullish_cross:
        for touch_index in range(start, index + 1):
            if _support_touch(history, touch_index):
                return "BUY"

    if bearish_cross:
        for touch_index in range(start, index + 1):
            if _resistance_touch(history, touch_index):
                return "SELL"

        # Current QuantNova backtester is long-only, so a bearish
        # EMA20 cross also acts as the long exit.
        return "SELL"

    return "HOLD"
