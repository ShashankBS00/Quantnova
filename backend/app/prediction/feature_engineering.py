import numpy as np
import pandas as pd


FEATURE_COLUMNS = [
    "return_1d",
    "return_5d",
    "return_10d",
    "sma_10_ratio",
    "sma_20_ratio",
    "sma_50_ratio",
    "ema_10_ratio",
    "ema_20_ratio",
    "rsi",
    "macd",
    "macd_signal",
    "macd_hist",
    "bb_position",
    "bb_width",
    "atr_percent",
    "volume_ratio",
    "volatility_10",
    "volatility_20",
]


def add_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create technical and statistical features from OHLCV data.
    """

    data = df.copy()

    # --------------------------------------------------
    # Normalize column names
    # --------------------------------------------------

    data.columns = [
        str(column).strip().lower()
        for column in data.columns
    ]

    required_columns = [
        "open",
        "high",
        "low",
        "close",
        "volume",
    ]

    missing = [
        column
        for column in required_columns
        if column not in data.columns
    ]

    if missing:
        raise ValueError(
            f"Missing required columns: {missing}"
        )

    # --------------------------------------------------
    # Returns
    # --------------------------------------------------

    data["return_1d"] = (
        data["close"].pct_change(1)
    )

    data["return_5d"] = (
        data["close"].pct_change(5)
    )

    data["return_10d"] = (
        data["close"].pct_change(10)
    )

    # --------------------------------------------------
    # SMA
    # --------------------------------------------------

    data["sma_10"] = (
        data["close"]
        .rolling(10)
        .mean()
    )

    data["sma_20"] = (
        data["close"]
        .rolling(20)
        .mean()
    )

    data["sma_50"] = (
        data["close"]
        .rolling(50)
        .mean()
    )

    data["sma_10_ratio"] = (
        data["close"] / data["sma_10"] - 1
    )

    data["sma_20_ratio"] = (
        data["close"] / data["sma_20"] - 1
    )

    data["sma_50_ratio"] = (
        data["close"] / data["sma_50"] - 1
    )

    # --------------------------------------------------
    # EMA
    # --------------------------------------------------

    data["ema_10"] = (
        data["close"]
        .ewm(span=10, adjust=False)
        .mean()
    )

    data["ema_20"] = (
        data["close"]
        .ewm(span=20, adjust=False)
        .mean()
    )

    data["ema_10_ratio"] = (
        data["close"] / data["ema_10"] - 1
    )

    data["ema_20_ratio"] = (
        data["close"] / data["ema_20"] - 1
    )

    # --------------------------------------------------
    # RSI
    # --------------------------------------------------

    delta = data["close"].diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    average_gain = (
        gain.rolling(14).mean()
    )

    average_loss = (
        loss.rolling(14).mean()
    )

    rs = (
        average_gain /
        average_loss.replace(0, np.nan)
    )

    data["rsi"] = (
        100 -
        (100 / (1 + rs))
    )

    # --------------------------------------------------
    # MACD
    # --------------------------------------------------

    ema_12 = (
        data["close"]
        .ewm(span=12, adjust=False)
        .mean()
    )

    ema_26 = (
        data["close"]
        .ewm(span=26, adjust=False)
        .mean()
    )

    data["macd"] = (
        ema_12 - ema_26
    )

    data["macd_signal"] = (
        data["macd"]
        .ewm(span=9, adjust=False)
        .mean()
    )

    data["macd_hist"] = (
        data["macd"] -
        data["macd_signal"]
    )

    # --------------------------------------------------
    # Bollinger Bands
    # --------------------------------------------------

    bb_middle = (
        data["close"]
        .rolling(20)
        .mean()
    )

    bb_std = (
        data["close"]
        .rolling(20)
        .std()
    )

    bb_upper = (
        bb_middle +
        2 * bb_std
    )

    bb_lower = (
        bb_middle -
        2 * bb_std
    )

    data["bb_position"] = (
        (data["close"] - bb_lower) /
        (bb_upper - bb_lower)
    )

    data["bb_width"] = (
        (bb_upper - bb_lower) /
        bb_middle
    )

    # --------------------------------------------------
    # ATR
    # --------------------------------------------------

    previous_close = (
        data["close"].shift(1)
    )

    true_range = pd.concat(
        [
            data["high"] - data["low"],
            (data["high"] - previous_close).abs(),
            (data["low"] - previous_close).abs(),
        ],
        axis=1,
    ).max(axis=1)

    data["atr"] = (
        true_range
        .rolling(14)
        .mean()
    )

    data["atr_percent"] = (
        data["atr"] /
        data["close"]
    )

    # --------------------------------------------------
    # Volume
    # --------------------------------------------------

    volume_average = (
        data["volume"]
        .rolling(20)
        .mean()
    )

    data["volume_ratio"] = (
        data["volume"] /
        volume_average
    )

    # --------------------------------------------------
    # Volatility
    # --------------------------------------------------

    data["volatility_10"] = (
        data["return_1d"]
        .rolling(10)
        .std()
    )

    data["volatility_20"] = (
        data["return_1d"]
        .rolling(20)
        .std()
    )

    return data


def prepare_training_data(
    df: pd.DataFrame,
    horizon: int = 1,
):
    """
    Create X and y for supervised learning.

    Target:
        Future percentage return after `horizon` periods.
    """

    data = add_features(df)

    # Future return target
    data["target"] = (
        data["close"]
        .shift(-horizon)
        / data["close"]
        - 1
    )

    data = data.dropna(
        subset=FEATURE_COLUMNS + ["target"]
    )

    X = data[FEATURE_COLUMNS].copy()
    y = data["target"].copy()

    return X, y, data