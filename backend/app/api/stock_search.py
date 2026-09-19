"""
QuantNova Indian Stock Search API

Searches Yahoo Finance and returns Indian
NSE/BSE equity securities.

The search is intentionally restricted to
Indian stocks so that global Yahoo Finance
results do not appear in QuantNova.
"""

from __future__ import annotations

from typing import Any

import requests

from fastapi import APIRouter, HTTPException


router = APIRouter(
    prefix="/market",
    tags=["Market"],
)


YAHOO_SEARCH_URL = (
    "https://query1.finance.yahoo.com/v1/finance/search"
)


# ============================================================
# CONFIGURATION
# ============================================================

INDIAN_EXCHANGES = {
    "NSE",
    "BSE",
    "NSI",
    "BOM",
    "NSEI",
    "BSEI",
}


# ============================================================
# HELPERS
# ============================================================

def is_indian_symbol(
    symbol: str,
) -> bool:
    """
    Check whether a Yahoo Finance symbol belongs
    to an Indian NSE/BSE market.

    Examples:

        SBIN.NS      -> True
        RELIANCE.NS  -> True
        TCS.NS       -> True
        TCS.BO       -> True

        AAPL         -> False
        SBI          -> False
        8473.T       -> False
    """

    symbol = (
        str(symbol)
        .strip()
        .upper()
    )

    return (
        symbol.endswith(".NS")
        or symbol.endswith(".BO")
    )


def calculate_relevance(
    quote: dict[str, Any],
    query: str,
) -> int:
    """
    Calculate a simple relevance score.

    Higher score = better search result.
    """

    query = (
        str(query)
        .strip()
        .upper()
    )

    symbol = (
        str(
            quote.get("symbol")
            or ""
        )
        .strip()
        .upper()
    )

    short_name = (
        str(
            quote.get("shortname")
            or ""
        )
        .strip()
        .upper()
    )

    long_name = (
        str(
            quote.get("longname")
            or ""
        )
        .strip()
        .upper()
    )

    score = 0

    # --------------------------------------------------------
    # Exact symbol match
    # --------------------------------------------------------

    if symbol == query:
        score += 1000

    # --------------------------------------------------------
    # Exact Indian symbol without suffix
    #
    # Example:
    # query = SBIN
    # symbol = SBIN.NS
    # --------------------------------------------------------

    base_symbol = (
        symbol.replace(
            ".NS",
            "",
        ).replace(
            ".BO",
            "",
        )
    )

    if base_symbol == query:
        score += 900

    # --------------------------------------------------------
    # Symbol starts with query
    # --------------------------------------------------------

    if symbol.startswith(query):
        score += 500

    if base_symbol.startswith(query):
        score += 450

    # --------------------------------------------------------
    # Company name exact/starts with query
    # --------------------------------------------------------

    if short_name == query:
        score += 400

    if short_name.startswith(query):
        score += 300

    if query in short_name:
        score += 150

    if query in long_name:
        score += 100

    # --------------------------------------------------------
    # Prefer NSE over BSE
    # --------------------------------------------------------

    if symbol.endswith(".NS"):
        score += 50

    elif symbol.endswith(".BO"):
        score += 30

    return score


def normalize_quote(
    quote: dict[str, Any],
) -> dict[str, Any]:

    symbol = (
        quote.get("symbol")
        or ""
    )

    name = (
        quote.get("longname")
        or quote.get("shortname")
        or symbol
    )

    short_name = (
        quote.get("shortname")
        or name
    )

    exchange = (
        quote.get("exchange")
        or ""
    )

    exchange_display = (
        quote.get("exchDisp")
        or exchange
    )

    quote_type = (
        quote.get("quoteType")
        or ""
    ).upper()

    # Normalize exchange display
    if symbol.upper().endswith(".NS"):
        exchange_display = "NSE"

    elif symbol.upper().endswith(".BO"):
        exchange_display = "BSE"

    return {
        "symbol": symbol,
        "name": name,
        "short_name": short_name,
        "exchange": exchange,
        "exchange_display": exchange_display,
        "quote_type": quote_type,
    }


# ============================================================
# SEARCH
# ============================================================

@router.get("/search")
def search_stocks(
    q: str,
    limit: int = 10,
) -> dict[str, Any]:

    try:

        query = (
            str(q)
            .strip()
        )

        # ----------------------------------------------------
        # Empty search
        # ----------------------------------------------------

        if not query:

            return {
                "success": True,
                "query": "",
                "market": "INDIA",
                "results": [],
            }

        # ----------------------------------------------------
        # Minimum search length
        # ----------------------------------------------------

        if len(query) < 1:

            return {
                "success": True,
                "query": query,
                "market": "INDIA",
                "results": [],
            }

        # ----------------------------------------------------
        # Limit
        # ----------------------------------------------------

        limit = max(
            1,
            min(
                int(limit),
                20,
            ),
        )

        # ----------------------------------------------------
        # Yahoo Finance request
        # ----------------------------------------------------

        params = {
            "q": query,
            "quotesCount": 50,
            "newsCount": 0,
        }

        headers = {
            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "Chrome/153.0 Safari/537.36"
            )
        }

        response = requests.get(
            YAHOO_SEARCH_URL,
            params=params,
            headers=headers,
            timeout=10,
        )

        response.raise_for_status()

        data = response.json()

        quotes = data.get(
            "quotes",
            [],
        )

        # ----------------------------------------------------
        # Filter Indian equities
        # ----------------------------------------------------

        indian_quotes = []

        for quote in quotes:

            symbol = (
                quote.get("symbol")
                or ""
            )

            quote_type = (
                quote.get("quoteType")
                or ""
            ).upper()

            exchange = (
                quote.get("exchange")
                or ""
            ).upper()

            # ------------------------------------------------
            # Only EQUITY
            # ------------------------------------------------

            if quote_type != "EQUITY":
                continue

            # ------------------------------------------------
            # Only Indian symbols
            #
            # .NS = NSE
            # .BO = BSE
            # ------------------------------------------------

            if not is_indian_symbol(
                symbol
            ):
                continue

            # ------------------------------------------------
            # Additional exchange safety
            # ------------------------------------------------

            if (
                exchange
                and exchange not in INDIAN_EXCHANGES
            ):

                # Yahoo sometimes uses different
                # exchange identifiers, so symbol
                # suffix remains the primary filter.
                if not (
                    str(symbol)
                    .upper()
                    .endswith(".NS")
                    or str(symbol)
                    .upper()
                    .endswith(".BO")
                ):
                    continue

            # ------------------------------------------------
            # Relevance
            # ------------------------------------------------

            score = calculate_relevance(
                quote,
                query,
            )

            normalized = normalize_quote(
                quote
            )

            normalized[
                "_score"
            ] = score

            indian_quotes.append(
                normalized
            )

        # ----------------------------------------------------
        # Sort by relevance
        # ----------------------------------------------------

        indian_quotes.sort(
            key=lambda item: (
                item.get(
                    "_score",
                    0,
                ),
                1
                if item.get(
                    "symbol",
                    "",
                ).upper().endswith(".NS")
                else 0,
            ),
            reverse=True,
        )

        # ----------------------------------------------------
        # Remove internal score
        # ----------------------------------------------------

        results = []

        seen_symbols = set()

        for quote in indian_quotes:

            symbol = quote.get(
                "symbol"
            )

            if not symbol:
                continue

            symbol = symbol.upper()

            if symbol in seen_symbols:
                continue

            seen_symbols.add(
                symbol
            )

            quote.pop(
                "_score",
                None,
            )

            results.append(
                quote
            )

            if len(results) >= limit:
                break

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return {
            "success": True,
            "query": query,
            "market": "INDIA",
            "results": results,
        }

    except requests.RequestException as error:

        raise HTTPException(
            status_code=502,
            detail=(
                "Unable to search Yahoo Finance: "
                f"{str(error)}"
            ),
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                "Stock search failed: "
                f"{str(error)}"
            ),
        )
        