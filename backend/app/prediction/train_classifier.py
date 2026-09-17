"""
QuantNova - 3-Class AI Direction Classifier

Classes:
    0 = DOWN
    1 = HOLD
    2 = UP

The model predicts the direction of the future return:

    future return > +threshold  -> UP
    future return < -threshold  -> DOWN
    otherwise                    -> HOLD
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import yfinance as yf

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)

from xgboost import XGBClassifier

from app.prediction.feature_engineering import (
    FEATURE_COLUMNS,
    prepare_training_data,
)
from app.prediction.model_utils import save_model


# ============================================================
# CONFIGURATION
# ============================================================

DEFAULT_TIMEFRAME = "1d"
DEFAULT_PERIOD = "5y"
DEFAULT_HORIZON = 1

# Neutral zone.
#
# Example:
#   +0.5% or more  -> UP
#   -0.5% or less  -> DOWN
#   between them   -> HOLD
#
DEFAULT_THRESHOLD = 0.005


# ============================================================
# DATA HELPERS
# ============================================================

def flatten_yfinance_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Flatten MultiIndex columns returned by some yfinance versions.
    """

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


def download_market_data(
    symbol: str,
    timeframe: str,
    period: str,
) -> pd.DataFrame:
    """
    Download historical market data from Yahoo Finance.
    """

    print()
    print("Downloading market data...")

    df = yf.download(
        symbol,
        period=period,
        interval=timeframe,
        auto_adjust=False,
        progress=False,
    )

    if df is None or df.empty:
        raise ValueError(
            f"No market data found for {symbol} "
            f"with timeframe {timeframe}."
        )

    df = flatten_yfinance_columns(df)

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
            "Missing required market columns: "
            + ", ".join(missing_columns)
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
            f"Market data became empty after cleaning for {symbol}."
        )

    return df


# ============================================================
# TARGET CREATION
# ============================================================

def create_direction_target(
    future_returns: pd.Series,
    threshold: float,
) -> pd.Series:
    """
    Convert future returns into three classes.

    0 = DOWN
    1 = HOLD
    2 = UP

    Example with threshold = 0.005:

        return >= +0.5% -> UP
        return <= -0.5% -> DOWN
        otherwise       -> HOLD
    """

    target = pd.Series(
        np.nan,
        index=future_returns.index,
        dtype="float64",
    )

    target[future_returns > threshold] = 2
    target[future_returns < -threshold] = 0

    # Everything inside the neutral zone becomes HOLD.
    neutral_mask = (
        future_returns >= -threshold
    ) & (
        future_returns <= threshold
    )

    target[neutral_mask] = 1

    return target.astype("int64")


# ============================================================
# TRAINING
# ============================================================

def train_classifier(
    symbol: str,
    timeframe: str = DEFAULT_TIMEFRAME,
    period: str = DEFAULT_PERIOD,
    horizon: int = DEFAULT_HORIZON,
    threshold: float = DEFAULT_THRESHOLD,
):
    """
    Train a 3-class XGBoost direction classifier.
    """

    symbol = str(symbol).strip().upper()
    timeframe = str(timeframe).strip().lower()

    if not symbol:
        raise ValueError("Symbol cannot be empty.")

    if horizon < 1:
        raise ValueError(
            "Horizon must be at least 1."
        )

    if threshold <= 0:
        raise ValueError(
            "Threshold must be greater than 0."
        )

    print("=" * 60)
    print("QuantNova AI Direction Classifier")
    print("=" * 60)

    print(f"Symbol    : {symbol}")
    print(f"Timeframe : {timeframe}")
    print(f"Period    : {period}")
    print(f"Horizon   : {horizon}")
    print(
        f"Threshold : {threshold * 100:.2f}%"
    )

    # --------------------------------------------------------
    # DOWNLOAD DATA
    # --------------------------------------------------------

    df = download_market_data(
        symbol=symbol,
        timeframe=timeframe,
        period=period,
    )

    # --------------------------------------------------------
    # FEATURE ENGINEERING
    # --------------------------------------------------------

    print()
    print("Creating features...")

    X, y_return, feature_data = prepare_training_data(
        df,
        horizon=horizon,
    )

    if X.empty or y_return.empty:
        raise ValueError(
            "Feature engineering produced no training data."
        )

    # --------------------------------------------------------
    # CREATE 3-CLASS TARGET
    # --------------------------------------------------------

    y = create_direction_target(
        future_returns=y_return,
        threshold=threshold,
    )

    # Make sure X and y have matching indexes.
    common_index = X.index.intersection(y.index)

    X = X.loc[common_index].copy()
    y = y.loc[common_index].copy()

    # Remove invalid values.
    valid_mask = (
        X.notna().all(axis=1)
        & y.notna()
    )

    X = X.loc[valid_mask]
    y = y.loc[valid_mask]

    # --------------------------------------------------------
    # VALIDATE DATA SIZE
    # --------------------------------------------------------

    minimum_rows = 500

    if len(X) < minimum_rows:
        raise ValueError(
            f"Not enough training data. "
            f"Required at least {minimum_rows} rows, "
            f"but only {len(X)} are available."
        )

    # --------------------------------------------------------
    # TIME-SERIES TRAIN / TEST SPLIT
    # --------------------------------------------------------

    split_index = int(len(X) * 0.80)

    X_train = X.iloc[:split_index].copy()
    X_test = X.iloc[split_index:].copy()

    y_train = y.iloc[:split_index].copy()
    y_test = y.iloc[split_index:].copy()

    print()
    print(f"Training rows : {len(X_train)}")
    print(f"Testing rows  : {len(X_test)}")

    # --------------------------------------------------------
    # CLASS DISTRIBUTION
    # --------------------------------------------------------

    class_names = {
        0: "DOWN",
        1: "HOLD",
        2: "UP",
    }

    print()
    print("TRAIN CLASS DISTRIBUTION")
    print("-" * 40)

    train_counts = y_train.value_counts().sort_index()

    for class_id in [0, 1, 2]:
        count = int(
            train_counts.get(class_id, 0)
        )

        percentage = (
            count / len(y_train) * 100
        )

        print(
            f"{class_names[class_id]:<8}: "
            f"{count:>4} "
            f"({percentage:>6.2f}%)"
        )

    print()
    print("TEST CLASS DISTRIBUTION")
    print("-" * 40)

    test_counts = y_test.value_counts().sort_index()

    for class_id in [0, 1, 2]:
        count = int(
            test_counts.get(class_id, 0)
        )

        percentage = (
            count / len(y_test) * 100
        )

        print(
            f"{class_names[class_id]:<8}: "
            f"{count:>4} "
            f"({percentage:>6.2f}%)"
        )

    # --------------------------------------------------------
    # CHECK THAT ALL CLASSES EXIST
    # --------------------------------------------------------

    missing_train_classes = [
        class_id
        for class_id in [0, 1, 2]
        if class_id not in set(y_train)
    ]

    missing_test_classes = [
        class_id
        for class_id in [0, 1, 2]
        if class_id not in set(y_test)
    ]

    if missing_train_classes:
        raise ValueError(
            "Training data is missing class(es): "
            + ", ".join(
                class_names[class_id]
                for class_id in missing_train_classes
            )
            + ". Try a smaller threshold."
        )

    if missing_test_classes:
        print()
        print(
            "WARNING: Test data does not contain "
            "all three classes."
        )

    # --------------------------------------------------------
    # XGBOOST MODEL
    # --------------------------------------------------------

    print()
    print("Training XGBoost 3-class classifier...")

    model = XGBClassifier(
        n_estimators=500,
        max_depth=5,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,

        objective="multi:softprob",
        num_class=3,

        eval_metric="mlogloss",

        random_state=42,
        n_jobs=-1,

        tree_method="hist",
    )

    model.fit(
        X_train,
        y_train,
    )

    # --------------------------------------------------------
    # PREDICTIONS
    # --------------------------------------------------------

    y_pred = model.predict(X_test)

    y_pred = np.asarray(
        y_pred,
        dtype=int,
    )

    # --------------------------------------------------------
    # PROBABILITIES
    # --------------------------------------------------------

    probabilities = model.predict_proba(
        X_test
    )

    probabilities = np.asarray(
        probabilities
    )

    # --------------------------------------------------------
    # METRICS
    # --------------------------------------------------------

    accuracy = accuracy_score(
        y_test,
        y_pred,
    )

    precision = precision_score(
        y_test,
        y_pred,
        average="macro",
        zero_division=0,
    )

    recall = recall_score(
        y_test,
        y_pred,
        average="macro",
        zero_division=0,
    )

    f1 = f1_score(
        y_test,
        y_pred,
        average="macro",
        zero_division=0,
    )

    # --------------------------------------------------------
    # CONFIDENCE
    # --------------------------------------------------------

    # This is the model's maximum class probability.
    #
    # It is NOT a calibrated probability.
    #
    # Example:
    # [0.10, 0.20, 0.70]
    #
    # confidence = 70%
    #
    # We will later calibrate these probabilities
    # before showing them as trading confidence.

    max_probabilities = probabilities.max(
        axis=1
    )

    average_confidence = (
        float(max_probabilities.mean())
        * 100
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("CLASSIFIER EVALUATION")
    print("=" * 60)

    print(
        f"Accuracy           : "
        f"{accuracy * 100:.2f}%"
    )

    print(
        f"Macro Precision    : "
        f"{precision * 100:.2f}%"
    )

    print(
        f"Macro Recall       : "
        f"{recall * 100:.2f}%"
    )

    print(
        f"Macro F1 Score     : "
        f"{f1 * 100:.2f}%"
    )

    print(
        f"Average confidence: "
        f"{average_confidence:.2f}%"
    )

    # --------------------------------------------------------
    # CLASSIFICATION REPORT
    # --------------------------------------------------------

    print()
    print("Classification Report")

    report = classification_report(
        y_test,
        y_pred,
        labels=[0, 1, 2],
        target_names=[
            "DOWN",
            "HOLD",
            "UP",
        ],
        zero_division=0,
    )

    print(report)

    # --------------------------------------------------------
    # CONFUSION MATRIX
    # --------------------------------------------------------

    print("Confusion Matrix")

    matrix = confusion_matrix(
        y_test,
        y_pred,
        labels=[0, 1, 2],
    )

    print()
    print(
        "              Predicted"
    )
    print(
        "              DOWN  HOLD  UP"
    )

    for row_index, row in enumerate(matrix):
        print(
            f"Actual {class_names[row_index]:<4} "
            f"{row[0]:>5} "
            f"{row[1]:>5} "
            f"{row[2]:>4}"
        )

    # --------------------------------------------------------
    # FEATURE IMPORTANCE
    # --------------------------------------------------------

    print()
    print("FEATURE IMPORTANCE")
    print("-" * 60)

    feature_importance = pd.Series(
        model.feature_importances_,
        index=X_train.columns,
    ).sort_values(
        ascending=False
    )

    for feature, importance in feature_importance.items():
        print(
            f"{feature:<25} "
            f"{importance:.4f}"
        )

    # --------------------------------------------------------
    # SAVE MODEL
    # --------------------------------------------------------

    print()

    model_feature_columns = list(
        X_train.columns
    )

    save_model(
        model=model,
        symbol=f"{symbol}_classifier",
        timeframe=timeframe,
        feature_columns=model_feature_columns,
    )

    # --------------------------------------------------------
    # SAVE TRAINING METADATA
    # --------------------------------------------------------

    metrics = {
        "symbol": symbol,
        "timeframe": timeframe,
        "period": period,
        "horizon": horizon,
        "threshold": threshold,

        "classes": {
            "0": "DOWN",
            "1": "HOLD",
            "2": "UP",
        },

        "training_rows": len(X_train),
        "testing_rows": len(X_test),

        "accuracy": float(accuracy),
        "precision_macro": float(precision),
        "recall_macro": float(recall),
        "f1_macro": float(f1),

        "average_model_probability": float(
            average_confidence / 100
        ),

        "train_class_distribution": {
            class_names[class_id]: int(
                train_counts.get(
                    class_id,
                    0,
                )
            )
            for class_id in [0, 1, 2]
        },

        "test_class_distribution": {
            class_names[class_id]: int(
                test_counts.get(
                    class_id,
                    0,
                )
            )
            for class_id in [0, 1, 2]
        },

        "feature_columns": model_feature_columns,
    }

    # Print summary so it is easy to inspect.
    print()
    print("=" * 60)
    print("MODEL TRAINING COMPLETE")
    print("=" * 60)

    print(
        f"Symbol       : {symbol}"
    )

    print(
        f"Timeframe    : {timeframe}"
    )

    print(
        f"Threshold    : "
        f"{threshold * 100:.2f}%"
    )

    print(
        f"Accuracy     : "
        f"{accuracy * 100:.2f}%"
    )

    print(
        f"Macro F1     : "
        f"{f1 * 100:.2f}%"
    )

    print()
    print("Model metadata:")
    print(metrics)

    print()
    print("Model saved successfully.")

    return {
        "model": model,
        "metrics": metrics,
        "feature_importance": feature_importance,
    }


# ============================================================
# COMMAND LINE INTERFACE
# ============================================================

def main():
    """
    Command-line entry point.

    Usage:

        python -m app.prediction.train_classifier TCS.NS 1d

    Optional threshold:

        python -m app.prediction.train_classifier TCS.NS 1d 0.005
    """

    if len(sys.argv) < 2:
        print(
            "Usage:"
        )

        print(
            "python -m "
            "app.prediction.train_classifier "
            "TCS.NS 1d"
        )

        print()

        print(
            "Optional:"
        )

        print(
            "python -m "
            "app.prediction.train_classifier "
            "TCS.NS 1d 0.005"
        )

        sys.exit(1)

    symbol = sys.argv[1]

    timeframe = (
        sys.argv[2]
        if len(sys.argv) >= 3
        else DEFAULT_TIMEFRAME
    )

    threshold = (
        float(sys.argv[3])
        if len(sys.argv) >= 4
        else DEFAULT_THRESHOLD
    )

    try:
        train_classifier(
            symbol=symbol,
            timeframe=timeframe,
            period=DEFAULT_PERIOD,
            horizon=DEFAULT_HORIZON,
            threshold=threshold,
        )

    except Exception as error:
        print()
        print("=" * 60)
        print("TRAINING FAILED")
        print("=" * 60)
        print(
            f"Error: {error}"
        )

        raise


if __name__ == "__main__":
    main()