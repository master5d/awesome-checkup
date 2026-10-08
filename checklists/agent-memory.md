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
