from sqlalchemy.orm import Session

from app.database.models import Strategy


# ==========================================
# Create Strategy
# ==========================================

def create_strategy(
    db: Session,
    user_id: int,
    name: str,
    symbol: str,
    strategy_type: str,
    asset_type: str = "STOCK",
    trading_style: str = "INTRADAY",
    timeframe: str = "1d",
    parameters: dict | None = None,
    stop_loss_percent: float | None = None,
    risk_reward_ratio: float | None = None,
):

    # --------------------------------------
    # Basic validation
    # --------------------------------------

    if not name or not name.strip():
        raise ValueError(
            "Strategy name is required"
        )

    if not symbol or not symbol.strip():
        raise ValueError(
            "Stock symbol is required"
        )

    if not strategy_type or not strategy_type.strip():
        raise ValueError(
            "Strategy type is required"
        )

    # --------------------------------------
    # Normalize values
    # --------------------------------------

    name = name.strip()

    symbol = symbol.strip().upper()

    strategy_type = strategy_type.strip().upper()

    asset_type = asset_type.strip().upper()

    trading_style = trading_style.strip().upper()

    timeframe = timeframe.strip().lower()

    # --------------------------------------
    # Allowed strategies
    # --------------------------------------

    allowed_strategies = [
        "SMA_CROSSOVER",
        "EMA_CROSSOVER",
        "SMA_EMA_TREND",
        "RSI",
        "MACD",
        "BOLLINGER_BANDS",
        "VWAP_EMA",
    ]

    if strategy_type not in allowed_strategies:

        raise ValueError(
            f"Unsupported strategy type: {strategy_type}"
        )

    # --------------------------------------
    # Allowed asset types
    # --------------------------------------

    allowed_asset_types = [
        "STOCK",
        "INDEX",
        "ETF",
    ]

    if asset_type not in allowed_asset_types:

        raise ValueError(
            f"Unsupported asset type: {asset_type}"
        )

    # --------------------------------------
    # Allowed trading styles
    # --------------------------------------

    allowed_trading_styles = [
        "INTRADAY",
        "SWING",
        "POSITION",
    ]

    if trading_style not in allowed_trading_styles:

        raise ValueError(
            f"Unsupported trading style: {trading_style}"
        )

    # --------------------------------------
    # Allowed timeframes
    # --------------------------------------

    allowed_timeframes = [
        "1m",
        "3m",
        "5m",
        "10m",
        "15m",
        "30m",
        "1h",
        "2h",
        "4h",
        "1d",
        "1wk",
        "1mo",
    ]

    if timeframe not in allowed_timeframes:

        raise ValueError(
            f"Unsupported timeframe: {timeframe}"
        )

    # --------------------------------------
    # Validate strategy parameters
    # --------------------------------------

    if parameters is None:
        parameters = {}

    if not isinstance(parameters, dict):

        raise ValueError(
            "Strategy parameters must be an object"
        )

    # ======================================
    # SMA CROSSOVER
    # ======================================

    if strategy_type == "SMA_CROSSOVER":

        fast_period = parameters.get(
            "fast_period"
        )

        slow_period = parameters.get(
            "slow_period"
        )

        if fast_period is None:
            raise ValueError(
                "Fast SMA period is required"
            )

        if slow_period is None:
            raise ValueError(
                "Slow SMA period is required"
            )

        try:
            fast_period = int(
                fast_period
            )

            slow_period = int(
                slow_period
            )

        except (TypeError, ValueError):

            raise ValueError(
                "SMA periods must be integers"
            )

        if fast_period <= 0:

            raise ValueError(
                "Fast SMA period must be greater than 0"
            )

        if slow_period <= 0:

            raise ValueError(
                "Slow SMA period must be greater than 0"
            )

        if fast_period >= slow_period:

            raise ValueError(
                "Fast SMA period must be smaller than slow SMA period"
            )

        parameters = {
            "fast_period": fast_period,
            "slow_period": slow_period,
        }

    # ======================================
    # EMA CROSSOVER
    # ======================================

    elif strategy_type == "EMA_CROSSOVER":

        fast_period = parameters.get(
            "fast_period"
        )

        slow_period = parameters.get(
            "slow_period"
        )

        if fast_period is None:
            raise ValueError(
                "Fast EMA period is required"
            )

        if slow_period is None:
            raise ValueError(
                "Slow EMA period is required"
            )

        try:
            fast_period = int(
                fast_period
            )

            slow_period = int(
                slow_period
            )

        except (TypeError, ValueError):

            raise ValueError(
                "EMA periods must be integers"
            )

        if fast_period <= 0:

            raise ValueError(
                "Fast EMA period must be greater than 0"
            )

        if slow_period <= 0:

            raise ValueError(
                "Slow EMA period must be greater than 0"
            )

        if fast_period >= slow_period:

            raise ValueError(
                "Fast EMA period must be smaller than slow EMA period"
            )

        parameters = {
            "fast_period": fast_period,
            "slow_period": slow_period,
        }

    # ======================================
    # SMA + EMA TREND
    # ======================================

    elif strategy_type == "SMA_EMA_TREND":

        fast_period = parameters.get(
            "fast_period"
        )

        slow_period = parameters.get(
            "slow_period"
        )

        if fast_period is None:
            raise ValueError(
                "Fast period is required"
            )

        if slow_period is None:
            raise ValueError(
                "Slow period is required"
            )

        try:
            fast_period = int(
                fast_period
            )

            slow_period = int(
                slow_period
            )

        except (TypeError, ValueError):

            raise ValueError(
                "Periods must be integers"
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

        parameters = {
            "fast_period": fast_period,
            "slow_period": slow_period,
        }

    # ======================================
    # RSI
    # ======================================

    elif strategy_type == "RSI":

        period = parameters.get(
            "period",
            14,
        )

        oversold = parameters.get(
            "oversold",
            30,
        )

        overbought = parameters.get(
            "overbought",
            70,
        )

        try:
            period = int(period)

            oversold = float(oversold)

            overbought = float(overbought)

        except (TypeError, ValueError):

            raise ValueError(
                "Invalid RSI parameters"
            )

        if period <= 0:

            raise ValueError(
                "RSI period must be greater than 0"
            )

        if not 0 < oversold < 100:

            raise ValueError(
                "RSI oversold must be between 0 and 100"
            )

        if not 0 < overbought < 100:

            raise ValueError(
                "RSI overbought must be between 0 and 100"
            )

        if oversold >= overbought:

            raise ValueError(
                "RSI oversold must be smaller than overbought"
            )

        parameters = {
            "period": period,
            "oversold": oversold,
            "overbought": overbought,
        }

    # ======================================
    # MACD
    # ======================================

    elif strategy_type == "MACD":

        fast_period = parameters.get(
            "fast_period",
            12,
        )

        slow_period = parameters.get(
            "slow_period",
            26,
        )

        signal_period = parameters.get(
            "signal_period",
            9,
        )

        try:
            fast_period = int(
                fast_period
            )

            slow_period = int(
                slow_period
            )

            signal_period = int(
                signal_period
            )

        except (TypeError, ValueError):

            raise ValueError(
                "Invalid MACD parameters"
            )

        if fast_period <= 0:

            raise ValueError(
                "MACD fast period must be greater than 0"
            )

        if slow_period <= 0:

            raise ValueError(
                "MACD slow period must be greater than 0"
            )

        if signal_period <= 0:

            raise ValueError(
                "MACD signal period must be greater than 0"
            )

        if fast_period >= slow_period:

            raise ValueError(
                "MACD fast period must be smaller than slow period"
            )

        parameters = {
            "fast_period": fast_period,
            "slow_period": slow_period,
            "signal_period": signal_period,
        }

    # ======================================
    # BOLLINGER BANDS
    # ======================================

    elif strategy_type == "BOLLINGER_BANDS":

        period = parameters.get(
            "period",
            20,
        )

        std_deviation = parameters.get(
            "std_deviation",
            2,
        )

        try:
            period = int(period)

            std_deviation = float(
                std_deviation
            )

        except (TypeError, ValueError):

            raise ValueError(
                "Invalid Bollinger Bands parameters"
            )

        if period <= 0:

            raise ValueError(
                "Bollinger period must be greater than 0"
            )

        if std_deviation <= 0:

            raise ValueError(
                "Standard deviation must be greater than 0"
            )

        parameters = {
            "period": period,
            "std_deviation": std_deviation,
        }

    # ======================================
    # VWAP + EMA
    # ======================================

    elif strategy_type == "VWAP_EMA":

        ema_period = parameters.get(
            "ema_period",
            20,
        )

        try:
            ema_period = int(ema_period)

        except (TypeError, ValueError):

            raise ValueError(
                "Invalid VWAP + EMA parameters"
            )

        if ema_period < 2:

            raise ValueError(
                "EMA period must be at least 2"
            )

        parameters = {
            "ema_period": ema_period,
        }

    # ======================================
    # Stop Loss
    # ======================================

    if stop_loss_percent is not None:

        try:
            stop_loss_percent = float(
                stop_loss_percent
            )

        except (TypeError, ValueError):

            raise ValueError(
                "Stop loss must be a number"
            )

        if stop_loss_percent <= 0:

            raise ValueError(
                "Stop loss must be greater than 0"
            )

        if stop_loss_percent > 100:

            raise ValueError(
                "Stop loss cannot be greater than 100%"
            )

    # ======================================
    # Risk Reward
    # ======================================

    if risk_reward_ratio is not None:

        try:
            risk_reward_ratio = float(
                risk_reward_ratio
            )

        except (TypeError, ValueError):

            raise ValueError(
                "Risk reward ratio must be a number"
            )

        if risk_reward_ratio <= 0:

            raise ValueError(
                "Risk reward ratio must be greater than 0"
            )

    # ======================================
    # Create Strategy
    # ======================================

    strategy = Strategy(
        user_id=user_id,

        name=name,

        symbol=symbol,

        asset_type=asset_type,

        trading_style=trading_style,

        timeframe=timeframe,

        strategy_type=strategy_type,

        parameters=parameters,

        stop_loss_percent=stop_loss_percent,

        risk_reward_ratio=risk_reward_ratio,
    )

    db.add(strategy)

    db.commit()

    db.refresh(strategy)

    return strategy


# ==========================================
# Get User Strategies
# ==========================================

def get_strategies(
    db: Session,
    user_id: int,
):

    return (
        db.query(Strategy)
        .filter(
            Strategy.user_id == user_id
        )
        .order_by(
            Strategy.id.desc()
        )
        .all()
    )


# ==========================================
# Get Single Strategy
# ==========================================

def get_strategy(
    db: Session,
    user_id: int,
    strategy_id: int,
):

    strategy = (
        db.query(Strategy)
        .filter(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id,
        )
        .first()
    )

    if strategy is None:

        raise ValueError(
            "Strategy not found"
        )

    return strategy


# ==========================================
# Delete Strategy
# ==========================================

def delete_strategy(
    db: Session,
    user_id: int,
    strategy_id: int,
):

    strategy = (
        db.query(Strategy)
        .filter(
            Strategy.id == strategy_id,
            Strategy.user_id == user_id,
        )
        .first()
    )

    if strategy is None:

        raise ValueError(
            "Strategy not found"
        )

    db.delete(strategy)

    db.commit()

    return {
        "message": "Strategy deleted successfully"
    }