from __future__ import annotations

from typing import Any

import yfinance as yf
import pandas as pd
from fastapi import APIRouter, HTTPException

from app.prediction.feature_engineering import add_features
from app.prediction.model_utils import load_model


router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"],
)


# ============================================================
# HELPERS
# ============================================================

def flatten_yfinance_columns(
    df: pd.DataFrame,
) -> pd.DataFrame:

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [
            str(column[0]).lower()
            if isinstance(column, tuple)
            else str(column).lower()
            for column in df.columns
        ]
    else:
        df.columns = [
            str(column).lower()
            for column in df.columns
        ]

    return df


def download_latest_data(
    symbol: str,
    timeframe: str,
) -> pd.DataFrame:

    # For daily predictions, use enough history
    # to calculate SMA 50, volatility, etc.
    if timeframe == "1d":
        period = "1y"
    elif timeframe in {"1wk", "1mo"}:
        period = "5y"
    else:
        period = "60d"

    df = yf.download(
        symbol,
        period=period,
        interval=timeframe,
        auto_adjust=False,
        progress=False,
    )

    if df is None or df.empty:
        raise ValueError(
            f"No market data available for {symbol}."
        )

    df = flatten_yfinance_columns(df)

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
        if column not in df.columns
    ]

    if missing:
        raise ValueError(
            "Missing market columns: "
            + ", ".join(missing)
        )

    df = df[required_columns].copy()

    for column in required_columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce",
        )

    df = df.dropna()

    if df.empty:
        raise ValueError(
            "No valid market data after cleaning."
        )

    return df


# ============================================================
# PREDICTION ENDPOINT
# ============================================================

@router.get("/predict")
def predict(
    symbol: str = "TCS.NS",
    timeframe: str = "1d",
) -> dict[str, Any]:

    try:

        symbol = (
            str(symbol)
            .strip()
            .upper()
        )

        timeframe = (
            str(timeframe)
            .strip()
            .lower()
        )

        if not symbol:
            raise ValueError(
                "Symbol cannot be empty."
            )

        # ----------------------------------------------------
        # LOAD TRAINED MODEL
        # ----------------------------------------------------

        model_payload = load_model(
            symbol=f"{symbol}_classifier",
            timeframe=timeframe,
        )

        if model_payload is None:
            raise ValueError(
                f"No trained classifier found for "
                f"{symbol} ({timeframe}). "
                f"Train the model first."
            )

        model = model_payload["model"]

        feature_columns = model_payload.get(
            "feature_columns"
        )

        if not feature_columns:
            raise ValueError(
                "Saved model does not contain "
                "feature column information."
            )

        # ----------------------------------------------------
        # DOWNLOAD MARKET DATA
        # ----------------------------------------------------

        df = download_latest_data(
            symbol=symbol,
            timeframe=timeframe,
        )

        # ----------------------------------------------------
        # FEATURE ENGINEERING
        # ----------------------------------------------------

        feature_df = add_features(
            df.copy()
        )

        feature_df = feature_df.dropna()

        if feature_df.empty:
            raise ValueError(
                "Unable to create prediction features."
            )

        # Latest completed feature row
        latest = feature_df.iloc[-1]

        X_latest = pd.DataFrame(
            [
                {
                    column: latest[column]
                    for column in feature_columns
                }
            ]
        )

        # ----------------------------------------------------
        # PREDICT
        # ----------------------------------------------------

        prediction = int(
            model.predict(X_latest)[0]
        )

        probabilities = model.predict_proba(
            X_latest
        )[0]

        # ----------------------------------------------------
        # MAP CLASS
        # ----------------------------------------------------

        class_names = {
            0: "DOWN",
            1: "HOLD",
            2: "UP",
        }

        direction = class_names.get(
            prediction,
            "HOLD",
        )

        # XGBoost class order should be [0, 1, 2]
        probability_map = {
            "DOWN": float(probabilities[0]),
            "HOLD": float(probabilities[1]),
            "UP": float(probabilities[2]),
        }

        probability = float(
            probabilities[prediction]
        )

        # ----------------------------------------------------
        # CURRENT MARKET DATA
        # ----------------------------------------------------

        current_price = float(
            latest["close"]
        )

        previous_close = None

        if len(feature_df) >= 2:
            previous_close = float(
                feature_df.iloc[-2]["close"]
            )

        daily_change_percent = None

        if (
            previous_close is not None
            and previous_close != 0
        ):
            daily_change_percent = (
                (
                    current_price
                    - previous_close
                )
                / previous_close
            ) * 100

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return {
            "success": True,

            "symbol": symbol,

            "timeframe": timeframe,

            "prediction": direction,

            "class_id": prediction,

            "probability": round(
                probability,
                4,
            ),

            "probability_percent": round(
                probability * 100,
                2,
            ),

            "probabilities": {
                "DOWN": round(
                    probability_map["DOWN"],
                    4,
                ),
                "HOLD": round(
                    probability_map["HOLD"],
                    4,
                ),
                "UP": round(
                    probability_map["UP"],
                    4,
                ),
            },

            "current_price": round(
                current_price,
                2,
            ),

            "daily_change_percent": (
                round(
                    daily_change_percent,
                    2,
                )
                if daily_change_percent is not None
                else None
            ),

            "prediction_time": str(
                feature_df.index[-1]
            ),

            "model": {
                "type": "XGBoost",
                "classes": [
                    "DOWN",
                    "HOLD",
                    "UP",
                ],
            },
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Prediction failed: "
                f"{str(error)}"
            ),
        )