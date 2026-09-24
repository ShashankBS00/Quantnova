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
#
#   +0.5% or more  -> UP
#   -0.5% or less  -> DOWN
#   between them   -> HOLD
#
DEFAULT_THRESHOLD = 0.005


# ============================================================
# TIMEFRAME CONFIGURATION
# ============================================================

# Minimum number of usable rows required AFTER
# feature engineering and NaN removal.
#
# Weekly and monthly datasets naturally contain
# fewer observations than daily datasets.
MINIMUM_ROWS_BY_TIMEFRAME = {
    "1d": 500,
    "1wk": 400,
    "1mo": 150,
}


# ============================================================
# DATA HELPERS
# ============================================================

def flatten_yfinance_columns(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Flatten MultiIndex columns returned by
    some yfinance versions.
    """

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

    print(
        f"Symbol    : {symbol}"
    )

    print(
        f"Timeframe : {timeframe}"
    )

    print(
        f"Period    : {period}"
    )

    df = yf.download(
        symbol,
        period=period,
        interval=timeframe,
        auto_adjust=False,
        progress=False,
    )

    if df is None or df.empty:

        raise ValueError(
            f"No market data found for "
            f"{symbol} with timeframe "
            f"{timeframe} and period {period}."
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
            "Missing required market columns: "
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
            f"Market data became empty "
            f"after cleaning for {symbol}."
        )

    print(
        f"Downloaded rows: {len(df)}"
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

    target[
        future_returns > threshold
    ] = 2

    target[
        future_returns < -threshold
    ] = 0

    # Everything inside the neutral zone
    # becomes HOLD.

    neutral_mask = (
        future_returns >= -threshold
    ) & (
        future_returns <= threshold
    )

    target[
        neutral_mask
    ] = 1

    return target.astype(
        "int64"
    )


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

    if horizon < 1:

        raise ValueError(
            "Horizon must be at least 1."
        )

    if threshold <= 0:

        raise ValueError(
            "Threshold must be greater than 0."
        )

    # --------------------------------------------------------
    # Validate timeframe
    # --------------------------------------------------------

    supported_timeframes = {
        "1d",
        "1wk",
        "1mo",
    }

    if timeframe not in supported_timeframes:

        raise ValueError(
            f"Unsupported training timeframe: "
            f"{timeframe}. "
            f"Supported timeframes: "
            f"{', '.join(sorted(supported_timeframes))}"
        )

    # --------------------------------------------------------
    # Print configuration
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print("QuantNova AI Direction Classifier")
    print("=" * 60)

    print(
        f"Symbol    : {symbol}"
    )

    print(
        f"Timeframe : {timeframe}"
    )

    print(
        f"Period    : {period}"
    )

    print(
        f"Horizon   : {horizon}"
    )

    print(
        f"Threshold : "
        f"{threshold * 100:.2f}%"
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

    X, y_return, feature_data = (
        prepare_training_data(
            df,
            horizon=horizon,
        )
    )

    if X.empty or y_return.empty:

        raise ValueError(
            "Feature engineering produced "
            "no training data."
        )

    print(
        f"Rows after feature engineering: "
        f"{len(X)}"
    )

    # --------------------------------------------------------
    # CREATE 3-CLASS TARGET
    # --------------------------------------------------------

    y = create_direction_target(
        future_returns=y_return,
        threshold=threshold,
    )

    # --------------------------------------------------------
    # ALIGN X AND Y
    # --------------------------------------------------------

    common_index = X.index.intersection(
        y.index
    )

    X = X.loc[
        common_index
    ].copy()

    y = y.loc[
        common_index
    ].copy()

    # --------------------------------------------------------
    # REMOVE INVALID VALUES
    # --------------------------------------------------------

    valid_mask = (
        X.notna().all(axis=1)
        & y.notna()
    )

    X = X.loc[
        valid_mask
    ].copy()

    y = y.loc[
        valid_mask
    ].copy()

    print(
        f"Usable training rows: "
        f"{len(X)}"
    )

    # --------------------------------------------------------
    # TIMEFRAME-AWARE DATA VALIDATION
    # --------------------------------------------------------

    minimum_rows = (
        MINIMUM_ROWS_BY_TIMEFRAME.get(
            timeframe,
            500,
        )
    )

    print()
    print(
        f"Minimum required rows "
        f"for {timeframe}: "
        f"{minimum_rows}"
    )

    print(
        f"Available usable rows: "
        f"{len(X)}"
    )

    if len(X) < minimum_rows:

        raise ValueError(
            f"Not enough training data "
            f"for {timeframe}. "
            f"Required at least "
            f"{minimum_rows} rows, "
            f"but only {len(X)} "
            f"are available. "
            f"Use a longer historical "
            f"training period."
        )

    # --------------------------------------------------------
    # TIME-SERIES TRAIN / TEST SPLIT
    # --------------------------------------------------------

    split_index = int(
        len(X) * 0.80
    )

    if split_index <= 0:

        raise ValueError(
            "Training split produced "
            "no training rows."
        )

    if split_index >= len(X):

        raise ValueError(
            "Training split produced "
            "no testing rows."
        )

    X_train = X.iloc[
        :split_index
    ].copy()

    X_test = X.iloc[
        split_index:
    ].copy()

    y_train = y.iloc[
        :split_index
    ].copy()

    y_test = y.iloc[
        split_index:
    ].copy()

    print()
    print(
        f"Training rows : "
        f"{len(X_train)}"
    )

    print(
        f"Testing rows  : "
        f"{len(X_test)}"
    )

    # --------------------------------------------------------
    # CLASS DISTRIBUTION
    # --------------------------------------------------------

    class_names = {
        0: "DOWN",
        1: "HOLD",
        2: "UP",
    }

    print()
    print(
        "TRAIN CLASS DISTRIBUTION"
    )

    print(
        "-" * 40
    )

    train_counts = (
        y_train.value_counts()
        .sort_index()
    )

    for class_id in [
        0,
        1,
        2,
    ]:

        count = int(
            train_counts.get(
                class_id,
                0,
            )
        )

        percentage = (
            count
            / len(y_train)
            * 100
        )

        print(
            f"{class_names[class_id]:<8}: "
            f"{count:>4} "
            f"({percentage:>6.2f}%)"
        )

    print()
    print(
        "TEST CLASS DISTRIBUTION"
    )

    print(
        "-" * 40
    )

    test_counts = (
        y_test.value_counts()
        .sort_index()
    )

    for class_id in [
        0,
        1,
        2,
    ]:

        count = int(
            test_counts.get(
                class_id,
                0,
            )
        )

        percentage = (
            count
            / len(y_test)
            * 100
        )

        print(
            f"{class_names[class_id]:<8}: "
            f"{count:>4} "
            f"({percentage:>6.2f}%)"
        )

    # --------------------------------------------------------
    # CHECK TRAINING CLASSES
    # --------------------------------------------------------

    missing_train_classes = [
        class_id
        for class_id in [
            0,
            1,
            2,
        ]
        if class_id
        not in set(y_train)
    ]

    missing_test_classes = [
        class_id
        for class_id in [
            0,
            1,
            2,
        ]
        if class_id
        not in set(y_test)
    ]

    if missing_train_classes:

        raise ValueError(
            "Training data is missing "
            "class(es): "
            + ", ".join(
                class_names[class_id]
                for class_id
                in missing_train_classes
            )
            + ". Try a smaller "
            "threshold or a longer "
            "training period."
        )

    if missing_test_classes:

        print()

        print(
            "WARNING: Test data does "
            "not contain all three "
            "classes."
        )

    # --------------------------------------------------------
    # XGBOOST MODEL
    # --------------------------------------------------------

    print()
    print(
        "Training XGBoost "
        "3-class classifier..."
    )

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

    y_pred = model.predict(
        X_test
    )

    y_pred = np.asarray(
        y_pred,
        dtype=int,
    )

    # --------------------------------------------------------
    # PROBABILITIES
    # --------------------------------------------------------

    probabilities = (
        model.predict_proba(
            X_test
        )
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

    max_probabilities = (
        probabilities.max(
            axis=1
        )
    )

    average_confidence = (
        float(
            max_probabilities.mean()
        )
        * 100
    )

    # --------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print(
        "CLASSIFIER EVALUATION"
    )
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
        f"Average confidence : "
        f"{average_confidence:.2f}%"
    )

    # --------------------------------------------------------
    # CLASSIFICATION REPORT
    # --------------------------------------------------------

    print()
    print(
        "Classification Report"
    )

    report = classification_report(
        y_test,
        y_pred,
        labels=[
            0,
            1,
            2,
        ],
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

    print(
        "Confusion Matrix"
    )

    matrix = confusion_matrix(
        y_test,
        y_pred,
        labels=[
            0,
            1,
            2,
        ],
    )

    print()
    print(
        "              Predicted"
    )

    print(
        "              DOWN  HOLD  UP"
    )

    for row_index, row in enumerate(
        matrix
    ):

        print(
            f"Actual "
            f"{class_names[row_index]:<4} "
            f"{row[0]:>5} "
            f"{row[1]:>5} "
            f"{row[2]:>4}"
        )

    # --------------------------------------------------------
    # FEATURE IMPORTANCE
    # --------------------------------------------------------

    print()
    print(
        "FEATURE IMPORTANCE"
    )

    print(
        "-" * 60
    )

    feature_importance = pd.Series(
        model.feature_importances_,
        index=X_train.columns,
    ).sort_values(
        ascending=False
    )

    for (
        feature,
        importance,
    ) in feature_importance.items():

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

        "training_rows": len(
            X_train
        ),

        "testing_rows": len(
            X_test
        ),

        "total_usable_rows": len(
            X
        ),

        "minimum_required_rows": (
            minimum_rows
        ),

        "accuracy": float(
            accuracy
        ),

        "precision_macro": float(
            precision
        ),

        "recall_macro": float(
            recall
        ),

        "f1_macro": float(
            f1
        ),

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
            for class_id in [
                0,
                1,
                2,
            ]
        },

        "test_class_distribution": {
            class_names[class_id]: int(
                test_counts.get(
                    class_id,
                    0,
                )
            )
            for class_id in [
                0,
                1,
                2,
            ]
        },

        "feature_columns": (
            model_feature_columns
        ),
    }

    # --------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------

    print()
    print("=" * 60)
    print(
        "MODEL TRAINING COMPLETE"
    )
    print("=" * 60)

    print(
        f"Symbol       : {symbol}"
    )

    print(
        f"Timeframe    : {timeframe}"
    )

    print(
        f"Period       : {period}"
    )

    print(
        f"Usable rows  : {len(X)}"
    )

    print(
        f"Train rows   : {len(X_train)}"
    )

    print(
        f"Test rows    : {len(X_test)}"
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
    print(
        "Model saved successfully."
    )

    return {
        "model": model,
        "metrics": metrics,
        "feature_importance": (
            feature_importance
        ),
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

    timeframe = (
        str(timeframe)
        .strip()
        .lower()
    )

    threshold = (
        float(sys.argv[3])
        if len(sys.argv) >= 4
        else DEFAULT_THRESHOLD
    )

    # --------------------------------------------------------
    # Select training period
    # --------------------------------------------------------

    training_periods = {
        "1d": "5y",
        "1wk": "10y",
        "1mo": "20y",
    }

    period = training_periods.get(
        timeframe,
        DEFAULT_PERIOD,
    )

    try:

        train_classifier(
            symbol=symbol,
            timeframe=timeframe,
            period=period,
            horizon=DEFAULT_HORIZON,
            threshold=threshold,
        )

    except Exception as error:

        print()
        print("=" * 60)
        print(
            "TRAINING FAILED"
        )
        print("=" * 60)

        print(
            f"Error: {error}"
        )

        raise


if __name__ == "__main__":
    main()