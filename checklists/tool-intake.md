<!-- generated from checklists/tool-intake.yaml by scripts/render.ts — edit the yaml, not this file -->
# Tool intake

How an external repo, post or tool gets into your stack: license first, claims checked against code, one written verdict.

Stages: 1 tried · 2 works · 3 reliable · 4 controlled · 5 exemplary. Run `npx awesome-checkup` to score your setup.

## Stage 1 — tried

### int-license-first

- [ ] A candidate's license is checked before its code is read or copied.

**Why:** Code you have read under a license you cannot ship is code you now have to forget.

- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively

## Stage 2 — works

### int-claims-vs-code

- [ ] Before adoption, 2–3 concrete claims of the README or post are checked against the repository — a benchmark number, an architecture claim, the install command.

**Why:** The README is marketing until the code agrees with it.

- scar: [The README's install command pointed to a repository that did not exist](../scars/readme-install-points-nowhere.md)
- auto-check: none — asked interactively
