import yfinance as yf
import pandas as pd


def run_sma_backtest(
    symbol: str,
    fast_period: int,
    slow_period: int,
    initial_cash: float = 100000.0,
):

    if fast_period >= slow_period:
        raise ValueError(
            "Fast period must be smaller than slow period"
        )

    history = yf.download(
        symbol,
        period="1y",
        auto_adjust=False,
        progress=False,
    )

    if history.empty:
        raise ValueError(
            f"No market data found for {symbol}"
        )

    # Handle yfinance MultiIndex columns
    if isinstance(history.columns, pd.MultiIndex):
        history.columns = history.columns.get_level_values(0)

    history = history.dropna(subset=["Close"])

    if len(history) < slow_period:
        raise ValueError(
            "Not enough historical data for this strategy"
        )

    # Calculate moving averages
    history["fast_sma"] = (
        history["Close"]
        .rolling(fast_period)
        .mean()
    )

    history["slow_sma"] = (
        history["Close"]
        .rolling(slow_period)
        .mean()
    )

    cash = float(initial_cash)
    shares = 0

    trades = []
    equity_curve = []

    for index, row in history.iterrows():

        close = float(row["Close"])
        fast = row["fast_sma"]
        slow = row["slow_sma"]

        if pd.isna(fast) or pd.isna(slow):
            continue

        # BUY signal
        if fast > slow and shares == 0:

            shares = int(cash // close)

            if shares > 0:
                cost = shares * close
                cash -= cost

                trades.append({
                    "date": index.strftime("%Y-%m-%d"),
                    "side": "BUY",
                    "price": round(close, 2),
                    "quantity": shares,
                })

        # SELL signal
        elif fast < slow and shares > 0:

            cash += shares * close

            trades.append({
                "date": index.strftime("%Y-%m-%d"),
                "side": "SELL",
                "price": round(close, 2),
                "quantity": shares,
            })

            shares = 0

        # Current portfolio value
        equity = cash + (shares * close)

        equity_curve.append({
            "date": index.strftime("%Y-%m-%d"),
            "equity": round(equity, 2),
        })

    # Close remaining position at final price
    final_price = float(history["Close"].iloc[-1])

    if shares > 0:
        cash += shares * final_price

        trades.append({
            "date": history.index[-1].strftime("%Y-%m-%d"),
            "side": "SELL",
            "price": round(final_price, 2),
            "quantity": shares,
        })

        shares = 0

    final_cash = cash

    total_return = (
        (final_cash - initial_cash)
        / initial_cash
    ) * 100

    sell_trades = [
        trade
        for trade in trades
        if trade["side"] == "SELL"
    ]

    buy_trades = [
        trade
        for trade in trades
        if trade["side"] == "BUY"
    ]

    return {
        "symbol": symbol,
        "strategy": "SMA_CROSSOVER",
        "initial_cash": round(
            initial_cash,
            2,
        ),
        "final_cash": round(
            final_cash,
            2,
        ),
        "total_return": round(
            total_return,
            2,
        ),
        "total_trades": len(sell_trades),
        "buy_trades": len(buy_trades),
        "sell_trades": len(sell_trades),
        "equity_curve": equity_curve,
        "trades": trades,
    }