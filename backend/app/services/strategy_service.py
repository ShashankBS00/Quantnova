strategies = []


def create_strategy(
    name: str,
    symbol: str,
    strategy_type: str,
    fast_period: int,
    slow_period: int,
):
    if not name.strip():
        raise ValueError("Strategy name is required")

    if not symbol.strip():
        raise ValueError("Stock symbol is required")

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

    strategy = {
        "id": len(strategies) + 1,
        "name": name.strip(),
        "symbol": symbol.upper(),
        "strategy_type": strategy_type,
        "fast_period": fast_period,
        "slow_period": slow_period,
    }

    strategies.append(strategy)

    return strategy


def get_strategies():
    return strategies


def get_strategy(strategy_id: int):
    for strategy in strategies:
        if strategy["id"] == strategy_id:
            return strategy

    raise ValueError("Strategy not found")


def delete_strategy(strategy_id: int):
    for index, strategy in enumerate(strategies):

        if strategy["id"] == strategy_id:
            strategies.pop(index)

            return {
                "message": "Strategy deleted successfully"
            }

    raise ValueError("Strategy not found")