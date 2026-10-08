import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import type { ClassDef } from './catalog/types.js';
import type { ItemResult } from './score.js';

export interface Answer {
  answer: 'yes' | 'no';
  date: string;
}
export type Answers = Record<string, Answer>;

export const ANSWERS_REL = '.checkup/answers.yaml';
export const MAX_AGE_DAYS = 90;

export function loadAnswers(dir: string, warn: (s: string) => void): Answers {
  const p = join(dir, ANSWERS_REL);
  if (!existsSync(p)) return {};
  let raw: unknown;
  try {
    raw = parse(readFileSync(p, 'utf8'));
    if (raw === null) return {};
    if (typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not a mapping');
  } catch (e) {
    warn(`${ANSWERS_REL} is unreadable (${(e as Error).message.split('\n')[0]}) — treating every answer as not given`);
    return {};
  }
  const out: Answers = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const a = (v ?? {}) as Partial<Answer>;
    if ((a.answer === 'yes' || a.answer === 'no') && typeof a.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.date)) {
      out[k] = { answer: a.answer, date: a.date };
    } else {
      warn(`${ANSWERS_REL}: ignoring a malformed answer for "${k}"`);
    }
  }
  return out;
}

export function saveAnswers(dir: string, answers: Answers): void {
  mkdirSync(join(dir, '.checkup'), { recursive: true });
  const sorted = Object.fromEntries(Object.entries(answers).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(join(dir, ANSWERS_REL), stringify(sorted), 'utf8');
}

export function today(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function isFresh(a: Answer, now: Date, maxAgeDays = MAX_AGE_DAYS): boolean {
  const age = (Date.parse(today(now)) - Date.parse(a.date)) / 86_400_000;
  return age >= 0 && age <= maxAgeDays;
}

export function applyAnswers(classes: ClassDef[], results: Map<string, ItemResult>, answers: Answers, now: Date): void {
  for (const c of classes) {
    for (const it of c.items) {
      if (it.probe) continue;
      const a = answers[it.id];
      if (!a || !isFresh(a, now)) continue;
      results.set(it.id, {
        itemId: it.id,
        classId: c.id,
        status: a.answer === 'yes' ? 'pass' : 'fail',
        via: 'answer',
        evidence: `answered ${a.answer} on ${a.date}`,
      });
    }
  }
}
