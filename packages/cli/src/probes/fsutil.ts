import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
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
        if (!SKIP_DIRS.has(e.name)) stack.push(childRel);
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

export function gitLsFiles(root: string): string[] | null {
  const r = spawnSync('git', ['ls-files', '-z'], { cwd: root, timeout: 10_000, encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  return r.stdout.split('\0').filter(Boolean);
}
