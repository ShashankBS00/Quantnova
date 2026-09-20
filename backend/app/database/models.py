from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Numeric,
    JSON,
    CheckConstraint,
    UniqueConstraint,
    Boolean,
)

from sqlalchemy.orm import relationship

from app.database.database import Base


# ==========================================
# User
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    role = Column(
        String(20),
        nullable=False,
        default="USER",
    )

    # User → Strategies
    strategies = relationship(
        "Strategy",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    # User → Trading Account
    trading_account = relationship(
        "TradingAccount",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


# ==========================================
# Strategy
# ==========================================

class Strategy(Base):
    __tablename__ = "strategies"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------
    # Basic Information
    # --------------------------------------

    name = Column(
        String(100),
        nullable=False,
    )

    symbol = Column(
        String(30),
        nullable=False,
        index=True,
    )

    # STOCK / INDEX / ETF
    asset_type = Column(
        String(30),
        nullable=False,
        default="STOCK",
    )

    # INTRADAY / SWING / POSITION
    trading_style = Column(
        String(30),
        nullable=False,
        default="INTRADAY",
    )

    # 5m / 15m / 30m / 1h / 1d / 1wk etc.
    timeframe = Column(
        String(20),
        nullable=False,
        default="1d",
    )

    # --------------------------------------
    # Strategy Type
    # --------------------------------------

    # Example:
    # SMA_CROSSOVER
    # EMA_CROSSOVER
    # RSI
    # MACD
    # BOLLINGER_BANDS
    strategy_type = Column(
        String(50),
        nullable=False,
    )

    # --------------------------------------
    # Strategy-specific settings
    # --------------------------------------
    #
    # SMA:
    # {
    #     "fast_period": 20,
    #     "slow_period": 50
    # }
    #
    # RSI:
    # {
    #     "period": 14,
    #     "oversold": 30,
    #     "overbought": 70
    # }
    #
    # MACD:
    # {
    #     "fast_period": 12,
    #     "slow_period": 26,
    #     "signal_period": 9
    # }
    #
    # Bollinger:
    # {
    #     "period": 20,
    #     "std_deviation": 2
    # }

    parameters = Column(
        JSON,
        nullable=True,
    )

    # --------------------------------------
    # Risk Management
    # --------------------------------------

    # Example:
    # 2.00 = 2% stop loss
    stop_loss_percent = Column(
        Numeric(8, 2),
        nullable=True,
    )

    # Example:
    # 2.00 = Risk : Reward = 1 : 2
    risk_reward_ratio = Column(
        Numeric(8, 2),
        nullable=True,
    )

    # --------------------------------------
    # Created information
    # --------------------------------------

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------
    # User
    # --------------------------------------

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    user = relationship(
        "User",
        back_populates="strategies",
    )

    # --------------------------------------
    # Strategy → Paper Trades
    # --------------------------------------

    paper_trades = relationship(
        "PaperTrade",
        back_populates="strategy",
    )


# ==========================================
# Trading Account
# ==========================================

class TradingAccount(Base):
    __tablename__ = "trading_accounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    initial_cash = Column(
        Numeric(15, 2),
        nullable=False,
        default=100000.00,
    )

    cash = Column(
        Numeric(15, 2),
        nullable=False,
        default=100000.00,
    )

    realized_pnl = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.00,
    )

    winning_trades = Column(
        Integer,
        nullable=False,
        default=0,
    )

    losing_trades = Column(
        Integer,
        nullable=False,
        default=0,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="trading_account",
    )

    # Account → Holdings
    holdings = relationship(
        "Holding",
        back_populates="account",
        cascade="all, delete-orphan",
    )

    # Account → Orders
    orders = relationship(
        "Order",
        back_populates="account",
        cascade="all, delete-orphan",
    )

    # Account → Paper Trades
    paper_trades = relationship(
        "PaperTrade",
        back_populates="account",
        cascade="all, delete-orphan",
    )


# ==========================================
# Holding
# ==========================================

class Holding(Base):
    __tablename__ = "holdings"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    account_id = Column(
        Integer,
        ForeignKey("trading_accounts.id"),
        nullable=False,
        index=True,
    )

    symbol = Column(
        String(30),
        nullable=False,
    )

    quantity = Column(
        Integer,
        nullable=False,
        default=0,
    )

    average_price = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.00,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    account = relationship(
        "TradingAccount",
        back_populates="holdings",
    )

    __table_args__ = (
        UniqueConstraint(
            "account_id",
            "symbol",
            name="unique_account_symbol",
        ),
        CheckConstraint(
            "quantity >= 0",
            name="positive_holding_quantity",
        ),
        CheckConstraint(
            "average_price >= 0",
            name="positive_average_price",
        ),
    )


# ==========================================
# Order
# ==========================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    account_id = Column(
        Integer,
        ForeignKey("trading_accounts.id"),
        nullable=False,
        index=True,
    )

    symbol = Column(
        String(30),
        nullable=False,
    )

    side = Column(
        String(10),
        nullable=False,
    )

    quantity = Column(
        Integer,
        nullable=False,
    )

    price = Column(
        Numeric(15, 2),
        nullable=False,
    )

    total_amount = Column(
        Numeric(15, 2),
        nullable=False,
    )

    stop_loss = Column(
        Numeric(15, 2),
        nullable=True,
    )

    target = Column(
        Numeric(15, 2),
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        default="FILLED",
    )

    realized_pnl = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.00,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    account = relationship(
        "TradingAccount",
        back_populates="orders",
    )

    __table_args__ = (
        CheckConstraint(
            "side IN ('BUY', 'SELL')",
            name="valid_order_side",
        ),
        CheckConstraint(
            "quantity > 0",
            name="positive_order_quantity",
        ),
        CheckConstraint(
            "price > 0",
            name="positive_order_price",
        ),
        CheckConstraint(
            "total_amount > 0",
            name="positive_total_amount",
        ),
        CheckConstraint(
            "stop_loss IS NULL OR stop_loss > 0",
            name="valid_stop_loss",
        ),
        CheckConstraint(
            "target IS NULL OR target > 0",
            name="valid_target",
        ),
    )


# ==========================================
# Paper Trade
# ==========================================

class PaperTrade(Base):
    __tablename__ = "paper_trades"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    account_id = Column(
        Integer,
        ForeignKey("trading_accounts.id"),
        nullable=False,
        index=True,
    )

    strategy_id = Column(
        Integer,
        ForeignKey("strategies.id"),
        nullable=False,
        index=True,
    )

    symbol = Column(
        String(30),
        nullable=False,
    )

    side = Column(
        String(10),
        nullable=False,
    )

    quantity = Column(
        Integer,
        nullable=False,
    )

    entry_price = Column(
        Numeric(15, 2),
        nullable=False,
    )

    exit_price = Column(
        Numeric(15, 2),
        nullable=True,
    )

    stop_loss = Column(
        Numeric(15, 2),
        nullable=True,
    )

    target = Column(
        Numeric(15, 2),
        nullable=True,
    )

    status = Column(
        String(20),
        nullable=False,
        default="OPEN",
    )

    realized_pnl = Column(
        Numeric(15, 2),
        nullable=False,
        default=0.00,
    )

    opened_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    closed_at = Column(
        DateTime,
        nullable=True,
    )

    account = relationship(
        "TradingAccount",
        back_populates="paper_trades",
    )

    strategy = relationship(
        "Strategy",
        back_populates="paper_trades",
    )

    __table_args__ = (
        CheckConstraint(
            "side IN ('BUY', 'SELL')",
            name="valid_paper_trade_side",
        ),
        CheckConstraint(
            "quantity > 0",
            name="positive_paper_trade_quantity",
        ),
        CheckConstraint(
            "entry_price > 0",
            name="positive_entry_price",
        ),
        CheckConstraint(
            "exit_price IS NULL OR exit_price > 0",
            name="valid_exit_price",
        ),
        CheckConstraint(
            "stop_loss IS NULL OR stop_loss > 0",
            name="valid_paper_stop_loss",
        ),
        CheckConstraint(
            "target IS NULL OR target > 0",
            name="valid_paper_target",
        ),
    )
# ==========================================
# AI Prediction History
# ==========================================

class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------
    # Market Information
    # --------------------------------------

    symbol = Column(
        String(30),
        nullable=False,
        index=True,
    )

    timeframe = Column(
        String(20),
        nullable=False,
        index=True,
    )

    # --------------------------------------
    # Prediction Information
    # --------------------------------------

    prediction = Column(
        String(10),
        nullable=False,
    )

    class_id = Column(
        Integer,
        nullable=False,
    )

    probability = Column(
        Numeric(8, 6),
        nullable=False,
    )

    down_probability = Column(
        Numeric(8, 6),
        nullable=False,
    )

    hold_probability = Column(
        Numeric(8, 6),
        nullable=False,
    )

    up_probability = Column(
        Numeric(8, 6),
        nullable=False,
    )

    # --------------------------------------
    # Market Price At Prediction
    # --------------------------------------

    prediction_price = Column(
        Numeric(15, 2),
        nullable=False,
    )

    prediction_time = Column(
        DateTime,
        nullable=False,
        index=True,
    )

    # --------------------------------------
    # Actual Future Result
    # --------------------------------------

    actual_price = Column(
        Numeric(15, 2),
        nullable=True,
    )

    actual_return_percent = Column(
        Numeric(10, 4),
        nullable=True,
    )

    actual_direction = Column(
        String(10),
        nullable=True,
    )

    # --------------------------------------
    # Evaluation
    # --------------------------------------

    is_correct = Column(
        Boolean,
        nullable=True,
    )

    verified_at = Column(
        DateTime,
        nullable=True,
    )

    # --------------------------------------
    # Model Information
    # --------------------------------------

    model_type = Column(
        String(50),
        nullable=False,
        default="XGBoost",
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # --------------------------------------
    # Constraints
    # --------------------------------------

    __table_args__ = (
        UniqueConstraint(
            "symbol",
            "timeframe",
            "prediction_time",
            name="unique_prediction_bar",
        ),

        CheckConstraint(
            "class_id >= 0 AND class_id <= 2",
            name="valid_prediction_class",
        ),

        CheckConstraint(
            "probability >= 0 AND probability <= 1",
            name="valid_prediction_probability",
        ),

        CheckConstraint(
            "down_probability >= 0 AND down_probability <= 1",
            name="valid_down_probability",
        ),

        CheckConstraint(
            "hold_probability >= 0 AND hold_probability <= 1",
            name="valid_hold_probability",
        ),

        CheckConstraint(
            "up_probability >= 0 AND up_probability <= 1",
            name="valid_up_probability",
        ),

        CheckConstraint(
            "prediction_price > 0",
            name="positive_prediction_price",
        ),
    )