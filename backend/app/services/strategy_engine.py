import pandas as pd


# ==========================================
# Import Strategies
# ==========================================

from app.services.strategies.sma_ema import (
    calculate_sma_ema,
    get_sma_ema_signal,
)

from app.services.strategies.macd import (
    calculate_macd,
    get_macd_signal,
)

from app.services.strategies.bollinger_bands import (
    calculate_bollinger_bands,
    get_bollinger_signal,
)

from app.services.strategies.VWAP_ema import (
    calculate_vwap_ema,
    get_vwap_ema_signal,
)

from app.services.strategies.Supertrend import (
    calculate_supertrend,
    get_supertrend_signal,
)

from app.services.strategies.ADX_EMA import (
    calculate_adx_ema,
    get_adx_ema_signal,
)
from app.services.strategies.Camarilla_EMA20 import (
    calculate_camarilla_ema20,
    get_camarilla_ema20_signal,
)

# ==========================================
# Default Result
# ==========================================

def default_result():

    return {
        "signal": "HOLD",
        "price": 0.0,

        # SMA / EMA
        "fast_ema": 0.0,
        "slow_sma": 0.0,

        # MACD
        "macd": 0.0,
        "macd_signal": 0.0,
        "macd_hist": 0.0,

        # Bollinger Bands
        "bollinger_middle": 0.0,
        "bollinger_upper": 0.0,
        "bollinger_lower": 0.0,

        # VWAP + EMA
        "vwap": 0.0,
        "ema": 0.0,

        # Supertrend
        "supertrend": 0.0,
        "supertrend_trend": 0,

        # ADX + EMA
        "adx": 0.0,
        "plus_di": 0.0,
        "minus_di": 0.0,

        # SMA Crossover / EMA Crossover
        "fast_sma": 0.0,
        "slow_sma": 0.0,
        "fast_ema": 0.0,
        "slow_ema": 0.0,

        # RSI
        "rsi": 0.0,

        # Camarilla Pivot + EMA20
        "pivot": 0.0,

        "r1": 0.0,
        "r2": 0.0,
        "r3": 0.0,
        "r4": 0.0,
        "r5": 0.0,

        "s1": 0.0,
        "s2": 0.0,
        "s3": 0.0,
        "s4": 0.0,
        "s5": 0.0,

        "ema20": 0.0,
        
    }


# ==========================================
# Generate Signal
# ==========================================

def generate_signal(
    df,
    strategy_type,
    parameters=None,
):

    # --------------------------------------
    # Validate DataFrame
    # --------------------------------------

    if df is None or df.empty:

        return default_result()

    if "Close" not in df.columns:

        return default_result()


    # --------------------------------------
    # Parameters
    # --------------------------------------

    if parameters is None:

        parameters = {}

    if not isinstance(parameters, dict):

        raise ValueError(
            "Strategy parameters must be a dictionary"
        )


    # --------------------------------------
    # Normalize Strategy Type
    # --------------------------------------

    strategy_type = str(
        strategy_type
    ).upper()


    # --------------------------------------
    # Clean Close Prices
    # --------------------------------------

    df = df.copy()

    df["Close"] = pd.to_numeric(
        df["Close"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["Close"]
    )

    if df.empty:

        return default_result()


    # --------------------------------------
    # Current Price
    # --------------------------------------

    current_price = float(
        df["Close"].iloc[-1]
    )


    result = default_result()

    result["price"] = round(
        current_price,
        2
    )


    # ======================================
    # SMA CROSSOVER
    # ======================================

    if strategy_type == "SMA_CROSSOVER":

        fast_period = int(
            parameters.get("fast_period", 20)
        )

        slow_period = int(
            parameters.get("slow_period", 50)
        )

        if fast_period >= slow_period:
            raise ValueError(
                "Fast period must be smaller than slow period"
            )

        if len(df) < slow_period:
            return result

        df["fast_sma"] = (
            df["Close"].rolling(fast_period).mean()
        )
        df["slow_sma"] = (
            df["Close"].rolling(slow_period).mean()
        )

        fast = df["fast_sma"].iloc[-1]
        slow = df["slow_sma"].iloc[-1]
        prev_fast = df["fast_sma"].iloc[-2]
        prev_slow = df["slow_sma"].iloc[-2]

        if any(pd.isna(v) for v in [fast, slow, prev_fast, prev_slow]):
            return result

        if prev_fast <= prev_slow and float(fast) > float(slow):
            signal = "BUY"
        elif prev_fast >= prev_slow and float(fast) < float(slow):
            signal = "SELL"
        else:
            signal = "HOLD"

        result.update({
            "signal": signal,
            "fast_sma": round(float(fast), 2),
            "slow_sma": round(float(slow), 2),
        })

        return result


    # ======================================
    # EMA CROSSOVER
    # ======================================

    if strategy_type == "EMA_CROSSOVER":

        fast_period = int(
            parameters.get("fast_period", 20)
        )

        slow_period = int(
            parameters.get("slow_period", 50)
        )

        if fast_period >= slow_period:
            raise ValueError(
                "Fast period must be smaller than slow period"
            )

        if len(df) < slow_period:
            return result

        df["fast_ema"] = (
            df["Close"].ewm(span=fast_period, adjust=False).mean()
        )
        df["slow_ema"] = (
            df["Close"].ewm(span=slow_period, adjust=False).mean()
        )

        fast = df["fast_ema"].iloc[-1]
        slow = df["slow_ema"].iloc[-1]
        prev_fast = df["fast_ema"].iloc[-2]
        prev_slow = df["slow_ema"].iloc[-2]

        if any(pd.isna(v) for v in [fast, slow, prev_fast, prev_slow]):
            return result

        if prev_fast <= prev_slow and float(fast) > float(slow):
            signal = "BUY"
        elif prev_fast >= prev_slow and float(fast) < float(slow):
            signal = "SELL"
        else:
            signal = "HOLD"

        result.update({
            "signal": signal,
            "fast_ema": round(float(fast), 2),
            "slow_ema": round(float(slow), 2),
        })

        return result


    # ======================================
    # RSI
    # ======================================

    if strategy_type == "RSI":

        period = int(
            parameters.get("period", 14)
        )

        oversold = float(
            parameters.get("oversold", 30)
        )

        overbought = float(
            parameters.get("overbought", 70)
        )

        if len(df) < period + 1:
            return result

        delta = df["Close"].diff()
        gain = delta.where(delta > 0, 0.0)
        loss = (-delta).where(delta < 0, 0.0)

        avg_gain = gain.ewm(
            span=(2 * period - 1), adjust=False, min_periods=period
        ).mean()
        avg_loss = loss.ewm(
            span=(2 * period - 1), adjust=False, min_periods=period
        ).mean()

        rs = avg_gain / avg_loss.replace(0, float("inf"))
        rsi_series = 100.0 - (100.0 / (1.0 + rs))

        current_rsi = rsi_series.iloc[-1]
        prev_rsi = rsi_series.iloc[-2]

        if pd.isna(current_rsi) or pd.isna(prev_rsi):
            return result

        rsi_val = float(current_rsi)
        prev_rsi_val = float(prev_rsi)

        if prev_rsi_val <= oversold and rsi_val > oversold:
            signal = "BUY"
        elif prev_rsi_val >= overbought and rsi_val < overbought:
            signal = "SELL"
        else:
            signal = "HOLD"

        result.update({
            "signal": signal,
            "rsi": round(rsi_val, 2),
        })

        return result


    # ======================================
    # SMA + EMA TREND
    # ======================================

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


        # Validate
        if fast_period >= slow_period:

            raise ValueError(
                "Fast period must be smaller "
                "than slow period"
            )


        # Check enough data
        if len(df) < slow_period:

            return result


        # Calculate indicators
        df = calculate_sma_ema(
            history=df,
            fast_period=fast_period,
            slow_period=slow_period,
        )


        # Current values
        fast_ema = df[
            "fast_ema"
        ].iloc[-1]

        slow_sma = df[
            "slow_sma"
        ].iloc[-1]


        # Check NaN
        if (
            pd.isna(fast_ema)
            or pd.isna(slow_sma)
        ):

            return result


        # Generate signal
        signal = get_sma_ema_signal(

            close=current_price,

            fast_ema=float(
                fast_ema
            ),

            slow_sma=float(
                slow_sma
            ),
        )


        # Update result
        result.update({

            "signal": signal,

            "fast_ema": round(
                float(fast_ema),
                2
            ),

            "slow_sma": round(
                float(slow_sma),
                2
            ),

        })


        return result


    # ======================================
    # MACD
    # ======================================

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


        # Validate
        if fast_period >= slow_period:

            raise ValueError(
                "MACD fast period must be "
                "smaller than slow period"
            )


        # Need enough data
        if len(df) < slow_period + 2:

            return result


        # Calculate MACD
        df = calculate_macd(

            history=df,

            fast_period=fast_period,

            slow_period=slow_period,

            signal_period=signal_period,

        )


        # Current values
        current_macd = df[
            "macd"
        ].iloc[-1]

        current_signal = df[
            "macd_signal"
        ].iloc[-1]


        # Previous values
        previous_macd = df[
            "macd"
        ].iloc[-2]

        previous_signal = df[
            "macd_signal"
        ].iloc[-2]


        # Check NaN
        values = [

            current_macd,

            current_signal,

            previous_macd,

            previous_signal,

        ]


        if any(
            pd.isna(value)
            for value in values
        ):

            return result


        # Generate signal
        signal = get_macd_signal(

            current_macd=float(
                current_macd
            ),

            current_signal=float(
                current_signal
            ),

            previous_macd=float(
                previous_macd
            ),

            previous_signal=float(
                previous_signal
            ),

        )


        # Histogram
        macd_hist = df[
            "macd_hist"
        ].iloc[-1]


        # Update result
        result.update({

            "signal": signal,

            "macd": round(
                float(current_macd),
                4
            ),

            "macd_signal": round(
                float(current_signal),
                4
            ),

            "macd_hist": round(
                float(macd_hist),
                4
            ),

        })


        return result


    # ======================================
    # BOLLINGER BANDS
    # ======================================

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
                2.0
            )
        )


        # Validate
        if period < 2:

            raise ValueError(
                "Bollinger period must "
                "be at least 2"
            )


        if len(df) < period:

            return result


        # Calculate Bollinger Bands
        df = calculate_bollinger_bands(

            history=df,

            period=period,

            std_deviation=std_deviation,

        )


        # Get values
        middle = df[
            "bollinger_middle"
        ].iloc[-1]

        upper = df[
            "bollinger_upper"
        ].iloc[-1]

        lower = df[
            "bollinger_lower"
        ].iloc[-1]


        # Check NaN
        values = [

            middle,

            upper,

            lower,

        ]


        if any(
            pd.isna(value)
            for value in values
        ):

            return result


        # Generate signal
        signal = get_bollinger_signal(

            close=current_price,

            bollinger_upper=float(
                upper
            ),

            bollinger_lower=float(
                lower
            ),

        )


        # Update result
        result.update({

            "signal": signal,

            "bollinger_middle": round(
                float(middle),
                2
            ),

            "bollinger_upper": round(
                float(upper),
                2
            ),

            "bollinger_lower": round(
                float(lower),
                2
            ),

        })


        return result


    # ======================================
    # VWAP + EMA
    # ======================================

    if strategy_type == "VWAP_EMA":

        ema_period = int(
            parameters.get(
                "ema_period",
                20
            )
        )


        # Validate
        if ema_period < 2:

            raise ValueError(
                "EMA period must be "
                "at least 2"
            )


        # Need at least two rows for crossover detection
        if len(df) < max(ema_period, 2):

            return result


        # Require Volume column
        if "Volume" not in df.columns:

            return result


        # Calculate indicators
        df = calculate_vwap_ema(
            history=df,
            ema_period=ema_period,
        )


        # Current values
        current_vwap = df["vwap"].iloc[-1]
        current_ema = df["ema"].iloc[-1]

        # Previous values
        previous_close = df["Close"].iloc[-2]
        previous_vwap = df["vwap"].iloc[-2]


        # Check NaN
        values = [
            current_vwap,
            current_ema,
            previous_close,
            previous_vwap,
        ]

        if any(
            pd.isna(value)
            for value in values
        ):

            return result


        # Generate signal
        signal = get_vwap_ema_signal(

            close=current_price,

            vwap=float(current_vwap),

            ema=float(current_ema),

            previous_close=float(previous_close),

            previous_vwap=float(previous_vwap),

        )


        # Update result
        result.update({

            "signal": signal,

            "vwap": round(
                float(current_vwap),
                2
            ),

            "ema": round(
                float(current_ema),
                2
            ),

        })


        return result


    # ======================================
    # SUPERTREND
    # ======================================

    if strategy_type == "SUPERTREND":

        period = int(
            parameters.get(
                "period",
                10
            )
        )

        multiplier = float(
            parameters.get(
                "multiplier",
                3.0
            )
        )


        # Validate
        if period < 2:

            raise ValueError(
                "Supertrend period must be "
                "at least 2"
            )


        if multiplier <= 0:

            raise ValueError(
                "Supertrend multiplier must "
                "be greater than 0"
            )


        # Need enough data
        if len(df) < period + 2:

            return result


        # Require High/Low columns
        if "High" not in df.columns or "Low" not in df.columns:

            return result


        # Calculate Supertrend
        df = calculate_supertrend(
            history=df,
            period=period,
            multiplier=multiplier,
        )


        # Current values
        current_supertrend = df["supertrend"].iloc[-1]
        current_trend = int(df["supertrend_trend"].iloc[-1])

        # Previous trend
        previous_trend = int(df["supertrend_trend"].iloc[-2])


        # Check NaN
        if pd.isna(current_supertrend):

            return result


        # Generate signal
        signal = get_supertrend_signal(

            trend=current_trend,

            previous_trend=previous_trend,

        )


        # Update result
        result.update({

            "signal": signal,

            "supertrend": round(
                float(current_supertrend),
                2
            ),

            "supertrend_trend": current_trend,

        })


        return result


    # ======================================
    # ADX + EMA
    # ======================================

    if strategy_type == "ADX_EMA":

        adx_period = int(
            parameters.get(
                "adx_period",
                14
            )
        )

        ema_period = int(
            parameters.get(
                "ema_period",
                20
            )
        )

        adx_threshold = float(
            parameters.get(
                "adx_threshold",
                25.0
            )
        )


        # Validate
        if adx_period < 2:

            raise ValueError(
                "ADX period must be at least 2"
            )

        if ema_period < 2:

            raise ValueError(
                "EMA period must be at least 2"
            )


        # Need enough data
        if len(df) < max(adx_period * 2, ema_period) + 2:

            return result


        # Require High/Low columns
        if "High" not in df.columns or "Low" not in df.columns:

            return result


        # Calculate indicators
        df = calculate_adx_ema(
            history=df,
            adx_period=adx_period,
            ema_period=ema_period,
        )


        # Current values
        current_adx = df["adx"].iloc[-1]
        current_ema = df["ema"].iloc[-1]
        current_plus_di = df["plus_di"].iloc[-1]
        current_minus_di = df["minus_di"].iloc[-1]

        # Previous values
        previous_close = df["Close"].iloc[-2]
        previous_ema = df["ema"].iloc[-2]


        # Check NaN
        if any(
            pd.isna(v) for v in [
                current_adx,
                current_ema,
                previous_close,
                previous_ema,
            ]
        ):
            return result


        # Generate signal
        signal = get_adx_ema_signal(

            close=current_price,

            adx=float(current_adx),

            ema=float(current_ema),

            previous_close=float(previous_close),

            previous_ema=float(previous_ema),

            adx_threshold=adx_threshold,

        )


        # Update result
        result.update({

            "signal": signal,

            "adx": round(float(current_adx), 2),

            "plus_di": round(float(current_plus_di), 2),

            "minus_di": round(float(current_minus_di), 2),

        })


        return result
        
    # ======================================
    # CAMARILLA PIVOT + EMA20
    # ======================================

    if strategy_type == "CAMARILLA_EMA20":

        ema_period = int(
            parameters.get(
                "ema_period",
                20,
            )
        )

        confirmation_bars = int(
            parameters.get(
                "confirmation_bars",
                3,
            )
        )

        # Validate EMA
        if ema_period < 2:

            raise ValueError(
                "EMA period must be at least 2"
            )

        # Validate confirmation window
        if (
            confirmation_bars < 0
            or
            confirmation_bars > 3
        ):

            raise ValueError(
                "Confirmation bars must be between 0 and 3"
            )

        # Need enough candles
        if len(df) < (
            ema_period
            + confirmation_bars
            + 2
        ):

            return result

        # Require OHLC
        if (
            "High" not in df.columns
            or
            "Low" not in df.columns
        ):

            return result

        # Calculate Camarilla + EMA20
        df = calculate_camarilla_ema20(
            history=df,
            ema_period=ema_period,
        )

        # Generate signal
        signal = get_camarilla_ema20_signal(
            history=df,
            index=len(df) - 1,
            confirmation_bars=confirmation_bars,
        )

        latest = df.iloc[-1]

        result.update({

            "signal": signal,

            "pivot": (
                round(
                    float(latest["pivot"]),
                    2,
                )
                if pd.notna(latest["pivot"])
                else 0.0
            ),

            "r1": (
                round(
                    float(latest["r1"]),
                    2,
                )
                if pd.notna(latest["r1"])
                else 0.0
            ),

            "r2": (
                round(
                    float(latest["r2"]),
                    2,
                )
                if pd.notna(latest["r2"])
                else 0.0
            ),

            "r3": (
                round(
                    float(latest["r3"]),
                    2,
                )
                if pd.notna(latest["r3"])
                else 0.0
            ),

            "r4": (
                round(
                    float(latest["r4"]),
                    2,
                )
                if pd.notna(latest["r4"])
                else 0.0
            ),

            "r5": (
                round(
                    float(latest["r5"]),
                    2,
                )
                if pd.notna(latest["r5"])
                else 0.0
            ),

            "s1": (
                round(
                    float(latest["s1"]),
                    2,
                )
                if pd.notna(latest["s1"])
                else 0.0
            ),

            "s2": (
                round(
                    float(latest["s2"]),
                    2,
                )
                if pd.notna(latest["s2"])
                else 0.0
            ),

            "s3": (
                round(
                    float(latest["s3"]),
                    2,
                )
                if pd.notna(latest["s3"])
                else 0.0
            ),

            "s4": (
                round(
                    float(latest["s4"]),
                    2,
                )
                if pd.notna(latest["s4"])
                else 0.0
            ),

            "s5": (
                round(
                    float(latest["s5"]),
                    2,
                )
                if pd.notna(latest["s5"])
                else 0.0
            ),

            "ema20": (
                round(
                    float(latest["ema20"]),
                    2,
                )
                if pd.notna(latest["ema20"])
                else 0.0
            ),

        })

        return result


    # ======================================
    # UNKNOWN STRATEGY
    # ======================================

    raise ValueError(

        f"Unsupported strategy type: "
        f"{strategy_type}"

    )