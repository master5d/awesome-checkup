// Ten deferred minors of the plan-1 final review — one block per finding.
import { describe, expect, it, vi } from 'vitest';
import type { Catalog } from '../src/catalog/types.js';
import { type IO, main } from '../src/cli.js';
import { git, gitErrorText } from '../src/probes/fsutil.js';
import { agentsContract } from '../src/probes/delegation.js';
import { dataPolicy, envKeys, looksLikeSecret, noFallbackIntoPublic } from '../src/probes/gateway.js';
import { noTrackedEnv } from '../src/probes/secrets.js';
import { ciRunsTests } from '../src/probes/verification.js';
import { buildReport, renderCard } from '../src/report.js';
import { tmpTree } from './helpers.js';

const ctx = (root: string, extra: Record<string, unknown> = {}) => ({ root, home: null, ...extra });

const CAT: Catalog = {
  standards: [{ id: 's', name: 'S', url: 'https://example.org', version: '1', checked: '2026-10-07' }],
  scars: { 'key-in-git': 'A key was committed' },
  classes: [
    {
      id: 'gateway',
      title: 'Gateway',
      summary: 's',
      items: [
        { id: 'gw-a', stage: 1, check: 'a', why: 'w', sources: [{ scar: 'key-in-git' }, { standard: 's' }] },
        { id: 'gw-b', stage: 2, check: 'b', why: 'w', sources: [{ standard: 's' }] },
      ],
    },
    { id: 'agent-memory', title: 'Memory', summary: 's', items: [{ id: 'mem-a', stage: 1, check: 'm', why: 'w', sources: [{ standard: 's' }] }] },
  ],
};

function fakeIO(cwd: string) {
  const out: string[] = [];
  const err: string[] = [];
  const io: IO = {
    stdout: (s) => out.push(s),
    stderr: (s) => err.push(s),
    isTTY: false,
    color: false,
    ask: vi.fn(async () => 's'),
    now: () => new Date('2026-10-08T12:00:00Z'),
    home: tmpTree({}),
    cwd,
  };
  return { io, out: () => out.join(''), err: () => err.join('') };
}

describe('1. an empty model_list is not a pass', () => {
  const root = tmpTree({ 'litellm-config.yaml': 'model_list: []\n' });
  it('data policy and fallback probes say "not verified"', () => {
    for (const p of [dataPolicy, noFallbackIntoPublic]) {
      const r = p.run(ctx(root));
      expect(r.status).toBe('unknown');
      expect(r.reason).toMatch(/empty/);
    }
  });
});

describe('2. a git failure names its cause instead of a bare "?"', () => {
  it('records the error code of a failed git call', () => {
    expect(git(tmpTree({}), ['--definitely-not-a-flag'])?.status).not.toBe(0);
    expect(gitErrorText({ code: 'ENOBUFS' })).toMatch(/ENOBUFS.*output/);
    expect(gitErrorText({ code: 'ETIMEDOUT' })).toMatch(/timed out/);
    expect(gitErrorText({ code: 'ENOENT' })).toMatch(/not installed|not found/);
  });
  it('no_tracked_env outside git keeps the plain reason', () => {
    expect(noTrackedEnv.run(ctx(tmpTree({}))).reason).toMatch(/not a git repository/);
  });
});

describe('3/4. --min-stage that can never be met, or names an unselected class, is a usage error', () => {
  it('above the class maximum → rc 2 with the maximum named', async () => {
    const f = fakeIO(tmpTree({}));
    expect(await main(['--no-ask', '--min-stage', 'gateway=5'], f.io, CAT)).toBe(2);
    expect(f.err()).toMatch(/gateway.*stage 2/);
  });
  it('a class outside --class → rc 2 that says so', async () => {
    const f = fakeIO(tmpTree({}));
    expect(await main(['--no-ask', '--class', 'gateway', '--min-stage', 'agent-memory=1'], f.io, CAT)).toBe(2);
    expect(f.err()).toMatch(/not selected/);
  });
  it('a truly unknown class is still "unknown class"', async () => {
    const f = fakeIO(tmpTree({}));
    expect(await main(['--no-ask', '--min-stage', 'nope=1'], f.io, CAT)).toBe(2);
    expect(f.err()).toMatch(/unknown class/);
  });
});

describe('5/6. CI detection', () => {
  it('a commented-out test step is not "CI runs tests"', () => {
    const root = tmpTree({ '.github/workflows/ci.yml': 'jobs:\n  t:\n    steps:\n      # - run: npm test\n      - run: npm run build\n' });
    expect(ciRunsTests.run(ctx(root)).status).toBe('fail');
  });
  it.each([
    ['bitbucket-pipelines.yml', 'pipelines:\n  default:\n    - step:\n        script:\n          - npm test\n'],
    ['.travis.yml', 'script: pytest\n'],
    ['.drone.yml', 'steps:\n  - commands: [cargo test]\n'],
    ['.woodpecker.yml', 'steps:\n  t:\n    commands: [go test ./...]\n'],
    ['.buildkite/pipeline.yml', 'steps:\n  - command: npm test\n'],
    ['appveyor.yml', 'test_script: dotnet test\n'],
    ['.forgejo/workflows/ci.yml', 'jobs:\n  t:\n    steps:\n      - run: npm test\n'],
    ['.gitea/workflows/ci.yaml', 'jobs:\n  t:\n    steps:\n      - run: pytest\n'],
  ])('%s is recognised', (rel, body) => {
    expect(ciRunsTests.run(ctx(tmpTree({ [rel]: body }))).status).toBe('pass');
  });
});

describe('7. a placeholder key is not a literal secret', () => {
  it.each(['sk-no-key-required', 'sk-dummy', 'sk-placeholder', 'not-needed', 'sk-xxxxxxxxxxxxxxxx', 'changeme'])('%s', (v) => {
    expect(looksLikeSecret(v)).toBe(false);
  });
  it('a real-looking key still is', () => {
    expect(looksLikeSecret('sk-proj-4f9aQz7LmN2xR8tYv1bC3dE5gH6jK0pS')).toBe(true);
  });
  it('env_keys passes a config whose only key is a placeholder', () => {
    const root = tmpTree({ 'config.yaml': 'model_list:\n  - model_name: local\n    litellm_params:\n      model: openai/x\n      api_key: sk-no-key-required\n' });
    expect(envKeys.run(ctx(root)).status).toBe('pass');
  });
});

describe('8. .claude/CLAUDE.md in the repo is an agent contract', () => {
  it('is recognised without --rig', () => {
    const r = agentsContract.run(ctx(tmpTree({ '.claude/CLAUDE.md': '# Rules\n' })));
    expect(r.status).toBe('pass');
    expect(r.evidence).toContain('.claude/CLAUDE.md');
  });
});

describe('9. the card links the scar behind a missing item', () => {
  it('shows the scar title and its page', () => {
    const results = new Map([['gw-a', { itemId: 'gw-a', classId: 'gateway', status: 'fail' as const, via: 'answer' as const }]]);
    const report = buildReport(CAT.classes.slice(0, 1), results, '0.0.0', CAT.scars);
    expect(report.next[0]?.scars).toEqual(['key-in-git']);
    const card = renderCard(report, false);
    expect(card).toContain('A key was committed');
    expect(card).toContain('/blob/main/scars/key-in-git.md');
  });
});

describe('10. a truncated walk never lets a gateway probe pass', () => {
  const root = tmpTree({
    'a.txt': 'x', 'b.txt': 'x', 'c.txt': 'x',
    'zz/litellm-config.yaml': 'model_list:\n  - model_name: p\n    litellm_params: {model: x, api_key: os.environ/K}\n    model_info: {data_policy: {trains: "no"}}\n',
  });
  it.each([envKeys, dataPolicy, noFallbackIntoPublic])('$id', (p) => {
    const full = p.run(ctx(root));
    expect(full.status).toBe('pass');
    const cut = p.run(ctx(root, { maxFiles: 2 }));
    expect(cut.status).toBe('unknown');
    expect(cut.reason).toMatch(/too large/);
  });
});
