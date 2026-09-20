from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.trading import router as trading_router
from app.api.market import router as market_router
from app.api.strategy import router as strategy_router
from app.api.backtest import router as backtest_router
from app.api.paper_trading import (
    router as paper_trading_router
)
from app.database.database import Base, engine
from app.database import models
from app.routers.auth import router as auth_router
from app.api.prediction import router as prediction_router
from app.api.stock_search import router as stock_search_router
from app.api.prediction_history import (
    router as prediction_history_router
)
app = FastAPI(
    title="QuantNova API",
    version="1.0.0",
    description="AI-Powered Algorithmic Trading Platform API",
    
)

Base.metadata.create_all(
    bind=engine
)
# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market_router)
app.include_router(trading_router)
app.include_router(strategy_router)
app.include_router(backtest_router)
app.include_router(paper_trading_router)
app.include_router(
    auth_router
)
app.include_router(prediction_router)
app.include_router(stock_search_router)
app.include_router(
    prediction_history_router
)

@app.get("/")
def home():
    return {
        "message": "Welcome to QuantNova API 🚀",
        "status": "Running",
    }