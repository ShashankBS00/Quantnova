import yfinance as yf
import pandas as pd


def get_historical_data(
    symbol: str,
    period: str = "1y",
):
    """
    Fetch historical market data from Yahoo Finance.
    """

    symbol = symbol.strip().upper()

    if not symbol:
        raise ValueError("Symbol is required")

    history = yf.download(
        symbol,
        period=period,
        auto_adjust=False,
        progress=False,
    )

    if history is None or history.empty:
        raise ValueError(
            f"No market data found for {symbol}"
        )

    # Handle yfinance MultiIndex columns
    if isinstance(
        history.columns,
        pd.MultiIndex
    ):
        history.columns = (
            history.columns
            .get_level_values(0)
        )

    history = history.dropna(
        subset=["Close"]
    )

    if history.empty:
        raise ValueError(
            f"No valid closing prices found for {symbol}"
        )

    return history