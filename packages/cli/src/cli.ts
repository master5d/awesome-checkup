import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { ANSWERS_REL, applyAnswers, loadAnswers, saveAnswers } from './answers.js';
import { askMissing } from './ask.js';
import { CATALOG } from './catalog/data.generated.js';
import type { Catalog } from './catalog/types.js';
import { gateCode, parseMinStage } from './gate.js';
import { rootIsDir } from './probes/fsutil.js';
import { PROBES } from './probes/registry.js';
import { buildReport, renderCard } from './report.js';
import { runProbes } from './run.js';

export const VERSION = '0.2.0';

export interface IO {
  stdout(s: string): void;
  stderr(s: string): void;
  /** interactive: stdin AND stdout are terminals — otherwise the questions would be invisible */
  isTTY: boolean;
  /** stdout is a colour terminal and NO_COLOR is not set */
  color: boolean;
  ask(q: string): Promise<string>;
  now(): Date;
  home: string;
  cwd: string;
}

const USAGE = [
  'usage: awesome-checkup [options]',
  '  --dir <path>              folder to check (default: current folder)',
  '  --class <id>              check one class (repeatable)',
  '  --no-ask                  auto-checks only; everything else is "not verified"',
  '  --json                    machine-readable output (implies --no-ask)',
  '  --no-color                plain output',
  '  --rig                     also read agent configs in your home folder',
  '  --min-stage <class>=<N>   exit 1 if below N because of a miss, 3 if only unverified (repeatable)',
  '  --version, --help',
  '',
  'exit codes: 0 ok · 1 below --min-stage because of a miss · 3 below only because of unverified items · 2 usage error · 4 internal error',
].join('\n');

interface Opts {
  dir: string;
  classes: string[];
  noAsk: boolean;
  json: boolean;
  noColor: boolean;
  rig: boolean;
  mins: string[];
  help: boolean;
  version: boolean;
}

export function parseArgs(argv: string[]): Opts {
  const o: Opts = { dir: '.', classes: [], noAsk: false, json: false, noColor: false, rig: false, mins: [], help: false, version: false };
  const value = (i: number, flag: string): string => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`${flag} needs a value`);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--dir': o.dir = value(i, a); i++; break;
      case '--class': o.classes.push(value(i, a)); i++; break;
      case '--min-stage': o.mins.push(value(i, a)); i++; break;
      case '--no-ask': o.noAsk = true; break;
      case '--json': o.json = true; break;
      case '--no-color': o.noColor = true; break;
      case '--rig': o.rig = true; break;
      case '--help': case '-h': o.help = true; break;
      case '--version': case '-v': o.version = true; break;
      default: throw new Error(`unknown option ${a}`);
    }
  }
  return o;
}

function defaultIO(): IO {
  return {
    stdout: (s) => void process.stdout.write(s),
    stderr: (s) => void process.stderr.write(s),
    isTTY: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    color: Boolean(process.stdout.isTTY) && !process.env.NO_COLOR,
    ask: async (q) => {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        return await rl.question(q);
      } finally {
        rl.close();
      }
    },
    now: () => new Date(),
    home: homedir(),
    cwd: process.cwd(),
  };
}

export async function main(argv: string[], io: IO = defaultIO(), catalog: Catalog = CATALOG): Promise<number> {
  let o: Opts;
  try {
    o = parseArgs(argv);
  } catch (e) {
    io.stderr(`awesome-checkup: ${(e as Error).message}\n${USAGE}\n`);
    return 2;
  }
  if (o.help) {
    io.stdout(`${USAGE}\n`);
    return 0;
  }
  if (o.version) {
    io.stdout(`${VERSION}\n`);
    return 0;
  }

  const known = new Set(catalog.classes.map((c) => c.id));
  for (const c of o.classes) {
    if (!known.has(c)) {
      io.stderr(`awesome-checkup: unknown class "${c}" (known: ${[...known].join(', ')})\n`);
      return 2;
    }
  }
  const selected = catalog.classes.filter((c) => o.classes.length === 0 || o.classes.includes(c.id));
  let mins: Map<string, number>;
  try {
    mins = new Map(o.mins.map((m) => parseMinStage(m, new Set(selected.map((c) => c.id)))));
  } catch (e) {
    io.stderr(`awesome-checkup: ${(e as Error).message}\n`);
    return 2;
  }

  const warn = (s: string) => io.stderr(`awesome-checkup: ${s}\n`);
  const dir = resolve(io.cwd, o.dir);
  if (!rootIsDir(dir)) {
    io.stderr(`awesome-checkup: --dir ${o.dir} is not a directory\n`);
    return 2;
  }
  const results = runProbes(selected, { root: dir, home: o.rig ? io.home : null }, PROBES, warn);
  const now = io.now();
  const answers = loadAnswers(dir, warn);
  applyAnswers(selected, results, answers, now);

  let noAsk = o.noAsk || o.json;
  if (!noAsk && !io.isTTY) {
    warn('stdin is not a terminal — running as --no-ask');
    noAsk = true;
  }
  if (!noAsk && (await askMissing(selected, results, answers, io, now))) {
    try {
      saveAnswers(dir, answers);
    } catch (e) {
      warn(`could not save answers to ${ANSWERS_REL} (${(e as Error).message}) — they count for this run only`);
    }
  }

  const report = buildReport(selected, results, VERSION);
  io.stdout(o.json ? `${JSON.stringify(report, null, 2)}\n` : `${renderCard(report, !o.noColor && io.color)}\n`);
  return mins.size > 0 ? gateCode(report.classes, mins) : 0;
}
