import type { ClassScore } from './score.js';

/**
 * known: every class in the catalog; selected: the classes this run checks, with their highest stage.
 * A class outside --class, or a stage above the class's highest one, can never be met — that is a usage
 * error (rc 2), not an eternal "unverified" (rc 3) (plan 1 review).
 */
export function parseMinStage(spec: string, known: ReadonlySet<string>, selected?: ReadonlyMap<string, number>): [string, number] {
  const m = /^([a-z0-9-]+)=([1-5])$/.exec(spec);
  if (!m) throw new Error(`--min-stage expects <class>=<1..5>, got "${spec}"`);
  const cls = m[1] as string;
  const n = Number(m[2]);
  if (!known.has(cls)) throw new Error(`--min-stage: unknown class "${cls}"`);
  if (selected && !selected.has(cls)) throw new Error(`--min-stage: class "${cls}" is not selected by --class`);
  const max = selected?.get(cls);
  if (max !== undefined && n > max) {
    throw new Error(`--min-stage: ${cls} has no items above stage ${max}, so ${cls}=${n} can never be met`);
  }
  return [cls, n];
}

export function gateCode(scores: ClassScore[], mins: ReadonlyMap<string, number>): 0 | 1 | 3 {
  let code: 0 | 1 | 3 = 0;
  for (const [cls, n] of mins) {
    const s = scores.find((x) => x.classId === cls);
    if (!s || s.verified >= n) continue;
    if (s.failedAt !== null && s.failedAt <= n) return 1;
    code = 3;
  }
  return code;
}
