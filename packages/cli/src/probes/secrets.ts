import { join } from 'node:path';
import { gitLsFiles, lineOf, lines, readText, walk } from './fsutil.js';
import type { Probe, ProbeContext, ProbeResult } from './types.js';

const ENV_RULE = /^\/?(\*\*\/)?(\.env\*?|\*\.env|\.env\.\*)$/;
const ENV_NEGATION = /^!\/?(\*\*\/)?(\.env|\.env\*)$/;
const ENV_FILE = /(^|\/)\.env(\.[^/]+)?$/;
const TEMPLATE = /\.(example|sample|template|dist)$/;
const SCANNERS = /\b(gitleaks|trufflehog|detect-secrets|ggshield|secretlint)\b/i;

export const gitignoreEnv: Probe = {
  id: 'secrets.gitignore_env',
  run(ctx: ProbeContext): ProbeResult {
    const text = readText(join(ctx.root, '.gitignore'));
    if (text === null) return { status: 'fail', reason: 'no .gitignore at the repository root' };
    const ls = lines(text).map((l) => l.trim());
    const rule = ls.findIndex((l) => ENV_RULE.test(l));
    if (rule < 0) return { status: 'fail', reason: '.gitignore has no rule for .env files' };
    const neg = ls.findIndex((l, j) => j > rule && ENV_NEGATION.test(l));
    if (neg >= 0) return { status: 'fail', evidence: `.gitignore:${neg + 1}`, reason: 'a later negation re-includes .env' };
    return { status: 'pass', evidence: `.gitignore:${rule + 1}` };
  },
};

export const noTrackedEnv: Probe = {
  id: 'secrets.no_tracked_env',
  run(ctx: ProbeContext): ProbeResult {
    const tracked = gitLsFiles(ctx.root);
    if (tracked === null) return { status: 'unknown', reason: 'not a git repository, or git is not available' };
    const bad = tracked.filter((f) => ENV_FILE.test(f) && !TEMPLATE.test(f));
    if (bad.length > 0) return { status: 'fail', evidence: bad.slice(0, 5).join(', '), reason: 'env file tracked by git' };
    return { status: 'pass', evidence: `${tracked.length} tracked files, none is an env file` };
  },
};

export const scannerWired: Probe = {
  id: 'secrets.scanner_wired',
  run(ctx: ProbeContext): ProbeResult {
    const fixed = ['.pre-commit-config.yaml', '.husky/pre-commit', 'lefthook.yml', '.gitlab-ci.yml'];
    const workflows = walk(join(ctx.root, '.github', 'workflows'), (r) => /\.ya?ml$/.test(r)).files.map((r) => `.github/workflows/${r}`);
    for (const rel of [...fixed, ...workflows]) {
      const t = readText(join(ctx.root, rel));
      if (t === null) continue;
      const i = t.search(SCANNERS);
      if (i >= 0) return { status: 'pass', evidence: `${rel}:${lineOf(t, i)}` };
    }
    return { status: 'fail', reason: 'no secret scanner (gitleaks, trufflehog, detect-secrets, ggshield, secretlint) in pre-commit or CI' };
  },
};
