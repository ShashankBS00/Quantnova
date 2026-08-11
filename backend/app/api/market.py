from fastapi import APIRouter
import yfinance as yf

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
        data.append({
            "time": index.strftime("%Y-%m-%d"),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2)
        })

    return {
        "symbol": symbol,
        "data": data
    }