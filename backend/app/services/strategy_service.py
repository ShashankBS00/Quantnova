from sqlalchemy.orm import Session

from app.database.models import Strategy


# --------------------------------
# Create Strategy
# --------------------------------

def create_strategy(
    db: Session,
    user_id: int,
    name: str,
    symbol: str,
    strategy_type: str,
    fast_period: int,
    slow_period: int,
    asset_type: str = "STOCK",
    timeframe: str = "1d",
):

    # -------------------------
    # Basic validation
    # -------------------------

    if not name.strip():
        raise ValueError(
            "Strategy name is required"
        )

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

    # -------------------------
    # Normalize values
    # -------------------------

    strategy_type = strategy_type.upper()
    asset_type = asset_type.upper()
    timeframe = timeframe.lower()

    # -------------------------
    # Allowed strategies
    # -------------------------

    allowed_strategies = [
        "SMA_CROSSOVER",
        "EMA_CROSSOVER",
        "SMA_EMA_TREND",
    ]

    if strategy_type not in allowed_strategies:
        raise ValueError(
            "Unsupported strategy type"
        )

    # -------------------------
    # Allowed asset types
    # -------------------------

    allowed_asset_types = [
        "STOCK",
    ]

    if asset_type not in allowed_asset_types:
        raise ValueError(
            "Unsupported asset type"
        )

    # -------------------------
    # Allowed timeframes
    # -------------------------

    allowed_timeframes = [
        "1d",
    ]

    if timeframe not in allowed_timeframes:
        raise ValueError(
            "Unsupported timeframe"
        )

    # -------------------------
    # Create database record
    # -------------------------

    strategy = Strategy(
        user_id=user_id,
        name=name.strip(),
        symbol=symbol.strip().upper(),
        asset_type=asset_type,
        timeframe=timeframe,
        strategy_type=strategy_type,
        fast_period=fast_period,
        slow_period=slow_period,
    )

    db.add(strategy)
    db.commit()
    db.refresh(strategy)

    return strategy


# --------------------------------
# Get User Strategies
# --------------------------------

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


# --------------------------------
# Get Single Strategy
# --------------------------------

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


# --------------------------------
# Delete Strategy
# --------------------------------

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