import { describe, expect, it } from 'vitest';
import { agentsContract, doneGate } from '../src/probes/delegation.js';
import { ciRunsTests, noStatusEatingPipe } from '../src/probes/verification.js';
import { tmpTree } from './helpers.js';

describe('delegation.agents_contract', () => {
  it('passes with AGENTS.md', () => {
    expect(agentsContract.run({ root: tmpTree({ 'AGENTS.md': '# x\n' }), home: null })).toMatchObject({ status: 'pass', evidence: 'AGENTS.md' });
  });
  it('does not look in the home directory without --rig', () => {
    const home = tmpTree({ '.claude/CLAUDE.md': '# global\n' });
    expect(agentsContract.run({ root: tmpTree({ 'a.txt': '' }), home: null }).status).toBe('fail');
    expect(agentsContract.run({ root: tmpTree({ 'a.txt': '' }), home })).toMatchObject({ status: 'pass', evidence: '~/.claude/CLAUDE.md' });
  });
});

describe('delegation.done_gate', () => {
  it('passes with a verification heading', () => {
    const r = doneGate.run({ root: tmpTree({ 'AGENTS.md': '# Rules\n\n## Verification before done\n\nrun tests\n' }), home: null });
    expect(r).toMatchObject({ status: 'pass', evidence: 'AGENTS.md:3' });
  });
  it('fails when the contract has no such section', () => {
    expect(doneGate.run({ root: tmpTree({ 'CLAUDE.md': '# Rules\n\nbe nice\n' }), home: null }).status).toBe('fail');
  });
  it('is unknown when there is no contract to inspect', () => {
    expect(doneGate.run({ root: tmpTree({ 'a.txt': '' }), home: null }).status).toBe('unknown');
  });
});

describe('verification.ci_runs_tests', () => {
  it('passes when a workflow runs tests', () => {
    const r = ciRunsTests.run({ root: tmpTree({ '.github/workflows/ci.yml': 'jobs:\n  t:\n    steps:\n      - run: npm test\n' }), home: null });
    expect(r).toMatchObject({ status: 'pass', evidence: '.github/workflows/ci.yml:4' });
  });
  it('fails when CI exists but never runs tests', () => {
    expect(ciRunsTests.run({ root: tmpTree({ '.github/workflows/ci.yml': 'jobs:\n  t:\n    steps:\n      - run: npm run build\n' }), home: null }).status).toBe('fail');
  });
  it('fails without CI', () => {
    expect(ciRunsTests.run({ root: tmpTree({ 'a.txt': '' }), home: null }).status).toBe('fail');
  });
});

describe('verification.no_status_eating_pipe', () => {
  const run = (files: Record<string, string>) => noStatusEatingPipe.run({ root: tmpTree(files), home: null });
  it('fails on a package.json test script piped into tail', () => {
    const r = run({ 'package.json': JSON.stringify({ scripts: { test: 'vitest run | tail -5' } }) });
    expect(r).toMatchObject({ status: 'fail', evidence: 'package.json scripts.test' });
  });
  it('fails on a test command forced green with || true', () => {
    expect(run({ 'package.json': JSON.stringify({ scripts: { ci: 'npm test || true' } }) }).status).toBe('fail');
  });
  it('fails on a shell script without pipefail, passes with it', () => {
    expect(run({ 'scripts/t.sh': '#!/bin/sh\npytest | tee log.txt\n' })).toMatchObject({ status: 'fail', evidence: 'scripts/t.sh:2' });
    expect(run({ 'scripts/t.sh': '#!/bin/bash\nset -euo pipefail\npytest | tee log.txt\n' }).status).toBe('pass');
  });
  it('checks GitHub steps only when they run under sh', () => {
    const step = (shell: string) => `jobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - ${shell}run: npm test | tail -20\n`;
    expect(run({ '.github/workflows/ci.yml': step('shell: sh\n        ') }).status).toBe('fail');
    expect(run({ '.github/workflows/ci.yml': step('') }).status).toBe('pass');
  });
  it('is unknown when there is nothing to inspect', () => {
    expect(run({ 'README.md': '# x\n' }).status).toBe('unknown');
  });
});
