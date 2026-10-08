import { describe, expect, it } from 'vitest';
import type { ClassDef, Item, Stage } from '../src/catalog/types.js';
import { type ItemResult, type Status, scoreClass } from '../src/score.js';

const item = (id: string, stage: Stage): Item => ({ id, stage, check: 'c', why: 'w', sources: [{ standard: 's' }] });
const cls: ClassDef = { id: 'k', title: 't', summary: 's', items: [item('a', 1), item('b', 2), item('c', 3), item('d', 4)] };
const res = (m: Record<string, Status>) =>
  new Map<string, ItemResult>(Object.entries(m).map(([id, status]) => [id, { itemId: id, classId: 'k', status, via: 'probe' }]));

describe('scoreClass', () => {
  it('all pass → top stage verified', () => {
    expect(scoreClass(cls, res({ a: 'pass', b: 'pass', c: 'pass', d: 'pass' }))).toMatchObject({ verified: 4, ceiling: 4, unverified: 0, failedAt: null, maxStage: 4 });
  });

  it('a fail stops the climb below its stage', () => {
    expect(scoreClass(cls, res({ a: 'pass', b: 'pass', c: 'fail', d: 'pass' }))).toMatchObject({ verified: 2, ceiling: 2, failedAt: 3 });
  });

  it('unknown is never counted as pass', () => {
    expect(scoreClass(cls, res({ a: 'pass', b: 'unknown', c: 'pass', d: 'pass' }))).toMatchObject({ verified: 1, ceiling: 4, unverified: 1, failedAt: null });
  });

  it('fail above an unknown caps the ceiling', () => {
    expect(scoreClass(cls, res({ a: 'pass', b: 'unknown', c: 'pass', d: 'fail' }))).toMatchObject({ verified: 1, ceiling: 3, unverified: 1, failedAt: 4 });
  });

  it('a missing result counts as unknown, not as zero-and-forgotten', () => {
    expect(scoreClass(cls, new Map())).toMatchObject({ verified: 0, ceiling: 4, unverified: 4 });
  });

  it('an empty middle stage is skipped, not a wall', () => {
    const gappy: ClassDef = { ...cls, items: [item('a', 1), item('c', 3)] };
    expect(scoreClass(gappy, res({ a: 'pass', c: 'pass' }))).toMatchObject({ verified: 3, maxStage: 3 });
  });
});
