"""
Quantitative Risk Engine & Multi-Asset Normalization Module.
Calculates dynamic capital-at-risk, position sizing, and target bounds deterministically in Python
to eliminate LLM mathematical hallucination.
"""

from typing import Dict, Any, Tuple, Optional, List, Union
import math
import numpy as np

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
    "LINK": "LINK-USD",
    "DOT": "DOT-USD",
    "NEAR": "NEAR-USD",
    "MATIC": "POL-USD",
    "POL": "POL-USD",
    "SHIB": "SHIB-USD",
    "LTC": "LTC-USD"
}

# Common Company and Asset names mapped to official ticker symbols (TradingView-style)
COMPANY_ALIASES: Dict[str, str] = {
    "BITCOIN": "BTC-USD",
    "ETHEREUM": "ETH-USD",
    "SOLANA": "SOL-USD",
    "RIPPLE": "XRP-USD",
    "CARDANO": "ADA-USD",
    "DOGECOIN": "DOGE-USD",
    "BINANCE COIN": "BNB-USD",
    "AVALANCHE": "AVAX-USD",
    "CHAINLINK": "LINK-USD",
    "POLKADOT": "DOT-USD",
    "APPLE": "AAPL",
    "TESLA": "TSLA",
    "NVIDIA": "NVDA",
    "MICROSOFT": "MSFT",
    "GOOGLE": "GOOGL",
    "ALPHABET": "GOOGL",
    "AMAZON": "AMZN",
    "META": "META",
    "FACEBOOK": "META",
    "NETFLIX": "NFLX",
    "AMD": "AMD",
    "INTEL": "INTC",
    "SP500": "SPY",
    "S&P 500": "SPY",
    "S&P": "SPY",
    "NASDAQ": "QQQ",
    "CRUDE OIL": "CL=F",
    "NATURAL GAS": "NG=F"
}

def normalize_ticker(ticker: str) -> str:
    """
    Normalizes input ticker symbols or names across asset classes (TradingView-style):
    - Company names: Bitcoin -> BTC-USD, Apple -> AAPL, Gold -> GC=F
    - Crypto shorts: BTC -> BTC-USD, BTCUSDT -> BTC-USD
    - Commodities: Crude Oil -> CL=F, Gold -> GC=F
    - Equities: AAPL, TSLA, NVDA preserved
    """
    clean = ticker.strip().upper()
    if clean.endswith("/USDT") or clean.endswith("-USDT") or (clean.endswith("USDT") and len(clean) > 4):
        base = clean.replace("/USDT", "").replace("-USDT", "").replace("USDT", "")
        clean = f"{base}-USD"

    if clean in COMPANY_ALIASES:
        return COMPANY_ALIASES[clean]
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


def calculate_institutional_risk_metrics(
    returns: Optional[Union[List[float], np.ndarray]] = None,
    atr_pct: float = 0.02,
    reward_risk_ratio: float = 2.0,
    estimated_win_rate: float = 0.55,
    fraction_multiplier: float = 0.25
) -> Dict[str, float]:
    """
    Computes institutional quantitative risk metrics:
    1. Parametric & Historical Value at Risk (VaR 95% & 99%).
    2. Conditional Value at Risk (CVaR / Expected Shortfall 95% & 99%).
    3. Fractional Kelly Criterion (f*) for mathematical position sizing.
    4. Annualized Volatility.
    """
    if returns is None or len(returns) < 5:
        sigma = max(0.005, atr_pct)
        var_param_95 = round(1.64485 * sigma * 100, 2)
        var_param_99 = round(2.32635 * sigma * 100, 2)
        cvar_95 = round(1.95 * sigma * 100, 2)
        cvar_99 = round(2.65 * sigma * 100, 2)
        vol_ann = round(sigma * math.sqrt(252) * 100, 2)
    else:
        arr = np.array(returns, dtype=float)
        arr = arr[np.isfinite(arr)]
        if len(arr) < 5:
            sigma = max(0.005, atr_pct)
            var_param_95 = round(1.64485 * sigma * 100, 2)
            var_param_99 = round(2.32635 * sigma * 100, 2)
            cvar_95 = round(1.95 * sigma * 100, 2)
            cvar_99 = round(2.65 * sigma * 100, 2)
            vol_ann = round(sigma * math.sqrt(252) * 100, 2)
        else:
            mu = float(np.mean(arr))
            sigma = float(np.std(arr, ddof=1)) if len(arr) > 1 else 0.01
            var_param_95 = round(max(0.1, -(mu - 1.64485 * sigma) * 100), 2)
            var_param_99 = round(max(0.1, -(mu - 2.32635 * sigma) * 100), 2)
            
            q5 = float(np.percentile(arr, 5))
            tail = arr[arr <= q5]
            if len(tail) > 0:
                cvar_95 = round(max(var_param_95, -float(np.mean(tail)) * 100), 2)
            else:
                cvar_95 = round(var_param_95 * 1.25, 2)
            
            q1 = float(np.percentile(arr, 1))
            tail_1 = arr[arr <= q1]
            if len(tail_1) > 0:
                cvar_99 = round(max(var_param_99, -float(np.mean(tail_1)) * 100), 2)
            else:
                cvar_99 = round(var_param_99 * 1.25, 2)

            vol_ann = round(sigma * math.sqrt(252) * 100, 2)

    p = max(0.1, min(0.9, estimated_win_rate))
    b = max(0.5, reward_risk_ratio)
    kelly_full = (p * (b + 1) - 1) / b
    kelly_fraction = max(0.0, kelly_full * fraction_multiplier)
    kelly_pct = round(kelly_fraction * 100, 2)

    return {
        "var_95": var_param_95,
        "var_99": var_param_99,
        "cvar_95": cvar_95,
        "cvar_99": cvar_99,
        "kelly_recommended_pct": kelly_pct,
        "volatility_annualized": vol_ann
    }


def evaluate_dynamic_risk(
    account_balance: float,
    interval: str,
    signal_action: str,
    entry_price: float,
    take_profit: float,
    stop_loss: float,
    atr: float = 0.0,
    recent_returns: Optional[List[float]] = None
) -> Dict[str, Any]:
    """
    Computes exact risk-to-reward (R:R), dollar risk at risk, position quantity,
    clamped budget allocation, and institutional risk metrics (VaR 95%, CVaR 95%, Kelly).
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

    # ATR percentage of price for volatility modeling
    atr_pct = (atr / entry_price) if entry_price > 0 and atr > 0 else 0.02
    quant_metrics = calculate_institutional_risk_metrics(
        returns=recent_returns,
        atr_pct=atr_pct,
        reward_risk_ratio=2.0,
        estimated_win_rate=0.55
    )

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
            "justification": f"Trade set to HOLD: Zero capital allocated for {timeframe_key} timeframe.",
            **quant_metrics
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
            "justification": "Rejected: Stop loss is identical to entry price (Zero unit risk).",
            **quant_metrics
        }

    rr_ratio = round(unit_reward / unit_risk, 2)

    # Re-calculate quant metrics with exact calculated R:R
    quant_metrics = calculate_institutional_risk_metrics(
        returns=recent_returns,
        atr_pct=atr_pct,
        reward_risk_ratio=rr_ratio,
        estimated_win_rate=0.58 if "STRONG" in action else 0.52
    )

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
            "justification": f"Rejected: Asymmetric Risk-to-Reward ratio is {rr_ratio:.2f} (below required 1.50 threshold).",
            **quant_metrics
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
        f"on ${capital:,.2f} balance with R:R of {rr_ratio:.2f} (Take Profit: ${take_profit:.2f}, Stop Loss: ${stop_loss:.2f}) | "
        f"VaR(95%): {quant_metrics['var_95']}%, CVaR(95%): {quant_metrics['cvar_95']}%, Kelly: {quant_metrics['kelly_recommended_pct']}%."
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
        "justification": justification_str,
        **quant_metrics
    }
