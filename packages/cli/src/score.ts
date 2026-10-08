import type { ClassDef } from './catalog/types.js';

export type Status = 'pass' | 'fail' | 'unknown';

export interface ItemResult {
  itemId: string;
  classId: string;
  status: Status;
  via: 'probe' | 'answer' | 'none';
  evidence?: string;
  reason?: string;
}

export interface ClassScore {
  classId: string;
  /** highest stage whose items (and all below) are verified pass */
  verified: number;
  /** highest stage reachable if every unknown turned out pass */
  ceiling: number;
  /** unknown items at stages ≤ ceiling */
  unverified: number;
  /** lowest stage with a fail, or null */
  failedAt: number | null;
  maxStage: number;
}

export function scoreClass(cls: ClassDef, results: ReadonlyMap<string, ItemResult>): ClassScore {
  const st = (id: string): Status => results.get(id)?.status ?? 'unknown';
  const maxStage = Math.max(0, ...cls.items.map((i) => i.stage));
  const fails = cls.items.filter((i) => st(i.id) === 'fail').map((i) => i.stage);
  const failedAt = fails.length > 0 ? Math.min(...fails) : null;
  const ceiling = failedAt === null ? maxStage : failedAt - 1;

  // A stage counts as verified only when it has items and all of them pass; empty stages are
  // skipped, never credited on their own — no evidence, no stage.
  let verified = 0;
  for (let n = 1; n <= maxStage; n++) {
    const at = cls.items.filter((i) => i.stage === n);
    if (at.length === 0) continue;
    if (at.every((i) => st(i.id) === 'pass')) verified = n;
    else break;
  }
  const unverified = cls.items.filter((i) => i.stage <= ceiling && st(i.id) === 'unknown').length;
  return { classId: cls.id, verified, ceiling, unverified, failedAt, maxStage };
}
