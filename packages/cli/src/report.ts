import pc from 'picocolors';
import { REPO_URL } from './catalog/render.js';
import type { ClassDef } from './catalog/types.js';
import { type ClassScore, type ItemResult, scoreClass } from './score.js';

export interface NextStep {
  classId: string;
  itemId: string;
  stage: number;
  status: 'fail' | 'unknown';
  check: string;
  /** why it is ✗ or ? — the probe's reason, or its (masked) evidence */
  why?: string;
  /** scar ids behind the item — the story of what went wrong without it */
  scars?: string[];
  /** title of the first scar, for the card */
  scarTitle?: string;
}

export interface Report {
  tool: 'awesome-checkup';
  version: string;
  classes: ClassScore[];
  next: NextStep[];
  items: ItemResult[];
}

export function buildReport(
  classes: ClassDef[],
  results: ReadonlyMap<string, ItemResult>,
  version: string,
  scarTitles: Readonly<Record<string, string>> = {},
): Report {
  const scores = classes.map((c) => scoreClass(c, results));
  const open: NextStep[] = [];
  for (const c of classes) {
    for (const it of c.items) {
      const r = results.get(it.id);
      const s = r?.status ?? 'unknown';
      if (s === 'pass') continue;
      const why = [r?.reason, r?.evidence].filter(Boolean).join(' — ') || undefined;
      const scars = it.sources.flatMap((src) => ('scar' in src ? [src.scar] : []));
      const title = scars[0] !== undefined ? scarTitles[scars[0]] : undefined;
      open.push({
        classId: c.id, itemId: it.id, stage: it.stage, status: s, check: it.check.trim(),
        ...(why ? { why } : {}), ...(scars.length ? { scars } : {}), ...(title ? { scarTitle: title } : {}),
      });
    }
  }
  open.sort((a, b) => (a.status === b.status ? a.stage - b.stage : a.status === 'fail' ? -1 : 1));
  const items = classes.flatMap((c) =>
    c.items.map((it) => results.get(it.id) ?? { itemId: it.id, classId: c.id, status: 'unknown' as const, via: 'none' as const }),
  );
  return { tool: 'awesome-checkup', version, classes: scores, next: open.slice(0, 3), items };
}

export function renderCard(r: Report, color: boolean): string {
  const c = pc.createColors(color);
  const out = [c.bold(`awesome-checkup ${r.version} — ${r.classes.length} classes`), ''];
  for (const s of r.classes) {
    let line = `${s.classId.padEnd(22)} stage ${s.verified} verified`;
    if (s.ceiling > s.verified) line += c.yellow(` · up to ${s.ceiling} if ${s.unverified} unverified item(s) pass`);
    if (s.failedAt !== null) line += c.red(` · blocked at stage ${s.failedAt}`);
    out.push(line);
  }
  if (r.next.length > 0) {
    out.push('', c.bold('next steps:'));
    for (const n of r.next) {
      const mark = n.status === 'fail' ? c.red('✗') : c.yellow('?');
      out.push(`  ${mark} [${n.classId}] ${n.itemId} (stage ${n.stage}) — ${n.check}`);
      if (n.why) out.push(`    why: ${n.why}`);
      const scar = n.scars?.[0];
      if (scar) out.push(`    scar: ${n.scarTitle ?? scar} — ${REPO_URL}/blob/main/scars/${scar}.md`);
      out.push(c.dim(`    ${REPO_URL}/blob/main/checklists/${n.classId}.md#${n.itemId}`));
    }
  }
  out.push('', c.dim('✓ verified · ✗ missing · ? not verified — unknown is never counted as passed, and never as zero'));
  return out.join('\n');
}
