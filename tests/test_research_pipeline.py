import unittest
import numpy as np

from app.agents.tools.risk_engine import (
    calculate_institutional_risk_metrics,
    evaluate_dynamic_risk,
    normalize_ticker
)
from app.agents.nodes.debate import synthesize_deterministic_debate
from app.services.backtest_service import compute_financial_metrics

class TestResearchPipeline(unittest.TestCase):

    def test_ticker_normalization(self):
        self.assertEqual(normalize_ticker("OIL"), "CL=F")
        self.assertEqual(normalize_ticker("GOLD"), "GC=F")
        self.assertEqual(normalize_ticker("BTC"), "BTC-USD")
        self.assertEqual(normalize_ticker("AAPL"), "AAPL")

    def test_institutional_risk_metrics(self):
        returns = [-0.02, 0.015, -0.01, 0.025, -0.03, 0.018, -0.005, 0.012, -0.022, 0.031]
        metrics = calculate_institutional_risk_metrics(
            returns=returns,
            atr_pct=0.02,
            reward_risk_ratio=2.0,
            estimated_win_rate=0.55
        )
        self.assertIn("var_95", metrics)
        self.assertIn("cvar_95", metrics)
        self.assertIn("kelly_recommended_pct", metrics)
        self.assertIn("volatility_annualized", metrics)
        self.assertGreater(metrics["var_95"], 0)
        self.assertGreaterEqual(metrics["cvar_95"], metrics["var_95"])
        self.assertGreaterEqual(metrics["kelly_recommended_pct"], 0)

    def test_dynamic_risk_with_institutional_layer(self):
        res = evaluate_dynamic_risk(
            account_balance=10000.0,
            interval="1h",
            signal_action="BUY",
            entry_price=100.0,
            take_profit=106.0,
            stop_loss=97.0,
            atr=1.5
        )
        self.assertEqual(res["risk_status"], "APPROVED")
        self.assertIn("var_95", res)
        self.assertIn("cvar_95", res)
        self.assertIn("kelly_recommended_pct", res)
        self.assertIn("1.00%", res["budget_allocation"])

    def test_adversarial_deterministic_debate(self):
        tech_data = {
            "current_price": 65000.0,
            "momentum": "bullish",
            "nearest_supply": 68000.0,
            "nearest_demand": 63000.0,
            "atr_14": 1200.0
        }
        debate = synthesize_deterministic_debate(tech_data)
        self.assertGreater(debate["consensus_score"], 0.50)
        self.assertEqual(debate["recommended_action"], "BUY")
        self.assertIn("bull_perspective", debate)
        self.assertIn("bear_perspective", debate)
        self.assertGreater(debate["bull_perspective"]["confidence"], debate["bear_perspective"]["confidence"])

    def test_financial_metrics_computation(self):
        equity_curve = [10000.0, 10200.0, 10100.0, 10400.0, 10600.0, 10500.0, 10800.0]
        returns = [0.0, 0.02, -0.0098, 0.0297, 0.0192, -0.0094, 0.0286]
        trades = [
            {"profit_pct": 2.0},
            {"profit_pct": -1.0},
            {"profit_pct": 3.0},
            {"profit_pct": 2.5}
        ]
        metrics = compute_financial_metrics(equity_curve, returns, returns, trades)
        self.assertEqual(metrics["total_return_pct"], 8.0)
        self.assertGreater(metrics["sharpe_ratio"], 0)
        self.assertGreater(metrics["sortino_ratio"], 0)
        self.assertGreater(metrics["max_drawdown_pct"], 0)
        self.assertEqual(metrics["win_rate_pct"], 75.0)

if __name__ == "__main__":
    unittest.main()
