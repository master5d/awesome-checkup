import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadCatalog } from './load.js';
import { renderClassMd, renderDataModule, renderReadme } from './render.js';
import { validateCatalog } from './validate.js';

export const DATA_MODULE = 'packages/cli/src/catalog/data.generated.ts';

export interface RenderPlan {
  errors: string[];
  outputs: Map<string, string>;
  orphans: string[];
}

export function planRender(root: string, probeIds: ReadonlySet<string>): RenderPlan {
  const loaded = loadCatalog(root);
  const errors = validateCatalog(loaded, probeIds);
  const yamlStems = new Set(loaded.stems);
  const dir = join(root, 'checklists');
  const orphans = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.md') && !yamlStems.has(f.slice(0, -3))).sort().map((f) => `checklists/${f}`)
    : [];
  if (errors.length > 0) return { errors, outputs: new Map(), orphans };
  const cat = loaded.catalog;
  const outputs = new Map<string, string>([
    ['README.md', renderReadme(cat)],
    [DATA_MODULE, renderDataModule(cat)],
  ]);
  for (const c of cat.classes) outputs.set(`checklists/${c.id}.md`, renderClassMd(c, cat));
  return { errors, outputs, orphans };
}

export function staleFiles(root: string, outputs: ReadonlyMap<string, string>): string[] {
  const stale: string[] = [];
  for (const [rel, body] of outputs) {
    const abs = join(root, rel);
    const cur = existsSync(abs) ? readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') : null;
    if (cur !== body) stale.push(rel);
  }
  return stale;
}

export function writeOutputs(root: string, outputs: ReadonlyMap<string, string>): void {
  for (const [rel, body] of outputs) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body, 'utf8');
  }
}
