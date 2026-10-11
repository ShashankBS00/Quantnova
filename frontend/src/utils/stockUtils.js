// Stock metadata and financial formatting utilities

export const STOCK_NAMES = {
  "RELIANCE.NS": "Reliance Industries Ltd",
  "TCS.NS": "Tata Consultancy Services Ltd",
  "INFY.NS": "Infosys Ltd",
  "HDFCBANK.NS": "HDFC Bank Ltd",
  "ICICIBANK.NS": "ICICI Bank Ltd",
  "SBIN.NS": "State Bank of India",
  "BHARTIARTL.NS": "Bharti Airtel Ltd",
  "ITC.NS": "ITC Ltd",
  "TATAMOTORS.NS": "Tata Motors Ltd",
  "LT.NS": "Larsen & Toubro Ltd",
  "KOTAKBANK.NS": "Kotak Mahindra Bank Ltd",
  "AXISBANK.NS": "Axis Bank Ltd",
  "HINDUNILVR.NS": "Hindustan Unilever Ltd",
  "BAJFINANCE.NS": "Bajaj Finance Ltd",
  "MARUTI.NS": "Maruti Suzuki India Ltd",
  "SUNPHARMA.NS": "Sun Pharmaceutical Industries Ltd",
  "TITAN.NS": "Titan Company Ltd",
  "WIPRO.NS": "Wipro Ltd",
  "ADANIENT.NS": "Adani Enterprises Ltd",
  "ASIANPAINT.NS": "Asian Paints Ltd",
  "NTPC.NS": "NTPC Ltd",
  "POWERGRID.NS": "Power Grid Corporation of India",
  "ONGC.NS": "Oil & Natural Gas Corporation Ltd",
  "COALINDIA.NS": "Coal India Ltd",
  "TATASTEEL.NS": "Tata Steel Ltd",
  "M&M.NS": "Mahindra & Mahindra Ltd",
  "HCLTECH.NS": "HCL Technologies Ltd",
  "ULTRACEMCO.NS": "UltraTech Cement Ltd",
  "NESTLEIND.NS": "Nestle India Ltd",
  "BAJAJFINSV.NS": "Bajaj Finserv Ltd",
};

/**
 * Returns clean company name for a ticker, or formats symbol nicely
 */
export function getCompanyName(symbol) {
  if (!symbol) return "—";
  const upper = symbol.toUpperCase().trim();
  if (STOCK_NAMES[upper]) return STOCK_NAMES[upper];
  const clean = upper.replace(/\.(NS|BO)$/i, "");
  return `${clean} Ltd`;
}

/**
 * Returns clean exchange name
 */
export function getExchange(symbol) {
  if (!symbol) return "NSE";
  const upper = symbol.toUpperCase().trim();
  if (upper.endsWith(".BO")) return "BSE";
  return "NSE";
}

/**
 * Strips .NS / .BO from symbol
 */
export function getCleanSymbol(symbol) {
  if (!symbol) return "";
  return symbol.replace(/\.(NS|BO)$/i, "");
}

/**
 * Formats a numeric value into INR currency e.g. ₹58,668.70
 */
export function formatINR(value, includeSymbol = true) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  const formatted = Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Formats signed INR for P&L e.g. +₹1,240.50 or -₹320.00
 */
export function formatPnlINR(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  const n = Number(value);
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  const formatted = Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}₹${formatted}`;
}

/**
 * Formats percentage e.g. +3.45% or -1.20%
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  const n = Number(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}%`;
}
