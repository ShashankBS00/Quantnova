import yfinance as yf

from app.prediction.feature_engineering import (
    add_features,
    FEATURE_COLUMNS,
)

from app.prediction.model_utils import (
    load_model,
)


def predict(
    symbol: str,
    timeframe: str = "1d",
):
    # --------------------------------------------------
    # Load trained model
    # --------------------------------------------------

    payload = load_model(
        symbol,
        timeframe,
    )

    if payload is None:
        raise FileNotFoundError(
            f"No trained model found for "
            f"{symbol} / {timeframe}"
        )

    model = payload["model"]

    # --------------------------------------------------
    # Get latest market data
    # --------------------------------------------------

    data = yf.download(
        symbol,
        period="1y",
        interval=timeframe,
        auto_adjust=False,
        progress=False,
    )

    if data.empty:
        raise ValueError(
            f"No market data found for {symbol}"
        )

    # --------------------------------------------------
    # Flatten columns
    # --------------------------------------------------

    if hasattr(data.columns, "levels"):
        data.columns = [
            column[0]
            if isinstance(column, tuple)
            else column
            for column in data.columns
        ]

    data.columns = [
        str(column).lower()
        for column in data.columns
    ]

    # --------------------------------------------------
    # Features
    # --------------------------------------------------

    data = add_features(data)

    data = data.dropna(
        subset=FEATURE_COLUMNS
    )

    if data.empty:
        raise ValueError(
            "Not enough data to generate prediction."
        )

    latest = data.iloc[-1]

    X = data[
        FEATURE_COLUMNS
    ].iloc[[-1]]

    # --------------------------------------------------
    # Predict future return
    # --------------------------------------------------

    predicted_return = float(
        model.predict(X)[0]
    )

    current_price = float(
        latest["close"]
    )

    predicted_price = (
        current_price *
        (1 + predicted_return)
    )

    # --------------------------------------------------
    # Direction
    # --------------------------------------------------

    if predicted_return > 0.005:
        direction = "BUY"

    elif predicted_return < -0.005:
        direction = "SELL"

    else:
        direction = "HOLD"

    # --------------------------------------------------
    # Confidence
    #
    # This is a simple model-derived score.
    # It is NOT a probability calibration.
    # --------------------------------------------------

    confidence = min(
        95.0,
        max(
            50.0,
            50.0 +
            abs(predicted_return) * 1000,
        ),
    )

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "current_price": current_price,
        "predicted_price": predicted_price,
        "expected_return": predicted_return * 100,
        "direction": direction,
        "confidence": confidence,
        "features": {
            "rsi": float(latest["rsi"]),
            "macd": float(latest["macd"]),
            "macd_signal": float(
                latest["macd_signal"]
            ),
            "macd_hist": float(
                latest["macd_hist"]
            ),
            "sma_20_ratio": float(
                latest["sma_20_ratio"]
            ),
            "ema_20_ratio": float(
                latest["ema_20_ratio"]
            ),
            "bb_position": float(
                latest["bb_position"]
            ),
            "volume_ratio": float(
                latest["volume_ratio"]
            ),
            "volatility_20": float(
                latest["volatility_20"]
            ),
        },
    }