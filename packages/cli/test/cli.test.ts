import dns from 'node:dns';
import { readdirSync, readFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Catalog } from '../src/catalog/types.js';
import { type IO, main, VERSION } from '../src/cli.js';
import { tmpTree } from './helpers.js';

const CAT: Catalog = {
  standards: [{ id: 's', name: 'S', url: 'https://example.org', version: '1', checked: '2026-10-07' }],
  scars: {},
  classes: [
    {
      id: 'secrets-guards',
      title: 'Secrets',
      summary: 's',
      items: [
        { id: 'sec-env-ignored', stage: 1, check: '.env is ignored', why: 'w', sources: [{ standard: 's' }], probe: 'secrets.gitignore_env' },
        { id: 'sec-ask', stage: 1, check: 'Do keys live outside the repo?', why: 'w', sources: [{ standard: 's' }] },
      ],
    },
    {
      id: 'gateway',
      title: 'Gateway',
      summary: 's',
      items: [{ id: 'gw-env-keys', stage: 1, check: 'keys from env', why: 'w', sources: [{ standard: 's' }], probe: 'gateway.litellm.env_keys' }],
    },
  ],
};

function fakeIO(cwd: string, over: Partial<IO> = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const io: IO = {
    stdout: (s) => out.push(s),
    stderr: (s) => err.push(s),
    isTTY: false,
    ask: vi.fn(async () => 's'),
    now: () => new Date('2026-10-07T12:00:00Z'),
    home: tmpTree({}),
    cwd,
    ...over,
  };
  return { io, out: () => out.join(''), err: () => err.join('') };
}

afterEach(() => vi.restoreAllMocks());

describe('arguments', () => {
  it('--version and --help exit 0', async () => {
    const f = fakeIO('.');
    expect(await main(['--version'], f.io, CAT)).toBe(0);
    expect(f.out()).toBe(`${VERSION}\n`);
    expect(await main(['--help'], fakeIO('.').io, CAT)).toBe(0);
  });
  it('unknown flag, unknown class and bad --min-stage exit 2', async () => {
    expect(await main(['--frobnicate'], fakeIO('.').io, CAT)).toBe(2);
    expect(await main(['--class', 'nope'], fakeIO('.').io, CAT)).toBe(2);
    for (const bad of ['gateway=9', 'gateway', 'nope=2', 'gateway=x']) {
      expect(await main(['--min-stage', bad], fakeIO('.').io, CAT)).toBe(2);
    }
  });
});

describe('scorecard', () => {
  it('--json has per-class stages and no overall number', async () => {
    const f = fakeIO(tmpTree({ '.gitignore': '.env\n' }));
    expect(await main(['--json'], f.io, CAT)).toBe(0);
    const r = JSON.parse(f.out()) as Record<string, unknown> & { classes: Array<Record<string, unknown>> };
    expect(r.classes.map((c) => c.classId)).toEqual(['secrets-guards', 'gateway']);
    for (const k of ['average', 'overall', 'total', 'score']) {
      expect(Object.keys(r)).not.toContain(k);
      for (const c of r.classes) expect(Object.keys(c)).not.toContain(k);
    }
  });

  it('without a terminal it never waits for answers and says so', async () => {
    const f = fakeIO(tmpTree({ '.gitignore': '.env\n' }), { isTTY: false });
    await main([], f.io, CAT);
    expect(f.io.ask).not.toHaveBeenCalled();
    expect(f.err()).toMatch(/not a terminal — running as --no-ask/);
  });

  it('interactive answers are saved with a date', async () => {
    const dir = tmpTree({ '.gitignore': '.env\n' });
    const f = fakeIO(dir, { isTTY: true, ask: vi.fn(async () => 'y') });
    await main(['--no-color'], f.io, CAT);
    expect(readFileSync(`${dir}/.checkup/answers.yaml`, 'utf8')).toMatch(/sec-ask:\s+answer: "?yes"?\s+date: "?2026-10-07"?/);
  });

  it('a literal key never reaches the output', async () => {
    const dir = tmpTree({ 'litellm.yaml': 'model_list:\n  - model_name: a\n    litellm_params:\n      model: x/y\n      api_key: sk-FAKEFAKEFAKEFAKE1234\n' });
    const f = fakeIO(dir);
    await main(['--json'], f.io, CAT);
    expect(f.out()).toContain('sk…(23 chars)');
    expect(f.out() + f.err()).not.toContain('FAKEFAKEFAKEFAKE1234');
  });
});

describe('--min-stage gate', () => {
  it('rc 1 when below because of a fail', async () => {
    expect(await main(['--no-ask', '--min-stage', 'secrets-guards=1'], fakeIO(tmpTree({ 'a.txt': '' })).io, CAT)).toBe(1);
  });
  it('rc 3 when below only because of unknowns', async () => {
    expect(await main(['--no-ask', '--min-stage', 'secrets-guards=1'], fakeIO(tmpTree({ '.gitignore': '.env\n' })).io, CAT)).toBe(3);
  });
  it('rc 0 when the verified stage is reached', async () => {
    const dir = tmpTree({ '.gitignore': '.env\n', '.checkup/answers.yaml': 'sec-ask: { answer: yes, date: "2026-10-01" }\n' });
    expect(await main(['--no-ask', '--min-stage', 'secrets-guards=1'], fakeIO(dir).io, CAT)).toBe(0);
  });
});

describe('zero network', () => {
  it('makes no network calls at runtime', async () => {
    const boom = () => { throw new Error('network call attempted'); };
    const spies = [
      vi.spyOn(globalThis, 'fetch').mockImplementation(boom),
      vi.spyOn(http, 'request').mockImplementation(boom),
      vi.spyOn(https, 'request').mockImplementation(boom),
      vi.spyOn(net, 'connect').mockImplementation(boom),
      vi.spyOn(dns, 'lookup').mockImplementation(boom),
    ];
    await main(['--json'], fakeIO(tmpTree({ '.gitignore': '.env\n' })).io, CAT);
    for (const s of spies) expect(s).not.toHaveBeenCalled();
  });

  it('no source file imports a network module or calls fetch', () => {
    const dir = new URL('../src/', import.meta.url);
    const files = readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith('.ts'));
    for (const f of files) {
      const src = readFileSync(new URL(f.replace(/\\/g, '/'), dir), 'utf8');
      expect(src, f).not.toMatch(/from ['"]node:(http|https|net|dns|tls|dgram)['"]|\bfetch\(/);
    }
  });
});
