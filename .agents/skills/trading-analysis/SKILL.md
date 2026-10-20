---
name: trading-analysis
description: Executes multi-agent quantitative and qualitative trading analysis on equities and cryptocurrencies. Runs parallel technical, news, fundamentals, and macro analysts, orchestrates an adversarial bull/bear debate, and synthesizes a final portfolio decision with entry, stop-loss, and capital allocation sizing. This skill should be used when evaluating trading opportunities, conducting deep equity research, or generating algorithmic trade signals.
---

# Multi-Agent Trading Analysis Skill

Conduct end-to-end multi-agent trading research combining quantitative metrics, company fundamentals, macro trends, and an adversarial bull/bear debate to produce executable portfolio decisions.

## What This Skill Does

- Dispatches parallel analyst nodes (Technical, Sentiment, Fundamentals, Macro) using real-time market data extraction.
- Simulates an adversarial debate between a dedicated Bull advocate, a Bear challenger, and a conservative Risk auditor.
- Directs a Research Manager to evaluate debate evidence and assign an investment thesis rating.
- Directs a Trader and Portfolio Manager to calculate volatility-adjusted price bounds, stop-losses, and position sizing.

## What This Skill Does NOT Do

- Rely on unverified subjective sentiment without underlying market data.
- Guarantee investment profits or act as an accredited financial advisor.
- Execute live market orders directly without user confirmation.

---

## Before Implementation

Gather context to anchor the analysis:

| Source | Gather |
|---|---|
| **Market Data** | Extract live metrics using `python scripts/fetch_market_data.py --ticker $TICKER --type [technical|news|fundamentals|macro]` |
| **Skill References** | Indicators in `references/technical_indicators.md`, risk models in `references/quantitative_risk_models.md`, and debate rubric in `references/adversarial_debate_framework.md` |
| **User Parameters** | Target asset ticker, investment horizon (intraday scalp vs macro position), and portfolio capital base |

---

## Required Clarifications

### Required
1. **Asset Ticker**: Ticker symbol (e.g. `AAPL`, `NVDA`, `TSLA`, `BTC-USD`).
2. **Analysis Horizon**: Swing trade, intraday momentum, or macro position.

### Optional
3. **Capital Baseline**: Total portfolio capital (defaults to $10,000.00).
4. **Risk Profile**: Standard 1% capital-at-risk vs conservative 0.5%.

---

## Execution Workflow

```
[ Parallel Data Ingestion ] ──► [ Adversarial Debate ] ──► [ Research Manager ] ──► [ PM Decision ]
 (Tech, News, Fund, Macro)       (Bull vs Bear vs Risk)        (Rating & Thesis)       (Entry, Stop, Sizing)
```

### Phase 1 — Parallel Data Analysis

Execute data extraction commands and analyze the four market vectors in parallel:

#### Node 1 — Technical Analyst
Fetch data:
```bash
python scripts/fetch_market_data.py --ticker $TICKER --type technical
```
Synthesize trend structure (EMA10, SMA50, SMA200), momentum (RSI-14, MACD histogram), volatility (ATR-14, Bollinger Bands), and nearest support/resistance levels.
End with: `TECHNICAL SIGNAL: [BULLISH / BEARISH / NEUTRAL]`

#### Node 2 — News & Sentiment Analyst
Fetch data:
```bash
python scripts/fetch_market_data.py --ticker $TICKER --type news
```
Evaluate top headlines, sector tailwinds/headwinds, earnings guidance, and overall narrative tone.
End with: `SENTIMENT SIGNAL: [POSITIVE / NEGATIVE / NEUTRAL]`

#### Node 3 — Fundamentals Analyst
Fetch data:
```bash
python scripts/fetch_market_data.py --ticker $TICKER --type fundamentals
```
Evaluate valuation (trailing/forward P/E, PEG, P/B), operating margins, free cash flow, leverage (debt-to-equity, current ratio), and analyst target consensus.
End with: `FUNDAMENTAL SIGNAL: [STRONG / FAIR / WEAK]`

#### Node 4 — Macro Analyst
Fetch data:
```bash
python scripts/fetch_market_data.py --ticker MACRO --type macro
```
Assess broader market conditions (S&P 500, 10-Year Treasury Yield, Gold, and Crude Oil) and global liquidity environment.
End with: `MACRO SIGNAL: [RISK-ON / RISK-OFF / NEUTRAL]`

---

### Phase 2 — Adversarial Bull/Bear Debate

Run sequential debate rounds using data from Phase 1:

1. **Bull Analyst**:
   - Construct the strongest data-backed upside thesis emphasizing growth catalysts, margin expansion, and bullish setups.
   - Conclude with: `BULL CONVICTION: [HIGH / MEDIUM / LOW]`
2. **Bear Analyst**:
   - Receives the Bull's case and directly rebuts specific claims using balance sheet weaknesses, macro headwinds, or valuation multiples.
   - Conclude with: `BEAR CONVICTION: [HIGH / MEDIUM / LOW]`
3. **Risk Auditor**:
   - Stress-tests the trade from a capital preservation perspective. Surfaces tail risks, liquidity limits, and downside drawdowns ignored by the Bull and Bear.
   - Conclude with: `RISK LEVEL: [HIGH / MEDIUM / LOW]`

---

### Phase 3 — Research Manager Synthesis

Arbitrate the debate and assign an explicit rating based on [references/adversarial_debate_framework.md](references/adversarial_debate_framework.md):

```
RECOMMENDATION: [Buy / Overweight / Hold / Underweight / Sell]
RATIONALE: [2-3 sentences specifying which case won the debate and why, citing metrics]
STRATEGIC ACTIONS: [2-3 sentences detailing tactical execution conditions]
```

---

### Phase 4 — Quantitative Trader & Risk Parameters

Calculate exact order parameters using [references/quantitative_risk_models.md](references/quantitative_risk_models.md):
- **Entry**: Current price or support level pull-back.
- **Take-Profit**: Resistance pivot $- (0.2 \times ATR_{14})$.
- **Stop-Loss**: Support pivot $- (0.5 \times ATR_{14})$.
- **Position Size**: 1% capital-at-risk formula ($R_{\max} / |P_{\text{entry}} - P_{\text{stop}}|$), clamped to a 10% maximum portfolio concentration.
- **R:R Check**: Verify $|P_{\text{TP}} - P_{\text{entry}}| / |P_{\text{entry}} - P_{\text{stop}}| \ge 1.5$.

---

### Phase 5 — Portfolio Manager Final Decision

Deliver the final executive trade directive in this standard format:

```markdown
### 🏛️ PORTFOLIO MANAGER EXECUTIVE DECISION
- **TICKER**: [Ticker Symbol]
- **ACTION**: [BUY / SELL / HOLD]
- **RATING**: [Buy / Overweight / Hold / Underweight / Sell]
- **ENTRY TARGET**: $[Price]
- **TAKE PROFIT**: $[Price]
- **STOP LOSS**: $[Price]
- **POSITION SIZE**: [Number of Shares / Allocated USD (% of Portfolio)]
- **BULL THESIS**: [Single strongest quantitative bull argument]
- **BEAR THESIS**: [Single strongest quantitative bear argument]
- **FINAL VERDICT**: [Executive summary justifying the decision and risk parameters]
```

---

## Output Quality Checklist

Before finalizing the decision, verify:

- [ ] Technical, News, Fundamentals, and Macro scripts executed successfully.
- [ ] Debate features specific data citations (exact P/E, RSI, debt numbers) rather than generalizations.
- [ ] Risk-to-Reward ratio is explicitly verified ($R:R \ge 1.5$).
- [ ] Stop-loss is positioned using empirical ATR buffers rather than arbitrary percentages.
- [ ] Position sizing strictly adheres to the 1% capital-at-risk model and 10% concentration ceiling.
