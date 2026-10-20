## 📜 System Constitution: Automated-Multi-Agentic-Trading-System

**Project:** Automated-Multi-Agentic-Trading-System  
**Tier:** Bachelor of Computer Science (BSCS) Final Year Project  
**Framework:** OpenAI Agents SDK Architecture (Python / `uv`)  
**Scope:** Multi-Asset Class Engine (Equities & Cryptocurrencies)  

---

## 1. System Architecture Overview

The system is built on a decoupled, asynchronous multi-agent orchestration pattern. Rather than relying on a single monolith prompt, the architecture enforces strict separation of concerns across **User Interaction Gateways**, **Deterministic Data Extraction**, **Semantic Market Strategy Interpretation**, and **Rigid Risk Compliance Control Blocks**.

---

## 2. Agent Registry & Core Personas

### 🔹 1. Master Trading Desk Router (Orchestrator)
* **Role:** Conversational Gateway, State Initiator & Interface Controller.
* **Objective:** Ingest user intent, validate asset token parameters, guide execution preference selection, and dynamically compute tool parameters.
* **Operational Laws:**
  * Must verify asset ticker syntax before opening downstream execution lanes.
  * Must present the explicit 4-tier strategy selection menu.
  * Must *never* trigger data extraction until both asset identity and timeframe targets are locked in.

### 🔹 2. Intraday & Swing Market Analyst
* **Role:** Quantitative & Technical Signal Synthesizer.
* **Objective:** Consume indicator matrices from the Python extraction tool, interpret momentum, and output semantic summaries.
* **Operational Laws:**
  * **Absolute Boundary:** Holds zero portfolio execution or order placement authority.
  * Must *never* output explicit trade directives like `BUY`, `SELL`, or `HOLD`.
  * Must focus exclusively on processing moving averages, RSI boundaries, and price trajectory vectors.

### 🔹 3. Risk Manager Agent
* **Role:** Capital Preservation & Compliance Audit Guardrail.
* **Objective:** Independent compliance block auditing proposed trading operations against structural safety constraints before returning payloads.
* **Operational Laws:**
  * Functions as the final automated gatekeeper of the system loop.
  * Must prefix all audit outputs with strict validation signatures: `[APPROVED]` or `[REJECTED]`.
  * Must append exactly one sentence of quantitative technical justification explaining safety math.

---

## 3. Dynamic Strategy & Risk Allocation Matrix

Parameters and capital risk shift dynamically based on timeframe and signal intensity:

| Strategy | Interval | Lookback | BUY / SELL Risk | STRONG BUY / SELL Risk | Primary Indicators |
| --- | --- | --- | :---: | :---: | --- |
| **Intraday Scalp** | `15m` | `7d` | **0.75%** | **1.50%** | EMA (9 / 21), RSI (14) |
| **Intraday Swing** | `1h` | `30d` | **1.00%** | **2.00%** | EMA (9 / 21), RSI (14) |
| **Medium Swing** | `4h` | `60d` | **2.00%** | **3.00%** | 50-MA, MACD, RSI (14) |
| **Macro Position** | `1d` | `180d` | **2.50%** | **4.00%** | 50/200-MA, Macro RSI |

- **Hold Condition**: 0.00% Risk, zero capital allocation ($0.00).
- **Dynamic Account Balance**: Scales to any capital base (prepared for live Binance API connection).

---

## 4. Multi-Asset Validation Protocols

Rigid formatting boundaries are enforced for extraction engine (`yfinance`) compatibility:

### 📈 Traditional Equities (Stocks)
* Standard exchange symbols enforced (`AAPL`, `NVDA`, `TSLA`).
* System logic handles market closure gaps (weekends, holidays).

### 🪙 Cryptocurrencies
* Base currency pair token (`-USD`): `BTC-USD`, `ETH-USD`, `SOL-USD`.
* Continuous 24/7/365 candle streams.

### 🛢️ Commodities & Energy Futures
* Standard futures tokens: `CL=F` (Crude Oil), `GC=F` (Gold), `SI=F` (Silver), `NG=F` (Natural Gas).
* System auto-normalizes aliases (`OIL`/`CRUDE` -> `CL=F`, `GOLD` -> `GC=F`).

---

## 5. Security, Isolation, & Fail-Safe Guardrails

1. **Deterministic State Overrides:** If the parser encounters a `[REJECTED]` token from the Risk Manager, it immediately truncates the workflow and forces a `HOLD` state.
2. **Context Contamination Prevention:** Sandboxed agent execution. Market Analyst has tool rights without user conversation access; Master Router manages conversation without touching raw database infrastructure.
3. **Graceful Exception Truncation:** On invalid tokens or timeout errors, tools return structured error blocks (`"Error: Extraction Target Unreachable"`), preventing thread crashes.

---

## 6. Observability & Telemetry Framework (Langfuse Tracing)

1. **Trace Scope:** Global trace initialized upon user connection.
2. **Nested Spans:** Each agent block (`Market Analyst Tool`, `Risk Manager Tool`) logs individual token usage and latency in nested spans.
3. **Tool Observation:** Python data extraction calls tracked as generation/tool events with exact input/output strings.
4. **Payload Validation:** `### DATABASE INSERTION PAYLOAD` tagged as output parameter before insertion into Neon Database.

---

## 7. Build & Development Commands

- **Launch Gateway Server**: `uv run python run.py` (runs on `http://0.0.0.0:8000`)
- **Direct Uvicorn Server**: `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- **Run Full Test Suite**: `uv run pytest -v`
- **Run Single Test**: `uv run pytest tests/test_flow.py::test_name -v`
- **Compile & Syntax Check**: `uv run python -m py_compile run.py app/main.py app/agents/runner.py`
- **Dependency Sync**: `uv sync`

---

## 8. Code Style & Architectural Invariants

- **Async Discipline**: All route controllers and agent node tools must be `async def`. Never use blocking calls (`time.sleep()`, synchronous `requests`) inside coroutines.
- **Contract Boundary**: Enforce strict Pydantic v2 schemas (`app/schemas/`) at API and inter-agent boundaries. Keep SQLAlchemy ORM models (`app/models/`) decoupled from HTTP schemas.
- **Sandboxed Agent Authority**: Market Analyst has zero execution authority; Risk Manager output must start with `[APPROVED]` or `[REJECTED]`.
- **Database Connection Management**: Use asynchronous context managers (`async with session_factory() as db_session:`) to prevent pool exhaustion.

---

## 9. Testing & Mocking Strategy

- **Test Runner**: `pytest` with `pytest-asyncio`.
- **Market Data Isolation**: Mock `yfinance` network calls and external market endpoints during automated test suites; never depend on live financial markets in CI/CD.
- **Database Isolation**: Unit and integration tests must run against isolated test schemas or rollback-guaranteed test transactions.

---

## 10. Subagent Delegation Strategy (Hybrid Model)

| Task Type | Best Approach | Rationale |
|---|---|---|
| **Codebase Exploration** | Subagents (Explore) | Ephemeral file reading and symbol scanning without polluting main context |
| **Multi-File Search / Grep** | Subagents | Deep log and regex searching keeps token usage lean |
| **Independent Parallel Tasks** | Background Subagents | Concurrent data analysis across multiple tickers |
| **Complex Architectural Planning** | Plan Subagents | Multi-agent state machine and schema design |
| **Iterative Refinement & Decisions** | Main Session | Core quantitative logic, user interaction, and final risk audits |
