import { describe, expect, it, vi } from 'vitest';
import type { ClassDef } from '../src/catalog/types.js';
import { gitLsFiles, lineOf, mask, walk } from '../src/probes/fsutil.js';
import type { Probe } from '../src/probes/types.js';
import { runProbes } from '../src/run.js';
import { gitInitAdd, tmpTree } from './helpers.js';

describe('walk', () => {
  it('skips heavy and vendored directories and returns sorted forward-slash paths', () => {
    const root = tmpTree({ 'b/x.yaml': '', 'a/y.yaml': '', 'node_modules/p/z.yaml': '', '.git/h.yaml': '', 'dist/d.yaml': '' });
    expect(walk(root, (r) => r.endsWith('.yaml'))).toEqual({ files: ['a/y.yaml', 'b/x.yaml'], truncated: false });
  });

  it('reports truncation instead of pretending the tree was fully read', () => {
    const root = tmpTree({ 'a.txt': '', 'b.txt': '', 'c.txt': '' });
    expect(walk(root, () => true, 2).truncated).toBe(true);
  });
});

describe('text helpers', () => {
  it('lineOf counts lines the same for LF and CRLF', () => {
    const lf = 'a\nb\nkey: x\n';
    const crlf = lf.replace(/\n/g, '\r\n');
    expect(lineOf(lf, lf.indexOf('key'))).toBe(3);
    expect(lineOf(crlf, crlf.indexOf('key'))).toBe(3);
  });

  it('mask never shows the tail of a secret', () => {
    const m = mask('sk-FAKE1234567890');
    expect(m).not.toContain('FAKE1234567890');
    expect(m).toContain('(17 chars)');
  });
});

describe('gitLsFiles', () => {
  it('is null outside a git repository', () => {
    expect(gitLsFiles(tmpTree({ 'a.txt': 'x' }))).toBeNull();
  });
  it('lists staged files', () => {
    const root = tmpTree({ 'a.txt': 'x', 'b.txt': 'y' });
    gitInitAdd(root, ['a.txt']);
    expect(gitLsFiles(root)).toEqual(['a.txt']);
  });
});

describe('runProbes', () => {
  const cls: ClassDef = {
    id: 'k',
    title: 't',
    summary: 's',
    items: [
      { id: 'p1', stage: 1, check: 'c', why: 'w', sources: [{ standard: 's' }], probe: 'x.boom' },
      { id: 'p2', stage: 1, check: 'c', why: 'w', sources: [{ standard: 's' }], probe: 'x.ok' },
      { id: 'p3', stage: 2, check: 'c', why: 'w', sources: [{ standard: 's' }], probe: 'x.ok' },
      { id: 'q1', stage: 2, check: 'c', why: 'w', sources: [{ standard: 's' }] },
    ],
  };
  it('crash → unknown with a loud warning; no probe → unknown via none; shared probe runs once', () => {
    const okRun = vi.fn(() => ({ status: 'pass' as const, evidence: 'e' }));
    const reg = new Map<string, Probe>([
      ['x.boom', { id: 'x.boom', run: () => { throw new Error('kaput'); } }],
      ['x.ok', { id: 'x.ok', run: okRun }],
    ]);
    const warn = vi.fn();
    const r = runProbes([cls], { root: '.', home: null }, reg, warn);
    expect(r.get('p1')).toMatchObject({ status: 'unknown', via: 'probe' });
    expect(r.get('p1')?.reason).toMatch(/probe crashed: kaput/);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/probe x\.boom crashed — kaput/));
    expect(r.get('p2')).toMatchObject({ status: 'pass', via: 'probe' });
    expect(r.get('q1')).toMatchObject({ status: 'unknown', via: 'none' });
    expect(okRun).toHaveBeenCalledTimes(1);
  });
});
