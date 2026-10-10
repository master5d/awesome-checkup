# Changelog

The CLI version follows the catalog: a release that adds items or scars bumps the minor version.

## 0.2.1 — 2026-10-10

0.2.0 was not published to npm on its own: 0.2.1 is the first npm release after 0.1.0 and carries everything listed
under 0.2.0 as well.

- Gateway: an empty `model_list` is "not verified", not a pass; stub keys such as `sk-no-key-required` are no longer
  reported as literal secrets.
- CI detection reads Bitbucket, Travis, Drone, Woodpecker, Buildkite, AppVeyor, Forgejo and Gitea configs, and a
  commented-out test step no longer counts as "CI runs tests".
- `.claude/CLAUDE.md` in the repository counts as an agent contract.
- `--min-stage` naming a class outside `--class`, or a stage above the class's highest item, is a usage error (exit 2)
  instead of an endless "unverified" (exit 3).
- When git itself fails (output too large, timeout, not installed) the card says so instead of a bare `?`.
- The card links the scar behind each next step.

## 0.2.0 — 2026-10-08

- **Secrets & guards** grows from 4 to 16 items. The 12 new ones cover keeping a secret out of tool output, HTTP
  client logs, diagnostic `--json` dumps, error messages and UI snapshots; masking every character instead of
  "long words only"; checking that a key has a value, not just a name; making sure every consumer has the new key
  after a rotation; tests that never reach live credentials; narrowly scoped inference tokens; and checking the key
  first when an error looks like a rate limit or an outage.
- 12 new scars behind those items (66 in total).
- The npm package now carries the README and both licenses (MIT for the code, CC BY 4.0 for the bundled catalog);
  0.1.0 shipped `dist/bin.js` and `package.json` only. CI fails if the tarball loses any of them.

## 0.1.0 — 2026-10-08

- First release: six classes (LLM gateway, agent delegation, agent memory, verification honesty, tool intake,
  secrets & guards), stages 1–5 per item, auto-checks for gateway configs, secrets, delegation and CI, and an
  interactive questionnaire for everything else.
