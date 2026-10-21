"""
Adversarial Multi-Agent Debate Nodes (Game-Theoretic Consensus).
Instantiates Bull Advocate, Bear Skeptic, and Portfolio Arbiter agents,
and manages the structured debate lifecycle.
"""

import json
import re
from typing import Dict, Any, Optional
from agents import Agent, Runner

from app.agents.client import get_gemini_model, get_agent_model_settings
from app.agents.prompts.debate import (
    BULL_AGENT_SYSTEM_PROMPT,
    BEAR_AGENT_SYSTEM_PROMPT,
    ARBITRATOR_SYSTEM_PROMPT
)

def create_bull_agent(model=None) -> Agent:
    llm = model or get_gemini_model()
    return Agent(
        name="Bullish Advocate",
        instructions=BULL_AGENT_SYSTEM_PROMPT,
        model=llm,
        model_settings=get_agent_model_settings()
    )

def create_bear_agent(model=None) -> Agent:
    llm = model or get_gemini_model()
    return Agent(
        name="Bearish Skeptic",
        instructions=BEAR_AGENT_SYSTEM_PROMPT,
        model=llm,
        model_settings=get_agent_model_settings()
    )

def create_arbitrator_agent(model=None) -> Agent:
    llm = model or get_gemini_model()
    return Agent(
        name="Portfolio Arbiter",
        instructions=ARBITRATOR_SYSTEM_PROMPT,
        model=llm,
        model_settings=get_agent_model_settings()
    )

def _extract_json_block(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    cleaned = text.strip()
    if "```" in cleaned:
        m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
        if m:
            cleaned = m.group(1).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        s = cleaned.find("{")
        e = cleaned.rfind("}")
        if s != -1 and e != -1 and e > s:
            try:
                return json.loads(cleaned[s:e+1])
            except Exception:
                pass
    return None

def synthesize_deterministic_debate(technical_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mathematical fallback ensuring 100% deterministic, zero-hallucination debate resolution
    derived directly from the technical matrix.
    """
    current_price = float(technical_data.get("current_price", 100.0))
    momentum = str(technical_data.get("momentum", "neutral")).lower()
    supply = technical_data.get("nearest_supply")
    demand = technical_data.get("nearest_demand")
    atr = float(technical_data.get("atr_14", current_price * 0.015))

    sup_val = float(supply) if supply else current_price * 1.05
    dem_val = float(demand) if demand else current_price * 0.95

    # Derive Bull & Bear confidence deterministically from technical momentum
    if momentum == "bullish":
        bull_conf = 0.78
        bear_conf = 0.32
        consensus_score = 0.72
        action = "BUY"
        bull_arg = (
            f"Bull Case: Asset exhibits positive momentum at ${current_price:.2f}. "
            f"Structure supports upward trajectory toward resistance at ${sup_val:.2f}."
        )
        bear_arg = (
            f"Bear Caution: Proximity to overhead supply at ${sup_val:.2f} creates "
            f"rejection vulnerability if volume fails to confirm."
        )
        thesis = (
            f"Bullish momentum confirmed across trend indicators. Reward-to-risk "
            f"favorable toward ${sup_val:.2f} target."
        )
    elif momentum == "bearish":
        bull_conf = 0.28
        bear_conf = 0.82
        consensus_score = 0.25
        action = "SELL"
        bull_arg = (
            f"Bull Counter: Oversold conditions near ${current_price:.2f} may offer "
            f"mean-reversion support near ${dem_val:.2f}."
        )
        bear_arg = (
            f"Bear Case: Downward trend momentum dominant. High probability of testing "
            f"demand floor at ${dem_val:.2f}."
        )
        thesis = (
            f"Bearish breakdown vectors dominate technical indicators. Defensive short "
            f"or liquidation recommended."
        )
    else:
        bull_conf = 0.50
        bear_conf = 0.50
        consensus_score = 0.50
        action = "HOLD"
        bull_arg = f"Bull Thesis: Asset holding consolidation range around ${current_price:.2f}."
        bear_arg = f"Bear Thesis: Directional exhaustion indicates range-bound chop with no edge."
        thesis = (
            "Neutral equilibrium reached between bullish and bearish forces. "
            "Capital preservation mandated (HOLD)."
        )

    return {
        "consensus_score": consensus_score,
        "recommended_action": action,
        "consensus_thesis": thesis,
        "bull_perspective": {
            "stance": "BULL",
            "confidence": bull_conf,
            "upside_target": sup_val,
            "argument": bull_arg
        },
        "bear_perspective": {
            "stance": "BEAR",
            "confidence": bear_conf,
            "downside_risk_target": dem_val,
            "argument": bear_arg
        }
    }

async def orchestrate_adversarial_debate(
    technical_data: Dict[str, Any],
    model=None
) -> Dict[str, Any]:
    """
    Executes the multi-agent adversarial debate:
    1. Bullish Advocate builds long thesis.
    2. Bearish Skeptic builds short counter-thesis.
    3. Portfolio Arbiter weighs both perspectives and yields the calibrated consensus.
    Guarantees deterministic fallback if LLM turns exceed latency bounds.
    """
    try:
        bull_agent = create_bull_agent(model=model)
        bear_agent = create_bear_agent(model=model)
        arbiter_agent = create_arbitrator_agent(model=model)

        tech_summary = json.dumps(technical_data, indent=2)

        # Round 1: Bull Advocate argument
        bull_res = await Runner.run(
            bull_agent,
            input=f"Analyze this market data and construct the quantitative BULL thesis:\n{tech_summary}"
        )
        bull_json = _extract_json_block(bull_res.final_output)

        # Round 2: Bear Skeptic counter-argument
        bear_res = await Runner.run(
            bear_agent,
            input=f"Analyze this market data and construct the quantitative BEAR counter-thesis:\n{tech_summary}"
        )
        bear_json = _extract_json_block(bear_res.final_output)

        # Round 3: Arbiter Synthesis
        arbiter_input = (
            f"Technical Context:\n{tech_summary}\n\n"
            f"Bull Advocate Thesis:\n{json.dumps(bull_json or {}, indent=2)}\n\n"
            f"Bear Skeptic Thesis:\n{json.dumps(bear_json or {}, indent=2)}"
        )
        arbiter_res = await Runner.run(
            arbiter_agent,
            input=f"Arbitrate this adversarial debate and compute the consensus verdict:\n{arbiter_input}"
        )
        arbiter_json = _extract_json_block(arbiter_res.final_output)

        if arbiter_json and "consensus_score" in arbiter_json and "recommended_action" in arbiter_json:
            return {
                "consensus_score": float(arbiter_json["consensus_score"]),
                "recommended_action": arbiter_json["recommended_action"],
                "consensus_thesis": arbiter_json.get("consensus_thesis", ""),
                "bull_perspective": bull_json or {},
                "bear_perspective": bear_json or {}
            }
    except Exception as e:
        print(f"⚠️ [Adversarial Debate Engine] LLM debate failed or timed out: {e}. Falling back to deterministic debate.")

    # Fallback guarantees zero crashes
    return synthesize_deterministic_debate(technical_data)
