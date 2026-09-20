import yfinance as yf
import pandas as pd
from app.services.strategies.Camarilla_EMA20 import (
    calculate_camarilla_ema20,
    get_camarilla_ema20_signal,
)


# =========================================================
# TIMEFRAME CONFIGURATION
# =========================================================

TIMEFRAME_CONFIG = {
    "1m": {
        "interval": "1m",
        "period": "7d",
    },

    "3m": {
        "interval": "3m",
        "period": "60d",
    },

    "5m": {
        "interval": "5m",
        "period": "60d",
    },

    "10m": {
        "interval": "10m",
        "period": "60d",
    },

    "15m": {
        "interval": "15m",
        "period": "60d",
    },

    "30m": {
        "interval": "30m",
        "period": "60d",
    },

    "1h": {
        "interval": "1h",
        "period": "730d",
    },

    "2h": {
        "interval": "2h",
        "period": "730d",
    },

    "4h": {
        "interval": "4h",
        "period": "730d",
    },

    "1d": {
        "interval": "1d",
        "period": "1y",
    },

    "1wk": {
        "interval": "1wk",
        "period": "5y",
    },

    "1mo": {
        "interval": "1mo",
        "period": "10y",
    },
}


# =========================================================
# SYMBOL NORMALIZATION
# =========================================================

SYMBOL_MAP = {
    "NIFTY": "^NSEI",
    "NIFTY50": "^NSEI",
    "NIFTY 50": "^NSEI",

    "BANKNIFTY": "^NSEBANK",
    "NIFTYBANK": "^NSEBANK",
    "NIFTY BANK": "^NSEBANK",

    "SENSEX": "^BSESN",
}


def normalize_symbol(symbol: str) -> str:

    symbol = (
        str(symbol)
        .strip()
        .upper()
    )

    if not symbol:

        raise ValueError(
            "Stock symbol is required"
        )

    # NIFTY / BANKNIFTY / SENSEX
    if symbol in SYMBOL_MAP:

        return SYMBOL_MAP[symbol]

    # Already Yahoo index symbol
    if symbol.startswith("^"):

        return symbol

    # Indian stock
    if "." not in symbol:

        return f"{symbol}.NS"

    return symbol


# =========================================================
# LOAD MARKET DATA
# =========================================================

def load_market_data(
    symbol: str,
    minimum_period: int,
    timeframe: str = "1d",
):

    timeframe = (
        str(timeframe)
        .strip()
        .lower()
    )

    if timeframe not in TIMEFRAME_CONFIG:

        raise ValueError(
            "Unsupported timeframe: "
            f"{timeframe}"
        )

    yahoo_symbol = normalize_symbol(
        symbol
    )

    config = TIMEFRAME_CONFIG[
        timeframe
    ]

    interval = config["interval"]
    period = config["period"]

    print(
        f"🌐 Backtest data: "
        f"{yahoo_symbol} | "
        f"timeframe={timeframe} | "
        f"interval={interval} | "
        f"period={period}"
    )

    try:

        history = yf.download(
            yahoo_symbol,
            period=period,
            interval=interval,
            auto_adjust=False,
            progress=False,
        )

    except Exception as error:

        raise ValueError(
            "Failed to download market "
            f"data for {symbol}: {error}"
        )

    if history is None or history.empty:

        raise ValueError(
            f"No market data found for "
            f"{symbol} "
            f"({timeframe})"
        )

    # --------------------------------------
    # Handle yfinance MultiIndex
    # --------------------------------------

    if isinstance(
        history.columns,
        pd.MultiIndex,
    ):

        history.columns = (
            history.columns
            .get_level_values(0)
        )

    # --------------------------------------
    # Required columns
    # --------------------------------------

    required_columns = [
        "Open",
        "High",
        "Low",
        "Close",
    ]

    for column in required_columns:

        if column not in history.columns:

            raise ValueError(
                f"Market data is missing "
                f"column: {column}"
            )

    # --------------------------------------
    # Numeric conversion
    # --------------------------------------

    for column in [
        "Open",
        "High",
        "Low",
        "Close",
        "Volume",
    ]:

        if column in history.columns:

            history[column] = pd.to_numeric(
                history[column],
                errors="coerce",
            )

    # --------------------------------------
    # Remove invalid candles
    # --------------------------------------

    history = history.dropna(
        subset=[
            "Open",
            "High",
            "Low",
            "Close",
        ]
    )

    # --------------------------------------
    # Enough data
    # --------------------------------------

    if len(history) < minimum_period:

        raise ValueError(
            "Not enough historical data "
            f"for {symbol} at "
            f"{timeframe} timeframe. "
            f"Required: {minimum_period}, "
            f"Available: {len(history)}"
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


    # =====================================================
    # VWAP + EMA
    # =====================================================

    if strategy_type == "VWAP_EMA":

        ema_period = int(
            parameters.get(
                "ema_period",
                20,
            )
        )

        for col in ("High", "Low", "Close", "Volume"):
            history[col] = pd.to_numeric(
                history[col], errors="coerce"
            )

        typical_price = (
            history["High"] +
            history["Low"] +
            history["Close"]
        ) / 3.0

        if hasattr(history.index, "date"):
            history["_date"] = history.index.date
            history["_tp_vol"] = typical_price * history["Volume"]
            history["_cum_tp_vol"] = history.groupby("_date")["_tp_vol"].cumsum()
            history["_cum_vol"] = history.groupby("_date")["Volume"].cumsum()
            history["vwap"] = history["_cum_tp_vol"] / history["_cum_vol"]
            history.drop(
                columns=["_date", "_tp_vol", "_cum_tp_vol", "_cum_vol"],
                inplace=True,
            )
        else:
            cum_tp_vol = (typical_price * history["Volume"]).cumsum()
            cum_vol = history["Volume"].cumsum()
            history["vwap"] = cum_tp_vol / cum_vol

        history["ema"] = (
            history["Close"]
            .ewm(span=ema_period, adjust=False)
            .mean()
        )

        return history


    # =====================================================
    # SUPERTREND
    # =====================================================

    if strategy_type == "SUPERTREND":

        period = int(
            parameters.get(
                "period",
                10,
            )
        )

        multiplier = float(
            parameters.get(
                "multiplier",
                3.0,
            )
        )

        for col in ("High", "Low", "Close"):
            history[col] = pd.to_numeric(
                history[col], errors="coerce"
            )

        high = history["High"]
        low = history["Low"]
        prev_close = history["Close"].shift(1)

        tr = pd.concat(
            [
                high - low,
                (high - prev_close).abs(),
                (low - prev_close).abs(),
            ],
            axis=1,
        ).max(axis=1)

        atr = tr.ewm(
            span=(2 * period - 1),
            adjust=False,
            min_periods=period,
        ).mean()

        hl2 = (high + low) / 2.0
        basic_upper = hl2 + multiplier * atr
        basic_lower = hl2 - multiplier * atr

        import numpy as np
        n = len(history)
        final_upper = np.full(n, np.nan)
        final_lower = np.full(n, np.nan)
        supertrend = np.full(n, np.nan)
        trend = np.zeros(n, dtype=int)
        close_arr = history["Close"].to_numpy()

        for i in range(period, n):
            bu = basic_upper.iloc[i]
            bl = basic_lower.iloc[i]

            final_upper[i] = (
                bu if np.isnan(final_upper[i - 1]) or bu < final_upper[i - 1] or close_arr[i - 1] > final_upper[i - 1]
                else final_upper[i - 1]
            )
            final_lower[i] = (
                bl if np.isnan(final_lower[i - 1]) or bl > final_lower[i - 1] or close_arr[i - 1] < final_lower[i - 1]
                else final_lower[i - 1]
            )

            prev_st = supertrend[i - 1]
            if np.isnan(prev_st):
                if close_arr[i] > final_upper[i]:
                    supertrend[i] = final_lower[i]; trend[i] = 1
                else:
                    supertrend[i] = final_upper[i]; trend[i] = -1
            elif prev_st == final_upper[i - 1]:
                if close_arr[i] > final_upper[i]:
                    supertrend[i] = final_lower[i]; trend[i] = 1
                else:
                    supertrend[i] = final_upper[i]; trend[i] = -1
            else:
                if close_arr[i] < final_lower[i]:
                    supertrend[i] = final_upper[i]; trend[i] = -1
                else:
                    supertrend[i] = final_lower[i]; trend[i] = 1

        history["supertrend"] = supertrend
        history["supertrend_trend"] = trend

        return history


    # =====================================================
    # ADX + EMA
    # =====================================================

    if strategy_type == "ADX_EMA":

        adx_period = int(
            parameters.get("adx_period", 14)
        )

        ema_period = int(
            parameters.get("ema_period", 20)
        )

        for col in ("High", "Low", "Close"):
            history[col] = pd.to_numeric(
                history[col], errors="coerce"
            )

        high = history["High"]
        low = history["Low"]
        close = history["Close"]
        prev_close = close.shift(1)
        prev_high = high.shift(1)
        prev_low = low.shift(1)

        up_move = high - prev_high
        down_move = prev_low - low

        plus_dm = up_move.where(
            (up_move > down_move) & (up_move > 0), 0.0
        )
        minus_dm = down_move.where(
            (down_move > up_move) & (down_move > 0), 0.0
        )

        tr = pd.concat(
            [
                high - low,
                (high - prev_close).abs(),
                (low - prev_close).abs(),
            ],
            axis=1,
        ).max(axis=1)

        def _ws(s, p):
            return s.ewm(
                span=(2 * p - 1), adjust=False, min_periods=p
            ).mean()

        atr = _ws(tr, adx_period)
        plus_di = 100.0 * _ws(plus_dm, adx_period) / atr
        minus_di = 100.0 * _ws(minus_dm, adx_period) / atr

        di_sum = plus_di + minus_di
        dx = (100.0 * (plus_di - minus_di).abs() / di_sum).where(
            di_sum != 0, 0.0
        )
        history["adx"] = _ws(dx, adx_period)
        history["plus_di"] = plus_di
        history["minus_di"] = minus_di
        history["ema"] = close.ewm(
            span=ema_period, adjust=False
        ).mean()

        return history


    # =====================================================
    # CAMARILLA PIVOT + EMA20
    # =====================================================

    if strategy_type == "CAMARILLA_EMA20":

        ema_period = int(
            parameters.get(
                "ema_period",
                20,
            )
        )

        if ema_period < 2:

            raise ValueError(
                "EMA period must be at least 2"
            )

        return calculate_camarilla_ema20(
            history=history,
            ema_period=ema_period,
        )


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


    # =====================================================
    # VWAP + EMA
    # =====================================================

    if strategy_type == "VWAP_EMA":

        vwap = row.get("vwap", float("nan"))
        ema = row.get("ema", float("nan"))

        if (
            pd.isna(vwap)
            or pd.isna(ema)
            or index < 1
        ):
            return "HOLD"

        previous_close = float(
            history.iloc[index - 1]["Close"]
        )

        previous_vwap = history.iloc[
            index - 1
        ].get("vwap", float("nan"))

        if pd.isna(previous_vwap):
            return "HOLD"

        crossed_above = (
            previous_close <= float(previous_vwap)
            and close > float(vwap)
        )

        crossed_below = (
            previous_close >= float(previous_vwap)
            and close < float(vwap)
        )

        if crossed_above and close > float(ema):
            return "BUY"

        if crossed_below and close < float(ema):
            return "SELL"

        return "HOLD"


    # =====================================================
    # SUPERTREND
    # =====================================================

    if strategy_type == "SUPERTREND":

        st = row.get("supertrend", float("nan"))
        current_trend = row.get("supertrend_trend", 0)

        if pd.isna(st) or index < 1:
            return "HOLD"

        previous_trend = history.iloc[
            index - 1
        ].get("supertrend_trend", 0)

        if previous_trend != 1 and int(current_trend) == 1:
            return "BUY"

        if previous_trend != -1 and int(current_trend) == -1:
            return "SELL"

        return "HOLD"


    # =====================================================
    # ADX + EMA
    # =====================================================

    if strategy_type == "ADX_EMA":

        adx = row.get("adx", float("nan"))
        ema = row.get("ema", float("nan"))
        adx_threshold = float(
            parameters.get("adx_threshold", 25.0)
        )

        if pd.isna(adx) or pd.isna(ema) or index < 1:
            return "HOLD"

        if float(adx) <= adx_threshold:
            return "HOLD"

        previous_close = float(
            history.iloc[index - 1]["Close"]
        )
        previous_ema = history.iloc[index - 1].get(
            "ema", float("nan")
        )

        if pd.isna(previous_ema):
            return "HOLD"

        if previous_close <= float(previous_ema) and close > float(ema):
            return "BUY"

        if previous_close >= float(previous_ema) and close < float(ema):
            return "SELL"

        return "HOLD"


    # =====================================================
    # CAMARILLA PIVOT + EMA20
    # =====================================================

    if strategy_type == "CAMARILLA_EMA20":

        confirmation_bars = int(
            parameters.get(
                "confirmation_bars",
                3,
            )
        )

        if (
            confirmation_bars < 0
            or
            confirmation_bars > 3
        ):

            raise ValueError(
                "Confirmation bars must be between 0 and 3"
            )

        return get_camarilla_ema20_signal(
            history=history,
            index=index,
            confirmation_bars=confirmation_bars,
        )


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
    timeframe: str = "1d",
    initial_cash: float = 100000.0,
    stop_loss_percent=None,
    risk_reward_ratio=None,
):
    timeframe = (
        str(timeframe)
        .strip()
        .lower()
    )

    if timeframe not in TIMEFRAME_CONFIG:

        raise ValueError(
            "Unsupported timeframe: "
            f"{timeframe}"
        )


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

    elif strategy_type == "VWAP_EMA":

        minimum_period = int(
            parameters.get(
                "ema_period",
                20,
            )
        )

    elif strategy_type == "SUPERTREND":

        minimum_period = int(
            parameters.get(
                "period",
                10,
            )
        ) + 2

    elif strategy_type == "ADX_EMA":

        minimum_period = int(
            parameters.get(
                "adx_period",
                14,
            )
        ) * 2 + 2

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
    elif strategy_type == "CAMARILLA_EMA20":

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

        minimum_period = max(
            ema_period + confirmation_bars + 2,
            30,
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
    symbol=symbol,
    minimum_period=minimum_period,
    timeframe=timeframe,
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

        "timeframe": timeframe,

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