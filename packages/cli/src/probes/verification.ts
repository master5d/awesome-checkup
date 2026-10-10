import { join } from 'node:path';
import { parse } from 'yaml';
import { ciConfigRels, lineOf, lines, listFiles, NO_ROOT, readText, rootIsDir, TRUNCATED_REASON, walk, withoutCommentLines } from './fsutil.js';
import type { Probe, ProbeContext, ProbeResult } from './types.js';

// a tool name followed by ".something" is a file (jest.config.js, run-all-tests.log), not a command
const TEST_CMD = /\b(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|pytest|go test|cargo test|vitest|jest|mvn\s+test|gradlew?\s+test|dotnet test)\b(?!\.\w)|run-all-tests(?:\.py)?(?![\w.-])/;
/** a pipe into a filter reports the filter's exit code unless pipefail is on */
const PIPE_EATS = new RegExp(`(${TEST_CMD.source}).*?[^|]\\|\\s*(tail|head|tee|grep|sed|awk|cat)\\b`);
/** "|| true" hides the exit code under every shell, pipefail or not */
const OR_EATS = new RegExp(`(${TEST_CMD.source}).*?\\|\\|\\s*(true|:|exit 0)\\b`);
/** a real `set -o pipefail` / `set -euo pipefail` command, not a comment mentioning the word */
const SETS_PIPEFAIL = /^\s*set\s+(-[a-zA-Z]*o\s+pipefail|-o\s+pipefail)\b/m;
/** GitHub runs an explicit `shell: bash` with -eo pipefail; the default on Linux/macOS is `bash -e` without it */
const PIPEFAIL_SHELLS = new Set(['bash']);
/** shells this probe does not judge (pwsh pipeline semantics differ) */
const UNJUDGED_SHELLS = new Set(['pwsh', 'powershell', 'cmd', 'python']);

function ciFiles(root: string): Array<{ rel: string; text: string }> {
  const out: Array<{ rel: string; text: string }> = [];
  for (const rel of ciConfigRels(root)) {
    const t = readText(join(root, rel));
    if (t !== null) out.push({ rel, text: t });
  }
  return out;
}

export const ciRunsTests: Probe = {
  id: 'verification.ci_runs_tests',
  run(ctx: ProbeContext): ProbeResult {
    if (!rootIsDir(ctx.root)) return NO_ROOT;
    const files = ciFiles(ctx.root);
    if (files.length === 0) return { status: 'fail', reason: 'no CI configuration found' };
    for (const f of files) {
      // a commented-out "# - run: npm test" is a test that does not run (plan 1 review)
      const i = withoutCommentLines(f.text).search(TEST_CMD);
      if (i >= 0) return { status: 'pass', evidence: `${f.rel}:${lineOf(f.text, i)}` };
    }
    return { status: 'fail', reason: 'CI exists but no test command was found in it' };
  },
};

interface Step {
  run?: string;
  shell?: string;
}
interface Job {
  'runs-on'?: unknown;
  defaults?: { run?: { shell?: string } };
  steps?: Step[];
}

function stepEatsStatus(run: string, shell: string | undefined, windowsRunner: boolean): boolean {
  if (OR_EATS.test(run)) return true;
  if (shell === undefined) return !windowsRunner && PIPE_EATS.test(run);
  if (UNJUDGED_SHELLS.has(shell) || PIPEFAIL_SHELLS.has(shell)) return false;
  return PIPE_EATS.test(run);
}

export const noStatusEatingPipe: Probe = {
  id: 'verification.no_status_eating_pipe',
  run(ctx: ProbeContext): ProbeResult {
    if (!rootIsDir(ctx.root)) return NO_ROOT;
    let inspected = 0;

    const pkg = readText(join(ctx.root, 'package.json'));
    if (pkg !== null) {
      try {
        const scripts = (JSON.parse(pkg) as { scripts?: Record<string, string> }).scripts ?? {};
        inspected += 1;
        for (const [k, v] of Object.entries(scripts)) {
          if (OR_EATS.test(v) || PIPE_EATS.test(v)) return { status: 'fail', evidence: `package.json scripts.${k}`, reason: 'a pipe or "|| true" hides the test exit code (npm runs scripts with sh, no pipefail)' };
        }
      } catch {
        // an unparseable package.json is not this probe's verdict
      }
    }

    const sh = listFiles(ctx.root, (r) => r.endsWith('.sh'));
    for (const rel of sh.files) {
      const t = readText(join(ctx.root, rel));
      if (t === null) continue;
      inspected += 1;
      const pipefail = SETS_PIPEFAIL.test(t);
      const ls = lines(t);
      const i = ls.findIndex((l) => !/^\s*#/.test(l) && (OR_EATS.test(l) || (!pipefail && PIPE_EATS.test(l))));
      if (i >= 0) return { status: 'fail', evidence: `${rel}:${i + 1}`, reason: 'the test exit code is hidden by a pipe (no pipefail) or by "|| true"' };
    }

    for (const rel of walk(join(ctx.root, '.github', 'workflows'), (r) => /\.ya?ml$/.test(r)).files) {
      const t = readText(join(ctx.root, '.github', 'workflows', rel));
      if (t === null) continue;
      inspected += 1;
      let doc: unknown;
      try {
        doc = parse(t);
      } catch {
        continue;
      }
      const wf = (doc ?? {}) as { defaults?: { run?: { shell?: string } }; jobs?: Record<string, Job> };
      for (const job of Object.values(wf.jobs ?? {})) {
        const j = (job ?? {}) as Job;
        const windowsRunner = /windows/i.test(JSON.stringify(j['runs-on'] ?? ''));
        for (const step of j.steps ?? []) {
          if (typeof step.run !== 'string') continue;
          const shell = step.shell ?? j.defaults?.run?.shell ?? wf.defaults?.run?.shell;
          if (stepEatsStatus(step.run, shell, windowsRunner)) {
            return { status: 'fail', evidence: `.github/workflows/${rel}:${lineOf(t, t.indexOf(step.run.split('\n')[0] ?? ''))}`, reason: 'the test exit code is hidden by a pipe (this step runs without pipefail) or by "|| true"' };
          }
        }
      }
    }

    if (inspected === 0) return { status: 'unknown', reason: sh.truncated ? TRUNCATED_REASON : 'no package.json scripts, shell scripts or CI steps to inspect' };
    if (sh.truncated) return { status: 'unknown', reason: TRUNCATED_REASON };
    return { status: 'pass', evidence: `${inspected} file(s) inspected` };
  },
};
