import { describe, expect, it } from 'vitest';
import { gitignoreEnv, noTrackedEnv, scannerWired } from '../src/probes/secrets.js';
import { gitInitAdd, tmpTree } from './helpers.js';

const ctx = (root: string) => ({ root, home: null });

describe('secrets.gitignore_env', () => {
  it('passes with a .env rule', () => {
    expect(gitignoreEnv.run(ctx(tmpTree({ '.gitignore': 'node_modules/\n.env*\n' })))).toMatchObject({ status: 'pass', evidence: '.gitignore:2' });
  });
  it('passes when only the example file is re-included', () => {
    expect(gitignoreEnv.run(ctx(tmpTree({ '.gitignore': '.env*\n!.env.example\n' }))).status).toBe('pass');
  });
  it('fails without .gitignore', () => {
    expect(gitignoreEnv.run(ctx(tmpTree({ 'a.txt': '' }))).status).toBe('fail');
  });
  it('fails without a rule for .env', () => {
    expect(gitignoreEnv.run(ctx(tmpTree({ '.gitignore': 'dist/\n' }))).status).toBe('fail');
  });
  it('fails when a later negation re-includes .env', () => {
    expect(gitignoreEnv.run(ctx(tmpTree({ '.gitignore': '.env\n!.env\n' })))).toMatchObject({ status: 'fail', evidence: '.gitignore:2' });
  });
});

describe('secrets.no_tracked_env', () => {
  it('is unknown outside a git repository — not a fail', () => {
    expect(noTrackedEnv.run(ctx(tmpTree({ '.env': 'X=1\n' }))).status).toBe('unknown');
  });
  it('fails when a .env file is tracked', () => {
    const root = tmpTree({ '.env': 'X=1\n', 'a.txt': '' });
    gitInitAdd(root, ['.env', 'a.txt']);
    expect(noTrackedEnv.run(ctx(root))).toMatchObject({ status: 'fail', evidence: '.env' });
  });
  it('passes when only a template is tracked', () => {
    const root = tmpTree({ '.env.example': 'X=\n', 'a.txt': '' });
    gitInitAdd(root, ['.env.example', 'a.txt']);
    expect(noTrackedEnv.run(ctx(root)).status).toBe('pass');
  });
});

describe('secrets.scanner_wired', () => {
  it('passes with gitleaks in pre-commit', () => {
    const r = scannerWired.run(ctx(tmpTree({ '.pre-commit-config.yaml': 'repos:\n  - repo: x\n    hooks:\n      - id: gitleaks\n' })));
    expect(r).toMatchObject({ status: 'pass', evidence: '.pre-commit-config.yaml:4' });
  });
  it('passes with a scanner step in a GitHub workflow', () => {
    const r = scannerWired.run(ctx(tmpTree({ '.github/workflows/ci.yml': 'jobs:\n  s:\n    steps:\n      - uses: gitleaks/gitleaks-action@v2\n' })));
    expect(r.status).toBe('pass');
  });
  it('fails with no scanner anywhere', () => {
    expect(scannerWired.run(ctx(tmpTree({ '.github/workflows/ci.yml': 'jobs: {}\n' }))).status).toBe('fail');
  });
});
