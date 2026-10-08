import type { ClassScore } from './score.js';

export function parseMinStage(spec: string, known: ReadonlySet<string>): [string, number] {
  const m = /^([a-z0-9-]+)=([1-5])$/.exec(spec);
  if (!m) throw new Error(`--min-stage expects <class>=<1..5>, got "${spec}"`);
  const cls = m[1] as string;
  if (!known.has(cls)) throw new Error(`--min-stage: unknown class "${cls}"`);
  return [cls, Number(m[2])];
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
