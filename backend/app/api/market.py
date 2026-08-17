from fastapi import APIRouter
import yfinance as yf
import pandas as pd
import time

router = APIRouter(prefix="/market", tags=["Market"])

# Simple in-memory cache
market_cache = {}

CACHE_DURATION = 30  # seconds


@router.get("/history")
def get_history(
    symbol: str = "RELIANCE.NS",
    period: str = "1mo"
):
    cache_key = f"{symbol}:{period}"

    # Check cache
    if cache_key in market_cache:
        cached_data, cached_time = market_cache[cache_key]

        if time.time() - cached_time < CACHE_DURATION:
            print(f"⚡ Cache hit: {symbol} ({period})")
            return cached_data

    print(f"🌐 Fetching Yahoo Finance: {symbol} ({period})")

    stock = yf.Ticker(symbol)

    history = stock.history(period=period)

    data = []

    for index, row in history.iterrows():

        if (
            pd.isna(row["Open"])
            or pd.isna(row["High"])
            or pd.isna(row["Low"])
            or pd.isna(row["Close"])
        ):
            continue

        data.append({
            "time": index.strftime("%Y-%m-%d"),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
        })

    response = {
        "symbol": symbol,
        "data": data
    }

    # Save to cache
    market_cache[cache_key] = (
        response,
        time.time()
    )

    return response