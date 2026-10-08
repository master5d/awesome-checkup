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

### sec-stdout-silent-capture

- [ ] Do all commands that interact with secrets use silent capture (e.g., variable assignment or piping) to ensure the secret value never appears in the tool's standard output or session transcript?

**Why:** Secrets printed to stdout are permanently persisted in conversation logs and session JSONL files, creating a permanent leak surface that outlives the session.

- scar: [Secret printed to stdout in tool output](../scars/scar-secret-stdout-leak.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

## Stage 2 — works

### sec-scanner-wired

- [ ] A secret scanner runs before commits or in CI.

**Why:** Rules in a contract are read by agents sometimes; a scanner reads every commit.

- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: `secrets.scanner_wired`

### sec-dep-logger-suppression

- [ ] Are loggers for third-party HTTP clients and dependencies explicitly configured to suppress INFO-level output that might contain full URLs with embedded secrets?

**Why:** Third-party libraries often log full request URLs at INFO level, bypassing application-level sanitization and leaking secrets in URL paths or query strings.

- scar: [HTTP client logs full URL with secret](../scars/scar-http-client-url-leak.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-diag-env-scrub

- [ ] Do diagnostic tools and machine-readable output modes (e.g., --json) explicitly exclude or scrub environment variables containing secrets before printing?

**Why:** Diagnostic tools that dump process environments can inadvertently expose all provider keys and tokens in logs, even when specific flags for human-readable output are not used.

- scar: [Diagnostic tool dumps environment variables](../scars/scar-diag-tool-env-dump.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-hash-stdin-only

- [ ] Are secrets hashed or verified by passing them via stdin or internal process memory, ensuring they are never passed as positional arguments to shell commands?

**Why:** Passing secrets as command-line arguments exposes them in error messages, process lists, and shell history, whereas stdin or internal variables keep them out of the argument parsing context.

- scar: [PowerShell alias prints secret in error message](../scars/scar-powershell-alias-leak.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-env-presence-check

- [ ] Do configuration checks verify that secret environment variables have non-empty values, rather than just checking for the existence of the variable name?

**Why:** Empty environment variables can mimic a configured state, causing services to silently fail or fall back to insecure defaults while appearing correctly set up.

- scar: [Empty environment variable mimics configuration](../scars/scar-empty-env-key.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

## Stage 3 — reliable

### sec-guard-fail-policy

- [ ] Every guard declares its failure policy — fail closed on irreversible channels, fail open but loudly when advisory, never silently.

**Why:** Undeclared policies are accidents of each guard's first version, and "checked, clean" looks the same as "could not check".

- scar: [Seven guards, seven failure policies](../scars/guards-with-seven-policies.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively

### sec-aria-snapshot-filter

- [ ] Do UI automation snapshots or accessibility checks filter out the values of fields identified as containing secrets after form submission?

**Why:** Accessibility snapshots of filled forms can print the current value of text boxes, leaking secrets that were just entered, even if the input method itself was secure.

- scar: [Accessibility snapshot prints form field value](../scars/scar-aria-snapshot-leak.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-mask-full-char

- [ ] Do masking routines replace every character of a secret with a placeholder (e.g., asterisks) rather than using length-based or prefix-based truncation?

**Why:** Length-based or prefix-based masking leaks short secrets (like PINs or short phrases) entirely, as they fall below the threshold for truncation.

- scar: [Length-based masking leaks short secrets](../scars/scar-mask-short-word-leak.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-rotation-consumer-sync

- [ ] Does the key rotation procedure include a step to verify that all consumer nodes and processes have updated their local copies of the key, using hash comparison rather than value printing?

**Why:** Key rotation on a central node does not automatically update long-running processes or containers on other nodes, leading to silent authentication failures that mimic infrastructure outages.

- scar: [Key rotation orphans consumers on other nodes](../scars/scar-rotation-orphan-consumer.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-stale-env-diagnosis

- [ ] When an authenticated service fails with a generic error (e.g., 'no database' or 'rate limit'), is the first diagnostic step to compare the hash of the key in the current process against the source of truth?

**Why:** Long-running sessions hold stale environment variables from before a rotation, causing errors that mislead diagnosis toward infrastructure faults rather than credential staleness.

- scar: [Long session holds stale key after rotation](../scars/scar-stale-session-key.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-test-credential-isolation

- [ ] Do test suites automatically isolate or mock the source of live credentials to prevent tests from triggering real external actions using production secrets?

**Why:** Tests that load real configuration files can inadvertently send real notifications or consume API quotas, causing spam and side effects that are hard to trace back to the test run.

- scar: [Test suite uses live credentials](../scars/scar-test-live-credential.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

### sec-ci-secret-freshness

- [ ] When CI fails with rate-limit or authentication errors, is the first check to verify the freshness and hash of the stored secret against the last known rotation date?

**Why:** Revoked or stale tokens in CI secrets can produce misleading error codes (like rate limits) that hide the true cause of authentication failure, leading to incorrect debugging efforts.

- scar: [Revoked token reads as rate limit](../scars/scar-revoked-token-rate-limit.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively

## Stage 4 — controlled

### sec-token-scope-narrow

- [ ] Are tokens used for inference or external API calls scoped to the minimum necessary permissions, verified by attempting to access unrelated resources and expecting a 403 error?

**Why:** Reusing broad infrastructure tokens for inference exposes the entire account (DNS, databases, tunnels) to the same risk as the inference endpoint, violating the principle of least privilege.

- scar: [Infrastructure token reused as inference key](../scars/scar-infra-token-reuse.md)
- standard: [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- auto-check: none — asked interactively
