---
name: code-review
description: Performs rigorous, multi-dimensional code reviews identifying security vulnerabilities, logic defects, concurrency hazards, performance bottlenecks, and architectural deviations. This skill should be used when reviewing pull requests, auditing code changes, checking code quality, or verifying pre-merge readiness.
---

# Code Review Skill

Conduct thorough, systematic, and actionable code quality audits across codebases, pull requests, and individual diffs.

## What This Skill Does

- Analyzes code changes for correctness, edge cases, and runtime failure modes.
- Audits security vulnerabilities (OWASP Top 10, IDOR, injection, secrets, authentication).
- Identifies concurrency hazards (event-loop blocking, thread safety, race conditions, connection leaks).
- Evaluates architectural soundness, typing contracts, and adherence to project conventions.
- Formulates prioritized findings using a standard severity grading system with drop-in code fixes.

## What This Skill Does NOT Do

- Automatically commit code changes or merge pull requests without human confirmation.
- Replace comprehensive automated unit/integration test suites.
- Introduce arbitrary stylistic preferences that conflict with configured repository formatters.

---

## Before Implementation

Gather context to ensure an accurate and tailored review:

| Source | Gather |
|---|---|
| **Codebase** | Project architecture, existing linters/formatters, frameworks, and conventions |
| **Git Diffs** | Exact modified files, added/removed lines, and commit messages |
| **Skill References** | Audit standards in `references/security-vulnerabilities.md`, `references/concurrency-async.md`, and `references/architecture-quality.md` |
| **User Guidelines** | Specific security tiers, performance budgets, or compliance constraints |

---

## Required Clarifications

### Required
1. **Target Scope**: Which files, git branch, diff range, or pull request to inspect.
2. **Review Focus**: Whether to prioritize security audits, performance profiling, refactoring, or a balanced full-spectrum review.

### Optional
3. **Target Environment**: Production high-throughput vs internal prototyping environment.
4. **Tolerance Level**: Whether to include stylistic nits or restrict findings to Major/Critical defects only.

---

## Review Process Workflow

```
[ Step 1: Ingest Context ] ───► [ Step 2: Static & Contract Audit ] ───► [ Step 3: Deep Threat/Perf Modeling ]
                                                                                   │
[ Step 5: Deliver Structured Report ] ◄─── [ Step 4: Classify & Formulate Fixes ] ◄─┘
```

### Phase 1: Context & Diff Parsing
- Inspect changed lines alongside their surrounding call sites and caller dependencies.
- Verify whether public APIs, database schemas, or serialized contracts have undergone breaking changes.

### Phase 2: Multi-Vector Analysis

1. **Correctness & Logic**:
   - Are boundary conditions, null/empty states, and collection edge cases handled?
   - Can exceptions cause partially committed state or corrupted data?

2. **Security & Vulnerabilities**:
   - Consult [references/security-vulnerabilities.md](references/security-vulnerabilities.md).
   - Check authorization guards (IDOR), parameterized queries, secrets handling, and input sanitation.

3. **Concurrency & Resource Management**:
   - Consult [references/concurrency-async.md](references/concurrency-async.md).
   - Ensure zero blocking operations run on async event loops. Verify connection pools, file handles, and transactions cleanly close.

4. **Architecture & Standards**:
   - Consult [references/architecture-quality.md](references/architecture-quality.md).
   - Verify typing precision, separation of concerns, and absence of hardcoded values.

---

## Severity Taxonomy

| Severity | Criteria | Action Required |
|---|---|---|
| **BLOCKER** | Direct security exploit (remote execution, data leak, authentication bypass) or catastrophic data loss | Immediate halt; cannot merge |
| **CRITICAL** | Severe crash in core flow, memory leak, deadlock, or event-loop freeze under load | Must resolve prior to release |
| **MAJOR** | Logic flaw, broken edge case, missing error handling, or performance regression | Strong recommendation to fix |
| **MINOR** | Code duplication, ambiguous naming, missing type annotations, or incomplete docstring | Fix when convenient |
| **NIT** | Trivial cosmetic preference or comment typography | Optional |

---

## Output Specification

Always deliver review findings using the structured format from [assets/review-report-template.md](assets/review-report-template.md):

1. **Executive Summary**: High-level verdict (`APPROVED`, `CHANGES REQUESTED`, or `BLOCKED`) with finding count.
2. **Findings Matrix**: Compact table detailing ID, Severity, File/Line, Category, and Summary.
3. **Detailed Findings**:
   - Exact file and line numbers: `[file.py#L12-L18]`.
   - Clear description of the underlying risk and runtime consequence.
   - Complete, drop-in replacement code snippet illustrating the remediation.
4. **Verification Steps**: Specific test cases or commands to validate the resolution.

---

## Review Quality Checklist

Before finalizing any code review, verify:

- [ ] Every finding has an assigned severity from the taxonomy table.
- [ ] Every critical issue includes a concrete explanation of the failure mechanism.
- [ ] Drop-in code fixes are provided for all Blocker and Critical issues.
- [ ] Findings cite line numbers and files accurately.
- [ ] Compliments on elegant or well-crafted solutions are noted where applicable.
