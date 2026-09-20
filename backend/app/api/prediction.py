"""
QuantNova AI Prediction API
"""

from __future__ import annotations

from typing import Any

import pandas as pd
import yfinance as yf

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.prediction.feature_engineering import (
    add_features,
)

from app.prediction.model_manager import (
    get_model,
    get_training_status,
    start_training,
    retry_training,
)

from app.services.prediction_history_service import (
    save_prediction,
)


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

    if isinstance(
        df.columns,
        pd.MultiIndex,
    ):

        df.columns = [
            str(column[0]).lower()
            if isinstance(
                column,
                tuple,
            )
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

    # --------------------------------------------------------
    # Yahoo Finance history period
    # --------------------------------------------------------

    if timeframe == "1d":

        period = "1y"

    elif timeframe == "1wk":

        period = "5y"

    elif timeframe == "1mo":

        period = "10y"

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

    df = flatten_yfinance_columns(
        df
    )

    required_columns = [
        "open",
        "high",
        "low",
        "close",
        "volume",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Missing market columns: "
            + ", ".join(
                missing_columns
            )
        )

    df = df[
        required_columns
    ].copy()

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
# PREDICTION
# ============================================================

@router.get("/predict")
def predict(
    symbol: str = "TCS.NS",
    timeframe: str = "1d",
    db: Session = Depends(get_db),
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

        # ----------------------------------------------------
        # Validate
        # ----------------------------------------------------

        if not symbol:

            raise ValueError(
                "Symbol cannot be empty."
            )

        if not timeframe:

            raise ValueError(
                "Timeframe cannot be empty."
            )

        # ----------------------------------------------------
        # Get model
        # ----------------------------------------------------

        model_payload = get_model(
            symbol=symbol,
            timeframe=timeframe,
        )

        # ----------------------------------------------------
        # Model does not exist
        # ----------------------------------------------------

        if model_payload is None:

            training_status = (
                get_training_status(
                    symbol=symbol,
                    timeframe=timeframe,
                )
            )

            status = training_status.get(
                "status"
            )

            # ------------------------------------------------
            # Automatically start training
            # ------------------------------------------------

            if status == "NOT_TRAINED":

                training_result = (
                    start_training(
                        symbol=symbol,
                        timeframe=timeframe,
                        threshold=0.005,
                    )
                )

                return {
                    "success": False,
                    "status": (
                        training_result.get(
                            "status",
                            "QUEUED",
                        )
                    ),
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "message": (
                        "AI model is not available yet. "
                        "Training has been started automatically."
                    ),
                }

            # ------------------------------------------------
            # Training in progress
            # ------------------------------------------------

            if status in {
                "QUEUED",
                "TRAINING",
            }:

                return {
                    "success": False,
                    "status": status,
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "message": (
                        "AI model training is in progress."
                    ),
                }

            # ------------------------------------------------
            # Training failed
            # ------------------------------------------------

            if status == "FAILED":

                return {
                    "success": False,
                    "status": "FAILED",
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "message": (
                        "AI model training failed."
                    ),
                    "error": training_status.get(
                        "error"
                    ),
                }

        # ----------------------------------------------------
        # Model should now exist
        # ----------------------------------------------------

        if model_payload is None:

            raise ValueError(
                "Model is not ready yet."
            )

        model = model_payload[
            "model"
        ]

        feature_columns = (
            model_payload.get(
                "feature_columns"
            )
        )

        if not feature_columns:

            raise ValueError(
                "Saved model does not contain "
                "feature column information."
            )

        # ----------------------------------------------------
        # Download latest market data
        # ----------------------------------------------------

        df = download_latest_data(
            symbol=symbol,
            timeframe=timeframe,
        )

        # ----------------------------------------------------
        # Create features
        # ----------------------------------------------------

        feature_df = add_features(
            df.copy()
        )

        feature_df = feature_df.dropna()

        if feature_df.empty:

            raise ValueError(
                "Unable to create prediction features."
            )

        # ----------------------------------------------------
        # Latest feature row
        # ----------------------------------------------------

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
        # Prediction
        # ----------------------------------------------------

        prediction = int(
            model.predict(
                X_latest
            )[0]
        )

        probabilities = (
            model.predict_proba(
                X_latest
            )[0]
        )

        # ----------------------------------------------------
        # Class mapping
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

        # ----------------------------------------------------
        # Probability mapping
        # ----------------------------------------------------

        probability_map = {
            "DOWN": float(
                probabilities[0]
            ),
            "HOLD": float(
                probabilities[1]
            ),
            "UP": float(
                probabilities[2]
            ),
        }

        prediction_probability = float(
            probabilities[prediction]
        )

        # ----------------------------------------------------
        # Current price
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

        # ====================================================
        # SAVE PREDICTION TO DATABASE
        # ====================================================

        save_prediction(
            db=db,
            symbol=symbol,
            timeframe=timeframe,
            prediction=direction,
            class_id=prediction,
            probability=prediction_probability,
            down_probability=probability_map["DOWN"],
            hold_probability=probability_map["HOLD"],
            up_probability=probability_map["UP"],
            prediction_price=current_price,
            prediction_time=feature_df.index[-1],
            model_type="XGBoost",
        )

        # ====================================================
        # RESPONSE
        # ====================================================

        return {
            "success": True,
            "status": "READY",

            "symbol": symbol,

            "timeframe": timeframe,

            "prediction": direction,

            "class_id": prediction,

            "probability": round(
                prediction_probability,
                4,
            ),

            "probability_percent": round(
                prediction_probability * 100,
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


# ============================================================
# MODEL STATUS
# ============================================================

@router.get("/status")
def prediction_status(
    symbol: str = "TCS.NS",
    timeframe: str = "1d",
) -> dict[str, Any]:

    try:

        status = get_training_status(
            symbol=symbol,
            timeframe=timeframe,
        )

        return {
            "success": True,
            **status,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to get model status: "
                f"{str(error)}"
            ),
        )


# ============================================================
# MANUAL MODEL TRAINING ENDPOINT
# ============================================================

@router.post("/train")
def train_prediction_model(
    symbol: str,
    timeframe: str = "1d",
    threshold: float = 0.005,
) -> dict[str, Any]:

    try:

        if threshold <= 0:

            raise ValueError(
                "Threshold must be greater than zero."
            )

        result = start_training(
            symbol=symbol,
            timeframe=timeframe,
            threshold=threshold,
        )

        return {
            "success": True,
            **result,
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
                "Unable to start training: "
                f"{str(error)}"
            ),
        )


# ============================================================
# RETRY TRAINING
# ============================================================

@router.post("/retry")
def retry_prediction_model(
    symbol: str,
    timeframe: str = "1d",
    threshold: float = 0.005,
) -> dict[str, Any]:

    try:

        if threshold <= 0:

            raise ValueError(
                "Threshold must be greater than zero."
            )

        result = retry_training(
            symbol=symbol,
            timeframe=timeframe,
            threshold=threshold,
        )

        return {
            "success": True,
            **result,
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
                "Unable to retry training: "
                f"{str(error)}"
            ),
        )