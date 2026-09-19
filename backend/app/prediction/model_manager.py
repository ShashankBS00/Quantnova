"""
QuantNova AI Model Manager

Responsible for:
    - Checking whether a trained model exists
    - Loading trained models
    - Starting model training
    - Tracking training status
    - Preventing duplicate training jobs
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Any

from app.prediction.model_utils import load_model
from app.prediction.train_classifier import train_classifier


# ============================================================
# TRAINING STATE
# ============================================================

_training_jobs: dict[str, dict[str, Any]] = {}

_training_lock = threading.Lock()


# ============================================================
# HELPERS
# ============================================================

def normalize_symbol(symbol: str) -> str:
    """
    Normalize stock symbol.
    """

    return (
        str(symbol)
        .strip()
        .upper()
    )


def normalize_timeframe(timeframe: str) -> str:
    """
    Normalize timeframe.
    """

    return (
        str(timeframe)
        .strip()
        .lower()
    )


def get_job_key(
    symbol: str,
    timeframe: str,
) -> str:
    """
    Generate unique training job key.
    """

    symbol = normalize_symbol(symbol)
    timeframe = normalize_timeframe(timeframe)

    return f"{symbol}:{timeframe}"


def get_model(
    symbol: str,
    timeframe: str,
) -> dict[str, Any] | None:
    """
    Load an existing trained model.
    """

    symbol = normalize_symbol(symbol)
    timeframe = normalize_timeframe(timeframe)

    return load_model(
        symbol=f"{symbol}_classifier",
        timeframe=timeframe,
    )


def model_exists(
    symbol: str,
    timeframe: str,
) -> bool:
    """
    Check whether a trained model exists.
    """

    return get_model(
        symbol,
        timeframe,
    ) is not None


# ============================================================
# TRAINING STATUS
# ============================================================

def get_training_status(
    symbol: str,
    timeframe: str,
) -> dict[str, Any]:

    symbol = normalize_symbol(symbol)
    timeframe = normalize_timeframe(timeframe)

    job_key = get_job_key(
        symbol,
        timeframe,
    )

    # --------------------------------------------------------
    # Model already exists
    # --------------------------------------------------------

    if model_exists(
        symbol,
        timeframe,
    ):
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "status": "READY",
            "message": "AI model is ready.",
        }

    # --------------------------------------------------------
    # Check training job
    # --------------------------------------------------------

    with _training_lock:

        job = _training_jobs.get(
            job_key
        )

        if job:
            return dict(job)

    # --------------------------------------------------------
    # No model and no training
    # --------------------------------------------------------

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "status": "NOT_TRAINED",
        "message": (
            "AI model is not trained "
            "for this stock and timeframe."
        ),
    }


# ============================================================
# TRAINING WORKER
# ============================================================

def _train_model_worker(
    symbol: str,
    timeframe: str,
    threshold: float = 0.005,
) -> None:
    """
    Background worker responsible for training.
    """

    job_key = get_job_key(
        symbol,
        timeframe,
    )

    try:

        with _training_lock:

            _training_jobs[job_key] = {
                "symbol": symbol,
                "timeframe": timeframe,
                "status": "TRAINING",
                "message": (
                    "AI model training is "
                    "in progress."
                ),
                "started_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

        # ----------------------------------------------------
        # Train model
        # ----------------------------------------------------

        result = train_classifier(
            symbol=symbol,
            timeframe=timeframe,
            period="5y",
            horizon=1,
            threshold=threshold,
        )

        metrics = result.get(
            "metrics",
            {},
        )

        # ----------------------------------------------------
        # Training completed
        # ----------------------------------------------------

        with _training_lock:

            _training_jobs[job_key] = {
                "symbol": symbol,
                "timeframe": timeframe,
                "status": "READY",
                "message": (
                    "AI model trained "
                    "successfully."
                ),
                "started_at": (
                    _training_jobs.get(
                        job_key,
                        {},
                    ).get("started_at")
                ),
                "completed_at": datetime.now(
                    timezone.utc
                ).isoformat(),
                "metrics": {
                    "accuracy": metrics.get(
                        "accuracy"
                    ),
                    "precision_macro": metrics.get(
                        "precision_macro"
                    ),
                    "recall_macro": metrics.get(
                        "recall_macro"
                    ),
                    "f1_macro": metrics.get(
                        "f1_macro"
                    ),
                },
            }

    except Exception as error:

        # ----------------------------------------------------
        # Training failed
        # ----------------------------------------------------

        with _training_lock:

            previous_job = _training_jobs.get(
                job_key,
                {},
            )

            _training_jobs[job_key] = {
                "symbol": symbol,
                "timeframe": timeframe,
                "status": "FAILED",
                "message": (
                    "AI model training failed."
                ),
                "error": str(error),
                "started_at": previous_job.get(
                    "started_at"
                ),
                "failed_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }


# ============================================================
# START TRAINING
# ============================================================

def start_training(
    symbol: str,
    timeframe: str,
    threshold: float = 0.005,
) -> dict[str, Any]:

    symbol = normalize_symbol(symbol)
    timeframe = normalize_timeframe(timeframe)

    job_key = get_job_key(
        symbol,
        timeframe,
    )

    # --------------------------------------------------------
    # Model already exists
    # --------------------------------------------------------

    if model_exists(
        symbol,
        timeframe,
    ):
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "status": "READY",
            "message": (
                "AI model already exists."
            ),
        }

    # --------------------------------------------------------
    # Check existing training job
    # --------------------------------------------------------

    with _training_lock:

        existing_job = _training_jobs.get(
            job_key
        )

        if existing_job:

            existing_status = existing_job.get(
                "status"
            )

            if existing_status == "TRAINING":

                return dict(
                    existing_job
                )

            if existing_status == "READY":

                return dict(
                    existing_job
                )

            # If previous job failed,
            # allow a new attempt.

        _training_jobs[job_key] = {
            "symbol": symbol,
            "timeframe": timeframe,
            "status": "QUEUED",
            "message": (
                "AI model training "
                "has been queued."
            ),
            "queued_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

    # --------------------------------------------------------
    # Start background thread
    # --------------------------------------------------------

    training_thread = threading.Thread(
        target=_train_model_worker,
        kwargs={
            "symbol": symbol,
            "timeframe": timeframe,
            "threshold": threshold,
        },
        daemon=True,
    )

    training_thread.start()

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "status": "QUEUED",
        "message": (
            "AI model training "
            "has started."
        ),
    }


# ============================================================
# RETRY TRAINING
# ============================================================

def retry_training(
    symbol: str,
    timeframe: str,
    threshold: float = 0.005,
) -> dict[str, Any]:

    symbol = normalize_symbol(symbol)
    timeframe = normalize_timeframe(timeframe)

    job_key = get_job_key(
        symbol,
        timeframe,
    )

    with _training_lock:

        existing_job = _training_jobs.get(
            job_key
        )

        if existing_job:

            if existing_job.get(
                "status"
            ) == "TRAINING":

                return dict(
                    existing_job
                )

    return start_training(
        symbol=symbol,
        timeframe=timeframe,
        threshold=threshold,
    )