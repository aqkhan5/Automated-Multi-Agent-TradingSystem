"""
Quantitative Risk Engine & Multi-Asset Normalization Module.
Calculates dynamic capital-at-risk, position sizing, and target bounds deterministically in Python
to eliminate LLM mathematical hallucination.
"""

from typing import Dict, Any, Tuple, Optional
import math

# Common Commodity and Energy ticker aliases mapped to official Yahoo Finance futures symbols
COMMODITY_ALIASES: Dict[str, str] = {
    "CRUDE": "CL=F",
    "CRUDEOIL": "CL=F",
    "CRUDE_OIL": "CL=F",
    "CRUDE-OIL": "CL=F",
    "OIL": "CL=F",
    "WTI": "CL=F",
    "BRENT": "BZ=F",
    "GOLD": "GC=F",
    "SILVER": "SI=F",
    "NATGAS": "NG=F",
    "NATURALGAS": "NG=F",
    "NATURAL_GAS": "NG=F",
    "COPPER": "HG=F",
    "PLATINUM": "PL=F",
    "CORN": "ZC=F",
    "WHEAT": "ZW=F",
    "SOYBEANS": "ZS=F"
}

# Common crypto short names mapped to -USD pair
CRYPTO_ALIASES: Dict[str, str] = {
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "SOL": "SOL-USD",
    "BNB": "BNB-USD",
    "XRP": "XRP-USD",
    "ADA": "ADA-USD",
    "DOGE": "DOGE-USD",
    "AVAX": "AVAX-USD",
    "LINK": "LINK-USD"
}

def normalize_ticker(ticker: str) -> str:
    """
    Normalizes input ticker symbols across asset classes:
    - Commodities & Energy: OIL -> CL=F, GOLD -> GC=F
    - Cryptocurrencies: BTC -> BTC-USD, ETH -> ETH-USD
    - Equities: AAPL, TSLA, NVDA preserved
    """
    clean = ticker.strip().upper()
    if clean in COMMODITY_ALIASES:
        return COMMODITY_ALIASES[clean]
    if clean in CRYPTO_ALIASES:
        return CRYPTO_ALIASES[clean]
    return clean

def detect_asset_class(ticker: str) -> str:
    """Classifies the asset class based on symbol syntax."""
    sym = ticker.upper()
    if sym.endswith("=F") or sym in COMMODITY_ALIASES.values():
        return "Commodity & Energy Futures"
    elif sym.endswith("-USD") or sym.endswith("USDT") or sym in CRYPTO_ALIASES.values():
        return "Cryptocurrency"
    else:
        return "Traditional Equity"

# User's Dynamic Risk Preferences Matrix:
# Maps (timeframe_interval, signal_intensity) -> risk_percentage
DYNAMIC_RISK_MATRIX: Dict[Tuple[str, str], float] = {
    # Intraday Scalp (15m)
    ("15m", "BUY"): 0.0075,         # 0.75%
    ("15m", "SELL"): 0.0075,        # 0.75%
    ("15m", "STRONG BUY"): 0.015,   # 1.50%
    ("15m", "STRONG SELL"): 0.015,  # 1.50%

    # Intraday Swing (1h)
    ("1h", "BUY"): 0.010,           # 1.00%
    ("1h", "SELL"): 0.010,          # 1.00%
    ("1h", "STRONG BUY"): 0.020,    # 2.00%
    ("1h", "STRONG SELL"): 0.020,   # 2.00%

    # Medium Swing (4h)
    ("4h", "BUY"): 0.020,           # 2.00%
    ("4h", "SELL"): 0.020,          # 2.00%
    ("4h", "STRONG BUY"): 0.030,    # 3.00%
    ("4h", "STRONG SELL"): 0.030,   # 3.00%

    # Macro Position (1d)
    ("1d", "BUY"): 0.025,           # 2.50%
    ("1d", "SELL"): 0.025,          # 2.50%
    ("1d", "STRONG BUY"): 0.040,    # 4.00%
    ("1d", "STRONG SELL"): 0.040,   # 4.00%
}

# Max position concentration ceilings per timeframe
CONCENTRATION_CAPS: Dict[str, float] = {
    "15m": 0.08,  # Max 8% portfolio cap for fast scalps
    "1h": 0.12,   # Max 12% portfolio cap for intraday swings
    "4h": 0.18,   # Max 18% portfolio cap for medium swings
    "1d": 0.25,   # Max 25% portfolio cap for macro positions
}

def calculate_deterministic_trade_bounds(
    current_price: float,
    signal_action: str,
    nearest_supply: Optional[float],
    nearest_demand: Optional[float],
    atr: float
) -> Tuple[float, float]:
    """
    Computes exact, volatility-adjusted Take-Profit and Stop-Loss boundaries
    while guaranteeing prevention of boundary inversion near highs/lows.
    """
    atr_val = atr if atr and atr > 0 else (current_price * 0.015)
    action = signal_action.upper().strip()

    if action in ("BUY", "STRONG BUY"):
        # Take Profit: Target nearest resistance minus buffer, or ATR projection
        if nearest_supply and nearest_supply > (current_price + 0.5 * atr_val):
            take_profit = nearest_supply - (0.2 * atr_val)
        else:
            take_profit = current_price + (2.5 * atr_val)

        # Stop Loss: Target nearest support minus buffer, or ATR projection
        if nearest_demand and nearest_demand < (current_price - 0.5 * atr_val):
            stop_loss = nearest_demand - (0.5 * atr_val)
        else:
            stop_loss = current_price - (1.5 * atr_val)

        # Safety clamps: Stop loss must be below entry; take profit must be above entry
        if stop_loss >= current_price:
            stop_loss = current_price - (1.5 * atr_val)
        if take_profit <= current_price:
            take_profit = current_price + (2.5 * atr_val)

    elif action in ("SELL", "STRONG SELL"):
        # Take Profit: Target nearest demand plus buffer, or ATR projection
        if nearest_demand and nearest_demand < (current_price - 0.5 * atr_val):
            take_profit = nearest_demand + (0.2 * atr_val)
        else:
            take_profit = current_price - (2.5 * atr_val)

        # Stop Loss: Target nearest supply plus buffer, or ATR projection
        if nearest_supply and nearest_supply > (current_price + 0.5 * atr_val):
            stop_loss = nearest_supply + (0.5 * atr_val)
        else:
            stop_loss = current_price + (1.5 * atr_val)

        # Safety clamps: Stop loss must be above entry; take profit must be below entry
        if stop_loss <= current_price:
            stop_loss = current_price + (1.5 * atr_val)
        if take_profit >= current_price:
            take_profit = current_price - (2.5 * atr_val)

    else:
        # HOLD: No directional order
        take_profit = 0.0
        stop_loss = 0.0

    return round(take_profit, 2), round(stop_loss, 2)


def evaluate_dynamic_risk(
    account_balance: float,
    interval: str,
    signal_action: str,
    entry_price: float,
    take_profit: float,
    stop_loss: float
) -> Dict[str, Any]:
    """
    Computes exact risk-to-reward (R:R), dollar risk at risk, position quantity,
    and clamped budget allocation based on the user's Dynamic Risk Matrix.
    """
    action = signal_action.upper().strip()
    clean_interval = interval.lower().strip()

    # Normalize interval key
    if "15m" in clean_interval:
        timeframe_key = "15m"
    elif "1h" in clean_interval:
        timeframe_key = "1h"
    elif "4h" in clean_interval:
        timeframe_key = "4h"
    elif "1d" in clean_interval or "day" in clean_interval:
        timeframe_key = "1d"
    else:
        timeframe_key = "1h"

    # Default to $10,000 if not provided or non-positive
    capital = account_balance if account_balance and account_balance > 0 else 10000.0

    # Handle HOLD or invalid action
    if action == "HOLD" or take_profit <= 0 or stop_loss <= 0 or entry_price <= 0:
        return {
            "verdict": "REJECTED",
            "action_command": "HOLD",
            "risk_status": "REJECTED",
            "risk_percentage": 0.0,
            "max_dollar_risk": 0.0,
            "risk_to_reward": 0.0,
            "position_quantity": 0.0,
            "budget_allocation": "Allocate 0% ($0.00 USDT)",
            "stable_capital": f"${capital:,.2f} USDT",
            "justification": f"Trade set to HOLD: Zero capital allocated for {timeframe_key} timeframe."
        }

    # Calculate exact Risk-to-Reward (R:R)
    unit_reward = abs(take_profit - entry_price)
    unit_risk = abs(entry_price - stop_loss)

    if unit_risk <= 0:
        return {
            "verdict": "REJECTED",
            "action_command": "HOLD",
            "risk_status": "REJECTED",
            "risk_percentage": 0.0,
            "max_dollar_risk": 0.0,
            "risk_to_reward": 0.0,
            "position_quantity": 0.0,
            "budget_allocation": "Allocate 0% ($0.00 USDT)",
            "stable_capital": f"${capital:,.2f} USDT",
            "justification": "Rejected: Stop loss is identical to entry price (Zero unit risk)."
        }

    rr_ratio = round(unit_reward / unit_risk, 2)

    # Compliance Gate: R:R must be >= 1.5
    if rr_ratio < 1.5:
        return {
            "verdict": "REJECTED",
            "action_command": "HOLD",
            "risk_status": "REJECTED",
            "risk_percentage": 0.0,
            "max_dollar_risk": 0.0,
            "risk_to_reward": rr_ratio,
            "position_quantity": 0.0,
            "budget_allocation": "Allocate 0% ($0.00 USDT)",
            "stable_capital": f"${capital:,.2f} USDT",
            "justification": f"Rejected: Asymmetric Risk-to-Reward ratio is {rr_ratio:.2f} (below required 1.50 threshold)."
        }

    # Fetch Risk Percentage from user's preference matrix
    risk_rate = DYNAMIC_RISK_MATRIX.get((timeframe_key, action), 0.01)
    max_dollar_risk = round(capital * risk_rate, 2)

    # Calculate position quantity and total capital budget
    position_quantity = round(max_dollar_risk / unit_risk, 4)
    raw_budget = round(position_quantity * entry_price, 2)

    # Clamping against timeframe concentration cap
    concentration_cap = CONCENTRATION_CAPS.get(timeframe_key, 0.15)
    max_permitted_budget = round(capital * concentration_cap, 2)
    final_budget = min(raw_budget, max_permitted_budget)

    budget_pct = round((final_budget / capital) * 100, 2)

    budget_allocation_str = (
        f"Allocate {budget_pct:.1f}% (${final_budget:,.2f} USDT) risking "
        f"{risk_rate * 100:.2f}% (${max_dollar_risk:,.2f} USDT)"
    )

    justification_str = (
        f"Approved: {timeframe_key.upper()} {action} risk sized at {risk_rate * 100:.2f}% (${max_dollar_risk:,.2f} USDT) "
        f"on ${capital:,.2f} balance with R:R of {rr_ratio:.2f} (Take Profit: ${take_profit:.2f}, Stop Loss: ${stop_loss:.2f})."
    )

    return {
        "verdict": "APPROVED",
        "action_command": action,
        "risk_status": "APPROVED",
        "risk_percentage": risk_rate * 100,
        "max_dollar_risk": max_dollar_risk,
        "risk_to_reward": rr_ratio,
        "position_quantity": position_quantity,
        "budget_allocation": budget_allocation_str,
        "stable_capital": f"${capital:,.2f} USDT",
        "justification": justification_str
    }
