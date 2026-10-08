import { scanLeaks } from './leaks.js';
import type { Loaded } from './load.js';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateCatalog(l: Loaded, probeIds: ReadonlySet<string>): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  const stdIds = new Set(l.catalog.standards.map((s) => s.id));

  l.catalog.classes.forEach((c, i) => {
    const stem = l.stems[i] ?? '?';
    if (!c || typeof c.id !== 'string') {
      errs.push(`checklists/${stem}.yaml: missing id`);
      return;
    }
    if (c.id !== stem) errs.push(`checklists/${stem}.yaml: id "${c.id}" must match file name`);
    if (!c.title?.trim() || !c.summary?.trim()) errs.push(`${c.id}: title and summary are required`);
    if (!Array.isArray(c.items) || c.items.length === 0) {
      errs.push(`${c.id}: no items`);
      return;
    }
    for (const it of c.items) {
      const where = `${c.id}/${it.id}`;
      if (typeof it.id !== 'string' || !KEBAB.test(it.id)) errs.push(`${where}: id must be kebab-case`);
      if (seen.has(it.id)) errs.push(`${where}: duplicate id`);
      seen.add(it.id);
      if (!Number.isInteger(it.stage) || it.stage < 1 || it.stage > 5) errs.push(`${where}: stage must be 1..5`);
      if (!it.check?.trim() || !it.why?.trim()) errs.push(`${where}: check and why are required`);
      if (!Array.isArray(it.sources) || it.sources.length === 0) {
        errs.push(`${where}: at least one source (scar or standard) is required`);
      } else {
        for (const raw of it.sources as unknown[]) {
          const s = (raw ?? {}) as Record<string, unknown>;
          const keys = Object.keys(s);
          if (keys.length !== 1 || (keys[0] !== 'scar' && keys[0] !== 'standard')) {
            errs.push(`${where}: a source is exactly one of {scar, standard}`);
            continue;
          }
          if (keys[0] === 'scar' && !(String(s.scar) in l.catalog.scars)) {
            errs.push(`${where}: scar "${String(s.scar)}" has no scars/${String(s.scar)}.md`);
          }
          if (keys[0] === 'standard' && !stdIds.has(String(s.standard))) {
            errs.push(`${where}: standard "${String(s.standard)}" is not in standards.yaml`);
          }
        }
      }
      if (it.probe !== undefined && !probeIds.has(it.probe)) errs.push(`${where}: probe "${it.probe}" is not registered`);
    }
  });

  for (const s of l.catalog.standards) {
    if (!s?.id || !s.name || !/^https:\/\//.test(s.url ?? '') || !s.checked) {
      errs.push(`standards.yaml: ${s?.id ?? '?'} needs id, name, https url and checked date`);
    }
  }

  const texts: Array<[string, string]> = [];
  for (const c of l.catalog.classes) {
    texts.push([`${c?.id} summary`, `${c?.title ?? ''}\n${c?.summary ?? ''}`]);
    for (const it of c?.items ?? []) texts.push([`${c.id}/${it.id}`, `${it.check ?? ''}\n${it.why ?? ''}`]);
  }
  for (const [id, t] of Object.entries(l.scarTexts)) texts.push([`scars/${id}.md`, t]);
  for (const [where, t] of texts) for (const f of scanLeaks(t)) errs.push(`${where}: possible leak (${f.kind}): ${f.match}`);

  return errs;
}
