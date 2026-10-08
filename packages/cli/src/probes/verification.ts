import { join } from 'node:path';
import { parse } from 'yaml';
import { lineOf, lines, readText, TRUNCATED_REASON, walk } from './fsutil.js';
import type { Probe, ProbeContext, ProbeResult } from './types.js';

const TEST_CMD = /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bpytest\b|\bgo test\b|\bcargo test\b|\bvitest\b|\bjest\b|\bmvn\s+test\b|\bgradlew?\s+test\b|\bdotnet test\b|run-all-tests/;
const EATS_STATUS = new RegExp(
  `(${TEST_CMD.source}).*?(?:[^|]\\|\\s*(tail|head|tee|grep|sed|awk|cat)\\b|\\|\\|\\s*(true|:|exit 0)\\b)`,
);

function ciFiles(root: string): Array<{ rel: string; text: string }> {
  const rels = [
    ...walk(join(root, '.github', 'workflows'), (r) => /\.ya?ml$/.test(r)).files.map((r) => `.github/workflows/${r}`),
    '.gitlab-ci.yml', '.circleci/config.yml', 'azure-pipelines.yml', 'Jenkinsfile',
  ];
  const out: Array<{ rel: string; text: string }> = [];
  for (const rel of rels) {
    const t = readText(join(root, rel));
    if (t !== null) out.push({ rel, text: t });
  }
  return out;
}

export const ciRunsTests: Probe = {
  id: 'verification.ci_runs_tests',
  run(ctx: ProbeContext): ProbeResult {
    const files = ciFiles(ctx.root);
    if (files.length === 0) return { status: 'fail', reason: 'no CI configuration found' };
    for (const f of files) {
      const i = f.text.search(TEST_CMD);
      if (i >= 0) return { status: 'pass', evidence: `${f.rel}:${lineOf(f.text, i)}` };
    }
    return { status: 'fail', reason: 'CI exists but no test command was found in it' };
  },
};

export const noStatusEatingPipe: Probe = {
  id: 'verification.no_status_eating_pipe',
  run(ctx: ProbeContext): ProbeResult {
    let inspected = 0;

    const pkg = readText(join(ctx.root, 'package.json'));
    if (pkg !== null) {
      try {
        const scripts = (JSON.parse(pkg) as { scripts?: Record<string, string> }).scripts ?? {};
        inspected += 1;
        for (const [k, v] of Object.entries(scripts)) {
          if (EATS_STATUS.test(v)) return { status: 'fail', evidence: `package.json scripts.${k}`, reason: 'a pipe or "|| true" hides the test exit code' };
        }
      } catch {
        // an unparseable package.json is not this probe's verdict
      }
    }

    const sh = walk(ctx.root, (r) => r.endsWith('.sh'));
    for (const rel of sh.files) {
      const t = readText(join(ctx.root, rel));
      if (t === null) continue;
      inspected += 1;
      if (/pipefail/.test(t)) continue;
      const ls = lines(t);
      const i = ls.findIndex((l) => EATS_STATUS.test(l));
      if (i >= 0) return { status: 'fail', evidence: `${rel}:${i + 1}`, reason: 'a pipe hides the test exit code (no pipefail)' };
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
      const jobs = (doc as { jobs?: Record<string, unknown> } | null)?.jobs ?? {};
      for (const job of Object.values(jobs)) {
        const j = (job ?? {}) as { defaults?: { run?: { shell?: string } }; steps?: Array<{ run?: string; shell?: string }> };
        for (const step of j.steps ?? []) {
          const shell = step.shell ?? j.defaults?.run?.shell;
          if (shell === 'sh' && typeof step.run === 'string' && EATS_STATUS.test(step.run)) {
            return { status: 'fail', evidence: `.github/workflows/${rel}:${lineOf(t, t.indexOf(step.run.split('\n')[0] ?? ''))}`, reason: 'a pipe hides the test exit code (shell: sh has no pipefail)' };
          }
        }
      }
    }

    if (inspected === 0) return { status: 'unknown', reason: sh.truncated ? TRUNCATED_REASON : 'no package.json scripts, shell scripts or CI steps to inspect' };
    if (sh.truncated) return { status: 'unknown', reason: TRUNCATED_REASON };
    return { status: 'pass', evidence: `${inspected} file(s) inspected` };
  },
};
