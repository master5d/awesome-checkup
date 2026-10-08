import { type Answers, today } from './answers.js';
import type { ClassDef } from './catalog/types.js';
import type { ItemResult } from './score.js';

export interface AskIO {
  ask(q: string): Promise<string>;
  stdout(s: string): void;
}

const MAX_TRIES = 3;

export async function askMissing(
  classes: ClassDef[],
  results: Map<string, ItemResult>,
  answers: Answers,
  io: AskIO,
  now: Date,
): Promise<boolean> {
  let changed = false;
  for (const c of classes) {
    for (const it of c.items) {
      if (it.probe || results.get(it.id)?.via === 'answer') continue;
      for (let tries = 0; tries < MAX_TRIES; tries++) {
        const raw = (await io.ask(`[${c.id} · stage ${it.stage}] ${it.check.trim()}\n  y = yes · n = no · s = skip > `)).trim().toLowerCase();
        if (raw === 's' || raw === '') break;
        if (raw === 'y' || raw === 'n') {
          const answer = raw === 'y' ? 'yes' : 'no';
          answers[it.id] = { answer, date: today(now) };
          results.set(it.id, { itemId: it.id, classId: c.id, status: answer === 'yes' ? 'pass' : 'fail', via: 'answer', evidence: `answered ${answer} now` });
          changed = true;
          break;
        }
        io.stdout('  please answer y, n or s\n');
      }
    }
  }
  return changed;
}
