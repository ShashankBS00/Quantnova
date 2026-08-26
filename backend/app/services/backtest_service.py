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

    # -------------------------
    # Moving averages
    # -------------------------

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

    entry_price = None

    # -------------------------
    # Backtest loop
    # -------------------------

    for index, row in history.iterrows():

        close = float(row["Close"])
        fast = row["fast_sma"]
        slow = row["slow_sma"]

        if pd.isna(fast) or pd.isna(slow):
            continue

        # -------------------------
        # BUY
        # -------------------------

        if fast > slow and shares == 0:

            shares = int(cash // close)

            if shares > 0:

                cost = shares * close
                cash -= cost

                entry_price = close

                trades.append({
                    "date": index.strftime("%Y-%m-%d"),
                    "side": "BUY",
                    "price": round(close, 2),
                    "quantity": shares,
                })

        # -------------------------
        # SELL
        # -------------------------

        elif fast < slow and shares > 0:

            cash += shares * close

            realized_pnl = (
                close - entry_price
            ) * shares

            trades.append({
                "date": index.strftime("%Y-%m-%d"),
                "side": "SELL",
                "price": round(close, 2),
                "quantity": shares,
                "pnl": round(realized_pnl, 2),
            })

            shares = 0
            entry_price = None

        # -------------------------
        # Equity
        # -------------------------

        equity = cash + (shares * close)

        equity_curve.append({
            "date": index.strftime("%Y-%m-%d"),
            "equity": round(equity, 2),
        })

    # -------------------------
    # Close remaining position
    # -------------------------

    final_price = float(
        history["Close"].iloc[-1]
    )

    if shares > 0:

        cash += shares * final_price

        realized_pnl = (
            final_price - entry_price
        ) * shares

        trades.append({
            "date": history.index[-1].strftime(
                "%Y-%m-%d"
            ),
            "side": "SELL",
            "price": round(final_price, 2),
            "quantity": shares,
            "pnl": round(realized_pnl, 2),
        })

        shares = 0
        entry_price = None

    # -------------------------
    # Final results
    # -------------------------

    final_cash = cash

    total_return = (
        (final_cash - initial_cash)
        / initial_cash
    ) * 100

    buy_trades = [
        trade
        for trade in trades
        if trade["side"] == "BUY"
    ]

    sell_trades = [
        trade
        for trade in trades
        if trade["side"] == "SELL"
    ]

    # -------------------------
    # Winning / losing trades
    # -------------------------

    completed_trades = [
        trade
        for trade in sell_trades
        if "pnl" in trade
    ]

    winning_trades = [
        trade
        for trade in completed_trades
        if trade["pnl"] > 0
    ]

    losing_trades = [
        trade
        for trade in completed_trades
        if trade["pnl"] < 0
    ]

    winning_count = len(winning_trades)
    losing_count = len(losing_trades)

    total_completed = (
        winning_count + losing_count
    )

    win_rate = (
        (winning_count / total_completed) * 100
        if total_completed > 0
        else 0
    )

    # -------------------------
    # Profit Factor
    # -------------------------

    gross_profit = sum(
        trade["pnl"]
        for trade in winning_trades
    )

    gross_loss = sum(
        abs(trade["pnl"])
        for trade in losing_trades
    )

    if gross_loss > 0:
        profit_factor = (
            gross_profit / gross_loss
        )
    elif gross_profit > 0:
        profit_factor = None
    else:
        profit_factor = 0

    # -------------------------
    # Drawdown Curve
    # -------------------------

    equity_values = [
        point["equity"]
        for point in equity_curve
    ]

    max_drawdown = 0.0

    if equity_values:

        equity_series = pd.Series(
            equity_values
        )

        running_peak = (
            equity_series.cummax()
        )

        drawdown = (
            (equity_series - running_peak)
            / running_peak
        ) * 100

        max_drawdown = abs(
            float(drawdown.min())
        )

        # Add drawdown to every equity point
        for index, point in enumerate(
            equity_curve
        ):
            point["drawdown"] = round(
                float(drawdown.iloc[index]),
                2,
            )

    # -------------------------
    # Return result
    # -------------------------

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

        "total_trades": len(
            completed_trades
        ),

        "buy_trades": len(
            buy_trades
        ),

        "sell_trades": len(
            sell_trades
        ),

        "winning_trades": winning_count,

        "losing_trades": losing_count,

        "win_rate": round(
            win_rate,
            2,
        ),

        "profit_factor": (
            round(profit_factor, 2)
            if profit_factor is not None
            else None
        ),

        "max_drawdown": round(
            max_drawdown,
            2,
        ),

        "equity_curve": equity_curve,

        "trades": trades,
    }
def run_ema_backtest(
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

    # -------------------------
    # Calculate EMA
    # -------------------------

    history["fast_ema"] = (
        history["Close"]
        .ewm(
            span=fast_period,
            adjust=False
        )
        .mean()
    )

    history["slow_ema"] = (
        history["Close"]
        .ewm(
            span=slow_period,
            adjust=False
        )
        .mean()
    )

    cash = float(initial_cash)
    shares = 0

    trades = []
    equity_curve = []

    entry_price = None

    # -------------------------
    # Backtest loop
    # -------------------------

    for index, row in history.iterrows():

        close = float(row["Close"])
        fast = row["fast_ema"]
        slow = row["slow_ema"]

        if pd.isna(fast) or pd.isna(slow):
            continue

        # -------------------------
        # BUY
        # -------------------------

        if fast > slow and shares == 0:

            shares = int(cash // close)

            if shares > 0:

                cost = shares * close
                cash -= cost

                entry_price = close

                trades.append({
                    "date": index.strftime("%Y-%m-%d"),
                    "side": "BUY",
                    "price": round(close, 2),
                    "quantity": shares,
                })

        # -------------------------
        # SELL
        # -------------------------

        elif fast < slow and shares > 0:

            cash += shares * close

            realized_pnl = (
                close - entry_price
            ) * shares

            trades.append({
                "date": index.strftime("%Y-%m-%d"),
                "side": "SELL",
                "price": round(close, 2),
                "quantity": shares,
                "pnl": round(realized_pnl, 2),
            })

            shares = 0
            entry_price = None

        # -------------------------
        # Equity
        # -------------------------

        equity = cash + (shares * close)

        equity_curve.append({
            "date": index.strftime("%Y-%m-%d"),
            "equity": round(equity, 2),
        })

    # -------------------------
    # Close remaining position
    # -------------------------

    final_price = float(
        history["Close"].iloc[-1]
    )

    if shares > 0:

        cash += shares * final_price

        realized_pnl = (
            final_price - entry_price
        ) * shares

        trades.append({
            "date": history.index[-1].strftime(
                "%Y-%m-%d"
            ),
            "side": "SELL",
            "price": round(final_price, 2),
            "quantity": shares,
            "pnl": round(realized_pnl, 2),
        })

        shares = 0
        entry_price = None

    # -------------------------
    # Final results
    # -------------------------

    final_cash = cash

    total_return = (
        (final_cash - initial_cash)
        / initial_cash
    ) * 100

    buy_trades = [
        trade
        for trade in trades
        if trade["side"] == "BUY"
    ]

    sell_trades = [
        trade
        for trade in trades
        if trade["side"] == "SELL"
    ]

    completed_trades = [
        trade
        for trade in sell_trades
        if "pnl" in trade
    ]

    winning_trades = [
        trade
        for trade in completed_trades
        if trade["pnl"] > 0
    ]

    losing_trades = [
        trade
        for trade in completed_trades
        if trade["pnl"] < 0
    ]

    winning_count = len(winning_trades)
    losing_count = len(losing_trades)

    total_completed = (
        winning_count + losing_count
    )

    win_rate = (
        (winning_count / total_completed) * 100
        if total_completed > 0
        else 0
    )

    # -------------------------
    # Profit Factor
    # -------------------------

    gross_profit = sum(
        trade["pnl"]
        for trade in winning_trades
    )

    gross_loss = sum(
        abs(trade["pnl"])
        for trade in losing_trades
    )

    if gross_loss > 0:
        profit_factor = (
            gross_profit / gross_loss
        )
    elif gross_profit > 0:
        profit_factor = None
    else:
        profit_factor = 0

    # -------------------------
    # Drawdown
    # -------------------------

    equity_values = [
        point["equity"]
        for point in equity_curve
    ]

    max_drawdown = 0.0

    if equity_values:

        equity_series = pd.Series(
            equity_values
        )

        running_peak = (
            equity_series.cummax()
        )

        drawdown = (
            (equity_series - running_peak)
            / running_peak
        ) * 100

        max_drawdown = abs(
            float(drawdown.min())
        )

        for index, point in enumerate(
            equity_curve
        ):
            point["drawdown"] = round(
                float(drawdown.iloc[index]),
                2,
            )

    # -------------------------
    # Return
    # -------------------------

    return {
        "symbol": symbol,
        "strategy": "EMA_CROSSOVER",

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

        "total_trades": len(
            completed_trades
        ),

        "buy_trades": len(
            buy_trades
        ),

        "sell_trades": len(
            sell_trades
        ),

        "winning_trades": winning_count,

        "losing_trades": losing_count,

        "win_rate": round(
            win_rate,
            2,
        ),

        "profit_factor": (
            round(profit_factor, 2)
            if profit_factor is not None
            else None
        ),

        "max_drawdown": round(
            max_drawdown,
            2,
        ),

        "equity_curve": equity_curve,

        "trades": trades,
    }