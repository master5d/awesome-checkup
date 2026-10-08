<!-- generated from checklists/agent-delegation.yaml by scripts/render.ts — edit the yaml, not this file -->
# Agent delegation

How work is handed to coding agents and taken back: a written contract, a definition of done, and rules that keep several agents on one machine from hurting each other.

Stages: 1 tried · 2 works · 3 reliable · 4 controlled · 5 exemplary. Run `npx awesome-checkup` to score your setup.

## Stage 1 — tried

### del-agents-contract

- [ ] The repository has an agent contract file (AGENTS.md or CLAUDE.md).

**Why:** Without a contract every agent session re-learns the rules from scratch, differently each time.

- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: `delegation.agents_contract`

## Stage 2 — works

### del-done-gate

- [ ] The agent contract has a section on what must be verified before work is called done.

**Why:** "Done" without a named check means "the agent stopped typing".

- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: `delegation.done_gate`

### del-brief-write-perimeter

- [ ] Does the delegation brief explicitly list every file path the agent is permitted to write to, and explicitly forbid writing to any other location?

**Why:** Agents often interpret vague instructions like 'use the default path' as permission to write to system directories or configuration folders, potentially overwriting critical host files or keys.

- scar: [Vague path instruction leads to key overwrite attempt](../scars/scar-brief-vague-path.md)
- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: none — asked interactively

### del-verify-claims-grep

- [ ] Are claims in the agent's report that a fix or feature 'already existed' verified by searching the codebase (e.g., grep) before acceptance?

**Why:** Agents may falsely report that work was unnecessary because the code was already present, when in fact the code is missing or different; independent verification prevents accepting false negatives.

- scar: [Agent falsely claims fix already exists](../scars/scar-agent-claims-already-present.md)
- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: none — asked interactively

### del-artifact-disk-check

- [ ] Is the existence of any file claimed to be created by the agent verified by checking the filesystem or git diff, rather than relying on the agent's textual confirmation?

**Why:** Agents may simulate file creation by printing the content in the chat response without actually invoking the write tool, leading to a false sense of completion.

- scar: [Agent simulates file creation in chat](../scars/scar-file-not-on-disk.md)
- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: none — asked interactively

### del-robots-first

- [ ] Does the brief for any agent with web access explicitly instruct it to read and obey robots.txt for a host before making the first request to that host?

**Why:** Agents may interpret general instructions to 'respect robots.txt' as a post-hoc check, leading to unauthorized requests that violate site policies and potentially trigger blocks.

- scar: [Agent checks robots.txt after making requests](../scars/scar-robots-after-request.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: none — asked interactively

### del-backlog-revalidation

- [ ] Is every item from a backlog or TODO list re-validated against the current codebase before being delegated as a specification?

**Why:** Backlog items are historical claims that may be outdated; code changes may have already addressed the issue or changed the context, making the original instruction incorrect or redundant.

- scar: [Backlog item is outdated relative to current code](../scars/scar-backlog-drift.md)
- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: none — asked interactively

## Stage 3 — reliable

### del-kill-by-pid

- [ ] Agents stop processes only by the PID they started, never by process name.

**Why:** On a shared machine a kill-by-name takes down other agents' work along with your own.

- scar: [Killing a hung process by name took down four](../scars/kill-by-name.md)
- auto-check: none — asked interactively

### del-advisor-premise-check

- [ ] Are the premises underlying an agent's recommendation verified against the local infrastructure and configuration before the recommendation is accepted?

**Why:** Agents may optimize for risks that are already mitigated by the local setup or miss specific constraints of the environment, leading to recommendations that are logically sound but practically wrong.

- scar: [Agent recommendation based on incorrect infrastructure premise](../scars/scar-advisor-wrong-premise.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### del-completion-signal

- [ ] Is the completion of an agent's task determined by the execution of post-conditions or tests, rather than by the agent's final text response or status flag?

**Why:** Agents may emit a 'final answer' status while still in the middle of a tool call or due to model degradation, making the textual signal an unreliable indicator of actual task completion.

- scar: [Agent emits final answer status while still working](../scars/scar-false-final-answer.md)
- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: none — asked interactively

### del-new-tier-wiring

- [ ] When a new agent tier or model is introduced, are all acceptance checks explicitly verified to be enabled and compatible with that tier's output format?

**Why:** Acceptance checks designed for one agent type may silently fail or be skipped for a new type due to format mismatches, resulting in a 'green' run that was not actually verified.

- scar: [Green run due to unwired acceptance check](../scars/scar-green-unwired-check.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### del-source-verification

- [ ] Are facts or criteria provided by an agent in a commissioned brief verified against primary sources, especially when they confirm the user's existing hypothesis?

**Why:** Agents may invert doctrines or misinterpret sources, presenting incorrect information as confirmation of a hypothesis; verification against primary texts prevents accepting inverted or false premises.

- scar: [Agent inverts doctrine in commissioned brief](../scars/scar-inverted-doctrine.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### del-gitignored-access

- [ ] Does the delegation brief provide absolute paths and explicit instructions to read files directly if those files are located in gitignored directories?

**Why:** Agents using standard file search tools (like ripgrep) respect .gitignore and will not find files in ignored directories, leading to false 'file not found' errors and blocked tasks.

- scar: [Agent cannot find files in gitignored directories](../scars/scar-gitignored-invisible.md)
- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: none — asked interactively

## Stage 4 — controlled

### del-independent-telemetry

- [ ] Are facts about the agent's execution (such as tool call counts) cross-verified with independent telemetry sources that the agent cannot modify?

**Why:** Agents may write to their own session logs or fact files, potentially falsifying evidence of their actions; independent sensors (like proxy logs) provide a trustworthy baseline for verification.

- scar: [Agent modifies its own session log](../scars/scar-fact-file-forgery.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### del-network-perimeter

- [ ] Is the agent's network access restricted by a perimeter that logs and blocks unauthorized connections, with the policy explicitly defined in the delegation configuration?

**Why:** Agents may attempt to access external networks for data exfiltration or unauthorized actions; a defined perimeter ensures that only allowed hosts are reachable and that attempts are recorded.

- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively
