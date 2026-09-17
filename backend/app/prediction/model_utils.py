from pathlib import Path

import joblib


MODEL_DIRECTORY = (
    Path(__file__).resolve().parent /
    "models"
)


def get_model_path(symbol: str, timeframe: str):
    safe_symbol = (
        symbol
        .replace(".", "_")
        .replace("/", "_")
        .upper()
    )

    safe_timeframe = (
        timeframe
        .replace("/", "_")
        .lower()
    )

    MODEL_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    return (
        MODEL_DIRECTORY /
        f"{safe_symbol}_{safe_timeframe}.joblib"
    )


def save_model(
    model,
    symbol: str,
    timeframe: str,
    feature_columns,
):
    path = get_model_path(
        symbol,
        timeframe,
    )

    payload = {
        "model": model,
        "feature_columns": feature_columns,
        "symbol": symbol,
        "timeframe": timeframe,
    }

    joblib.dump(
        payload,
        path,
    )

    return path


def load_model(
    symbol: str,
    timeframe: str,
):
    path = get_model_path(
        symbol,
        timeframe,
    )

    if not path.exists():
        return None

    return joblib.load(path)