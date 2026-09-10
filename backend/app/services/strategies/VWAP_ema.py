import pandas as pd


# ==========================================
# VWAP + EMA Strategy
# ==========================================
#
# Parameters:
#   ema_period  - EMA period used for trend confirmation (default: 20)
#
# Indicators:
#   VWAP  = Cumulative(Price * Volume) / Cumulative(Volume)
#           where Price = (High + Low + Close) / 3  (typical price)
#   EMA   = Exponential Moving Average of Close
#
# Signals:
#   BUY  - Close crosses ABOVE VWAP AND Close > EMA  (bullish momentum)
#   SELL - Close crosses BELOW VWAP AND Close < EMA  (bearish momentum)
#   HOLD - No clear crossover or conflicting signals
# ==========================================


def calculate_vwap_ema(
    history,
    ema_period: int = 20,
):
    """
    Calculates VWAP and EMA and appends them to the history DataFrame.

    VWAP is computed as a rolling cumulative VWAP reset per day
    (or over the full dataset if intraday grouping is unavailable).

    Returns the modified DataFrame with columns:
        - vwap : Volume Weighted Average Price
        - ema  : Exponential Moving Average of Close
    """

    df = history.copy()

    # ------------------------------------------
    # Coerce numeric columns
    # ------------------------------------------

    for col in ("High", "Low", "Close", "Volume"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # ------------------------------------------
    # Typical Price  = (High + Low + Close) / 3
    # ------------------------------------------

    df["typical_price"] = (
        df["High"] + df["Low"] + df["Close"]
    ) / 3.0

    # ------------------------------------------
    # VWAP  (cumulative within each calendar day)
    # ------------------------------------------

    if hasattr(df.index, "date"):
        # DatetimeIndex: reset cumulation per day
        df["_date"] = df.index.date
        df["_tp_vol"] = df["typical_price"] * df["Volume"]
        df["_cum_tp_vol"] = df.groupby("_date")["_tp_vol"].cumsum()
        df["_cum_vol"] = df.groupby("_date")["Volume"].cumsum()
        df["vwap"] = df["_cum_tp_vol"] / df["_cum_vol"]
        df.drop(
            columns=["_date", "_tp_vol", "_cum_tp_vol", "_cum_vol"],
            inplace=True,
        )
    else:
        # No datetime index: global cumulative VWAP
        cum_tp_vol = (df["typical_price"] * df["Volume"]).cumsum()
        cum_vol = df["Volume"].cumsum()
        df["vwap"] = cum_tp_vol / cum_vol

    # ------------------------------------------
    # EMA
    # ------------------------------------------

    df["ema"] = (
        df["Close"]
        .ewm(span=ema_period, adjust=False)
        .mean()
    )

    # Drop helper column
    df.drop(columns=["typical_price"], inplace=True, errors="ignore")

    return df


def get_vwap_ema_signal(
    close: float,
    vwap: float,
    ema: float,
    previous_close: float,
    previous_vwap: float,
) -> str:
    """
    Generates a BUY / SELL / HOLD signal based on a
    VWAP crossover confirmed by EMA trend direction.

    BUY  : Close crosses ABOVE VWAP
           (previous_close <= previous_vwap AND close > vwap)
           AND close > ema  (EMA confirmation)

    SELL : Close crosses BELOW VWAP
           (previous_close >= previous_vwap AND close < vwap)
           AND close < ema  (EMA confirmation)

    HOLD : No confirmed crossover
    """

    crossed_above_vwap = (
        previous_close <= previous_vwap
        and close > vwap
    )

    crossed_below_vwap = (
        previous_close >= previous_vwap
        and close < vwap
    )

    # BUY: bullish VWAP crossover confirmed by EMA
    if crossed_above_vwap and close > ema:
        return "BUY"

    # SELL: bearish VWAP crossover confirmed by EMA
    if crossed_below_vwap and close < ema:
        return "SELL"

    return "HOLD"
