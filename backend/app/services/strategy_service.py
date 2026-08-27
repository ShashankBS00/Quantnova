strategies = []


# --------------------------------
# Create Strategy
# --------------------------------

def create_strategy(
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
    # Create strategy
    # -------------------------

    strategy = {
        "id": len(strategies) + 1,

        "name": name.strip(),

        "symbol": symbol.strip().upper(),

        "asset_type": asset_type,

        "timeframe": timeframe,

        "strategy_type": strategy_type,

        "fast_period": fast_period,

        "slow_period": slow_period,
    }

    strategies.append(strategy)

    return strategy


# --------------------------------
# Get All Strategies
# --------------------------------

def get_strategies():

    return strategies


# --------------------------------
# Get Single Strategy
# --------------------------------

def get_strategy(
    strategy_id: int,
):

    for strategy in strategies:

        if strategy["id"] == strategy_id:

            return strategy

    raise ValueError(
        "Strategy not found"
    )


# --------------------------------
# Delete Strategy
# --------------------------------

def delete_strategy(
    strategy_id: int,
):

    for index, strategy in enumerate(
        strategies
    ):

        if strategy["id"] == strategy_id:

            strategies.pop(index)

            return {
                "message": "Strategy deleted successfully"
            }

    raise ValueError(
        "Strategy not found"
    )