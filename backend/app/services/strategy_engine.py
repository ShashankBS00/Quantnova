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
    # UNKNOWN STRATEGY
    # ======================================

    raise ValueError(

        f"Unsupported strategy type: "
        f"{strategy_type}"

    )