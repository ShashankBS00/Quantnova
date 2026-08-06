from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.market import router as market_router

app = FastAPI(
    title="QuantNova API",
    version="1.0.0",
    description="AI-Powered Algorithmic Trading Platform API",
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

@app.get("/")
def home():
    return {
        "message": "Welcome to QuantNova API 🚀",
        "status": "Running",
    }