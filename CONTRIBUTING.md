# Contributing

Each checklist item needs a source. Pick one or both:

- **scar** — a short, anonymised story of something that went wrong (`scars/<id>.md`, 3–6 sentences: what happened → how it was noticed → what the rule is now). No names, hosts, paths or internal project names.
- **standard** — an entry in `standards.yaml` (id, name, https URL, version, the date you opened the URL).

An item without a source is an opinion, and CI will reject it.

## Adding an item

1. Edit `checklists/<class>.yaml` — never the generated `.md` files.
2. Fields: `id` (kebab-case, unique), `stage` (1–5), `check` (one sentence a reader can answer yes/no), `why` (one or two sentences), `sources`, optional `probe`.
3. Run `npm run render` and commit the yaml together with the regenerated files.
4. `npm test` must pass. A new auto-check needs three fixtures: done → ✓, broken → ✗, cannot tell → ?.

## Stages

1 tried · 2 works · 3 reliable · 4 controlled · 5 exemplary. Put an item at the lowest stage where a careful practitioner would already expect it.
