export interface LeakFinding {
  kind: string;
  match: string;
}

const PATTERNS: Array<[string, RegExp]> = [
  ['ipv4', /\b(?!127\.0\.0\.1\b)(?!0\.0\.0\.0\b)(?:\d{1,3}\.){3}\d{1,3}\b/g],
  ['email', /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g],
  ['windows-path', /\b[A-Za-z]:\\[^\s`'"]+/g],
  ['home-path', /(?:\/Users\/|\/home\/)[A-Za-z0-9._-]+/g],
  ['tailnet', /\b[\w-]+\.[\w-]+\.ts\.net\b|\b[\w-]+\.ts\.net\b/gi],
];

/** Generic leak patterns only. The exact deny-list of lab names lives in the private pipeline, never here. */
export function scanLeaks(text: string): LeakFinding[] {
  const out: LeakFinding[] = [];
  for (const [kind, re] of PATTERNS) {
    for (const m of text.matchAll(re)) out.push({ kind, match: m[0] });
  }
  return out;
}
