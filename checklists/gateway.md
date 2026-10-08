<!-- generated from checklists/gateway.yaml by scripts/render.ts — edit the yaml, not this file -->
# LLM gateway & routing

One door between your code and every model provider: keys, quotas, fallbacks and data policy live in one config instead of in every script. Config conventions the auto-checks understand — a LiteLLM YAML with model_list:, a pool is public-only when its name contains "public" or its members set model_info.data_policy.public_only, and each endpoint declares model_info.data_policy.trains: yes | no | unknown.

Stages: 1 tried · 2 works · 3 reliable · 4 controlled · 5 exemplary. Run `npx awesome-checkup` to score your setup.

## Stage 1 — tried

### gw-env-keys

- [ ] Provider API keys in the gateway config come from the environment, never as literals.

**Why:** A key written into a config file ends up in git history and every backup of the repo.

- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: `gateway.litellm.env_keys`

## Stage 2 — works

### gw-single-door

- [ ] Application code, scripts and agents call models only through the gateway; no provider SDK keys live in application code.

**Why:** Quotas, fallbacks and data policy only hold if nothing goes around them.

- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: none — asked interactively

### gw-no-fallback-into-public

- [ ] No fallback chain — direct or transitive — leads from a general pool into a public-only pool.

**Why:** Fallbacks are recursive; one convenient edge sends private prompts to an endpoint meant only for public text.

- scar: [A free endpoint trained on our prompts for weeks](../scars/free-endpoint-trains-silently.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: `gateway.litellm.no_fallback_into_public`

## Stage 3 — reliable

### gw-data-policy-per-member

- [ ] Every endpoint behind the gateway declares its data policy, and endpoints that train on inputs — or whose policy is unknown — are reachable only from a public-only pool.

**Why:** A policy accepted as "not published" is a policy nobody re-checks once the provider publishes "trains on prompts".

- scar: [A free endpoint trained on our prompts for weeks](../scars/free-endpoint-trains-silently.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: `gateway.litellm.data_policy`
