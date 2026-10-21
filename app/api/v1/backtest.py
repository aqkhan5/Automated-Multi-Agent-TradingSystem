from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.services.backtest_service import run_ablation_backtest
from app.agents.tools.risk_engine import normalize_ticker

router = APIRouter(prefix="/backtest", tags=["Empirical Research & Ablation Backtest"])

class BacktestRequest(BaseModel):
    ticker: str = Field(default="BTC-USD", description="Asset symbol (Equities, Crypto, Commodities)")
    period: str = Field(default="180d", description="Historical period lookback (30d, 90d, 180d, 1y, 2y)")
    initial_capital: Optional[float] = Field(default=10000.0, description="Starting test capital")

@router.post("/run")
async def api_run_backtest(req: BacktestRequest):
    """
    Executes historical ablation backtesting over real market candle sequences.
    Simulates Benchmark, Single Agent, Linear MAS, and Adversarial MAS side-by-side,
    calculating Sharpe, Sortino, Drawdown, Calmar, and cumulative equity curves.
    """
    clean_ticker = normalize_ticker(req.ticker)
    capital = float(req.initial_capital) if req.initial_capital and req.initial_capital > 0 else 10000.0
    period = req.period.strip() or "180d"

    try:
        results = await run_ablation_backtest(
            ticker_input=clean_ticker,
            period=period,
            initial_capital=capital
        )
        return results
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest execution failed: {str(e)}")
