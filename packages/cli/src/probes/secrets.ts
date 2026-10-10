import { isAbsolute, join, resolve } from 'node:path';
import { ciConfigRels, git, gitLsFiles, lastGitError, lineOf, lines, NO_ROOT, readText, rootIsDir, withoutCommentLines } from './fsutil.js';
import type { Probe, ProbeContext, ProbeResult } from './types.js';

const ENV_RULE = /^\/?(\*\*\/)?(\.env\*?|\*\.env|\.env\.\*)$/;
const ENV_NEGATION = /^!\/?(\*\*\/)?(\.env|\.env\*)$/;
const ENV_FILE = /(^|\/)\.env(\.[^/]+)?$/;
const TEMPLATE = /\.(example|sample|template|dist)$/;
const SCANNERS = /\b(gitleaks|trufflehog|detect-secrets|ggshield|secretlint)\b/i;
const HOOK_CONFIGS = ['.pre-commit-config.yaml', '.husky/pre-commit', 'lefthook.yml', 'lefthook.yaml', '.lefthook.yml'];
const PATH_TOKEN = /[\w.-]+(?:\/[\w.-]+)+/g;

/** .gitignore read by regex — only when git itself cannot answer */
function gitignoreByRegex(ctx: ProbeContext): ProbeResult {
  const text = readText(join(ctx.root, '.gitignore'));
  if (text === null) return { status: 'fail', reason: 'no .gitignore at the repository root' };
  const ls = lines(text).map((l) => l.trim());
  const rule = ls.findIndex((l) => ENV_RULE.test(l));
  if (rule < 0) return { status: 'fail', reason: '.gitignore has no rule for .env files' };
  const neg = ls.findIndex((l, j) => j > rule && ENV_NEGATION.test(l));
  if (neg >= 0) return { status: 'fail', evidence: `.gitignore:${neg + 1}`, reason: 'a later negation re-includes .env' };
  return { status: 'pass', evidence: `.gitignore:${rule + 1}` };
}

export const gitignoreEnv: Probe = {
  id: 'secrets.gitignore_env',
  run(ctx: ProbeContext): ProbeResult {
    if (!rootIsDir(ctx.root)) return NO_ROOT;
    const inside = git(ctx.root, ['rev-parse', '--is-inside-work-tree']);
    if (!inside || inside.status !== 0) return gitignoreByRegex(ctx);
    for (const name of ['.env', '.env.local']) {
      const r = git(ctx.root, ['check-ignore', '-v', '--no-index', name]);
      if (!r) return { status: 'unknown', reason: lastGitError ?? 'git did not answer' };
      if (r.status === 1) return { status: 'fail', reason: `git does not ignore ${name} here` };
      if (r.status !== 0) return { status: 'unknown', reason: `git check-ignore exited ${r.status}` };
    }
    const r = git(ctx.root, ['check-ignore', '-v', '--no-index', '.env']);
    return { status: 'pass', evidence: r?.stdout.split('\t')[0]?.trim() || 'git check-ignore' };
  },
};

export const noTrackedEnv: Probe = {
  id: 'secrets.no_tracked_env',
  run(ctx: ProbeContext): ProbeResult {
    const tracked = gitLsFiles(ctx.root);
    if (tracked === null) return { status: 'unknown', reason: lastGitError ?? 'not a git repository, or git is not available' };
    const bad = tracked.filter((f) => ENV_FILE.test(f) && !TEMPLATE.test(f));
    if (bad.length > 0) return { status: 'fail', evidence: bad.slice(0, 5).join(', '), reason: 'env file tracked by git' };
    return { status: 'pass', evidence: `${tracked.length} tracked files, none is an env file` };
  },
};

function scannerIn(text: string | null): number {
  return text === null ? -1 : text.search(SCANNERS);
}

/** the active pre-commit hook (core.hooksPath aware) and the repo files it calls, one level deep */
function hookFiles(root: string): Array<{ rel: string; text: string }> | null {
  const hooks = git(root, ['rev-parse', '--git-path', 'hooks']);
  const top = git(root, ['rev-parse', '--show-toplevel']);
  if (!hooks || hooks.status !== 0 || !top || top.status !== 0) return null;
  const hooksDir = hooks.stdout.trim();
  const topDir = top.stdout.trim();
  const hookPath = isAbsolute(hooksDir) ? join(hooksDir, 'pre-commit') : resolve(root, hooksDir, 'pre-commit');
  const hook = readText(hookPath);
  if (hook === null) return [];
  const out = [{ rel: 'pre-commit hook', text: hook }];
  for (const m of hook.matchAll(PATH_TOKEN)) {
    const t = readText(join(topDir, m[0]));
    if (t !== null) out.push({ rel: m[0], text: t });
    if (out.length > 10) break;
  }
  return out;
}

export const scannerWired: Probe = {
  id: 'secrets.scanner_wired',
  run(ctx: ProbeContext): ProbeResult {
    if (!rootIsDir(ctx.root)) return NO_ROOT;
    for (const rel of [...HOOK_CONFIGS, ...ciConfigRels(ctx.root)]) {
      const raw = readText(join(ctx.root, rel));
      const t = raw === null ? null : withoutCommentLines(raw);
      const i = scannerIn(t);
      if (t !== null && i >= 0) return { status: 'pass', evidence: `${rel}:${lineOf(t, i)}` };
    }
    const hooks = hookFiles(ctx.root);
    for (const h of hooks ?? []) {
      const i = scannerIn(h.text);
      if (i >= 0) return { status: 'pass', evidence: `${h.rel}:${lineOf(h.text, i)}` };
    }
    if (hooks && hooks.length > 0) {
      return { status: 'unknown', reason: 'a pre-commit hook exists but no known secret scanner was recognised in it' };
    }
    return { status: 'fail', reason: 'no secret scanner (gitleaks, trufflehog, detect-secrets, ggshield, secretlint) in pre-commit hooks or CI' };
  },
};
