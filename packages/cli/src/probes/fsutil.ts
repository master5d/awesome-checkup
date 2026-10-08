import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'vendor', '.venv', 'venv', '__pycache__', '.next', 'target', '.checkup',
]);
export const MAX_FILES = 20_000;
export const MAX_BYTES = 2 * 1024 * 1024;
export const TRUNCATED_REASON = `tree too large — only the first ${MAX_FILES} files were scanned`;

export interface WalkResult {
  files: string[];
  truncated: boolean;
}

export function rootIsDir(root: string): boolean {
  try {
    return statSync(root).isDirectory();
  } catch {
    return false;
  }
}

/** single-file CI configs, and folders of workflow files — shared by every probe that reads CI (plan 1 review: the list was narrow) */
export const CI_FILES = [
  '.gitlab-ci.yml', '.circleci/config.yml', 'azure-pipelines.yml', 'Jenkinsfile', 'bitbucket-pipelines.yml',
  '.travis.yml', '.drone.yml', '.woodpecker.yml', '.buildkite/pipeline.yml', 'appveyor.yml', '.appveyor.yml',
];
export const CI_DIRS = ['.github/workflows', '.forgejo/workflows', '.gitea/workflows', '.woodpecker'];

/** every CI config under root: the single files plus *.yml|*.yaml in the workflow folders */
export function ciConfigRels(root: string): string[] {
  const inDirs = CI_DIRS.flatMap((d) => walk(join(root, d), (r) => /\.ya?ml$/.test(r)).files.map((r) => `${d}/${r}`));
  return [...inDirs, ...CI_FILES];
}

/** text with comment-only lines blanked (YAML/shell "#", Groovy "//"), line numbers preserved */
export function withoutCommentLines(text: string): string {
  return text.split('\n').map((l) => (/^\s*(#|\/\/)/.test(l) ? '' : l)).join('\n');
}

export const NO_ROOT:{ status: 'unknown'; reason: string } = { status: 'unknown', reason: 'the folder to check does not exist or is not a directory' };

export function walk(root: string, match: (rel: string) => boolean, maxFiles = MAX_FILES): WalkResult {
  const files: string[] = [];
  const stack: string[] = [''];
  let seen = 0;
  while (stack.length > 0) {
    const rel = stack.pop() as string;
    let entries;
    try {
      entries = readdirSync(join(root, rel), { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        // a nested checkout (worktree, submodule) is someone else's tree, not this one
        if (!SKIP_DIRS.has(e.name) && !existsSync(join(root, childRel, '.git'))) stack.push(childRel);
        continue;
      }
      if (!e.isFile()) continue;
      seen += 1;
      if (seen > maxFiles) return { files: files.sort(), truncated: true };
      if (match(childRel)) files.push(childRel);
    }
  }
  return { files: files.sort(), truncated: false };
}

export function readText(abs: string): string | null {
  try {
    if (statSync(abs).size > MAX_BYTES) return null;
    return readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
}

export function lines(text: string): string[] {
  return text.split(/\r?\n/);
}

export function lineOf(text: string, index: number): number {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

export function mask(secret: string): string {
  return `${secret.slice(0, 2)}…(${secret.length} chars)`;
}

const GIT_OPTS = { timeout: 20_000, encoding: 'utf8' as const, maxBuffer: 256 * 1024 * 1024 };

/** why the last git call could not run at all — so a probe can say more than "?" (plan 1 review) */
export let lastGitError: string | null = null;

export function gitErrorText(err: { code?: string; message?: string }): string {
  switch (err.code) {
    case 'ENOBUFS': return 'git ENOBUFS — its output was larger than the buffer (a very large repository)';
    case 'ETIMEDOUT': return 'git timed out';
    case 'ENOENT': return 'git is not installed or not found on PATH';
    default: return `git could not run (${err.code ?? err.message ?? 'unknown error'})`;
  }
}

export function git(root: string, args: string[]): { status: number | null; stdout: string } | null {
  lastGitError = null;
  if (!rootIsDir(root)) return null;
  const r = spawnSync('git', args, { cwd: root, ...GIT_OPTS });
  if (r.error) {
    lastGitError = gitErrorText(r.error as NodeJS.ErrnoException);
    return null;
  }
  return { status: r.status, stdout: r.stdout };
}

export function gitLsFiles(root: string): string[] | null {
  const r = git(root, ['ls-files', '-z']);
  if (!r || r.status !== 0) return null;
  return r.stdout.split('\0').filter(Boolean);
}

const listCache = new Map<string, string[] | null>();

/** tracked + untracked-but-not-ignored files, relative to root; null outside a git work tree */
export function gitVisibleFiles(root: string): string[] | null {
  if (!listCache.has(root)) {
    const r = git(root, ['ls-files', '-co', '--exclude-standard', '-z']);
    listCache.set(root, r && r.status === 0 ? r.stdout.split('\0').filter(Boolean) : null);
  }
  return listCache.get(root) ?? null;
}

/** the files git would show; a bounded raw walk only outside git */
export function listFiles(root: string, match: (rel: string) => boolean, maxFiles = MAX_FILES): WalkResult {
  const visible = gitVisibleFiles(root);
  if (visible) return { files: visible.filter(match).sort(), truncated: false };
  return walk(root, match, maxFiles);
}
