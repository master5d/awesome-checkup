import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planRender, staleFiles, writeOutputs } from '../src/catalog/build.js';
import { loadCatalog } from '../src/catalog/load.js';
import { renderClassMd, renderDataModule, renderReadme } from '../src/catalog/render.js';
import { tmpTree } from './helpers.js';

const CLASS = `id: gateway
title: LLM gateway
summary: One door to every model.
items:
  - id: gw-one
    stage: 1
    check: Provider keys come from the environment.
    why: A literal key in a config file is a key in git history.
    sources:
      - scar: key-leak
      - standard: owasp-llm-2025
    probe: gateway.litellm.env_keys
  - id: gw-two
    stage: 3
    check: Someone owns the gateway.
    why: Nobody noticed it was down.
    sources:
      - standard: owasp-llm-2025
`;
const FILES = {
  'checklists/gateway.yaml': CLASS,
  'standards.yaml': '- id: owasp-llm-2025\n  name: OWASP Top 10 for LLM Applications 2025\n  url: https://genai.owasp.org/llm-top-10/\n  version: "2025"\n  checked: "2026-10-07"\n',
  'scars/key-leak.md': '# A key in a config file\n\nIt happened once.\n',
};
const PROBES = new Set(['gateway.litellm.env_keys']);

describe('render', () => {
  it('class markdown has stage sections, anchors, sources and auto-check marks', () => {
    const root = tmpTree(FILES);
    const { catalog } = loadCatalog(root);
    const md = renderClassMd(catalog.classes[0]!, catalog);
    expect(md).toMatch(/^<!-- generated from checklists\/gateway\.yaml/);
    expect(md).toContain('## Stage 1 — tried');
    expect(md).toContain('## Stage 3 — reliable');
    expect(md).not.toContain('## Stage 2');
    expect(md).toContain('### gw-one');
    expect(md).toContain('[A key in a config file](../scars/key-leak.md)');
    expect(md).toContain('[OWASP Top 10 for LLM Applications 2025](https://genai.owasp.org/llm-top-10/)');
    expect(md).toContain('auto-check: `gateway.litellm.env_keys`');
    expect(md).toContain('auto-check: none — asked interactively');
  });

  it('README lists classes with item counts and never an overall score', () => {
    const { catalog } = loadCatalog(tmpTree(FILES));
    const readme = renderReadme(catalog);
    expect(readme).toContain('[LLM gateway](checklists/gateway.md)');
    expect(readme).toMatch(/\| 2 \| 1 \|/);
    expect(readme.toLowerCase()).not.toMatch(/overall score|average/);
  });

  it('data module carries the catalog but no filesystem paths', () => {
    const root = tmpTree(FILES);
    const { catalog } = loadCatalog(root);
    const mod = renderDataModule(catalog);
    expect(mod).toContain('export const CATALOG: Catalog =');
    expect(mod).toContain('"gw-one"');
    expect(mod).not.toContain(root);
  });
});

describe('build', () => {
  it('invalid catalog → errors and no outputs', () => {
    const plan = planRender(tmpTree({ ...FILES, 'standards.yaml': '[]\n' }), PROBES);
    expect(plan.errors.length).toBeGreaterThan(0);
    expect(plan.outputs.size).toBe(0);
  });

  it('written outputs are not stale; CRLF-only differences are not stale; edits are', () => {
    const root = tmpTree(FILES);
    const plan = planRender(root, PROBES);
    expect(plan.errors).toEqual([]);
    writeOutputs(root, plan.outputs);
    expect(staleFiles(root, plan.outputs)).toEqual([]);
    const md = join(root, 'checklists/gateway.md');
    writeFileSync(md, readFileSync(md, 'utf8').replace(/\n/g, '\r\n'));
    expect(staleFiles(root, plan.outputs)).toEqual([]);
    writeFileSync(md, 'hand edit\n');
    expect(staleFiles(root, plan.outputs)).toEqual(['checklists/gateway.md']);
  });

  it('a markdown file without its yaml is reported as an orphan', () => {
    const plan = planRender(tmpTree({ ...FILES, 'checklists/ghost.md': '# ghost\n' }), PROBES);
    expect(plan.orphans).toEqual(['checklists/ghost.md']);
  });
});
