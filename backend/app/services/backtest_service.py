import yfinance as yf
import pandas as pd

from app.services.strategies.sma_ema import (
    calculate_sma_ema,
    get_sma_ema_signal,
)


# =========================================================
# LOAD MARKET DATA
# =========================================================

def load_market_data(
    symbol: str,
    slow_period: int,
):
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
        history.columns = (
            history.columns.get_level_values(0)
        )

    history = history.dropna(
        subset=["Close"]
    )

    if len(history) < slow_period:
        raise ValueError(
            "Not enough historical data for this strategy"
        )

    return history


# =========================================================
# CALCULATE STRATEGY INDICATORS
# =========================================================

def calculate_strategy_indicators(
    history,
    strategy_type: str,
    fast_period: int,
    slow_period: int,
):
    strategy_type = strategy_type.upper()

    # -----------------------------------------------------
    # SMA CROSSOVER
    # -----------------------------------------------------

    if strategy_type == "SMA_CROSSOVER":

        history["fast_indicator"] = (
            history["Close"]
            .rolling(fast_period)
            .mean()
        )

        history["slow_indicator"] = (
            history["Close"]
            .rolling(slow_period)
            .mean()
        )

    # -----------------------------------------------------
    # EMA CROSSOVER
    # -----------------------------------------------------

    elif strategy_type == "EMA_CROSSOVER":

        history["fast_indicator"] = (
            history["Close"]
            .ewm(
                span=fast_period,
                adjust=False,
            )
            .mean()
        )

        history["slow_indicator"] = (
            history["Close"]
            .ewm(
                span=slow_period,
                adjust=False,
            )
            .mean()
        )

    # -----------------------------------------------------
    # SMA + EMA TREND
    # -----------------------------------------------------

    elif strategy_type == "SMA_EMA_TREND":

        history = calculate_sma_ema(
            history,
            fast_period,
            slow_period,
        )

        history["fast_indicator"] = (
            history["fast_ema"]
        )

        history["slow_indicator"] = (
            history["slow_sma"]
        )

    else:
        raise ValueError(
            f"Unsupported strategy type: {strategy_type}"
        )

    return history


# =========================================================
# GET TRADING SIGNAL
# =========================================================

def get_strategy_signal(
    strategy_type: str,
    close: float,
    fast: float,
    slow: float,
):
    strategy_type = strategy_type.upper()

    # -----------------------------------------------------
    # SMA CROSSOVER
    # -----------------------------------------------------

    if strategy_type == "SMA_CROSSOVER":

        if fast > slow:
            return "BUY"

        if fast < slow:
            return "SELL"

        return "HOLD"

    # -----------------------------------------------------
    # EMA CROSSOVER
    # -----------------------------------------------------

    if strategy_type == "EMA_CROSSOVER":

        if fast > slow:
            return "BUY"

        if fast < slow:
            return "SELL"

        return "HOLD"

    # -----------------------------------------------------
    # SMA + EMA TREND
    # -----------------------------------------------------

    if strategy_type == "SMA_EMA_TREND":

        return get_sma_ema_signal(
            close=close,
            fast_ema=fast,
            slow_sma=slow,
        )

    raise ValueError(
        f"Unsupported strategy type: {strategy_type}"
    )


# =========================================================
# PERFORMANCE METRICS
# =========================================================

def calculate_metrics(
    initial_cash: float,
    final_cash: float,
    trades: list,
    equity_curve: list,
):
    # -----------------------------------------------------
    # Total Return
    # -----------------------------------------------------

    total_return = (
        (
            final_cash - initial_cash
        )
        / initial_cash
    ) * 100

    # -----------------------------------------------------
    # Buy / Sell Trades
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # Completed Trades
    # -----------------------------------------------------

    completed_trades = [
        trade
        for trade in sell_trades
        if "pnl" in trade
    ]

    # -----------------------------------------------------
    # Winning / Losing
    # -----------------------------------------------------

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

    winning_count = len(
        winning_trades
    )

    losing_count = len(
        losing_trades
    )

    total_completed = (
        winning_count
        + losing_count
    )

    # -----------------------------------------------------
    # Win Rate
    # -----------------------------------------------------

    win_rate = (
        (
            winning_count
            / total_completed
        )
        * 100
        if total_completed > 0
        else 0
    )

    # -----------------------------------------------------
    # Profit Factor
    # -----------------------------------------------------

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
            gross_profit
            / gross_loss
        )

    elif gross_profit > 0:

        profit_factor = None

    else:

        profit_factor = 0

    # -----------------------------------------------------
    # Maximum Drawdown
    # -----------------------------------------------------

    max_drawdown = 0.0

    equity_values = [
        point["equity"]
        for point in equity_curve
    ]

    if equity_values:

        equity_series = pd.Series(
            equity_values
        )

        running_peak = (
            equity_series.cummax()
        )

        drawdown = (
            (
                equity_series
                - running_peak
            )
            / running_peak
        ) * 100

        max_drawdown = abs(
            float(
                drawdown.min()
            )
        )

        # Add drawdown to equity curve
        for index, point in enumerate(
            equity_curve
        ):

            point["drawdown"] = round(
                float(
                    drawdown.iloc[index]
                ),
                2,
            )

    # -----------------------------------------------------
    # Return Metrics
    # -----------------------------------------------------

    return {
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

        "winning_trades": (
            winning_count
        ),

        "losing_trades": (
            losing_count
        ),

        "win_rate": round(
            win_rate,
            2,
        ),

        "profit_factor": (
            round(
                profit_factor,
                2,
            )
            if profit_factor is not None
            else None
        ),

        "max_drawdown": round(
            max_drawdown,
            2,
        ),
    }


# =========================================================
# COMMON BACKTEST ENGINE
# =========================================================

def run_strategy_backtest(
    symbol: str,
    strategy_type: str,
    fast_period: int,
    slow_period: int,
    initial_cash: float = 100000.0,
):

    strategy_type = (
        strategy_type.upper()
    )

    # -----------------------------------------------------
    # Validate
    # -----------------------------------------------------

    if not symbol.strip():
        raise ValueError(
            "Stock symbol is required"
        )

    if fast_period <= 0:
        raise ValueError(
            "Fast period must be greater than 0"
        )

    if slow_period <= 0:
        raise ValueError(
            "Slow period must be greater than 0"
        )

    if fast_period >= slow_period:
        raise ValueError(
            "Fast period must be smaller than slow period"
        )

    if initial_cash <= 0:
        raise ValueError(
            "Initial cash must be greater than 0"
        )

    # -----------------------------------------------------
    # Load Data
    # -----------------------------------------------------

    history = load_market_data(
        symbol,
        slow_period,
    )

    # -----------------------------------------------------
    # Calculate Indicators
    # -----------------------------------------------------

    history = calculate_strategy_indicators(
        history,
        strategy_type,
        fast_period,
        slow_period,
    )

    # -----------------------------------------------------
    # Portfolio
    # -----------------------------------------------------

    cash = float(
        initial_cash
    )

    shares = 0

    entry_price = None

    trades = []

    equity_curve = []

    # -----------------------------------------------------
    # Backtest Loop
    # -----------------------------------------------------

    for index, row in history.iterrows():

        close = float(
            row["Close"]
        )

        fast = row[
            "fast_indicator"
        ]

        slow = row[
            "slow_indicator"
        ]

        # Skip until indicators are ready
        if (
            pd.isna(fast)
            or pd.isna(slow)
        ):
            continue

        signal = get_strategy_signal(
            strategy_type=strategy_type,
            close=close,
            fast=float(fast),
            slow=float(slow),
        )

        # =================================================
        # BUY
        # =================================================

        if (
            signal == "BUY"
            and shares == 0
        ):

            shares = int(
                cash // close
            )

            if shares > 0:

                cost = (
                    shares * close
                )

                cash -= cost

                entry_price = close

                trades.append({
                    "date": index.strftime(
                        "%Y-%m-%d"
                    ),
                    "side": "BUY",
                    "price": round(
                        close,
                        2,
                    ),
                    "quantity": shares,
                })

        # =================================================
        # SELL
        # =================================================

        elif (
            signal == "SELL"
            and shares > 0
        ):

            cash += (
                shares * close
            )

            realized_pnl = (
                close
                - entry_price
            ) * shares

            trades.append({
                "date": index.strftime(
                    "%Y-%m-%d"
                ),
                "side": "SELL",
                "price": round(
                    close,
                    2,
                ),
                "quantity": shares,
                "pnl": round(
                    realized_pnl,
                    2,
                ),
            })

            shares = 0

            entry_price = None

        # =================================================
        # EQUITY
        # =================================================

        equity = (
            cash
            + (
                shares
                * close
            )
        )

        equity_curve.append({
            "date": index.strftime(
                "%Y-%m-%d"
            ),
            "equity": round(
                equity,
                2,
            ),
        })

    # =====================================================
    # CLOSE REMAINING POSITION
    # =====================================================

    final_price = float(
        history["Close"].iloc[-1]
    )

    if shares > 0:

        cash += (
            shares
            * final_price
        )

        realized_pnl = (
            final_price
            - entry_price
        ) * shares

        trades.append({
            "date": history.index[-1].strftime(
                "%Y-%m-%d"
            ),
            "side": "SELL",
            "price": round(
                final_price,
                2,
            ),
            "quantity": shares,
            "pnl": round(
                realized_pnl,
                2,
            ),
        })

        shares = 0

        entry_price = None

    # =====================================================
    # FINAL CASH
    # =====================================================

    final_cash = cash

    # =====================================================
    # METRICS
    # =====================================================

    metrics = calculate_metrics(
        initial_cash=initial_cash,
        final_cash=final_cash,
        trades=trades,
        equity_curve=equity_curve,
    )

    # =====================================================
    # RESULT
    # =====================================================

    return {
        "symbol": symbol.upper(),

        "strategy": strategy_type,

        "fast_period": fast_period,

        "slow_period": slow_period,

        **metrics,

        "equity_curve": equity_curve,

        "trades": trades,
    }


# =========================================================
# BACKWARD COMPATIBILITY
# =========================================================

def run_sma_backtest(
    symbol: str,
    fast_period: int,
    slow_period: int,
    initial_cash: float = 100000.0,
):

    return run_strategy_backtest(
        symbol=symbol,
        strategy_type="SMA_CROSSOVER",
        fast_period=fast_period,
        slow_period=slow_period,
        initial_cash=initial_cash,
    )


def run_ema_backtest(
    symbol: str,
    fast_period: int,
    slow_period: int,
    initial_cash: float = 100000.0,
):

    return run_strategy_backtest(
        symbol=symbol,
        strategy_type="EMA_CROSSOVER",
        fast_period=fast_period,
        slow_period=slow_period,
        initial_cash=initial_cash,
    )


def run_sma_ema_backtest(
    symbol: str,
    fast_period: int,
    slow_period: int,
    initial_cash: float = 100000.0,
):

    return run_strategy_backtest(
        symbol=symbol,
        strategy_type="SMA_EMA_TREND",
        fast_period=fast_period,
        slow_period=slow_period,
        initial_cash=initial_cash,
    )