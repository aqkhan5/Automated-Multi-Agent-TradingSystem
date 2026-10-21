from typing import Literal, Optional, Dict, Any
from pydantic import BaseModel, Field

class RiskEvaluation(BaseModel):
    stable_capital: str = Field(description="Current account stable capital (dynamic balance)")
    risk_tier: str = Field(description="Evaluated risk tier (Dynamic Sized Allocation | Zero Allocation)")
    verdict: Literal["APPROVED", "REJECTED"]
    action_command: str = Field(description="Final Action Command (STRONG BUY | BUY | HOLD | SELL | STRONG SELL)")
    budget_allocation: str = Field(description="Calculated trade budget allocation based on dynamic risk matrix")
    justification: str = Field(description="Single-sentence compliance justification explaining safety and risk math.")
    var_95: Optional[float] = Field(default=None, description="Parametric Value-at-Risk at 95% confidence")
    cvar_95: Optional[float] = Field(default=None, description="Conditional Value-at-Risk (Expected Shortfall) at 95%")
    kelly_recommended_pct: Optional[float] = Field(default=None, description="Fractional Kelly Criterion recommended allocation percentage")

class FinalTradingDecision(BaseModel):
    ticker: str
    action: Literal["STRONG BUY", "BUY", "HOLD", "SELL", "STRONG SELL"]
    risk_status: str
    stable_capital: str = Field(description="Available dynamic capital balance.")
    budget_allocation: str = Field(description="Exact capital allocation budget.")
    ENTRY_PRICE: float = Field(default=0.0, description="The absolute latest actual closing price of the asset used as the definitive entry level baseline for target math calculations")
    TAKE_PROFIT: float = Field(default=0.0, description="Calculated target Take Profit price as a float, or 0.0 if not applicable.")
    STOP_LOSS: float = Field(default=0.0, description="Calculated target Stop Loss price as a float, or 0.0 if not applicable.")
    justification: str = Field(description="Comprehensive final combined reasoning explanation.")
    var_95: Optional[float] = Field(default=None, description="Parametric Value-at-Risk at 95% confidence (%)")
    cvar_95: Optional[float] = Field(default=None, description="Conditional Value-at-Risk (Expected Shortfall) at 95% confidence (%)")
    kelly_recommended_pct: Optional[float] = Field(default=None, description="Fractional Kelly suggested portfolio allocation percentage (%)")
    volatility_annualized: Optional[float] = Field(default=None, description="Annualized volatility percentage (%)")
    debate_summary: Optional[Dict[str, Any]] = Field(default=None, description="Adversarial Bull vs Bear debate transcript & consensus metrics")

class TradeExecutionRequest(BaseModel):
    ticker: str
    interval: str
    period: str
    strategy: str
    user_name: str
    user_email: str
    user_phone: str
    account_balance: Optional[float] = Field(default=None, description="Optional dynamic account capital balance (USDT)")
