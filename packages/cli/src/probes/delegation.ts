import { join } from 'node:path';
import { lineOf, NO_ROOT, readText, rootIsDir } from './fsutil.js';
import type { Probe, ProbeContext, ProbeResult } from './types.js';

// .claude/CLAUDE.md is the project-level file Claude Code also reads (plan 1 review: it was not recognised)
const REPO_FILES = ['AGENTS.md', 'CLAUDE.md', '.claude/CLAUDE.md', '.github/copilot-instructions.md'];
const HOME_FILES = ['.claude/CLAUDE.md', '.codex/AGENTS.md'];
const DONE_HEADING = /^#{1,6}\s.*(verif|before .*done|definition of done|acceptance|\btest|\bcheck|validat|quality|\bci\b|провер|тест|приёмк|приемк)/im;

function contractFiles(ctx: ProbeContext): Array<{ rel: string; text: string }> {
  const out: Array<{ rel: string; text: string }> = [];
  for (const rel of REPO_FILES) {
    const t = readText(join(ctx.root, rel));
    if (t !== null) out.push({ rel, text: t });
  }
  if (ctx.home) {
    for (const rel of HOME_FILES) {
      const t = readText(join(ctx.home, rel));
      if (t !== null) out.push({ rel: `~/${rel}`, text: t });
    }
  }
  return out;
}

export const agentsContract: Probe = {
  id: 'delegation.agents_contract',
  run(ctx: ProbeContext): ProbeResult {
    if (!rootIsDir(ctx.root)) return NO_ROOT;
    const files = contractFiles(ctx);
    if (files.length > 0) return { status: 'pass', evidence: files.map((f) => f.rel).join(', ') };
    return { status: 'fail', reason: `no AGENTS.md or CLAUDE.md${ctx.home ? '' : ' (home directory not scanned — pass --rig to include it)'}` };
  },
};

export const doneGate: Probe = {
  id: 'delegation.done_gate',
  run(ctx: ProbeContext): ProbeResult {
    const files = contractFiles(ctx);
    if (files.length === 0) return { status: 'unknown', reason: 'no agent contract file to inspect' };
    for (const f of files) {
      const i = f.text.search(DONE_HEADING);
      if (i >= 0) return { status: 'pass', evidence: `${f.rel}:${lineOf(f.text, i)}` };
    }
    return { status: 'unknown', reason: 'no "verification before done" section was recognised in the agent contract — answer it yourself' };
  },
};
