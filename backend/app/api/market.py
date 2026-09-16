from fastapi import APIRouter, HTTPException

import yfinance as yf
import pandas as pd
import time


router = APIRouter(
    prefix="/market",
    tags=["Market"],
)


# ==========================================
# Cache
# ==========================================

market_cache = {}

CACHE_DURATION = 30


# ==========================================
# Symbol Mapping
# ==========================================

SYMBOL_MAP = {
    "NIFTY": "^NSEI",
    "NIFTY50": "^NSEI",
    "NIFTY 50": "^NSEI",

    "BANKNIFTY": "^NSEBANK",
    "NIFTYBANK": "^NSEBANK",
    "NIFTY BANK": "^NSEBANK",

    "SENSEX": "^BSESN",
}


# ==========================================
# Timeframe Mapping
# ==========================================

TIMEFRAME_CONFIG = {
    "1m": {
        "interval": "1m",
        "period": "7d",
    },

    "3m": {
        "interval": "3m",
        "period": "60d",
    },

    "5m": {
        "interval": "5m",
        "period": "60d",
    },

    "10m": {
        "interval": "10m",
        "period": "60d",
    },

    "15m": {
        "interval": "15m",
        "period": "60d",
    },

    "30m": {
        "interval": "30m",
        "period": "60d",
    },

    "1h": {
        "interval": "1h",
        "period": "730d",
    },

    "2h": {
        "interval": "2h",
        "period": "730d",
    },

    "4h": {
        "interval": "4h",
        "period": "730d",
    },

    "1d": {
        "interval": "1d",
        "period": "1y",
    },

    "1wk": {
        "interval": "1wk",
        "period": "5y",
    },

    "1mo": {
        "interval": "1mo",
        "period": "10y",
    },
}


# ==========================================
# Normalize Symbol
# ==========================================

def normalize_symbol(symbol: str) -> str:

    symbol = (
        str(symbol)
        .strip()
        .upper()
    )

    if symbol in SYMBOL_MAP:

        return SYMBOL_MAP[symbol]

    if symbol.startswith("^"):

        return symbol

    if "." not in symbol:

        return f"{symbol}.NS"

    return symbol


# ==========================================
# Market History
# ==========================================

@router.get("/history")
def get_history(
    symbol: str = "RELIANCE.NS",
    period: str = "1mo",
    interval: str = "1d",
):

    interval = (
        str(interval)
        .strip()
        .lower()
    )

    if interval not in TIMEFRAME_CONFIG:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported interval: "
                f"{interval}"
            ),
        )

    yahoo_symbol = normalize_symbol(
        symbol
    )

    config = TIMEFRAME_CONFIG[
        interval
    ]

    # --------------------------------------
    # If caller didn't provide an explicit
    # period, use the timeframe default.
    # --------------------------------------

    if not period or period == "auto":

        period = config["period"]

    cache_key = (
        f"{yahoo_symbol}:"
        f"{period}:"
        f"{interval}"
    )

    # --------------------------------------
    # Cache
    # --------------------------------------

    if cache_key in market_cache:

        cached_data, cached_time = (
            market_cache[cache_key]
        )

        if (
            time.time() - cached_time
            < CACHE_DURATION
        ):

            print(
                f"⚡ Cache hit: "
                f"{yahoo_symbol} "
                f"({period}, {interval})"
            )

            return cached_data

    print(
        f"🌐 Fetching Yahoo Finance: "
        f"{yahoo_symbol} "
        f"({period}, {interval})"
    )

    # --------------------------------------
    # Fetch
    # --------------------------------------

    try:

        history = yf.download(
            yahoo_symbol,
            period=period,
            interval=interval,
            auto_adjust=False,
            progress=False,
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Yahoo Finance error: "
                f"{str(error)}"
            ),
        )

    # --------------------------------------
    # Empty
    # --------------------------------------

    if history is None or history.empty:

        raise HTTPException(
            status_code=404,
            detail=(
                f"No market data found "
                f"for {symbol}"
            ),
        )

    # --------------------------------------
    # MultiIndex
    # --------------------------------------

    if isinstance(
        history.columns,
        pd.MultiIndex,
    ):

        history.columns = (
            history.columns
            .get_level_values(0)
        )

    # --------------------------------------
    # Convert numeric columns
    # --------------------------------------

    for column in [
        "Open",
        "High",
        "Low",
        "Close",
        "Volume",
    ]:

        if column in history.columns:

            history[column] = pd.to_numeric(
                history[column],
                errors="coerce",
            )

    data = []

    # --------------------------------------
    # Candles
    # --------------------------------------

    for index, row in history.iterrows():

        if any(
            pd.isna(row[column])
            for column in [
                "Open",
                "High",
                "Low",
                "Close",
            ]
        ):

            continue

        timestamp = int(
            index.timestamp()
        )

        data.append(
            {
                "time": timestamp,

                "open": round(
                    float(row["Open"]),
                    2,
                ),

                "high": round(
                    float(row["High"]),
                    2,
                ),

                "low": round(
                    float(row["Low"]),
                    2,
                ),

                "close": round(
                    float(row["Close"]),
                    2,
                ),

                "volume": (
                    int(row["Volume"])
                    if (
                        "Volume" in history.columns
                        and
                        not pd.isna(
                            row["Volume"]
                        )
                    )
                    else 0
                ),
            }
        )

    response = {
        "symbol": yahoo_symbol,
        "period": period,
        "interval": interval,
        "data": data,
    }

    # --------------------------------------
    # Cache
    # --------------------------------------

    market_cache[cache_key] = (
        response,
        time.time(),
    )

    return response