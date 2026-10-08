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

## Stage 3 — reliable

### sec-guard-fail-policy

- [ ] Every guard declares its failure policy — fail closed on irreversible channels, fail open but loudly when advisory, never silently.

**Why:** Undeclared policies are accidents of each guard's first version, and "checked, clean" looks the same as "could not check".

- scar: [Seven guards, seven failure policies](../scars/guards-with-seven-policies.md)
- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- auto-check: none — asked interactively
