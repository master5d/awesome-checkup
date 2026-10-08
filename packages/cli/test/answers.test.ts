import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { type Answers, applyAnswers, isFresh, loadAnswers, saveAnswers } from '../src/answers.js';
import { askMissing } from '../src/ask.js';
import type { ClassDef } from '../src/catalog/types.js';
import type { ItemResult } from '../src/score.js';
import { tmpTree } from './helpers.js';

const NOW = new Date('2026-10-07T12:00:00Z');
const cls: ClassDef = {
  id: 'k',
  title: 't',
  summary: 's',
  items: [
    { id: 'q1', stage: 1, check: 'Do you do X?', why: 'w', sources: [{ standard: 's' }] },
    { id: 'q2', stage: 2, check: 'Do you do Y?', why: 'w', sources: [{ standard: 's' }] },
    { id: 'p1', stage: 1, check: 'c', why: 'w', sources: [{ standard: 's' }], probe: 'x.y' },
  ],
};
const unknownResults = () =>
  new Map<string, ItemResult>(cls.items.map((i) => [i.id, { itemId: i.id, classId: 'k', status: 'unknown', via: i.probe ? 'probe' : 'none' }]));

describe('loadAnswers', () => {
  it('missing file → no answers, no warning', () => {
    const warn = vi.fn();
    expect(loadAnswers(tmpTree({ 'a.txt': '' }), warn)).toEqual({});
    expect(warn).not.toHaveBeenCalled();
  });
  it('corrupt file → no answers and a loud warning', () => {
    const warn = vi.fn();
    expect(loadAnswers(tmpTree({ '.checkup/answers.yaml': 'q1: [unclosed\n' }), warn)).toEqual({});
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/unreadable/));
  });
  it('malformed entry is ignored with a warning, good entry kept', () => {
    const warn = vi.fn();
    const a = loadAnswers(tmpTree({ '.checkup/answers.yaml': 'q1: { answer: yes, date: "2026-10-01" }\nq2: { answer: maybe, date: "2026-10-01" }\n' }), warn);
    expect(a).toEqual({ q1: { answer: 'yes', date: '2026-10-01' } });
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/q2/));
  });
});

describe('isFresh', () => {
  it('90 days is fresh, 91 is stale, a future date is stale', () => {
    expect(isFresh({ answer: 'yes', date: '2026-07-09' }, NOW)).toBe(true);
    expect(isFresh({ answer: 'yes', date: '2026-07-08' }, NOW)).toBe(false);
    expect(isFresh({ answer: 'yes', date: '2026-10-08' }, NOW)).toBe(false);
  });
});

describe('applyAnswers', () => {
  it('fresh answers count, stale answers stay unknown, probed items ignore answers', () => {
    const r = unknownResults();
    const answers: Answers = {
      q1: { answer: 'yes', date: '2026-10-01' },
      q2: { answer: 'yes', date: '2026-01-01' },
      p1: { answer: 'yes', date: '2026-10-01' },
    };
    applyAnswers([cls], r, answers, NOW);
    expect(r.get('q1')).toMatchObject({ status: 'pass', via: 'answer' });
    expect(r.get('q2')).toMatchObject({ status: 'unknown' });
    expect(r.get('p1')).toMatchObject({ status: 'unknown', via: 'probe' });
  });
});

describe('askMissing', () => {
  it('y → pass, s → stays unknown and unsaved; nonsense three times → skip', async () => {
    const replies = ['y', 'what', 'huh', 'eh'];
    const io = { ask: vi.fn(async () => replies.shift() ?? 's'), stdout: vi.fn() };
    const r = unknownResults();
    const answers: Answers = {};
    expect(await askMissing([cls], r, answers, io, NOW)).toBe(true);
    expect(r.get('q1')).toMatchObject({ status: 'pass', via: 'answer' });
    expect(r.get('q2')).toMatchObject({ status: 'unknown' });
    expect(answers).toEqual({ q1: { answer: 'yes', date: '2026-10-07' } });
    expect(io.ask).toHaveBeenCalledTimes(4);
  });

  it('save → load round-trip', () => {
    const dir = tmpTree({ 'a.txt': '' });
    saveAnswers(dir, { q2: { answer: 'no', date: '2026-10-07' }, q1: { answer: 'yes', date: '2026-10-07' } });
    expect(existsSync(join(dir, '.checkup/answers.yaml'))).toBe(true);
    expect(loadAnswers(dir, vi.fn())).toEqual({ q1: { answer: 'yes', date: '2026-10-07' }, q2: { answer: 'no', date: '2026-10-07' } });
  });
});
