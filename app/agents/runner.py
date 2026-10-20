import json
import re
from typing import Optional
from agents import Runner
from agents.extensions.memory.sqlalchemy_session import SQLAlchemySession

from app.core.config import settings
from app.db.session import get_db_engine, get_async_session_factory
from app.models.base import Base
from app.models.trading import TradingHistory
from app.schemas.trading import FinalTradingDecision
from app.agents.nodes.manager import create_manager_agent
from app.agents.tools.risk_engine import normalize_ticker, evaluate_dynamic_risk

async def run_trading_desk(
    ticker_input: str,
    interval: str,
    period: str,
    strategy: str,
    user_name: str,
    user_email: str,
    user_phone: str,
    account_balance: Optional[float] = None
) -> FinalTradingDecision:
    """
    Executes the multi-agent cognitive trading loop across Equities, Crypto, and Commodities:
    1. Normalizes ticker (e.g. OIL -> CL=F, GOLD -> GC=F, BTC -> BTC-USD).
    2. Ingests dynamic account capital (ready for live Binance API integration).
    3. Executes multi-agent orchestration with deterministic temperature=0.0.
    4. Enforces strict schema decoding and Python-level anti-hallucination guardrails.
    5. Persists the verified outcome to Neon PostgreSQL.
    """
    clean_ticker = normalize_ticker(ticker_input)
    balance = float(account_balance) if account_balance and account_balance > 0 else settings.DEFAULT_ACCOUNT_CAPITAL

    engine = None
    try:
        engine = get_db_engine()

        # Ensure base metadata exists
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        manager = create_manager_agent()

        prompt_input = (
            f"Process trade opportunity for asset: '{clean_ticker}' using strategy '{strategy}'. "
            f"Fetch market data using interval='{interval}' and lookback period='{period}'. "
            f"Active account capital balance is ${balance:,.2f} USDT. "
            f"Apply the Dynamic Risk Preferences Matrix based on timeframe '{interval}' and signal intensity."
        )

        result = await Runner.run(
            manager,
            input=prompt_input
        )

        # Extract text from final_output or search recent items if empty
        text = (result.final_output or "").strip()
        if not text and hasattr(result, "_model_input_items"):
            for item in reversed(result._model_input_items):
                item_text = getattr(item, "text", "") or getattr(item, "output", "") or ""
                if "{" in item_text and "}" in item_text:
                    text = item_text.strip()
                    break

        # Strip markdown fences
        if "```" in text:
            # Extract content between ```json ... ``` or ``` ... ```
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()
            else:
                lines = text.splitlines()
                lines = [l for l in lines if not l.strip().startswith("```")]
                text = "\n".join(lines).strip()

        # If still empty or not valid JSON, fallback to direct deterministic computation
        data = None
        try:
            data = json.loads(text)
        except Exception:
            # Locate first { and last } in string
            start_idx = text.find("{")
            end_idx = text.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                data = json.loads(text[start_idx:end_idx + 1])
            else:
                # Deterministic fallback to prevent pipeline crashes
                data = {
                    "ticker": clean_ticker,
                    "action": "HOLD",
                    "risk_status": "REJECTED",
                    "stable_capital": f"${balance:,.2f} USDT",
                    "budget_allocation": "Allocate 0% ($0.00 USDT)",
                    "ENTRY_PRICE": 0.0,
                    "TAKE_PROFIT": 0.0,
                    "STOP_LOSS": 0.0,
                    "justification": f"System defaulted to HOLD for {clean_ticker} on {interval} timeframe due to ambiguous agent output."
                }

        decision = FinalTradingDecision(**data)

        # -------------------------------------------------------------
        # DETERMINISTIC PYTHON GUARDRAILS (Anti-Hallucination Layer)
        # -------------------------------------------------------------
        # 1. State Override: If Risk is REJECTED, action MUST be HOLD
        if decision.risk_status == "REJECTED" or decision.action == "HOLD":
            decision.action = "HOLD"
            decision.risk_status = "REJECTED"
            if "0%" not in decision.budget_allocation:
                decision.budget_allocation = "Allocate 0% ($0.00 USDT)"

        # 2. Boundary Integrity Clamps: Ensure no inverted Take-Profit / Stop-Loss
        if decision.action in ("BUY", "STRONG BUY") and decision.ENTRY_PRICE > 0:
            if decision.TAKE_PROFIT <= decision.ENTRY_PRICE:
                decision.TAKE_PROFIT = round(decision.ENTRY_PRICE * 1.04, 2)
            if decision.STOP_LOSS >= decision.ENTRY_PRICE:
                decision.STOP_LOSS = round(decision.ENTRY_PRICE * 0.96, 2)
        elif decision.action in ("SELL", "STRONG SELL") and decision.ENTRY_PRICE > 0:
            if decision.TAKE_PROFIT >= decision.ENTRY_PRICE:
                decision.TAKE_PROFIT = round(decision.ENTRY_PRICE * 0.96, 2)
            if decision.STOP_LOSS <= decision.ENTRY_PRICE:
                decision.STOP_LOSS = round(decision.ENTRY_PRICE * 1.04, 2)

        print("\n" + "=" * 70)
        print("          VERIFIED FINAL QUANTITATIVE SYSTEM DECISION")
        print("=" * 70)
        print(f"  * ASSET TICKER     : {decision.ticker}")
        print(f"  * SYSTEM ACTION    : {decision.action}")
        print(f"  * RISK COMPLIANCE  : {decision.risk_status}")
        print(f"  * STABLE CAPITAL   : {decision.stable_capital}")
        print(f"  * BUDGET ALLOCATION: {decision.budget_allocation}")
        print(f"  * POSITION ENTRY   : ${decision.ENTRY_PRICE:.2f}" if decision.ENTRY_PRICE > 0 else "  * POSITION ENTRY   : N/A")
        print(f"  * TAKE PROFIT TRGT : ${decision.TAKE_PROFIT:.2f}" if decision.TAKE_PROFIT > 0 else "  * TAKE PROFIT TRGT : N/A")
        print(f"  * STOP LOSS TARGET : ${decision.STOP_LOSS:.2f}" if decision.STOP_LOSS > 0 else "  * STOP LOSS TARGET : N/A")
        print(f"  * JUSTIFICATION    : {decision.justification}")
        print("=" * 70 + "\n")

        # Persist decision outcome to database
        try:
            session_factory = get_async_session_factory(engine)
            async with session_factory() as db_session:
                status_init = "INACTIVE"
                if decision.risk_status == "APPROVED" and decision.action in ("BUY", "STRONG BUY", "SELL", "STRONG SELL"):
                    status_init = "RUNNING"

                new_record = TradingHistory(
                    user_name=user_name,
                    user_email=user_email,
                    user_phone=user_phone,
                    ticker=decision.ticker,
                    action=decision.action,
                    risk_status=decision.risk_status,
                    stable_capital=decision.stable_capital,
                    budget_allocation=decision.budget_allocation,
                    entry_price=str(decision.ENTRY_PRICE),
                    take_profit=str(decision.TAKE_PROFIT),
                    stop_loss=str(decision.STOP_LOSS),
                    justification=decision.justification,
                    status=status_init
                )
                db_session.add(new_record)
                await db_session.commit()
                print("✅ [Database] Trading history record successfully persisted to Neon PostgreSQL.")
        except Exception as db_err:
            print(f"❌ [Database Error] Failed to persist trading record: {db_err}")

        return decision

    except Exception as e:
        print(f"\n[Error] Multi-agent execution error: {e}")
        raise
    finally:
        if engine:
            try:
                await engine.dispose()
                print("🔌 [Database] Asynchronous database connection engine disposed cleanly.")
            except Exception as dispose_err:
                print(f"🔌 [Database Warning] Engine dispose warning: {dispose_err}")
