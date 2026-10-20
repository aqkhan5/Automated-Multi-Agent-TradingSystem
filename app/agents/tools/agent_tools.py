from agents import Agent

def get_analyst_tool(analyst_agent: Agent):
    """Wraps the Market Data Analyst agent into a callable tool for orchestrators."""
    return analyst_agent.as_tool(
        tool_name="analyze_market_data",
        tool_description=(
            "Retrieves quantitative technical market data (EMA, SMA, RSI, MACD, ATR, supply/demand zones) "
            "for equities, cryptocurrencies, and commodities (Crude Oil, Gold). "
            "Expects parameters: ticker (str), period (str), and interval (str)."
        )
    )

def get_risk_tool(risk_agent: Agent):
    """Wraps the Risk Manager agent into a callable tool for orchestrators."""
    return risk_agent.as_tool(
        tool_name="evaluate_trading_risk",
        tool_description=(
            "Audits a proposed trading action and exit bounds against the Dynamic Risk Preferences Matrix "
            "(0.75%-1.5% for 15m scalp, 1%-2% for 1h swing, 2%-3% for 4h swing, 2.5%-4% for 1d macro) "
            "and R:R >= 1.50 constraints on dynamic account balances. "
            "Expects parameters: action_command (str), interval (str), entry_price (float), "
            "take_profit (float), stop_loss (float), account_balance (float, optional)."
        )
    )
