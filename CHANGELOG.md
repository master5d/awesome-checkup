# Changelog

The CLI version follows the catalog: a release that adds items or scars bumps the minor version.

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
