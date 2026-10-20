---
name: mcp-builder
description: Guides the creation of high-quality Model Context Protocol (MCP) servers in Python (FastMCP) and TypeScript. This skill should be used when building MCP servers to integrate external APIs, services, and databases with LLMs through standardized tools, resources, and prompts.
---

# MCP Server Development Guide

Architect, implement, and evaluate high-quality Model Context Protocol (MCP) servers that empower LLMs to interact reliably with external APIs, internal databases, and developer tools.

## What This Skill Does

- Guides end-to-end design of MCP servers using either Python (FastMCP / official SDK) or TypeScript.
- Enforces MCP best practices: clean tool schemas, actionable error strings, pagination, and deterministic naming.
- Provides test automation, protocol inspection patterns, and empirical multi-turn evaluation question suites.

## What This Skill Does NOT Do

- Build ad-hoc monolithic API wrappers without MCP schema validation.
- Expose unconstrained destructive actions without explicit user guardrails or parameter validation.

---

## Before Implementation

Gather context to anchor server architecture and tool design:

| Source | Gather |
|---|---|
| **API / Service** | Target endpoints, authentication (API keys, OAuth, Bearer tokens), rate limits, and schemas |
| **Language & Environment** | Python (FastMCP / `uv`) vs Node.js/TypeScript (`npm`), transport mode (`stdio` vs Streamable HTTP) |
| **Skill References** | Core guidelines in `references/mcp_best_practices.md`, Python patterns in `references/python_mcp_server.md`, TypeScript in `references/node_mcp_server.md`, and evaluation in `references/evaluation.md` |
| **User Guidelines** | Target client constraints (Claude Desktop, Cursor, Custom Agent CLI) |

---

## Required Clarifications

### Required
1. **Target Service**: External API or database to integrate (e.g. GitHub, Slack, Neon DB, Custom REST API).
2. **Implementation Language**: TypeScript (Node.js SDK) or Python (FastMCP / Python SDK).
3. **Transport Mechanism**: `stdio` (local agent integration) or Streamable HTTP/SSE (remote hosted server).

### Optional
4. **Tool Scope**: Comprehensive API coverage vs task-specific workflow tools.
5. **Evaluation Suite**: Whether to generate automated evaluation scripts and XML benchmark test sets.

---

## MCP Server Development Workflow

```
[ Step 1: Protocol & Schema Planning ] ──► [ Step 2: Client & Tool Implementation ] ──► [ Step 3: Inspector Testing ]
                                                                                                  │
[ Step 5: Deliver Evaluation XML & Server ] ◄──── [ Step 4: Quality & Resilience Audit ] ◄────────┘
```

### Phase 1: Architecture & Tool Schema Design
1. **Tool Naming & Discoverability**:
   - Use consistent snake_case prefixes (e.g. `github_create_issue`, `neon_run_query`).
   - Describe purpose clearly in `<100` words; include argument constraints and typing.
2. **Context Economy**:
   - Return concise, actionable payloads. Always implement pagination for unbounded collections.
   - Separate human-readable summary text from structured JSON outputs.

### Phase 2: Implementation

Consult the appropriate implementation reference:
- **TypeScript**: [references/node_mcp_server.md](references/node_mcp_server.md) for Zod schemas, server instantiation, and async tool handlers.
- **Python**: [references/python_mcp_server.md](references/python_mcp_server.md) for FastMCP decorators (`@mcp.tool`), Pydantic models, and resource endpoints.
- **Universal Standards**: [references/mcp_best_practices.md](references/mcp_best_practices.md) for error message contracts, logging, and timeouts.

### Phase 3: Local Testing & Inspection
- **Inspect with MCP CLI**:
  - Run `npx @modelcontextprotocol/inspector <command-to-run-server>`
  - Verify all tools appear in tool registry with valid JSON schemas.
  - Test tool execution with valid and invalid parameters to verify error recovery.

### Phase 4: Automated Evaluation
Consult [references/evaluation.md](references/evaluation.md) and execute evaluation scripts from `scripts/`:
1. Use `scripts/connections.py` to test transport connections.
2. Formulate 10 complex, realistic evaluation questions in an XML benchmark following `scripts/example_evaluation.xml`.
3. Run `python scripts/evaluation.py` to measure agent resolution rate.

---

## Output Checklist & Quality Gates

Before releasing an MCP server, verify:

- [ ] All tool parameters are strictly typed (Zod schema in TS, Pydantic/type annotations in Python).
- [ ] Tool descriptions explain what the tool does and when an agent should invoke it.
- [ ] Error messages are informative and suggest next remediation steps rather than dumping raw stack traces.
- [ ] `stdio` servers write logs exclusively to `stderr` (`sys.stderr` / `console.error`) to prevent corrupting stdout JSON-RPC.
- [ ] Long-running operations enforce timeouts and support pagination where collections exceed 20 items.
