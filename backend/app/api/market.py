from fastapi import APIRouter
import yfinance as yf
import pandas as pd

router = APIRouter(prefix="/market", tags=["Market"])


@router.get("/history")
def get_history(
    symbol: str = "RELIANCE.NS",
    period: str = "1mo"
):
    stock = yf.Ticker(symbol)

    history = stock.history(period=period)

    data = []

    for index, row in history.iterrows():

        # Skip rows with missing OHLC values
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

    return {
        "symbol": symbol,
        "data": data,
    }