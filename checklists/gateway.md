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

### gw-config-generated-from-recipes

- [ ] Is the final gateway configuration file generated from a source-of-truth recipe system, with manual edits to the generated file blocked by tests?

**Why:** Manual edits to generated configs lead to drift and silent failures; enforcing generation ensures that all changes are reviewed, documented, and consistent with the intended architecture.

- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively

### gw-key-distribution-verified

- [ ] Is the distribution of gateway API keys to consumers verified by checking that the environment variables are correctly loaded in the specific shell contexts used by the services?

**Why:** Keys may be present in files but not exported to the process environment due to shell profile differences (e.g., zsh vs bash), leading to silent authentication failures that are hard to diagnose.

- scar: [Gateway key not visible to service](../scars/scar-key-env-mismatch.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

## Stage 3 — reliable

### gw-data-policy-per-member

- [ ] Every endpoint behind the gateway declares its data policy, and endpoints that train on inputs — or whose policy is unknown — are reachable only from a public-only pool.

**Why:** A policy accepted as "not published" is a policy nobody re-checks once the provider publishes "trains on prompts".

- scar: [A free endpoint trained on our prompts for weeks](../scars/free-endpoint-trains-silently.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: `gateway.litellm.data_policy`

### gw-fallback-timeout-tuned

- [ ] Does every fallback chain in the gateway config declare a per-deployment timeout that is explicitly tuned against real workload latency rather than a generic health-check value?

**Why:** A silent or busy backend does not return an error; without a short, workload-specific timeout, the router waits for the global limit, rendering the fallback chain ineffective and causing client-side timeouts.

- scar: [Fallback chain failed to trigger due to silent backend](../scars/scar-fallback-theater.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### gw-judge-pinned-model

- [ ] Are endpoints designated for LLM-as-a-judge or measurement tasks pinned to a single specific model instance rather than a load-balanced pool alias?

**Why:** Using a pool for a judge introduces variance in the measurement instrument itself, making results across runs incomparable and masking true model performance differences.

- scar: [LLM judge variance masked model performance](../scars/scar-judge-pool-variance.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### gw-identity-fallback-closed

- [ ] Do fallback configurations for credentials or identities fail closed (returning an error) rather than substituting a different valid identity or token?

**Why:** Substituting a different identity during a fallback is impersonation, not resilience; it results in actions being performed under the wrong name, which is an irreversible security and compliance failure.

- scar: [Fallback token substituted wrong identity](../scars/scar-identity-impersonation.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: none — asked interactively

### gw-error-classification-post-throttle

- [ ] Are error classifications and root-cause analyses deferred until after throttling (429) conditions have been resolved and requests re-attempted?

**Why:** Throttling errors mask the underlying cause; diagnosing failures while rate limits are active leads to incorrect conclusions about permanent issues versus temporary capacity constraints.

- scar: [429 errors masked permanent content deletion](../scars/scar-throttling-masks-error.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### gw-unknown-data-not-zero

- [ ] Do gateway metrics and dashboards distinguish between a measured zero and a missing data source, avoiding the substitution of null or missing values with zero?

**Why:** Displaying missing data as zero creates a false sense of security or success; it hides configuration errors or dead sources that require attention.

- scar: [Missing data displayed as zero cost](../scars/scar-unknown-as-zero.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### gw-fallback-test-under-load

- [ ] Are fallback chains tested under conditions where the primary backend is busy or slow, rather than just when it is completely down?

**Why:** A down backend fails fast, making fallbacks appear healthy; a busy backend holds connections, testing the actual timeout and failover logic that matters in production.

- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

## Stage 4 — controlled

### gw-usage-attribution-verified

- [ ] Do reports or metrics attributed to a specific pool or model include verification from usage logs confirming which specific backend members actually served the requests?

**Why:** Pool labels in reports can be misleading if some members are down or rate-limited; verifying actual attribution prevents drawing architectural conclusions from single-model data labeled as ensemble data.

- scar: [Pool label hid single-model execution](../scars/scar-pool-label-misleading.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### gw-scar-class-not-transport

- [ ] Are known defects or 'scars' documented as properties of the model class or API behavior rather than specific to a single transport or gateway path?

**Why:** Defects like token budget exhaustion in reasoning models can manifest across multiple transports; scoping them to one path prevents detection in other code paths that use the same model class.

- scar: [Known defect missed in second transport](../scars/scar-scar-transport-scoped.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively
