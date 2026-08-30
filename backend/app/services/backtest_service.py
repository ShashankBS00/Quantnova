import yfinance as yf
import pandas as pd


# =========================================================
# LOAD MARKET DATA
# =========================================================

def load_market_data(
    symbol: str,
    minimum_period: int,
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

    # Handle yfinance MultiIndex
    if isinstance(
        history.columns,
        pd.MultiIndex,
    ):

        history.columns = (
            history.columns
            .get_level_values(0)
        )

    history = history.dropna(
        subset=["Close"]
    )

    if len(history) < minimum_period:

        raise ValueError(
            "Not enough historical data "
            "for this strategy"
        )

    return history


# =========================================================
# CALCULATE INDICATORS
# =========================================================

def calculate_strategy_indicators(
    history,
    strategy_type,
    parameters,
):

    strategy_type = (
        str(strategy_type)
        .upper()
    )

    parameters = parameters or {}

    # =====================================================
    # SMA CROSSOVER
    # =====================================================

    if strategy_type == "SMA_CROSSOVER":

        fast_period = int(
            parameters.get(
                "fast_period",
                20,
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                50,
            )
        )

        history["fast_indicator"] = (
            history["Close"]
            .rolling(
                fast_period
            )
            .mean()
        )

        history["slow_indicator"] = (
            history["Close"]
            .rolling(
                slow_period
            )
            .mean()
        )

        history["fast_sma"] = (
            history["fast_indicator"]
        )

        history["slow_sma"] = (
            history["slow_indicator"]
        )

        return history


    # =====================================================
    # EMA CROSSOVER
    # =====================================================

    if strategy_type == "EMA_CROSSOVER":

        fast_period = int(
            parameters.get(
                "fast_period",
                20,
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                50,
            )
        )

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

        history["fast_ema"] = (
            history["fast_indicator"]
        )

        history["slow_ema"] = (
            history["slow_indicator"]
        )

        return history


    # =====================================================
    # SMA + EMA TREND
    # =====================================================

    if strategy_type == "SMA_EMA_TREND":

        fast_period = int(
            parameters.get(
                "fast_period",
                20,
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                50,
            )
        )

        history["fast_ema"] = (
            history["Close"]
            .ewm(
                span=fast_period,
                adjust=False,
            )
            .mean()
        )

        history["slow_sma"] = (
            history["Close"]
            .rolling(
                slow_period
            )
            .mean()
        )

        history["fast_indicator"] = (
            history["fast_ema"]
        )

        history["slow_indicator"] = (
            history["slow_sma"]
        )

        return history


    # =====================================================
    # RSI
    # =====================================================

    if strategy_type == "RSI":

        period = int(
            parameters.get(
                "period",
                14,
            )
        )

        delta = (
            history["Close"]
            .diff()
        )

        gain = delta.clip(
            lower=0
        )

        loss = -delta.clip(
            upper=0
        )

        avg_gain = (
            gain.rolling(period)
            .mean()
        )

        avg_loss = (
            loss.rolling(period)
            .mean()
        )

        rs = (
            avg_gain /
            avg_loss
        )

        history["rsi"] = (
            100 -
            (
                100 /
                (1 + rs)
            )
        )

        return history


    # =====================================================
    # MACD
    # =====================================================

    if strategy_type == "MACD":

        fast_period = int(
            parameters.get(
                "fast_period",
                12,
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                26,
            )
        )

        signal_period = int(
            parameters.get(
                "signal_period",
                9,
            )
        )

        fast_ema = (
            history["Close"]
            .ewm(
                span=fast_period,
                adjust=False,
            )
            .mean()
        )

        slow_ema = (
            history["Close"]
            .ewm(
                span=slow_period,
                adjust=False,
            )
            .mean()
        )

        history["macd"] = (
            fast_ema - slow_ema
        )

        history["macd_signal"] = (
            history["macd"]
            .ewm(
                span=signal_period,
                adjust=False,
            )
            .mean()
        )

        return history


    # =====================================================
    # BOLLINGER BANDS
    # =====================================================

    if strategy_type == "BOLLINGER_BANDS":

        period = int(
            parameters.get(
                "period",
                20,
            )
        )

        std_deviation = float(
            parameters.get(
                "std_deviation",
                2,
            )
        )

        middle = (
            history["Close"]
            .rolling(period)
            .mean()
        )

        std = (
            history["Close"]
            .rolling(period)
            .std()
        )

        history["bollinger_middle"] = (
            middle
        )

        history["bollinger_upper"] = (
            middle +
            std_deviation * std
        )

        history["bollinger_lower"] = (
            middle -
            std_deviation * std
        )

        return history


    raise ValueError(
        f"Unsupported strategy type: "
        f"{strategy_type}"
    )


# =========================================================
# SIGNAL
# =========================================================

def get_strategy_signal(
    history,
    index,
    strategy_type,
    parameters,
):

    strategy_type = (
        str(strategy_type)
        .upper()
    )

    row = history.iloc[index]

    close = float(
        row["Close"]
    )

    # =====================================================
    # SMA CROSSOVER
    # =====================================================

    if strategy_type == "SMA_CROSSOVER":

        current_fast = row[
            "fast_indicator"
        ]

        current_slow = row[
            "slow_indicator"
        ]

        previous_fast = history.iloc[
            index - 1
        ]["fast_indicator"]

        previous_slow = history.iloc[
            index - 1
        ]["slow_indicator"]

        if any(
            pd.isna(value)
            for value in [
                current_fast,
                current_slow,
                previous_fast,
                previous_slow,
            ]
        ):
            return "HOLD"

        if (
            previous_fast <= previous_slow
            and
            current_fast > current_slow
        ):

            return "BUY"

        if (
            previous_fast >= previous_slow
            and
            current_fast < current_slow
        ):

            return "SELL"

        return "HOLD"


    # =====================================================
    # EMA CROSSOVER
    # =====================================================

    if strategy_type == "EMA_CROSSOVER":

        current_fast = row[
            "fast_indicator"
        ]

        current_slow = row[
            "slow_indicator"
        ]

        previous_fast = history.iloc[
            index - 1
        ]["fast_indicator"]

        previous_slow = history.iloc[
            index - 1
        ]["slow_indicator"]

        if any(
            pd.isna(value)
            for value in [
                current_fast,
                current_slow,
                previous_fast,
                previous_slow,
            ]
        ):
            return "HOLD"

        if (
            previous_fast <= previous_slow
            and
            current_fast > current_slow
        ):

            return "BUY"

        if (
            previous_fast >= previous_slow
            and
            current_fast < current_slow
        ):

            return "SELL"

        return "HOLD"


    # =====================================================
    # SMA + EMA TREND
    # =====================================================

    if strategy_type == "SMA_EMA_TREND":

        fast_ema = row[
            "fast_ema"
        ]

        slow_sma = row[
            "slow_sma"
        ]

        if (
            pd.isna(fast_ema)
            or
            pd.isna(slow_sma)
        ):

            return "HOLD"

        if (
            close > fast_ema
            and
            fast_ema > slow_sma
        ):

            return "BUY"

        if (
            close < fast_ema
            and
            fast_ema < slow_sma
        ):

            return "SELL"

        return "HOLD"


    # =====================================================
    # RSI
    # =====================================================

    if strategy_type == "RSI":

        rsi = row["rsi"]

        if pd.isna(rsi):
            return "HOLD"

        oversold = float(
            parameters.get(
                "oversold",
                30,
            )
        )

        overbought = float(
            parameters.get(
                "overbought",
                70,
            )
        )

        if rsi <= oversold:
            return "BUY"

        if rsi >= overbought:
            return "SELL"

        return "HOLD"


    # =====================================================
    # MACD
    # =====================================================

    if strategy_type == "MACD":

        macd = row["macd"]

        signal_line = row[
            "macd_signal"
        ]

        if (
            pd.isna(macd)
            or
            pd.isna(signal_line)
        ):
            return "HOLD"

        previous_macd = history.iloc[
            index - 1
        ]["macd"]

        previous_signal = history.iloc[
            index - 1
        ]["macd_signal"]

        if (
            previous_macd <= previous_signal
            and
            macd > signal_line
        ):

            return "BUY"

        if (
            previous_macd >= previous_signal
            and
            macd < signal_line
        ):

            return "SELL"

        return "HOLD"


    # =====================================================
    # BOLLINGER
    # =====================================================

    if strategy_type == "BOLLINGER_BANDS":

        upper = row[
            "bollinger_upper"
        ]

        lower = row[
            "bollinger_lower"
        ]

        if (
            pd.isna(upper)
            or
            pd.isna(lower)
        ):
            return "HOLD"

        if close <= lower:
            return "BUY"

        if close >= upper:
            return "SELL"

        return "HOLD"


    raise ValueError(
        f"Unsupported strategy type: "
        f"{strategy_type}"
    )


# =========================================================
# BACKTEST
# =========================================================

def run_strategy_backtest(
    symbol: str,
    strategy_type: str,
    parameters: dict,
    initial_cash: float = 100000.0,
    stop_loss_percent=None,
    risk_reward_ratio=None,
):

    symbol = (
        symbol
        .strip()
        .upper()
    )

    strategy_type = (
        strategy_type
        .strip()
        .upper()
    )

    parameters = parameters or {}

    # -----------------------------------------------
    # Period needed
    # -----------------------------------------------

    fast_period = int(
        parameters.get(
            "fast_period",
            20,
        )
    )

    slow_period = int(
        parameters.get(
            "slow_period",
            50,
        )
    )

    if strategy_type == "RSI":

        minimum_period = int(
            parameters.get(
                "period",
                14,
            )
        )

    elif strategy_type == "BOLLINGER_BANDS":

        minimum_period = int(
            parameters.get(
                "period",
                20,
            )
        )

    elif strategy_type == "MACD":

        minimum_period = (
            int(
                parameters.get(
                    "slow_period",
                    26,
                )
            )
            +
            int(
                parameters.get(
                    "signal_period",
                    9,
                )
            )
        )

    else:

        minimum_period = max(
            fast_period,
            slow_period,
        )

    # -----------------------------------------------
    # Validation
    # -----------------------------------------------

    if not symbol:

        raise ValueError(
            "Stock symbol is required"
        )

    if initial_cash <= 0:

        raise ValueError(
            "Initial cash must be greater than 0"
        )

    if (
        strategy_type
        in [
            "SMA_CROSSOVER",
            "EMA_CROSSOVER",
            "SMA_EMA_TREND",
        ]
        and
        fast_period >= slow_period
    ):

        raise ValueError(
            "Fast period must be smaller than slow period"
        )

    # -----------------------------------------------
    # Load data
    # -----------------------------------------------

    history = load_market_data(
        symbol,
        minimum_period,
    )

    # -----------------------------------------------
    # Indicators
    # -----------------------------------------------

    history = (
        calculate_strategy_indicators(
            history,
            strategy_type,
            parameters,
        )
    )

    # -----------------------------------------------
    # Portfolio
    # -----------------------------------------------

    cash = float(
        initial_cash
    )

    shares = 0

    entry_price = None

    trades = []

    equity_curve = []

    # -----------------------------------------------
    # Backtest
    # -----------------------------------------------

    for index in range(
        1,
        len(history),
    ):

        row = history.iloc[index]

        close = float(
            row["Close"]
        )

        signal = get_strategy_signal(
            history=history,
            index=index,
            strategy_type=strategy_type,
            parameters=parameters,
        )

        # ==========================================
        # Existing position risk management
        # ==========================================

        if (
            shares > 0
            and
            entry_price is not None
        ):

            stop_price = None
            target_price = None

            if (
                stop_loss_percent
                is not None
                and
                float(
                    stop_loss_percent
                ) > 0
            ):

                risk = (
                    entry_price
                    *
                    float(
                        stop_loss_percent
                    )
                    / 100
                )

                stop_price = (
                    entry_price
                    - risk
                )

                if (
                    risk_reward_ratio
                    is not None
                    and
                    float(
                        risk_reward_ratio
                    ) > 0
                ):

                    target_price = (
                        entry_price
                        +
                        (
                            risk
                            *
                            float(
                                risk_reward_ratio
                            )
                        )
                    )

            # Stop loss

            if (
                stop_price is not None
                and
                close <= stop_price
            ):

                pnl = (
                    stop_price
                    - entry_price
                ) * shares

                cash += (
                    shares
                    * stop_price
                )

                trades.append({
                    "date":
                        history.index[
                            index
                        ].strftime(
                            "%Y-%m-%d"
                        ),

                    "side": "SELL",

                    "price": round(
                        stop_price,
                        2,
                    ),

                    "quantity":
                        shares,

                    "pnl": round(
                        pnl,
                        2,
                    ),

                    "reason":
                        "STOP_LOSS",
                })

                shares = 0

                entry_price = None

                equity_curve.append({
                    "date":
                        history.index[
                            index
                        ].strftime(
                            "%Y-%m-%d"
                        ),

                    "equity":
                        round(
                            cash,
                            2,
                        ),
                })

                continue

            # Target

            if (
                target_price is not None
                and
                close >= target_price
            ):

                pnl = (
                    target_price
                    - entry_price
                ) * shares

                cash += (
                    shares
                    * target_price
                )

                trades.append({
                    "date":
                        history.index[
                            index
                        ].strftime(
                            "%Y-%m-%d"
                        ),

                    "side": "SELL",

                    "price": round(
                        target_price,
                        2,
                    ),

                    "quantity":
                        shares,

                    "pnl": round(
                        pnl,
                        2,
                    ),

                    "reason":
                        "TARGET",
                })

                shares = 0

                entry_price = None

                equity_curve.append({
                    "date":
                        history.index[
                            index
                        ].strftime(
                            "%Y-%m-%d"
                        ),

                    "equity":
                        round(
                            cash,
                            2,
                        ),
                })

                continue

        # ==========================================
        # BUY
        # ==========================================

        if (
            signal == "BUY"
            and
            shares == 0
        ):

            quantity = int(
                cash // close
            )

            if quantity > 0:

                cost = (
                    quantity
                    * close
                )

                cash -= cost

                shares = quantity

                entry_price = close

                trades.append({
                    "date":
                        history.index[
                            index
                        ].strftime(
                            "%Y-%m-%d"
                        ),

                    "side": "BUY",

                    "price": round(
                        close,
                        2,
                    ),

                    "quantity":
                        quantity,
                })

        # ==========================================
        # SELL
        # ==========================================

        elif (
            signal == "SELL"
            and
            shares > 0
        ):

            pnl = (
                close
                - entry_price
            ) * shares

            cash += (
                shares
                * close
            )

            trades.append({
                "date":
                    history.index[
                        index
                    ].strftime(
                        "%Y-%m-%d"
                    ),

                "side": "SELL",

                "price": round(
                    close,
                    2,
                ),

                "quantity":
                    shares,

                "pnl": round(
                    pnl,
                    2,
                ),

                "reason":
                    "SIGNAL",
            })

            shares = 0

            entry_price = None

        # ==========================================
        # Equity
        # ==========================================

        equity = (
            cash
            +
            (
                shares
                * close
            )
        )

        equity_curve.append({
            "date":
                history.index[
                    index
                ].strftime(
                    "%Y-%m-%d"
                ),

            "equity":
                round(
                    equity,
                    2,
                ),
        })

    # ==========================================
    # Close final position
    # ==========================================

    final_price = float(
        history["Close"].iloc[-1]
    )

    if shares > 0:

        pnl = (
            final_price
            - entry_price
        ) * shares

        cash += (
            shares
            * final_price
        )

        trades.append({
            "date":
                history.index[
                    -1
                ].strftime(
                    "%Y-%m-%d"
                ),

            "side": "SELL",

            "price": round(
                final_price,
                2,
            ),

            "quantity":
                shares,

            "pnl": round(
                pnl,
                2,
            ),

            "reason":
                "END_OF_BACKTEST",
        })

        shares = 0

        entry_price = None

    # ==========================================
    # Metrics
    # ==========================================

    final_cash = cash

    completed_trades = [
        trade
        for trade in trades
        if (
            trade["side"] == "SELL"
            and
            "pnl" in trade
        )
    ]

    winning = [
        trade
        for trade in completed_trades
        if trade["pnl"] > 0
    ]

    losing = [
        trade
        for trade in completed_trades
        if trade["pnl"] < 0
    ]

    total_completed = len(
        completed_trades
    )

    win_rate = (
        (
            len(winning)
            /
            total_completed
        )
        * 100
        if total_completed
        else 0
    )

    gross_profit = sum(
        trade["pnl"]
        for trade in winning
    )

    gross_loss = sum(
        abs(
            trade["pnl"]
        )
        for trade in losing
    )

    if gross_loss > 0:

        profit_factor = (
            gross_profit
            /
            gross_loss
        )

    elif gross_profit > 0:

        profit_factor = None

    else:

        profit_factor = 0

    # ==========================================
    # Drawdown
    # ==========================================

    equity_values = [
        item["equity"]
        for item in equity_curve
    ]

    max_drawdown = 0

    if equity_values:

        series = pd.Series(
            equity_values
        )

        peak = (
            series.cummax()
        )

        drawdown = (
            (
                series
                - peak
            )
            /
            peak
        ) * 100

        max_drawdown = abs(
            float(
                drawdown.min()
            )
        )

        for i, point in enumerate(
            equity_curve
        ):

            point["drawdown"] = round(
                float(
                    drawdown.iloc[i]
                ),
                2,
            )

    total_return = (
        (
            final_cash
            -
            initial_cash
        )
        /
        initial_cash
    ) * 100

    # ==========================================
    # Result
    # ==========================================

    return {

        "symbol":
            symbol,

        "strategy":
            strategy_type,

        "parameters":
            parameters,

        "initial_cash":
            round(
                initial_cash,
                2,
            ),

        "final_cash":
            round(
                final_cash,
                2,
            ),

        "total_return":
            round(
                total_return,
                2,
            ),

        "total_trades":
            total_completed,

        "buy_trades":
            len([
                t
                for t in trades
                if t["side"] == "BUY"
            ]),

        "sell_trades":
            len([
                t
                for t in trades
                if t["side"] == "SELL"
            ]),

        "winning_trades":
            len(winning),

        "losing_trades":
            len(losing),

        "win_rate":
            round(
                win_rate,
                2,
            ),

        "profit_factor":
            (
                round(
                    profit_factor,
                    2,
                )
                if profit_factor
                is not None
                else None
            ),

        "max_drawdown":
            round(
                max_drawdown,
                2,
            ),

        "stop_loss_percent":
            stop_loss_percent,

        "risk_reward_ratio":
            risk_reward_ratio,

        "equity_curve":
            equity_curve,

        "trades":
            trades,
    }