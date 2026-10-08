<!-- generated from checklists/secrets-guards.yaml by scripts/render.ts — edit the yaml, not this file -->
# Secrets & guards

Keys stay out of git and out of logs, and every guard that protects them states what it does when it cannot check.

Stages: 1 tried · 2 works · 3 reliable · 4 controlled · 5 exemplary. Run `npx awesome-checkup` to score your setup.

## Stage 1 — tried

### sec-env-ignored

- [ ] .env files are ignored by git, and no later rule re-includes them.

**Why:** The first leak is almost always a .env committed with everything else.

- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: `secrets.gitignore_env`

### sec-no-tracked-env

- [ ] No .env file is tracked by git (templates like .env.example are fine).

**Why:** An ignore rule added after the first commit does not untrack the file.

- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: `secrets.no_tracked_env`

## Stage 2 — works

### sec-scanner-wired

- [ ] A secret scanner runs before commits or in CI.

**Why:** Rules in a contract are read by agents sometimes; a scanner reads every commit.

- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: `secrets.scanner_wired`

### sec-typecheck-gate

- [ ] Is a type-checking step (e.g., tsc --noEmit) integrated into the daily test or build pipeline, not just the deployment stage?

**Why:** Test runners often transpile code without type-checking, allowing type errors to persist unnoticed for long periods. Integrating type checks into the frequent test cycle ensures that 'green tests' actually imply a healthy, compilable codebase.

- scar: [Green tests, broken build](../scars/scar-test-runner-no-typecheck.md)
- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively

## Stage 3 — reliable

### sec-guard-fail-policy

- [ ] Every guard declares its failure policy — fail closed on irreversible channels, fail open but loudly when advisory, never silently.

**Why:** Undeclared policies are accidents of each guard's first version, and "checked, clean" looks the same as "could not check".

- scar: [Seven guards, seven failure policies](../scars/guards-with-seven-policies.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### sec-verify-independent-path

- [ ] Does the verification step for secret writes construct the target path independently of the write operation's logic?

**Why:** If verification uses the same resolution logic as the write, it will confirm errors in path resolution (e.g., writing to the wrong user's home directory) as successful matches. Independent construction ensures the check validates the actual location, not just the intended one.

- scar: [Verification confirmed the wrong file](../scars/scar-verify-shared-resolution.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-hash-single-extractor

- [ ] Is a single, shared extraction and normalization function used for all sides when comparing secret hashes?

**Why:** Using different extraction methods (e.g., YAML parsing vs. raw string reading) can introduce invisible differences like whitespace or quotes, leading to false 'mismatch' conclusions that corrupt the mental model of which secrets are actually in use.

- scar: [False mismatch due to extraction differences](../scars/scar-hash-extractor-mismatch.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-guard-consumer-parser

- [ ] Are sanitization or guard rules defined by the logic of the consuming parser rather than a generic format specification?

**Why:** Defining 'dangerous' content based on a spec rather than the actual consumer's parser can leave gaps where the consumer interprets benign-looking input as dangerous, or where the sanitizer inadvertently creates dangerous structures from safe ones.

- scar: [Sanitizer created the danger it removed](../scars/scar-sanitizer-spec-gap.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: none — asked interactively

### sec-empty-window-null

- [ ] Do monitoring aggregates return null or an explicit 'insufficient data' state when the observation window is empty, rather than zero?

**Why:** Aggregates like variance or mean calculated over an empty set often default to zero, which reads as 'stable' or 'calm' to consumers. This creates a false sense of security by masking the lack of data as a positive signal.

- scar: [Empty data read as stability](../scars/scar-empty-window-calm.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### sec-import-isolation-test

- [ ] Are import statements for cross-module dependencies tested in an isolated process that mimics the production runtime environment?

**Why:** Test runners often modify the system path (e.g., via conftest) to make imports work, hiding failures that would occur in the actual daemon or service context where those paths are not available. Isolated testing ensures the module can load itself.

- scar: [Test path hid runtime import failure](../scars/scar-conftest-hides-import.md)
- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively

### sec-fixture-live-data-filter

- [ ] Do test fixtures that copy live append-only logs filter out entries that the test itself generates or modifies?

**Why:** Using a live log as a fixture base without filtering can cause tests to fail on the first real production entry if the test writes duplicate IDs or states. This breaks the test exactly when the system starts working correctly.

- scar: [Fixture broke on first real entry](../scars/scar-fixture-live-log.md)
- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively

### sec-evidence-gap-first

- [ ] Before escalating a discrepancy between automated evaluators to a human, is there a process to verify that all required evidence was available to both evaluators?

**Why:** Disputes between judges or evaluators are often caused by missing data or inconsistent rules rather than genuine ambiguity. Resolving evidence gaps first prevents wasting human attention on fixable technical issues.

- scar: [Dispute was a data gap](../scars/scar-judge-evidence-gap.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### sec-prompt-field-collision

- [ ] Do prompt templates avoid using attribute names in the context that are identical to the expected answer field names?

**Why:** LLMs may copy values from context attributes that share the same name as the required output field, leading to parsing errors or incorrect data. Distinct naming prevents the model from confusing source data with the target structure.

- scar: [Model copied context attribute to answer field](../scars/scar-prompt-label-collision.md)
- standard: [OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)
- auto-check: none — asked interactively

## Stage 4 — controlled

### sec-guard-usage-verified

- [ ] Is there a check that confirms the guard or security feature is actually being invoked in the production flow, not just present in the codebase?

**Why:** A guard that is implemented but not wired into the execution path provides false security. Verifying usage ensures that the protection mechanism is active and intercepting the intended events.

- scar: [Feature present but not invoked](../scars/scar-shipped-not-used.md)
- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively
