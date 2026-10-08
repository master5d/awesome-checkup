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

### int-source-authenticity

- [ ] Is the existence of the source artifact (repository, package, or post) verified against a live registry or remote endpoint before any content is analyzed?

**Why:** Candidates may be marketing funnels, clickbait splices, or non-existent repositories; verifying the artifact's existence prevents wasting effort on phantom tools.

- scar: [The Marketing Funnel Candidate](../scars/int-scar-funnel.md)
- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively

### int-media-preservation

- [ ] Are all media assets (screenshots, diagrams) from the source note converted and stored in a persistent, gitignored directory with a manifest before the verdict is issued?

**Why:** Source notes are often deleted after intake, causing the loss of visual evidence; preserving media ensures the rationale for the verdict remains auditable.

- scar: [The Vanishing Evidence](../scars/int-scar-media-loss.md)
- auto-check: none — asked interactively

### int-dedup-full-id

- [ ] Is the deduplication check performed using the full unique identifier (GUID or URL) of the source rather than just the title or name?

**Why:** Titles are frequently renamed or reused, leading to duplicate intake entries; using the full ID ensures accurate detection of previously processed candidates.

- scar: [The Duplicate Entry](../scars/int-scar-duplicate-id.md)
- auto-check: none — asked interactively

### int-declined-check

- [ ] Is the candidate checked against the journal of previously declined decisions before a new task is created?

**Why:** Re-evaluating rejected candidates without checking the history leads to redundant work; the journal provides the context for why a candidate was previously rejected and under what conditions it could be reconsidered.

- scar: [The Rejected Candidate Revisited](../scars/int-scar-declined-loop.md)
- auto-check: none — asked interactively

## Stage 3 — reliable

### int-community-health

- [ ] Is the community health of the candidate (median response time, release frequency, code of conduct) documented in the intake dossier?

**Why:** A dead or unresponsive community is a strong signal for 'pattern-only' or 'onboard-pending' verdicts, as it indicates a lack of future maintenance and support.

- scar: [The Silent Upstream](../scars/int-scar-dead-upstream.md)
- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively

### int-backlog-link

- [ ] Does the intake commit include a corresponding entry in the project backlog or code repository that references the intake number?

**Why:** Verdicts recorded only in the intake log without a backlog link are often forgotten and never implemented; linking them ensures the action is tracked and executed.

- scar: [The Forgotten Verdict](../scars/int-scar-lost-action.md)
- auto-check: none — asked interactively

### int-unique-numbering

- [ ] Is the intake number assigned from a central registry and cited in commits with a project qualifier (e.g., 'Project#123') rather than a bare number?

**Why:** Bare numbers are ambiguous across projects and can be duplicated; qualified numbers ensure that references in commits and logs point to the correct candidate.

- scar: [The Ambiguous Reference](../scars/int-scar-number-collision.md)
- auto-check: none — asked interactively

### int-pattern-extraction

- [ ] Are all products and tools mentioned in the source note, including alternatives and adjacent repositories, reviewed for extractable patterns even if the main candidate is rejected?

**Why:** Rejected candidates often contain useful patterns or ideas that can be applied to the lab; ignoring them misses opportunities for improvement.

- scar: [The Hidden Pattern](../scars/int-scar-rejected-pattern.md)
- auto-check: none — asked interactively

## Stage 4 — controlled

### int-role-mapping

- [ ] Is the 'people = agents' lens applied to candidates involving organizational roles, mapping human roles to agent or lab equivalents before issuing a verdict?

**Why:** Candidates focused on human workflows may appear inapplicable to a one-person lab; mapping roles reveals hidden applicability and potential patterns.

- scar: [The Inapplicable Workflow](../scars/int-scar-role-miss.md)
- standard: [AGENTS.md — open format for guiding coding agents](https://agents.md/)
- auto-check: none — asked interactively

### int-decentralized-check

- [ ] For candidates involving decentralized protocols, are the six specific questions (open protocol, signed builds, isolation, reciprocity, verifiable numbers, federation role) answered and recorded in the dossier?

**Why:** Decentralized tools have unique risks and requirements; a structured check ensures that critical aspects like data isolation and verifiability are not overlooked.

- standard: [NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)
- standard: [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
- auto-check: none — asked interactively
