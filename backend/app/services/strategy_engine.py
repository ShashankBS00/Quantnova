import pandas as pd


# ==========================================
# Helper: SMA
# ==========================================

def calculate_sma(series, period):
    return (
        pd.to_numeric(series, errors="coerce")
        .rolling(window=period)
        .mean()
    )


# ==========================================
# Helper: EMA
# ==========================================

def calculate_ema(series, period):
    return (
        pd.to_numeric(series, errors="coerce")
        .ewm(
            span=period,
            adjust=False
        )
        .mean()
    )


# ==========================================
# Generate Trading Signal
# ==========================================

def generate_signal(
    df,
    strategy_type,
    parameters=None,
):

    # --------------------------------------
    # Validate dataframe
    # --------------------------------------

    if df is None or df.empty:

        return {
            "signal": "HOLD",
            "price": 0.0,
            "fast_ema": 0.0,
            "slow_sma": 0.0,
            "fast_sma": 0.0,
            "slow_ema": 0.0,
        }

    if "Close" not in df.columns:

        return {
            "signal": "HOLD",
            "price": 0.0,
            "fast_ema": 0.0,
            "slow_sma": 0.0,
            "fast_sma": 0.0,
            "slow_ema": 0.0,
        }

    # --------------------------------------
    # Parameters
    # --------------------------------------

    if parameters is None:
        parameters = {}

    if not isinstance(parameters, dict):

        raise ValueError(
            "Strategy parameters must be an object"
        )

    # --------------------------------------
    # Normalize strategy
    # --------------------------------------

    strategy_type = str(
        strategy_type
    ).upper()

    # --------------------------------------
    # Close prices
    # --------------------------------------

    close = pd.to_numeric(
        df["Close"],
        errors="coerce"
    ).dropna()

    if close.empty:

        return {
            "signal": "HOLD",
            "price": 0.0,
            "fast_ema": 0.0,
            "slow_sma": 0.0,
            "fast_sma": 0.0,
            "slow_ema": 0.0,
        }

    current_price = float(
        close.iloc[-1]
    )

    # ======================================
    # Default result
    # ======================================

    result = {
        "signal": "HOLD",
        "price": round(
            current_price,
            2
        ),
        "fast_ema": 0.0,
        "slow_sma": 0.0,
        "fast_sma": 0.0,
        "slow_ema": 0.0,
    }

    # ==========================================
    # SMA CROSSOVER
    # ==========================================

    if strategy_type == "SMA_CROSSOVER":

        fast_period = int(
            parameters.get(
                "fast_period",
                20
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                50
            )
        )

        if fast_period >= slow_period:

            raise ValueError(
                "Fast SMA period must be smaller than slow SMA period"
            )

        if len(close) < slow_period + 1:

            return result

        fast_sma = calculate_sma(
            close,
            fast_period
        )

        slow_sma = calculate_sma(
            close,
            slow_period
        )

        current_fast = float(
            fast_sma.iloc[-1]
        )

        current_slow = float(
            slow_sma.iloc[-1]
        )

        previous_fast = float(
            fast_sma.iloc[-2]
        )

        previous_slow = float(
            slow_sma.iloc[-2]
        )

        # Actual crossover

        if (
            previous_fast <= previous_slow
            and current_fast > current_slow
        ):

            signal = "BUY"

        elif (
            previous_fast >= previous_slow
            and current_fast < current_slow
        ):

            signal = "SELL"

        else:

            signal = "HOLD"

        result.update({
            "signal": signal,
            "fast_sma": round(
                current_fast,
                2
            ),
            "slow_sma": round(
                current_slow,
                2
            ),
        })

        return result

    # ==========================================
    # EMA CROSSOVER
    # ==========================================

    if strategy_type == "EMA_CROSSOVER":

        fast_period = int(
            parameters.get(
                "fast_period",
                20
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                50
            )
        )

        if fast_period >= slow_period:

            raise ValueError(
                "Fast EMA period must be smaller than slow EMA period"
            )

        if len(close) < slow_period + 1:

            return result

        fast_ema = calculate_ema(
            close,
            fast_period
        )

        slow_ema = calculate_ema(
            close,
            slow_period
        )

        current_fast = float(
            fast_ema.iloc[-1]
        )

        current_slow = float(
            slow_ema.iloc[-1]
        )

        previous_fast = float(
            fast_ema.iloc[-2]
        )

        previous_slow = float(
            slow_ema.iloc[-2]
        )

        if (
            previous_fast <= previous_slow
            and current_fast > current_slow
        ):

            signal = "BUY"

        elif (
            previous_fast >= previous_slow
            and current_fast < current_slow
        ):

            signal = "SELL"

        else:

            signal = "HOLD"

        result.update({
            "signal": signal,
            "fast_ema": round(
                current_fast,
                2
            ),
            "slow_ema": round(
                current_slow,
                2
            ),
        })

        return result

    # ==========================================
    # SMA + EMA TREND
    # ==========================================

    if strategy_type == "SMA_EMA_TREND":

        fast_period = int(
            parameters.get(
                "fast_period",
                20
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                50
            )
        )

        if fast_period >= slow_period:

            raise ValueError(
                "Fast period must be smaller than slow period"
            )

        if len(close) < slow_period:

            return result

        fast_ema = calculate_ema(
            close,
            fast_period
        )

        slow_sma = calculate_sma(
            close,
            slow_period
        )

        current_fast_ema = float(
            fast_ema.iloc[-1]
        )

        current_slow_sma = float(
            slow_sma.iloc[-1]
        )

        if (
            current_price >
            current_fast_ema
            and
            current_fast_ema >
            current_slow_sma
        ):

            signal = "BUY"

        elif (
            current_price <
            current_fast_ema
            and
            current_fast_ema <
            current_slow_sma
        ):

            signal = "SELL"

        else:

            signal = "HOLD"

        result.update({
            "signal": signal,
            "fast_ema": round(
                current_fast_ema,
                2
            ),
            "slow_sma": round(
                current_slow_sma,
                2
            ),
        })

        return result

    # ==========================================
    # RSI
    # ==========================================

    if strategy_type == "RSI":

        period = int(
            parameters.get(
                "period",
                14
            )
        )

        oversold = float(
            parameters.get(
                "oversold",
                30
            )
        )

        overbought = float(
            parameters.get(
                "overbought",
                70
            )
        )

        if len(close) < period + 1:

            return result

        delta = close.diff()

        gain = delta.clip(
            lower=0
        )

        loss = -delta.clip(
            upper=0
        )

        avg_gain = gain.rolling(
            period
        ).mean()

        avg_loss = loss.rolling(
            period
        ).mean()

        rs = avg_gain / avg_loss

        rsi = 100 - (
            100 / (1 + rs)
        )

        current_rsi = float(
            rsi.iloc[-1]
        )

        if current_rsi <= oversold:

            signal = "BUY"

        elif current_rsi >= overbought:

            signal = "SELL"

        else:

            signal = "HOLD"

        result.update({
            "signal": signal,
            "rsi": round(
                current_rsi,
                2
            ),
        })

        return result

    # ==========================================
    # MACD
    # ==========================================

    if strategy_type == "MACD":

        fast_period = int(
            parameters.get(
                "fast_period",
                12
            )
        )

        slow_period = int(
            parameters.get(
                "slow_period",
                26
            )
        )

        signal_period = int(
            parameters.get(
                "signal_period",
                9
            )
        )

        if fast_period >= slow_period:

            raise ValueError(
                "MACD fast period must be smaller than slow period"
            )

        if len(close) < slow_period + signal_period:

            return result

        fast_ema = calculate_ema(
            close,
            fast_period
        )

        slow_ema = calculate_ema(
            close,
            slow_period
        )

        macd = (
            fast_ema -
            slow_ema
        )

        signal_line = calculate_ema(
            macd,
            signal_period
        )

        current_macd = float(
            macd.iloc[-1]
        )

        current_signal = float(
            signal_line.iloc[-1]
        )

        previous_macd = float(
            macd.iloc[-2]
        )

        previous_signal = float(
            signal_line.iloc[-2]
        )

        if (
            previous_macd <= previous_signal
            and
            current_macd > current_signal
        ):

            signal = "BUY"

        elif (
            previous_macd >= previous_signal
            and
            current_macd < current_signal
        ):

            signal = "SELL"

        else:

            signal = "HOLD"

        result.update({
            "signal": signal,
            "macd": round(
                current_macd,
                4
            ),
            "macd_signal": round(
                current_signal,
                4
            ),
        })

        return result

    # ==========================================
    # Bollinger Bands
    # ==========================================

    if strategy_type == "BOLLINGER_BANDS":

        period = int(
            parameters.get(
                "period",
                20
            )
        )

        std_deviation = float(
            parameters.get(
                "std_deviation",
                2
            )
        )

        if len(close) < period:

            return result

        middle = close.rolling(
            period
        ).mean()

        std = close.rolling(
            period
        ).std()

        upper = (
            middle +
            std_deviation * std
        )

        lower = (
            middle -
            std_deviation * std
        )

        current_middle = float(
            middle.iloc[-1]
        )

        current_upper = float(
            upper.iloc[-1]
        )

        current_lower = float(
            lower.iloc[-1]
        )

        if current_price <= current_lower:

            signal = "BUY"

        elif current_price >= current_upper:

            signal = "SELL"

        else:

            signal = "HOLD"

        result.update({
            "signal": signal,
            "bollinger_middle": round(
                current_middle,
                2
            ),
            "bollinger_upper": round(
                current_upper,
                2
            ),
            "bollinger_lower": round(
                current_lower,
                2
            ),
        })

        return result

    # ==========================================
    # Unknown strategy
    # ==========================================

    raise ValueError(
        f"Unsupported strategy type: {strategy_type}"
    )