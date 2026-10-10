/**
 * indicators.js — Technical indicator calculations for QuantNova
 *
 * All functions accept an array of OHLCV candle objects:
 *   { time, open, high, low, close, volume }
 * and return an array of { time, value } points.
 * NaN / null values are filtered out.
 * No look-ahead bias — each bar uses only past and current data.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Filter out any data point whose value is not finite */
const filterValid = (arr) =>
  arr.filter((p) => p != null && isFinite(p.value));

/** Simple sum of an array slice */
const sum = (arr, from, to) => {
  let s = 0;
  for (let i = from; i <= to; i++) s += arr[i];
  return s;
};

// ─── SMA ─────────────────────────────────────────────────────────────────────

/**
 * Simple Moving Average
 * @param {Array} candles
 * @param {number} period
 * @returns {Array<{time, value}>}
 */
export function calcSMA(candles, period = 20) {
  const closes = candles.map((c) => c.close);
  const result = [];
  for (let i = period - 1; i < closes.length; i++) {
    const avg = sum(closes, i - period + 1, i) / period;
    result.push({ time: candles[i].time, value: parseFloat(avg.toFixed(4)) });
  }
  return filterValid(result);
}

// ─── EMA ─────────────────────────────────────────────────────────────────────

/**
 * Exponential Moving Average
 * @param {Array} candles
 * @param {number} period
 * @returns {Array<{time, value}>}
 */
export function calcEMA(candles, period = 20) {
  if (candles.length < period) return [];
  const closes = candles.map((c) => c.close);
  const k = 2 / (period + 1);
  const result = [];

  // Seed with SMA of first `period` bars
  let ema = sum(closes, 0, period - 1) / period;

  for (let i = period - 1; i < closes.length; i++) {
    if (i === period - 1) {
      ema = sum(closes, 0, period - 1) / period;
    } else {
      ema = closes[i] * k + ema * (1 - k);
    }
    result.push({ time: candles[i].time, value: parseFloat(ema.toFixed(4)) });
  }
  return filterValid(result);
}

// Internal EMA on raw number array (used by MACD, ADX, etc.)
function emaRaw(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out = new Array(values.length).fill(null);
  let ema = 0;
  for (let i = 0; i < period; i++) ema += values[i];
  ema /= period;
  out[period - 1] = ema;
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

// ─── VWAP ─────────────────────────────────────────────────────────────────────

/**
 * Volume Weighted Average Price
 * Resets each day (uses the date portion of `time` to detect session boundary).
 * @param {Array} candles
 * @returns {Array<{time, value}>}
 */
export function calcVWAP(candles) {
  const result = [];
  let cumVol = 0;
  let cumTPV = 0;
  let lastDay = null;

  for (const c of candles) {
    const date = new Date(c.time * 1000);
    const day = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;

    if (day !== lastDay) {
      cumVol = 0;
      cumTPV = 0;
      lastDay = day;
    }

    const tp = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 0;
    cumTPV += tp * vol;
    cumVol += vol;

    const vwap = cumVol === 0 ? tp : cumTPV / cumVol;
    result.push({ time: c.time, value: parseFloat(vwap.toFixed(4)) });
  }
  return filterValid(result);
}

// ─── Bollinger Bands ──────────────────────────────────────────────────────────

/**
 * Bollinger Bands
 * @param {Array} candles
 * @param {number} period
 * @param {number} stdDev multiplier
 * @returns {{ upper, middle, lower }} each an array of {time, value}
 */
export function calcBollingerBands(candles, period = 20, stdDev = 2) {
  const closes = candles.map((c) => c.close);
  const upper = [];
  const middle = [];
  const lower = [];

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    const t = candles[i].time;
    upper.push({ time: t, value: parseFloat((mean + stdDev * sd).toFixed(4)) });
    middle.push({ time: t, value: parseFloat(mean.toFixed(4)) });
    lower.push({ time: t, value: parseFloat((mean - stdDev * sd).toFixed(4)) });
  }
  return {
    upper: filterValid(upper),
    middle: filterValid(middle),
    lower: filterValid(lower),
  };
}

// ─── RSI ──────────────────────────────────────────────────────────────────────

/**
 * Relative Strength Index (Wilder's smoothing)
 * @param {Array} candles
 * @param {number} period
 * @returns {Array<{time, value}>}
 */
export function calcRSI(candles, period = 14) {
  const closes = candles.map((c) => c.close);
  const result = [];
  if (closes.length < period + 1) return result;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;

  const rsi = (ag, al) => (al === 0 ? 100 : 100 - 100 / (1 + ag / al));
  result.push({ time: candles[period].time, value: parseFloat(rsi(avgGain, avgLoss).toFixed(4)) });

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result.push({ time: candles[i].time, value: parseFloat(rsi(avgGain, avgLoss).toFixed(4)) });
  }
  return filterValid(result);
}

// ─── MACD ─────────────────────────────────────────────────────────────────────

/**
 * MACD — Moving Average Convergence Divergence
 * @param {Array} candles
 * @param {number} fast
 * @param {number} slow
 * @param {number} signal
 * @returns {{ macd, signal, histogram }} each {time, value}[]
 */
export function calcMACD(candles, fast = 12, slow = 26, signal = 9) {
  const closes = candles.map((c) => c.close);
  const fastEMA = emaRaw(closes, fast);
  const slowEMA = emaRaw(closes, slow);

  const macdLine = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] != null && slowEMA[i] != null) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    } else {
      macdLine.push(null);
    }
  }

  const validMacdValues = macdLine.filter((v) => v != null);
  const signalRaw = emaRaw(validMacdValues, signal);

  const macdResult = [];
  const signalResult = [];
  const histResult = [];
  let validIdx = 0;

  for (let i = 0; i < candles.length; i++) {
    const m = macdLine[i];
    if (m == null) continue;
    const s = signalRaw[validIdx];
    macdResult.push({ time: candles[i].time, value: parseFloat(m.toFixed(4)) });
    if (s != null) {
      signalResult.push({ time: candles[i].time, value: parseFloat(s.toFixed(4)) });
      histResult.push({ time: candles[i].time, value: parseFloat((m - s).toFixed(4)) });
    }
    validIdx++;
  }

  return {
    macd: filterValid(macdResult),
    signal: filterValid(signalResult),
    histogram: filterValid(histResult),
  };
}

// ─── ATR ──────────────────────────────────────────────────────────────────────

/**
 * Average True Range (Wilder's smoothing)
 * @param {Array} candles
 * @param {number} period
 * @returns {Array<{time, value}>}
 */
export function calcATR(candles, period = 14) {
  if (candles.length < period + 1) return [];
  const trueRanges = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }

  const result = [];
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push({ time: candles[period].time, value: parseFloat(atr.toFixed(4)) });

  for (let i = period; i < trueRanges.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    result.push({ time: candles[i + 1].time, value: parseFloat(atr.toFixed(4)) });
  }
  return filterValid(result);
}

// ─── ADX ──────────────────────────────────────────────────────────────────────

/**
 * Average Directional Index
 * @param {Array} candles
 * @param {number} period
 * @returns {Array<{time, value}>}
 */
export function calcADX(candles, period = 14) {
  if (candles.length < period * 2) return [];

  const plusDM = [];
  const minusDM = [];
  const trArr = [];

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;

    const upMove = high - prevHigh;
    const downMove = prevLow - low;

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    trArr.push(
      Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
    );
  }

  const wilderSmooth = (arr) => {
    const out = [];
    let s = arr.slice(0, period).reduce((a, b) => a + b, 0);
    out.push(s);
    for (let i = period; i < arr.length; i++) {
      s = s - s / period + arr[i];
      out.push(s);
    }
    return out;
  };

  const sTR = wilderSmooth(trArr);
  const sPlusDM = wilderSmooth(plusDM);
  const sMinusDM = wilderSmooth(minusDM);

  const dx = [];
  for (let i = 0; i < sTR.length; i++) {
    if (sTR[i] === 0) { dx.push(0); continue; }
    const plusDI = (sPlusDM[i] / sTR[i]) * 100;
    const minusDI = (sMinusDM[i] / sTR[i]) * 100;
    const diSum = plusDI + minusDI;
    dx.push(diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100);
  }

  const result = [];
  let adx = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < dx.length; i++) {
    adx = (adx * (period - 1) + dx[i]) / period;
    const candleIdx = i + period;
    if (candleIdx < candles.length) {
      result.push({
        time: candles[candleIdx].time,
        value: parseFloat(adx.toFixed(4)),
      });
    }
  }
  return filterValid(result);
}

// ─── Supertrend ───────────────────────────────────────────────────────────────

/**
 * Supertrend
 * @param {Array} candles
 * @param {number} atrPeriod
 * @param {number} multiplier
 * @returns {{ bull, bear }} each {time, value}[]
 */
export function calcSupertrend(candles, atrPeriod = 10, multiplier = 3) {
  const atrData = calcATR(candles, atrPeriod);
  if (atrData.length === 0) return { bull: [], bear: [] };

  const atrMap = new Map(atrData.map((d) => [d.time, d.value]));

  const bull = [];
  const bear = [];

  let upperBand = null;
  let lowerBand = null;
  let supertrend = null;
  let isBull = false; // tracks trend direction (false = bearish)

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const atr = atrMap.get(c.time);
    if (atr == null) continue;

    const hl2 = (c.high + c.low) / 2;
    const rawUpper = hl2 + multiplier * atr;
    const rawLower = hl2 - multiplier * atr;

    const prevUpper = upperBand;
    const prevLower = lowerBand;
    const prevClose = i > 0 ? candles[i - 1].close : null;

    upperBand =
      prevUpper != null && rawUpper > prevUpper && prevClose != null && prevClose < prevUpper
        ? prevUpper
        : rawUpper;
    lowerBand =
      prevLower != null && rawLower < prevLower && prevClose != null && prevClose > prevLower
        ? prevLower
        : rawLower;

    if (supertrend == null) {
      supertrend = upperBand;
      isBull = false;
    } else if (!isBull) {
      // Currently bearish — check if price crosses above upper band
      if (c.close > upperBand) {
        isBull = true;
        supertrend = lowerBand;
      } else {
        supertrend = upperBand;
      }
    } else {
      // Currently bullish — check if price crosses below lower band
      if (c.close < lowerBand) {
        isBull = false;
        supertrend = upperBand;
      } else {
        supertrend = lowerBand;
      }
    }

    if (isBull) {
      bull.push({ time: c.time, value: parseFloat(supertrend.toFixed(4)) });
    } else {
      bear.push({ time: c.time, value: parseFloat(supertrend.toFixed(4)) });
    }
  }

  return { bull: filterValid(bull), bear: filterValid(bear) };
}

// ─── Pivot Points ─────────────────────────────────────────────────────────────

/**
 * Standard Pivot Points (uses the second-to-last candle as "previous session")
 * @param {Array} candles
 * @returns {{ P, R1, R2, R3, S1, S2, S3 }} each a number
 */
export function calcStandardPivots(candles) {
  if (candles.length < 2) return null;
  const prev = candles[candles.length - 2];
  const H = prev.high;
  const L = prev.low;
  const C = prev.close;
  const P = (H + L + C) / 3;
  return {
    P: parseFloat(P.toFixed(4)),
    R1: parseFloat((2 * P - L).toFixed(4)),
    R2: parseFloat((P + H - L).toFixed(4)),
    R3: parseFloat((H + 2 * (P - L)).toFixed(4)),
    S1: parseFloat((2 * P - H).toFixed(4)),
    S2: parseFloat((P - H + L).toFixed(4)),
    S3: parseFloat((L - 2 * (H - P)).toFixed(4)),
  };
}

/**
 * Camarilla Pivot Points
 * @param {Array} candles
 * @returns {{ H4, H3, H2, H1, L1, L2, L3, L4 }} each a number
 */
export function calcCamarillaPivots(candles) {
  if (candles.length < 2) return null;
  const prev = candles[candles.length - 2];
  const H = prev.high;
  const L = prev.low;
  const C = prev.close;
  const range = H - L;
  return {
    H4: parseFloat((C + range * 1.1 / 2).toFixed(4)),
    H3: parseFloat((C + range * 1.1 / 4).toFixed(4)),
    H2: parseFloat((C + range * 1.1 / 6).toFixed(4)),
    H1: parseFloat((C + range * 1.1 / 12).toFixed(4)),
    L1: parseFloat((C - range * 1.1 / 12).toFixed(4)),
    L2: parseFloat((C - range * 1.1 / 6).toFixed(4)),
    L3: parseFloat((C - range * 1.1 / 4).toFixed(4)),
    L4: parseFloat((C - range * 1.1 / 2).toFixed(4)),
  };
}
