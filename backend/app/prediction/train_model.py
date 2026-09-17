import sys
from pathlib import Path

import yfinance as yf

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

from xgboost import XGBRegressor

from app.prediction.feature_engineering import (
    FEATURE_COLUMNS,
    prepare_training_data,
)

from app.prediction.model_utils import (
    save_model,
)


def train_model(
    symbol: str,
    timeframe: str = "1d",
    period: str = "5y",
    horizon: int = 1,
):
    print("=" * 60)
    print("QuantNova AI Prediction Model Training")
    print("=" * 60)

    print(f"Symbol    : {symbol}")
    print(f"Timeframe : {timeframe}")
    print(f"Period    : {period}")
    print(f"Horizon   : {horizon}")

    # --------------------------------------------------
    # Download historical data
    # --------------------------------------------------

    print("\nDownloading market data...")

    data = yf.download(
        symbol,
        period=period,
        interval=timeframe,
        auto_adjust=False,
        progress=False,
    )

    if data.empty:
        raise ValueError(
            f"No market data found for {symbol}"
        )

    # --------------------------------------------------
    # Flatten yfinance columns
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
    # Prepare dataset
    # --------------------------------------------------

    print("Creating features...")

    X, y, processed = prepare_training_data(
        data,
        horizon=horizon,
    )

    if len(X) < 500:
        raise ValueError(
            f"Not enough training data. "
            f"Only {len(X)} usable rows."
        )

    # --------------------------------------------------
    # Time-series split
    # --------------------------------------------------

    split_index = int(
        len(X) * 0.8
    )

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    print(
        f"\nTraining rows : {len(X_train)}"
    )

    print(
        f"Testing rows  : {len(X_test)}"
    )

    # --------------------------------------------------
    # XGBoost model
    # --------------------------------------------------

    model = XGBRegressor(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
        n_jobs=-1,
    )

    print("\nTraining XGBoost...")

    model.fit(
        X_train,
        y_train,
        eval_set=[
            (X_test, y_test)
        ],
        verbose=False,
    )

    # --------------------------------------------------
    # Evaluation
    # --------------------------------------------------

    predictions = model.predict(
        X_test
    )

    mae = mean_absolute_error(
        y_test,
        predictions,
    )

    mse = mean_squared_error(
        y_test,
        predictions,
    )

    rmse = mse ** 0.5

    r2 = r2_score(
        y_test,
        predictions,
    )

    # Directional accuracy
    actual_direction = (
        y_test >= 0
    )

    predicted_direction = (
        predictions >= 0
    )

    directional_accuracy = (
        actual_direction ==
        predicted_direction
    ).mean() * 100

    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)

    print(
        f"MAE                 : {mae:.6f}"
    )

    print(
        f"RMSE                : {rmse:.6f}"
    )

    print(
        f"R²                  : {r2:.4f}"
    )

    print(
        f"Directional Accuracy: "
        f"{directional_accuracy:.2f}%"
    )

    # --------------------------------------------------
    # Feature importance
    # --------------------------------------------------

    print("\nFEATURE IMPORTANCE")

    importance = sorted(
        zip(
            FEATURE_COLUMNS,
            model.feature_importances_,
        ),
        key=lambda x: x[1],
        reverse=True,
    )

    for name, value in importance:
        print(
            f"{name:<25} "
            f"{value:.4f}"
        )

    # --------------------------------------------------
    # Save model
    # --------------------------------------------------

    model_path = save_model(
        model=model,
        symbol=symbol,
        timeframe=timeframe,
        feature_columns=FEATURE_COLUMNS,
    )

    print("\nModel saved:")
    print(model_path)

    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "training_rows": len(X_train),
        "testing_rows": len(X_test),
        "mae": float(mae),
        "rmse": float(rmse),
        "r2": float(r2),
        "directional_accuracy": float(
            directional_accuracy
        ),
        "model_path": str(model_path),
    }


if __name__ == "__main__":

    symbol = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "TCS.NS"
    )

    timeframe = (
        sys.argv[2]
        if len(sys.argv) > 2
        else "1d"
    )

    train_model(
        symbol=symbol,
        timeframe=timeframe,
    )