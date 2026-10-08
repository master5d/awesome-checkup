import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { Catalog, ClassDef, Standard } from './types.js';

export interface Loaded {
  catalog: Catalog;
  /** file stems of checklists/*.yaml, same order as catalog.classes */
  stems: string[];
  /** full scar texts — validated for leaks, never shipped in the data module */
  scarTexts: Record<string, string>;
}

export function loadCatalog(root: string): Loaded {
  const dir = join(root, 'checklists');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort() : [];
  const stems = files.map((f) => f.slice(0, -'.yaml'.length));
  const classes = files.map((f) => parse(readFileSync(join(dir, f), 'utf8')) as ClassDef);

  const stdPath = join(root, 'standards.yaml');
  const standards = existsSync(stdPath) ? ((parse(readFileSync(stdPath, 'utf8')) as Standard[] | null) ?? []) : [];

  const scars: Record<string, string> = {};
  const scarTexts: Record<string, string> = {};
  const scarDir = join(root, 'scars');
  if (existsSync(scarDir)) {
    for (const f of readdirSync(scarDir).filter((x) => x.endsWith('.md')).sort()) {
      const id = f.slice(0, -'.md'.length);
      const text = readFileSync(join(scarDir, f), 'utf8');
      scarTexts[id] = text;
      scars[id] = /^#\s+(.+)$/m.exec(text)?.[1]?.trim() ?? id;
    }
  }
  return { catalog: { classes, standards, scars }, stems, scarTexts };
}
