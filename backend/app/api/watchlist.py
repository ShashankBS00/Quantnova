from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Watchlist, User
from app.utils.auth_dependency import security
from jose import jwt, JWTError
from app.services.auth_service import SECRET_KEY, ALGORITHM

router = APIRouter(
    prefix="/watchlist",
    tags=["Watchlist"],
)

# ─── Default seed watchlists ──────────────────────────────────────────────────
DEFAULT_WATCHLISTS = [
    {
        "name": "My Watchlist",
        "symbols": [
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries Ltd", "exchange": "NSE"},
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services Ltd", "exchange": "NSE"},
            {"symbol": "INFY.NS", "name": "Infosys Limited", "exchange": "NSE"},
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "exchange": "NSE"},
            {"symbol": "TATAMOTORS.NS", "name": "Tata Motors Ltd", "exchange": "NSE"},
            {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd", "exchange": "NSE"},
        ],
    },
    {
        "name": "Banking & Finance",
        "symbols": [
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank Ltd", "exchange": "NSE"},
            {"symbol": "ICICIBANK.NS", "name": "ICICI Bank Ltd", "exchange": "NSE"},
            {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE"},
            {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "exchange": "NSE"},
            {"symbol": "AXISBANK.NS", "name": "Axis Bank Ltd", "exchange": "NSE"},
        ],
    },
    {
        "name": "Tech & IT",
        "symbols": [
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE"},
            {"symbol": "INFY.NS", "name": "Infosys Limited", "exchange": "NSE"},
            {"symbol": "WIPRO.NS", "name": "Wipro Limited", "exchange": "NSE"},
            {"symbol": "HCLTECH.NS", "name": "HCL Technologies Ltd", "exchange": "NSE"},
            {"symbol": "TECHM.NS", "name": "Tech Mahindra Ltd", "exchange": "NSE"},
        ],
    },
]

# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class StockItem(BaseModel):
    symbol: str
    name: Optional[str] = None
    exchange: Optional[str] = "NSE"

class CreateWatchlistRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    symbols: Optional[List[StockItem]] = []

class UpdateWatchlistRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class AddSymbolRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    name: Optional[str] = None
    exchange: Optional[str] = "NSE"

class ReorderRequest(BaseModel):
    symbols: List[StockItem]


# ─── Optional Auth Dependency ─────────────────────────────────────────────────

optional_security = HTTPBearer(auto_error=False)

def get_optional_current_user(
    db: Session = Depends(get_db),
    credentials=Depends(optional_security),
) -> Optional[User]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except Exception:
        return None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("")
def list_watchlists(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    """
    List all watchlists for user. Seeds defaults if none exist.
    """
    user_id = user.id if user else None
    query = db.query(Watchlist)
    if user_id:
        query = query.filter(Watchlist.user_id == user_id)
    else:
        query = query.filter(Watchlist.user_id.is_(None))

    lists = query.order_by(Watchlist.id.asc()).all()

    if not lists:
        # Seed default watchlists
        seeded = []
        for d in DEFAULT_WATCHLISTS:
            wl = Watchlist(
                user_id=user_id,
                name=d["name"],
                symbols=d["symbols"],
            )
            db.add(wl)
            seeded.append(wl)
        db.commit()
        for s in seeded:
            db.refresh(s)
        lists = seeded

    return {
        "success": True,
        "watchlists": [
            {
                "id": str(w.id),
                "name": w.name,
                "symbols": w.symbols or [],
                "created_at": w.created_at.isoformat() if w.created_at else None,
            }
            for w in lists
        ],
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_watchlist(
    request: CreateWatchlistRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = user.id if user else None
    clean_name = request.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Watchlist name cannot be empty")

    # Check for duplicate watchlist name
    existing = (
        db.query(Watchlist)
        .filter(
            Watchlist.user_id == user_id if user_id else Watchlist.user_id.is_(None),
            Watchlist.name == clean_name,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail=f"A watchlist named '{clean_name}' already exists")

    symbols_data = [item.dict() for item in (request.symbols or [])]
    wl = Watchlist(
        user_id=user_id,
        name=clean_name,
        symbols=symbols_data,
    )
    db.add(wl)
    db.commit()
    db.refresh(wl)

    return {
        "success": True,
        "watchlist": {
            "id": str(wl.id),
            "name": wl.name,
            "symbols": wl.symbols,
            "created_at": wl.created_at.isoformat() if wl.created_at else None,
        },
    }


@router.put("/{watchlist_id}")
def update_watchlist(
    watchlist_id: int,
    request: UpdateWatchlistRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = user.id if user else None
    query = db.query(Watchlist).filter(Watchlist.id == watchlist_id)
    if user_id:
        query = query.filter(Watchlist.user_id == user_id)
    wl = query.first()

    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    clean_name = request.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Watchlist name cannot be empty")

    wl.name = clean_name
    db.commit()
    db.refresh(wl)

    return {
        "success": True,
        "watchlist": {
            "id": str(wl.id),
            "name": wl.name,
            "symbols": wl.symbols,
        },
    }


@router.delete("/{watchlist_id}")
def delete_watchlist(
    watchlist_id: int,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = user.id if user else None
    query = db.query(Watchlist).filter(Watchlist.id == watchlist_id)
    if user_id:
        query = query.filter(Watchlist.user_id == user_id)
    wl = query.first()

    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    db.delete(wl)
    db.commit()

    return {"success": True, "message": f"Watchlist '{wl.name}' deleted"}


@router.post("/{watchlist_id}/symbols")
def add_symbol_to_watchlist(
    watchlist_id: int,
    request: AddSymbolRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = user.id if user else None
    query = db.query(Watchlist).filter(Watchlist.id == watchlist_id)
    if user_id:
        query = query.filter(Watchlist.user_id == user_id)
    wl = query.first()

    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    raw_symbol = request.symbol.strip().upper()
    if not ("." in raw_symbol):
        raw_symbol = f"{raw_symbol}.NS"

    current_symbols = list(wl.symbols or [])
    if any(item.get("symbol") == raw_symbol for item in current_symbols):
        raise HTTPException(status_code=400, detail=f"{raw_symbol} is already in '{wl.name}'")

    clean_display = raw_symbol.split(".")[0]
    stock_item = {
        "symbol": raw_symbol,
        "name": request.name or f"{clean_display} Ltd",
        "exchange": request.exchange or "NSE",
    }
    current_symbols.append(stock_item)
    wl.symbols = current_symbols
    db.commit()
    db.refresh(wl)

    return {
        "success": True,
        "watchlist": {
            "id": str(wl.id),
            "name": wl.name,
            "symbols": wl.symbols,
        },
    }


@router.delete("/{watchlist_id}/symbols/{symbol}")
def remove_symbol_from_watchlist(
    watchlist_id: int,
    symbol: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = user.id if user else None
    query = db.query(Watchlist).filter(Watchlist.id == watchlist_id)
    if user_id:
        query = query.filter(Watchlist.user_id == user_id)
    wl = query.first()

    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    target = symbol.strip().upper()
    current_symbols = list(wl.symbols or [])
    filtered = [item for item in current_symbols if item.get("symbol") != target]

    wl.symbols = filtered
    db.commit()
    db.refresh(wl)

    return {
        "success": True,
        "watchlist": {
            "id": str(wl.id),
            "name": wl.name,
            "symbols": wl.symbols,
        },
    }


@router.put("/{watchlist_id}/reorder")
def reorder_watchlist_symbols(
    watchlist_id: int,
    request: ReorderRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user),
):
    user_id = user.id if user else None
    query = db.query(Watchlist).filter(Watchlist.id == watchlist_id)
    if user_id:
        query = query.filter(Watchlist.user_id == user_id)
    wl = query.first()

    if not wl:
        raise HTTPException(status_code=404, detail="Watchlist not found")

    wl.symbols = [item.dict() for item in request.symbols]
    db.commit()
    db.refresh(wl)

    return {
        "success": True,
        "watchlist": {
            "id": str(wl.id),
            "name": wl.name,
            "symbols": wl.symbols,
        },
    }
