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

## Stage 3 — reliable

### del-kill-by-pid

- [ ] Agents stop processes only by the PID they started, never by process name.

**Why:** On a shared machine a kill-by-name takes down other agents' work along with your own.

- scar: [Killing a hung process by name took down four](../scars/kill-by-name.md)
- auto-check: none — asked interactively
