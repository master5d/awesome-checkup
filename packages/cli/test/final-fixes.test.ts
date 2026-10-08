import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Catalog } from '../src/catalog/types.js';
import { type IO, main } from '../src/cli.js';
import { agentsContract, doneGate } from '../src/probes/delegation.js';
import { envKeys } from '../src/probes/gateway.js';
import { gitignoreEnv, scannerWired } from '../src/probes/secrets.js';
import { ciRunsTests, noStatusEatingPipe } from '../src/probes/verification.js';
import { PROBES } from '../src/probes/registry.js';
import { runProbes } from '../src/run.js';
import { gitInitAdd, tmpTree } from './helpers.js';

const ctx = (root: string) => ({ root, home: null });
const MISSING = join(tmpTree({}), 'does-not-exist');
const KEY = 'sk-proj-FAKEFAKEFAKEFAKE1234';

describe('F1 status-eating pipes (critical)', () => {
  const wf = (step: string, extra = '') => ({ '.github/workflows/ci.yml': `${extra}jobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - ${step}\n` });
  it('default shell on a Linux runner has no pipefail → a piped test is a fail', () => {
    expect(noStatusEatingPipe.run(ctx(tmpTree(wf('run: npm test | tail -20')))).status).toBe('fail');
  });
  it('explicit bash runs with pipefail → a piped test passes', () => {
    expect(noStatusEatingPipe.run(ctx(tmpTree(wf('shell: bash\n        run: npm test | tail -20')))).status).toBe('pass');
  });
  it('workflow-level defaults.run.shell: bash is honoured', () => {
    expect(noStatusEatingPipe.run(ctx(tmpTree(wf('run: npm test | tail -20', 'defaults:\n  run:\n    shell: bash\n')))).status).toBe('pass');
  });
  it('"|| true" hides the exit code under any shell', () => {
    expect(noStatusEatingPipe.run(ctx(tmpTree(wf('shell: bash\n        run: npm test || true')))).status).toBe('fail');
  });
  it('a shell script with pipefail still fails on "|| true"', () => {
    expect(noStatusEatingPipe.run(ctx(tmpTree({ 't.sh': '#!/bin/bash\nset -euo pipefail\nnpm test || true\n' }))).status).toBe('fail');
  });
  it('a file NAMED after a test tool is not a test command (log, config)', () => {
    const step = 'shell: bash\n        run: |\n          python scripts/run-all-tests.py | tee run-all-tests.log\n          rc=${PIPESTATUS[0]}\n          { grep FAIL run-all-tests.log || true; }';
    expect(noStatusEatingPipe.run(ctx(tmpTree(wf(step)))).status).toBe('pass');
    expect(noStatusEatingPipe.run(ctx(tmpTree(wf('run: cat vitest.config.ts | head -5')))).status).toBe('pass');
  });
  it('a comment that mentions pipefail does not count as setting it', () => {
    expect(noStatusEatingPipe.run(ctx(tmpTree({ 't.sh': '#!/bin/sh\n# TODO: add pipefail\npytest | tee log\n' }))).status).toBe('fail');
  });
});

describe('F2 file listing follows git, not the raw tree', () => {
  it('ignored stale copies do not produce a false fail', () => {
    const files = {
      '.gitignore': 'stale/\n',
      'config/litellm.yaml': 'model_list:\n  - model_name: a\n    litellm_params:\n      model: x/y\n      api_key: os.environ/K\n',
      'stale/litellm.yaml': `model_list:\n  - model_name: a\n    litellm_params:\n      model: x/y\n      api_key: ${KEY}\n`,
    };
    const root = tmpTree(files);
    gitInitAdd(root, ['.gitignore', 'config/litellm.yaml']);
    expect(envKeys.run(ctx(root)).status).toBe('pass');
  });
});

describe('F3 scanner wired through git hooks', () => {
  it('finds gitleaks behind a .git/hooks shim that calls a tracked script', () => {
    const root = tmpTree({ 'secops/hooks/pre-commit': '#!/bin/sh\ngitleaks protect --staged\n' });
    gitInitAdd(root, ['secops/hooks/pre-commit']);
    writeFileSync(join(root, '.git/hooks/pre-commit'), '#!/bin/sh\nexec "$(git rev-parse --show-toplevel)/secops/hooks/pre-commit" "$@"\n');
    expect(scannerWired.run(ctx(root)).status).toBe('pass');
  });
  it('a hook without a recognisable scanner is unknown, not fail', () => {
    const root = tmpTree({ 'a.txt': '' });
    gitInitAdd(root, ['a.txt']);
    writeFileSync(join(root, '.git/hooks/pre-commit'), '#!/bin/sh\n./run-my-checks\n');
    expect(scannerWired.run(ctx(root)).status).toBe('unknown');
  });
});

describe('F5/F6 gateway config parsing', () => {
  const cfg = (body: string) => tmpTree({ 'litellm.yaml': body });
  it('flow-mapped literal key fails', () => {
    expect(envKeys.run(ctx(cfg(`model_list:\n  - model_name: a\n    litellm_params: { model: x/y, api_key: ${KEY} }\n`))).status).toBe('fail');
  });
  it('quoted key name fails', () => {
    expect(envKeys.run(ctx(cfg(`model_list:\n  - model_name: a\n    litellm_params:\n      model: x/y\n      "api_key": "${KEY}"\n`))).status).toBe('fail');
  });
  it('a literal in environment_variables fails', () => {
    expect(envKeys.run(ctx(cfg(`model_list:\n  - model_name: a\n    litellm_params:\n      model: x/y\n      api_key: os.environ/OPENAI_API_KEY\nenvironment_variables:\n  OPENAI_API_KEY: ${KEY}\n`))).status).toBe('fail');
  });
  it('an unparseable config is unknown and says so loudly', () => {
    const r = envKeys.run(ctx(cfg('model_list:\n  - model_name: [unclosed\n')));
    expect(r.status).toBe('unknown');
    expect(r.warning).toMatch(/does not parse/);
    const warn = vi.fn();
    runProbes([{ id: 'gateway', title: 't', summary: 's', items: [{ id: 'g', stage: 1, check: 'c', why: 'w', sources: [{ standard: 's' }], probe: 'gateway.litellm.env_keys' }] }], ctx(cfg('model_list:\n  - model_name: [unclosed\n')), PROBES, warn);
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/does not parse/));
  });
});

describe('F9 done-gate vocabulary', () => {
  it('the agents.md "Testing instructions" section counts', () => {
    expect(doneGate.run(ctx(tmpTree({ 'AGENTS.md': '# Repo\n\n## Testing instructions\n\nnpm test\n' }))).status).toBe('pass');
  });
  it('an unrecognised contract is unknown, not fail', () => {
    expect(doneGate.run(ctx(tmpTree({ 'CLAUDE.md': '# Rules\n\nbe nice\n' }))).status).toBe('unknown');
  });
});

describe('F10 every probe can say "cannot tell"', () => {
  for (const p of [gitignoreEnv, scannerWired, agentsContract, ciRunsTests]) {
    it(`${p.id}: missing root → unknown`, () => expect(p.run(ctx(MISSING)).status).toBe('unknown'));
  }
});

describe('F11 .gitignore is judged by git', () => {
  it('a monorepo subfolder inherits the root rule', () => {
    const root = tmpTree({ '.gitignore': '.env*\n', 'packages/x/a.txt': '' });
    gitInitAdd(root, ['.gitignore', 'packages/x/a.txt']);
    expect(gitignoreEnv.run(ctx(join(root, 'packages/x'))).status).toBe('pass');
  });
  it('a valid pattern the regex did not know (*.env*) passes', () => {
    const root = tmpTree({ '.gitignore': '*.env*\n', 'a.txt': '' });
    gitInitAdd(root, ['.gitignore', 'a.txt']);
    expect(gitignoreEnv.run(ctx(root)).status).toBe('pass');
  });
});

const CAT: Catalog = {
  standards: [{ id: 's', name: 'S', url: 'https://example.org', version: '1', checked: '2026-10-07' }],
  scars: {},
  classes: [{ id: 'secrets-guards', title: 'Secrets', summary: 's', items: [
    { id: 'sec-env-ignored', stage: 1, check: '.env is ignored', why: 'w', sources: [{ standard: 's' }], probe: 'secrets.gitignore_env' },
    { id: 'sec-ask', stage: 1, check: 'Q?', why: 'w', sources: [{ standard: 's' }] },
  ] }],
};
function io(cwd: string, over: Partial<IO> = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const v: IO = { stdout: (s) => out.push(s), stderr: (s) => err.push(s), isTTY: false, color: false, ask: vi.fn(async () => 'y'), now: () => new Date('2026-10-07T12:00:00Z'), home: tmpTree({}), cwd, ...over };
  return { io: v, out: () => out.join(''), err: () => err.join('') };
}

describe('F4 the card shows why', () => {
  it('a fail in next steps carries its reason', async () => {
    const f = io(tmpTree({ 'a.txt': '' }));
    await main(['--no-ask'], f.io, CAT);
    expect(f.out()).toMatch(/\.gitignore/);
  });
});

describe('F7 exit codes mean what they say', () => {
  it('a missing --dir is a usage error (2), not a list of fails (1)', async () => {
    const f = io(tmpTree({}));
    expect(await main(['--dir', 'nope', '--min-stage', 'secrets-guards=1'], f.io, CAT)).toBe(2);
    expect(f.err()).toMatch(/not a directory/);
  });
  it('a failed answers save warns and still prints the card', async () => {
    const dir = tmpTree({ '.gitignore': '.env\n' });
    writeFileSync(join(dir, '.checkup'), 'i am a file');
    const f = io(dir, { isTTY: true });
    expect(await main([], f.io, CAT)).toBe(0);
    expect(f.err()).toMatch(/could not save answers/);
    expect(f.out()).toMatch(/secrets-guards/);
  });
});

describe('F8 colour follows stdout, not stdin', () => {
  it('no ANSI codes when stdout is not a colour terminal', async () => {
    const dir = tmpTree({ '.gitignore': '.env\n' });
    mkdirSync(join(dir, 'x'));
    const f = io(dir, { isTTY: true, color: false, ask: vi.fn(async () => 's') });
    await main([], f.io, CAT);
    expect(f.out()).not.toMatch(/\u001b\[/);
  });
});
