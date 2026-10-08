<!-- generated from checklists/agent-memory.yaml by scripts/render.ts — edit the yaml, not this file -->
# Agent memory

What agents remember between sessions, who said it, and how a wrong memory gets out.

Stages: 1 tried · 2 works · 3 reliable · 4 controlled · 5 exemplary. Run `npx awesome-checkup` to score your setup.

## Stage 2 — works

### mem-provenance

- [ ] Every memory record names its origin (the owner, a specific agent, or the web), and an agent's claim is never stored as the owner's word.

**Why:** A memory without provenance turns one agent's guess into every later agent's fact.

- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: none — asked interactively

### mem-quarantine

- [ ] Does every new memory record enter an isolated quarantine state before becoming visible to other agents or the shared index?

**Why:** Isolating drafts prevents unverified agent outputs or web content from immediately polluting the shared truth, allowing for inspection before promotion.

- scar: [Direct Write to Shared Memory](../scars/scar-memory-quarantine.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: none — asked interactively

### mem-index-budget

- [ ] Is the size of the active memory index monitored against a defined budget, with alerts triggered when usage exceeds a threshold?

**Why:** Prevents silent truncation of critical memory by the harness, ensuring that the agent does not lose access to essential context due to unmanaged growth.

- scar: [Silent Index Truncation](../scars/scar-index-truncation.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### mem-sensitive-data-scan

- [ ] Do memory records undergo automated scanning for sensitive data such as PII, secrets, or injection payloads before admission?

**Why:** Prevents the accidental storage of confidential information or malicious instructions in the agent's long-term memory, which could be exposed in future contexts.

- scar: [PII in Memory Record](../scars/scar-pii-leak.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

## Stage 3 — reliable

### mem-ledger-integrity

- [ ] Is there a hash-chained ledger that records all memory admissions and edits, with integrity verified at session start?

**Why:** A tamper-evident ledger ensures that silent modifications or deletions of memory records are detected immediately, preserving the audit trail of what the agent knows.

- scar: [Parallel Session Ledger Conflict](../scars/scar-ledger-branch.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### mem-owner-claim-marker

- [ ] Are claims attributed to the owner within memory records explicitly marked with a distinct syntax that distinguishes them from agent assertions?

**Why:** Prevents 'attribution laundering' where an agent's guess or inference is stored as a direct instruction from the owner, which could lead to unauthorized actions based on false authority.

- scar: [Agent Guess Stored as Owner Word](../scars/scar-attribution-laundering.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: none — asked interactively

### mem-supersession-lineage

- [ ] When a memory record is corrected, does the new record explicitly reference the old one via a supersession field rather than overwriting it?

**Why:** Maintaining lineage allows for auditing why a fact changed and ensures that the default recall sees only the current truth while the history remains available for investigation.

- scar: [Silent Overwrite of Memory](../scars/scar-supersession-loss.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### mem-duplicate-detection

- [ ] Are new memory records checked for semantic or lexical duplicates against the existing corpus before admission?

**Why:** Identifies redundant or conflicting information early, allowing the owner to decide whether to merge, supersede, or reject the new record, thus maintaining corpus quality.

- scar: [Semantic Duplicate Confusion](../scars/scar-semantic-dup.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### mem-probe-recall

- [ ] Is there a mechanism to verify that admitted memory records are actually retrievable by the recall system using representative queries?

**Why:** Ensures that memory records are not just stored but are effectively accessible, preventing 'dead' memory that consumes budget but never influences agent behavior.

- scar: [Unretrievable Memory](../scars/scar-recall-failure.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### mem-lifetime-expiry

- [ ] Do memory records have an explicit lifetime or expiry mechanism that flags or removes stale information from the active index?

**Why:** Prevents the accumulation of outdated facts that may contradict current reality, ensuring the agent operates on the most relevant and up-to-date information.

- scar: [Outdated Fact in Context](../scars/scar-stale-memory.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

## Stage 4 — controlled

### mem-owner-approval-channel

- [ ] Is the approval of high-risk memory operations (such as superseding or retiring records) restricted to a specific, authenticated channel distinct from agent execution?

**Why:** Ensures that critical changes to the agent's knowledge base are explicitly authorized by the human owner, preventing agents from self-approving dangerous modifications.

- scar: [Agent Self-Approval](../scars/scar-approval-bypass.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively
