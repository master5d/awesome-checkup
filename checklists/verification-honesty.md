<!-- generated from checklists/verification-honesty.yaml by scripts/render.ts — edit the yaml, not this file -->
# Verification honesty

Green means passed, red means failed, and "could not check" is a third colour — never folded into either.

Stages: 1 tried · 2 works · 3 reliable · 4 controlled · 5 exemplary. Run `npx awesome-checkup` to score your setup.

## Stage 1 — tried

### ver-ci-runs-tests

- [ ] CI runs the test suite on every change.

**Why:** Tests that only run on one laptop are tests that stop running.

- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: `verification.ci_runs_tests`

## Stage 2 — works

### ver-no-status-eating-pipe

- [ ] No test command is piped or forced green in a way that hides its exit code.

**Why:** A pipe into tail reports tail's exit code; "|| true" reports nothing at all.

- scar: [FAIL printed, exit code 0](../scars/status-eaten-by-pipe.md)
- auto-check: `verification.no_status_eating_pipe`

### ver-typecheck-in-ci

- [ ] Is the type-checking step (e.g., tsc --noEmit) executed as part of the standard test or build pipeline, ensuring that green tests do not coexist with broken types?

**Why:** Test runners often transpile code without type-checking, allowing type errors to persist indefinitely; integrating type-checking into the daily verification loop prevents the false equivalence of 'tests pass' and 'code is healthy'.

- scar: [Green tests, broken build](../scars/scar-test-runner-no-typecheck.md)
- auto-check: none — asked interactively

## Stage 3 — reliable

### ver-unknown-is-not-green

- [ ] Your test runner reports "not run / failed to collect" separately from "passed", and a suite that did not run never counts as green.

**Why:** Absence of failures is not presence of passes.

- scar: [FAIL printed, exit code 0](../scars/status-eaten-by-pipe.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### ver-exit-code-3-not-green

- [ ] Does the test runner distinguish between 'passed' (exit 0), 'failed' (exit 1), and 'not checked/unknown' (exit 3 or similar) in its exit codes and reporting?

**Why:** Treating 'not checked' as a failure is overly strict, but treating it as a pass is dishonest; a distinct exit code ensures that missing coverage or collection errors are visible as a third state rather than being folded into green or red.

- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively

### ver-import-in-isolated-process

- [ ] Are import or startup checks for daemon-like modules performed in an isolated process that does not inherit the test runner's environment modifications (such as sys.path adjustments)?

**Why:** Test configurations often modify the runtime environment to make imports succeed, masking failures that would occur in the production runtime; isolated verification ensures the module can actually start in its intended context.

- scar: [Test path hid runtime import failure](../scars/scar-conftest-hides-import.md)
- auto-check: none — asked interactively

### ver-aggregate-null-on-empty

- [ ] Do monitoring aggregates (such as variance or mean) return a null or 'unknown' state when the data window is empty, rather than defaulting to zero?

**Why:** Aggregating over an empty set often yields zero, which is misinterpreted as 'stable' or 'calm'; returning null explicitly signals a lack of data, preventing false confidence in system stability.

- scar: [Empty window reads as calm](../scars/scar-aggregate-empty-window.md)
- auto-check: none — asked interactively

### ver-sanitizer-matches-consumer

- [ ] Is the sanitization logic defined by the same criteria as the consumer's parser, rather than by a generic specification?

**Why:** Discrepancies between a sanitizer's definition of 'safe' and a consumer's definition of 'dangerous' create security holes; aligning them ensures that sanitized input is actually safe for the specific consumer.

- scar: [Sanitizer and consumer disagree](../scars/scar-sanitizer-consumer-mismatch.md)
- auto-check: none — asked interactively

### ver-fixture-independent-of-live

- [ ] Do test fixtures use isolated, static data rather than copying live, append-only files from the repository?

**Why:** Copying live files into fixtures creates tests that break when the live data grows; isolated fixtures ensure that tests remain stable and independent of the production state.

- scar: [Fixture breaks on live data](../scars/scar-fixture-live-file.md)
- auto-check: none — asked interactively

### ver-prompt-field-collision

- [ ] In prompts with structured outputs, are field names distinct from any attribute names printed in the context to prevent accidental copying?

**Why:** Models may copy values from context attributes that share names with output fields, leading to parse errors or incorrect data; distinct naming prevents this confusion.

- scar: [Prompt field collision](../scars/scar-prompt-field-collision.md)
- auto-check: none — asked interactively

### ver-hash-compare-single-extractor

- [ ] When comparing secrets or sensitive values by hash, is a single extraction and normalization function used for all sides of the comparison?

**Why:** Using different extraction methods for different sides of a comparison can lead to false negatives due to formatting differences; a single extractor ensures that the comparison is based on the actual values.

- scar: [Hash compare with different extractors](../scars/scar-hash-compare-extractor.md)
- auto-check: none — asked interactively

### ver-translation-verified-source

- [ ] Are tests that pin specific translations or readings verified against a published or authoritative source, rather than relying on an unverified agent's interpretation?

**Why:** Pinning an unverified reading in a test freezes a potential error; verifying against an authoritative source ensures that the test protects a correct interpretation.

- scar: [Test pins unverified translation](../scars/scar-translation-unverified.md)
- auto-check: none — asked interactively

## Stage 4 — controlled

### ver-verify-independent-of-write

- [ ] Does the verification step for a write operation (such as a secret or config deployment) use an independent method to locate the target, distinct from the logic used to perform the write?

**Why:** If verification uses the same resolution logic as the write, it will confirm the write's error rather than detecting it; independent verification ensures that the target was actually reached and modified as intended.

- scar: [Verification confirms write error](../scars/scar-verify-shares-write-resolution.md)
- auto-check: none — asked interactively

### ver-usage-not-presence

- [ ] Do acceptance tests verify that a shipped feature is actually used by a consumer, rather than just checking for its presence in the codebase?

**Why:** Features can be implemented and tested in isolation but never wired into the application flow; verifying usage ensures that the 'shipped' status reflects actual functionality rather than just code existence.

- scar: [Feature present but not invoked](../scars/scar-shipped-not-used.md)
- auto-check: none — asked interactively

### ver-judge-evidence-gap

- [ ] Before escalating a dispute between an automated judge and a human or LLM reviewer, is the evidence gap (missing data or unclear rules) identified and resolved?

**Why:** Disputes often stem from missing evidence or ambiguous rules rather than genuine disagreement; resolving the evidence gap first prevents unnecessary escalation and ensures that the dispute is about the actual issue.

- scar: [Dispute was a data gap](../scars/scar-judge-evidence-gap.md)
- auto-check: none — asked interactively
