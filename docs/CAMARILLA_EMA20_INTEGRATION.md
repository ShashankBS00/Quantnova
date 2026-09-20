# QuantNova — Camarilla Pivot + EMA20 Integration

## Strategy ID

`CAMARILLA_EMA20`

## Exact rules

- Camarilla Pivot Points: daily-based values
- Levels: P, R1-R5, S1-S5
- EMA: 20 on the selected chart timeframe
- Confirmation window: default 3 candles

### BUY

1. Price/candle touches S2, S3, S4, or S5.
2. On the same candle or within the next 3 candles, price crosses EMA20 upward:
   - previous close <= previous EMA20
   - current close > current EMA20
3. Generate `BUY`.

### SELL

1. Price/candle touches R2, R3, R4, or R5.
2. On the same candle or within the next 3 candles, price crosses EMA20 downward:
   - previous close >= previous EMA20
   - current close < current EMA20
3. Generate `SELL`.

### Exit

For the current QuantNova long-only backtester, a bearish EMA20 cross is also returned as `SELL`, so it can close an existing long position.

True short entry/exit needs the separate short-position support that QuantNova does not currently have.

## Files to integrate

### 1. Add

`backend/app/services/strategies/Camarilla_EMA20.py`

Use the supplied `Camarilla_EMA20.py` file.

### 2. strategy_engine.py

Add import:

```python
from app.services.strategies.Camarilla_EMA20 import (
    calculate_camarilla_ema20,
    get_camarilla_ema20_signal,
)
```

Add these fields to `default_result()`:

```python
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
```

Add this branch before `# UNKNOWN STRATEGY`:

```python
if strategy_type == "CAMARILLA_EMA20":

    ema_period = int(
        parameters.get("ema_period", 20)
    )

    confirmation_bars = int(
        parameters.get("confirmation_bars", 3)
    )

    if ema_period < 2:
        raise ValueError("EMA period must be at least 2")

    if confirmation_bars < 0 or confirmation_bars > 3:
        raise ValueError(
            "Confirmation bars must be between 0 and 3"
        )

    if len(df) < ema_period + confirmation_bars + 2:
        return result

    if not all(
        column in df.columns
        for column in ("High", "Low", "Close")
    ):
        return result

    df = calculate_camarilla_ema20(
        history=df,
        ema_period=ema_period,
    )

    signal = get_camarilla_ema20_signal(
        history=df,
        index=len(df) - 1,
        confirmation_bars=confirmation_bars,
    )

    latest = df.iloc[-1]

    result.update({
        "signal": signal,
        "pivot": round(float(latest["pivot"]), 2) if pd.notna(latest["pivot"]) else 0.0,
        "r1": round(float(latest["r1"]), 2) if pd.notna(latest["r1"]) else 0.0,
        "r2": round(float(latest["r2"]), 2) if pd.notna(latest["r2"]) else 0.0,
        "r3": round(float(latest["r3"]), 2) if pd.notna(latest["r3"]) else 0.0,
        "r4": round(float(latest["r4"]), 2) if pd.notna(latest["r4"]) else 0.0,
        "r5": round(float(latest["r5"]), 2) if pd.notna(latest["r5"]) else 0.0,
        "s1": round(float(latest["s1"]), 2) if pd.notna(latest["s1"]) else 0.0,
        "s2": round(float(latest["s2"]), 2) if pd.notna(latest["s2"]) else 0.0,
        "s3": round(float(latest["s3"]), 2) if pd.notna(latest["s3"]) else 0.0,
        "s4": round(float(latest["s4"]), 2) if pd.notna(latest["s4"]) else 0.0,
        "s5": round(float(latest["s5"]), 2) if pd.notna(latest["s5"]) else 0.0,
        "ema20": round(float(latest["ema20"]), 2) if pd.notna(latest["ema20"]) else 0.0,
    })

    return result
```

### 3. backtest_service.py

Import the strategy:

```python
from app.services.strategies.Camarilla_EMA20 import (
    calculate_camarilla_ema20,
    get_camarilla_ema20_signal,
)
```

In `calculate_strategy_indicators()`, add:

```python
if strategy_type == "CAMARILLA_EMA20":

    ema_period = int(
        parameters.get("ema_period", 20)
    )

    if ema_period < 2:
        raise ValueError("EMA period must be at least 2")

    return calculate_camarilla_ema20(
        history=history,
        ema_period=ema_period,
    )
```

In `get_strategy_signal()`, add:

```python
if strategy_type == "CAMARILLA_EMA20":

    confirmation_bars = int(
        parameters.get("confirmation_bars", 3)
    )

    if confirmation_bars < 0 or confirmation_bars > 3:
        raise ValueError(
            "Confirmation bars must be between 0 and 3"
        )

    return get_camarilla_ema20_signal(
        history=history,
        index=index,
        confirmation_bars=confirmation_bars,
    )
```

In the minimum-period selection in `run_strategy_backtest()`, add:

```python
elif strategy_type == "CAMARILLA_EMA20":

    ema_period = int(
        parameters.get("ema_period", 20)
    )

    confirmation_bars = int(
        parameters.get("confirmation_bars", 3)
    )

    minimum_period = max(
        ema_period + confirmation_bars + 2,
        30,
    )
```

### 4. frontend/src/config/strategies.js

Add this strategy object before the end of `strategyTypes`:

```javascript
{
  value: "CAMARILLA_EMA20",
  label: "Camarilla Pivot + EMA 20",
  description:
    "Uses daily-based Camarilla R2-R5/S2-S5 levels. Price touches a level and then crosses EMA 20 within the configured 1-3 candle confirmation window. An opposite EMA 20 cross is used as the exit signal.",
  fields: [
    {
      name: "confirmation_bars",
      label: "Confirmation Window (Candles)",
      type: "number",
      defaultValue: 3,
      min: 1,
      max: 3,
    },
  ],
}
```

## Important implementation detail

The pivot levels are based on the previous completed daily session, while EMA20 follows the selected chart timeframe. This matches the screenshot setting where daily-based values are enabled.

TradingView documents the Camarilla formulas as:
- R1/S1: previous close ± 1.1 × range / 12
- R2/S2: ± 1.1 × range / 6
- R3/S3: ± 1.1 × range / 4
- R4/S4: ± 1.1 × range / 2
- R5: previous high / previous low × previous close
- S5: previous close − (R5 − previous close)
