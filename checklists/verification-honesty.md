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

## Stage 3 — reliable

### ver-unknown-is-not-green

- [ ] Your test runner reports "not run / failed to collect" separately from "passed", and a suite that did not run never counts as green.

**Why:** Absence of failures is not presence of passes.

- scar: [FAIL printed, exit code 0](../scars/status-eaten-by-pipe.md)
- standard: [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- auto-check: none — asked interactively
