"""
QuantNova AI Prediction History Service

Stores predictions and verifies them when future
market data becomes available.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd
import yfinance as yf

from sqlalchemy.orm import Session

from app.database.models import PredictionHistory


# ============================================================
# HELPERS
# ============================================================

def normalize_prediction_time(
    value,
) -> datetime:
    """
    Convert pandas/Yahoo timestamp into a
    timezone-naive datetime suitable for PostgreSQL.
    """

    timestamp = pd.Timestamp(value)

    if timestamp.tzinfo is not None:
        timestamp = timestamp.tz_convert(
            "UTC"
        ).tz_localize(None)

    return timestamp.to_pydatetime()


def direction_from_return(
    return_percent: float,
    threshold_percent: float = 0.5,
) -> str:
    """
    Convert actual future return into:

        DOWN
        HOLD
        UP
    """

    if return_percent > threshold_percent:
        return "UP"

    if return_percent < -threshold_percent:
        return "DOWN"

    return "HOLD"


# ============================================================
# SAVE PREDICTION
# ============================================================

def save_prediction(
    db: Session,
    *,
    symbol: str,
    timeframe: str,
    prediction: str,
    class_id: int,
    probability: float,
    down_probability: float,
    hold_probability: float,
    up_probability: float,
    prediction_price: float,
    prediction_time,
    model_type: str = "XGBoost",
) -> PredictionHistory:

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

    normalized_time = (
        normalize_prediction_time(
            prediction_time
        )
    )

    # --------------------------------------------------------
    # Check existing prediction
    # --------------------------------------------------------

    existing = (
        db.query(
            PredictionHistory
        )
        .filter(
            PredictionHistory.symbol
            == symbol,
            PredictionHistory.timeframe
            == timeframe,
            PredictionHistory.prediction_time
            == normalized_time,
        )
        .first()
    )

    if existing:
        return existing

    # --------------------------------------------------------
    # Create prediction
    # --------------------------------------------------------

    history = PredictionHistory(
        symbol=symbol,
        timeframe=timeframe,
        prediction=prediction,
        class_id=class_id,
        probability=float(
            probability
        ),
        down_probability=float(
            down_probability
        ),
        hold_probability=float(
            hold_probability
        ),
        up_probability=float(
            up_probability
        ),
        prediction_price=float(
            prediction_price
        ),
        prediction_time=normalized_time,
        model_type=model_type,
    )

    db.add(history)

    db.commit()

    db.refresh(history)

    return history


# ============================================================
# GET HISTORY
# ============================================================

def get_prediction_history(
    db: Session,
    *,
    symbol: str | None = None,
    timeframe: str | None = None,
    limit: int = 50,
) -> list[PredictionHistory]:

    query = db.query(
        PredictionHistory
    )

    if symbol:

        query = query.filter(
            PredictionHistory.symbol
            == symbol.strip().upper()
        )

    if timeframe:

        query = query.filter(
            PredictionHistory.timeframe
            == timeframe.strip().lower()
        )

    query = query.order_by(
        PredictionHistory.prediction_time.desc()
    )

    query = query.limit(
        max(
            1,
            min(
                limit,
                200,
            ),
        )
    )

    return query.all()


# ============================================================
# VERIFY PREDICTIONS
# ============================================================

def verify_predictions(
    db: Session,
    *,
    symbol: str | None = None,
    timeframe: str | None = None,
) -> dict[str, Any]:

    query = db.query(
        PredictionHistory
    ).filter(
        PredictionHistory.actual_price.is_(None)
    )

    if symbol:

        query = query.filter(
            PredictionHistory.symbol
            == symbol.strip().upper()
        )

    if timeframe:

        query = query.filter(
            PredictionHistory.timeframe
            == timeframe.strip().lower()
        )

    pending_predictions = (
        query.all()
    )

    if not pending_predictions:
        return {
            "verified": 0,
            "skipped": 0,
            "total_checked": 0,
        }

    verified = 0
    skipped = 0
    market_cache: dict[tuple[str, str], pd.DataFrame] = {}

    for item in pending_predictions:

        try:

            item_tf = (item.timeframe or timeframe or "1d").strip().lower()

            # ------------------------------------------------
            # Check market data cache or download
            # ------------------------------------------------

            if (item.symbol, item_tf) in market_cache:
                market_data = market_cache[(item.symbol, item_tf)]
            else:
                if item_tf == "1d":
                    period = "1y"
                elif item_tf == "1wk":
                    period = "5y"
                elif item_tf == "1mo":
                    period = "10y"
                else:
                    period = "60d"

                market_data = yf.download(
                    item.symbol,
                    period=period,
                    interval=item_tf,
                    auto_adjust=False,
                    progress=False,
                )

                if (
                    market_data is None
                    or market_data.empty
                ):
                    skipped += 1
                    continue

                if isinstance(
                    market_data.columns,
                    pd.MultiIndex,
                ):
                    market_data.columns = [
                        str(column[0]).lower()
                        for column
                        in market_data.columns
                    ]
                else:
                    market_data.columns = [
                        str(column).lower()
                        for column
                        in market_data.columns
                    ]

                market_cache[(item.symbol, item_tf)] = market_data

            if "close" not in market_data.columns:
                skipped += 1
                continue

            closes = pd.to_numeric(
                market_data["close"],
                errors="coerce",
            ).dropna()

            # ------------------------------------------------
            # Normalize timestamps
            # ------------------------------------------------

            future_prices = []

            prediction_time = (
                pd.Timestamp(
                    item.prediction_time
                )
            )

            for timestamp, price in (
                closes.items()
            ):

                timestamp = pd.Timestamp(
                    timestamp
                )

                if timestamp.tzinfo is not None:

                    timestamp = (
                        timestamp
                        .tz_convert("UTC")
                        .tz_localize(None)
                    )

                if timestamp > prediction_time:

                    future_prices.append(
                        (
                            timestamp,
                            float(price),
                        )
                    )

            # ------------------------------------------------
            # Need a future candle
            # ------------------------------------------------

            if not future_prices:

                skipped += 1
                continue

            future_prices.sort(
                key=lambda x: x[0]
            )

            actual_time, actual_price = (
                future_prices[0]
            )

            # ------------------------------------------------
            # Calculate actual return
            # ------------------------------------------------

            prediction_price = float(
                item.prediction_price
            )

            if prediction_price <= 0:

                skipped += 1
                continue

            actual_return = (
                (
                    actual_price
                    - prediction_price
                )
                / prediction_price
            ) * 100

            actual_direction = (
                direction_from_return(
                    actual_return
                )
            )

            # ------------------------------------------------
            # Compare prediction
            # ------------------------------------------------

            is_correct = (
                item.prediction
                == actual_direction
            )

            # ------------------------------------------------
            # Save result
            # ------------------------------------------------

            item.actual_price = (
                round(actual_price, 2)
            )

            item.actual_return_percent = (
                round(actual_return, 4)
            )

            item.actual_direction = (
                actual_direction
            )

            item.is_correct = (
                is_correct
            )

            item.verified_at = (
                datetime.utcnow()
            )

            verified += 1

        except Exception as error:
            print(f"Error verifying prediction item {item.id}: {error}")
            skipped += 1
            continue

    if verified > 0:
        db.commit()

    return {
        "verified": verified,
        "skipped": skipped,
        "total_checked": len(
            pending_predictions
        ),
    }


# ============================================================
# PERFORMANCE SUMMARY
# ============================================================

def get_prediction_performance(
    db: Session,
    *,
    symbol: str | None = None,
    timeframe: str | None = None,
) -> dict[str, Any]:

    query = db.query(
        PredictionHistory
    ).filter(
        PredictionHistory.is_correct.isnot(None)
    )

    if symbol:

        query = query.filter(
            PredictionHistory.symbol
            == symbol.strip().upper()
        )

    if timeframe:

        query = query.filter(
            PredictionHistory.timeframe
            == timeframe.strip().lower()
        )

    records = query.all()

    total = len(records)

    if total == 0:

        return {
            "total_predictions": 0,
            "correct_predictions": 0,
            "incorrect_predictions": 0,
            "accuracy": None,
        }

    correct = sum(
        1
        for record in records
        if record.is_correct
    )

    incorrect = (
        total - correct
    )

    accuracy = (
        correct / total
    ) * 100

    # --------------------------------------------------------
    # Per-direction performance
    # --------------------------------------------------------

    direction_stats = {}

    for direction in [
        "DOWN",
        "HOLD",
        "UP",
    ]:

        direction_records = [
            record
            for record in records
            if record.prediction
            == direction
        ]

        direction_total = len(
            direction_records
        )

        direction_correct = sum(
            1
            for record
            in direction_records
            if record.is_correct
        )

        direction_accuracy = None

        if direction_total > 0:

            direction_accuracy = (
                direction_correct
                / direction_total
            ) * 100

        direction_stats[
            direction
        ] = {
            "total": direction_total,
            "correct": direction_correct,
            "accuracy": (
                round(
                    direction_accuracy,
                    2,
                )
                if direction_accuracy
                is not None
                else None
            ),
        }

    return {
        "total_predictions": total,
        "correct_predictions": correct,
        "incorrect_predictions": incorrect,
        "accuracy": round(
            accuracy,
            2,
        ),
        "by_direction": direction_stats,
    }