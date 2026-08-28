from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
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

    # User → Strategies
    strategies = relationship(
        "Strategy",
        back_populates="user",
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

    name = Column(
        String(100),
        nullable=False,
    )

    symbol = Column(
        String(30),
        nullable=False,
        index=True,
    )

    asset_type = Column(
        String(30),
        nullable=False,
        default="STOCK",
    )

    timeframe = Column(
        String(20),
        nullable=False,
        default="1d",
    )

    strategy_type = Column(
        String(50),
        nullable=False,
    )

    fast_period = Column(
        Integer,
        nullable=False,
    )

    slow_period = Column(
        Integer,
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    # ======================================
    # User relationship
    # ======================================

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