from agents import Agent
from app.agents.client import get_gemini_model, get_agent_model_settings
from app.agents.prompts.risk import RISK_SYSTEM_PROMPT
from app.agents.tools.market_data import compute_trade_risk_and_bounds

def create_risk_agent(model=None) -> Agent:
    """
    Instantiates the Risk Manager Guardrail agent.
    Role: Capital Preservation & Dynamic Risk Audit Guardrail.
    Boundaries: Enforces the Dynamic Risk Preferences Matrix and R:R >= 1.50 rules on dynamic account balances.
    """
    llm = model or get_gemini_model()
    return Agent(
        name="Risk Manager Agent",
        instructions=RISK_SYSTEM_PROMPT,
        tools=[compute_trade_risk_and_bounds],
        model=llm,
        model_settings=get_agent_model_settings()
    )
