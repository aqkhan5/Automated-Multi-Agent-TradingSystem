import json
import re
from typing import Optional, Dict, Any
from agents import Runner

from app.core.config import settings
from app.db.session import get_db_engine, get_async_session_factory
from app.models.base import Base
from app.models.trading import TradingHistory
from app.schemas.trading import FinalTradingDecision
from app.agents.nodes.manager import create_manager_agent
from app.agents.nodes.debate import orchestrate_adversarial_debate
from app.agents.tools.risk_engine import (
    normalize_ticker,
    evaluate_dynamic_risk,
    calculate_deterministic_trade_bounds
)

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
    2. Ingests dynamic account capital (ready for live exchange / broker API integration).
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

        # -------------------------------------------------------------
        # 1. EXTRACT DECISION PAYLOAD FROM RESULT OR TURNS
        # -------------------------------------------------------------
        text = (result.final_output or "").strip()
        analyst_cache: Dict[str, Any] = {}

        # Search turns in reverse if final_output is empty or incomplete
        if hasattr(result, "_model_input_items"):
            for item in reversed(result._model_input_items):
                item_text = getattr(item, "text", "") or getattr(item, "output", "") or ""
                # Check if this item is a FinalTradingDecision block
                if not text and '"action"' in item_text and '"risk_status"' in item_text:
                    text = item_text.strip()
                # Cache Analyst data if available as fallback
                if not analyst_cache and '"current_price"' in item_text and ('"momentum"' in item_text or '"summary"' in item_text):
                    try:
                        clean_item_text = item_text
                        if "```" in clean_item_text:
                            m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean_item_text)
                            clean_item_text = m.group(1).strip() if m else clean_item_text
                        analyst_cache = json.loads(clean_item_text)
                    except Exception:
                        pass

        # Strip markdown fences from decision text
        if "```" in text:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()
            else:
                lines = [l for l in text.splitlines() if not l.strip().startswith("```")]
                text = "\n".join(lines).strip()

        data = None
        if text and '"action"' in text:
            try:
                data = json.loads(text)
            except Exception:
                start_idx = text.find("{")
                end_idx = text.rfind("}")
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    try:
                        data = json.loads(text[start_idx:end_idx + 1])
                    except Exception:
                        data = None

        # -------------------------------------------------------------
        # 2. RUN ADVERSARIAL MULTI-AGENT DEBATE & SYNTHESIZE OUTCOME
        # -------------------------------------------------------------
        debate_result = await orchestrate_adversarial_debate(analyst_cache)

        if not data or "action" not in data or "risk_status" not in data:
            current_price = float(analyst_cache.get("current_price", 0.0))
            atr = float(analyst_cache.get("atr_14", 0.0))
            supply = float(analyst_cache["nearest_supply"]) if analyst_cache.get("nearest_supply") else None
            demand = float(analyst_cache["nearest_demand"]) if analyst_cache.get("nearest_demand") else None

            # Calibrate signal action from Arbiter consensus or fallback momentum
            sig_action = debate_result.get("recommended_action")
            if not sig_action or sig_action not in ("STRONG BUY", "BUY", "HOLD", "SELL", "STRONG SELL"):
                momentum = str(analyst_cache.get("momentum", "neutral")).lower()
                if momentum == "bullish":
                    sig_action = "BUY"
                elif momentum == "bearish":
                    sig_action = "SELL"
                else:
                    sig_action = "HOLD"

            tp, sl = calculate_deterministic_trade_bounds(
                current_price=current_price,
                signal_action=sig_action,
                nearest_supply=supply,
                nearest_demand=demand,
                atr=atr
            )

            risk_eval = evaluate_dynamic_risk(
                account_balance=balance,
                interval=interval,
                signal_action=sig_action,
                entry_price=current_price,
                take_profit=tp,
                stop_loss=sl,
                atr=atr
            )

            data = {
                "ticker": clean_ticker,
                "action": risk_eval["action_command"],
                "risk_status": risk_eval["risk_status"],
                "stable_capital": risk_eval["stable_capital"],
                "budget_allocation": risk_eval["budget_allocation"],
                "ENTRY_PRICE": current_price,
                "TAKE_PROFIT": tp,
                "STOP_LOSS": sl,
                "var_95": risk_eval.get("var_95"),
                "cvar_95": risk_eval.get("cvar_95"),
                "kelly_recommended_pct": risk_eval.get("kelly_recommended_pct"),
                "volatility_annualized": risk_eval.get("volatility_annualized"),
                "debate_summary": debate_result,
                "justification": (
                    f"Decision synthesized via adversarial multi-agent debate (Consensus: {debate_result.get('consensus_score', 0.5):.2f}) "
                    f"and quantitative risk engine for {clean_ticker} on {interval} ({strategy}). {risk_eval['justification']}"
                )
            }
        else:
            if "debate_summary" not in data or not data["debate_summary"]:
                data["debate_summary"] = debate_result
            if "var_95" not in data or data.get("var_95") is None:
                current_price = float(data.get("ENTRY_PRICE", 0.0))
                atr = float(analyst_cache.get("atr_14", 0.0))
                q_eval = evaluate_dynamic_risk(
                    account_balance=balance,
                    interval=interval,
                    signal_action=data.get("action", "HOLD"),
                    entry_price=current_price,
                    take_profit=float(data.get("TAKE_PROFIT", 0.0)),
                    stop_loss=float(data.get("STOP_LOSS", 0.0)),
                    atr=atr
                )
                data["var_95"] = q_eval.get("var_95")
                data["cvar_95"] = q_eval.get("cvar_95")
                data["kelly_recommended_pct"] = q_eval.get("kelly_recommended_pct")
                data["volatility_annualized"] = q_eval.get("volatility_annualized")

        decision = FinalTradingDecision(**data)

        # -------------------------------------------------------------
        # 3. CODE-ENFORCED STATE OVERRIDES & BOUNDARY CLAMPS
        # -------------------------------------------------------------
        if decision.risk_status == "REJECTED" or decision.action == "HOLD":
            decision.action = "HOLD"
            decision.risk_status = "REJECTED"
            if "0%" not in decision.budget_allocation:
                decision.budget_allocation = "Allocate 0% ($0.00 USDT)"

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
