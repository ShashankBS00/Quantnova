"""
QuantNova Prediction History API
"""

from __future__ import annotations

from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.prediction_history_service import (
    get_prediction_history,
    get_prediction_performance,
    verify_predictions,
)


router = APIRouter(
    prefix="/prediction",
    tags=["Prediction"],
)


# ============================================================
# HISTORY
# ============================================================

@router.get("/history")
def prediction_history(
    symbol: str | None = None,
    timeframe: str | None = None,
    limit: int = 50,
    auto_verify: bool = True,
    db: Session = Depends(get_db),
) -> dict[str, Any]:

    try:

        if auto_verify:
            try:
                verify_predictions(
                    db,
                    symbol=symbol,
                    timeframe=timeframe,
                )
            except Exception as verify_err:
                print(f"Auto-verify non-fatal error: {verify_err}")

        records = (
            get_prediction_history(
                db,
                symbol=symbol,
                timeframe=timeframe,
                limit=limit,
            )
        )

        results = []

        for record in records:

            results.append(
                {
                    "id": record.id,

                    "symbol": record.symbol,

                    "timeframe": (
                        record.timeframe
                    ),

                    "prediction": (
                        record.prediction
                    ),

                    "class_id": (
                        record.class_id
                    ),

                    "probability": float(
                        record.probability
                    ),

                    "probability_percent": round(
                        float(
                            record.probability
                        ) * 100,
                        2,
                    ),

                    "probabilities": {
                        "DOWN": float(
                            record.down_probability
                        ),
                        "HOLD": float(
                            record.hold_probability
                        ),
                        "UP": float(
                            record.up_probability
                        ),
                    },

                    "prediction_price": float(
                        record.prediction_price
                    ),

                    "prediction_time": (
                        record.prediction_time
                        .isoformat()
                    ),

                    "actual_price": (
                        float(
                            record.actual_price
                        )
                        if record.actual_price
                        is not None
                        else None
                    ),

                    "actual_return_percent": (
                        float(
                            record.actual_return_percent
                        )
                        if record.actual_return_percent
                        is not None
                        else None
                    ),

                    "actual_direction": (
                        record.actual_direction
                    ),

                    "is_correct": (
                        record.is_correct
                    ),

                    "verified_at": (
                        record.verified_at.isoformat()
                        if record.verified_at
                        else None
                    ),

                    "model_type": (
                        record.model_type
                    ),

                    "created_at": (
                        record.created_at.isoformat()
                    ),
                }
            )

        return {
            "success": True,
            "count": len(results),
            "results": results,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to load prediction "
                f"history: {str(error)}"
            ),
        )


# ============================================================
# VERIFY
# ============================================================

@router.post("/history/verify")
def verify_prediction_history(
    symbol: str | None = None,
    timeframe: str | None = None,
    db: Session = Depends(get_db),
) -> dict[str, Any]:

    try:

        result = (
            verify_predictions(
                db,
                symbol=symbol,
                timeframe=timeframe,
            )
        )

        return {
            "success": True,
            **result,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to verify predictions: "
                f"{str(error)}"
            ),
        )


# ============================================================
# PERFORMANCE
# ============================================================

@router.get("/performance")
def prediction_performance(
    symbol: str | None = None,
    timeframe: str | None = None,
    auto_verify: bool = True,
    db: Session = Depends(get_db),
) -> dict[str, Any]:

    try:

        if auto_verify:
            try:
                verify_predictions(
                    db,
                    symbol=symbol,
                    timeframe=timeframe,
                )
            except Exception as verify_err:
                print(f"Auto-verify non-fatal error in /performance: {verify_err}")

        performance = (
            get_prediction_performance(
                db,
                symbol=symbol,
                timeframe=timeframe,
            )
        )

        return {
            "success": True,
            **performance,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to calculate prediction "
                f"performance: {str(error)}"
            ),
        )