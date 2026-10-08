import { describe, expect, it } from 'vitest';
import { scanLeaks } from '../src/catalog/leaks.js';
import { loadCatalog } from '../src/catalog/load.js';
import { validateCatalog } from '../src/catalog/validate.js';
import { tmpTree } from './helpers.js';

const GOOD_CLASS = `id: gateway
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
`;
const STANDARDS = `- id: owasp-llm-2025
  name: OWASP Top 10 for LLM Applications 2025
  url: https://genai.owasp.org/llm-top-10/
  version: "2025"
  checked: "2026-10-07"
`;
const SCAR = '# A key in a config file\n\nIt happened once.\n';
const PROBES = new Set(['gateway.litellm.env_keys']);

function load(over: Record<string, string> = {}, drop: string[] = []) {
  const files: Record<string, string> = {
    'checklists/gateway.yaml': GOOD_CLASS,
    'standards.yaml': STANDARDS,
    'scars/key-leak.md': SCAR,
    ...over,
  };
  for (const d of drop) delete files[d];
  return loadCatalog(tmpTree(files));
}

describe('loadCatalog + validateCatalog', () => {
  it('accepts a good catalog', () => {
    const l = load();
    expect(l.catalog.classes.map((c) => c.id)).toEqual(['gateway']);
    expect(l.stems).toEqual(['gateway']);
    expect(l.catalog.scars['key-leak']).toBe('A key in a config file');
    expect(validateCatalog(l, PROBES)).toEqual([]);
  });

  it('rejects an item without sources', () => {
    const bad = GOOD_CLASS.replace(/    sources:\n      - scar: key-leak\n      - standard: owasp-llm-2025\n/, '    sources: []\n');
    expect(validateCatalog(load({ 'checklists/gateway.yaml': bad }), PROBES).join('\n')).toMatch(/at least one source/);
  });

  it('rejects a scar reference without a file', () => {
    expect(validateCatalog(load({}, ['scars/key-leak.md']), PROBES).join('\n')).toMatch(/scar "key-leak" has no scars\/key-leak\.md/);
  });

  it('rejects an unknown standard', () => {
    expect(validateCatalog(load({ 'standards.yaml': '[]\n' }), PROBES).join('\n')).toMatch(/standard "owasp-llm-2025" is not in standards\.yaml/);
  });

  it('rejects an unregistered probe', () => {
    expect(validateCatalog(load(), new Set()).join('\n')).toMatch(/probe "gateway\.litellm\.env_keys" is not registered/);
  });

  it('rejects stage 0 and stage 6', () => {
    for (const s of ['0', '6']) {
      const bad = GOOD_CLASS.replace('stage: 1', `stage: ${s}`);
      expect(validateCatalog(load({ 'checklists/gateway.yaml': bad }), PROBES).join('\n')).toMatch(/stage must be 1\.\.5/);
    }
  });

  it('rejects a class id that does not match its file name', () => {
    const l = load({ 'checklists/other.yaml': GOOD_CLASS.replace('gw-one', 'gw-two') });
    expect(validateCatalog(l, PROBES).join('\n')).toMatch(/other\.yaml: id "gateway" must match file name/);
  });

  it('rejects duplicate item ids across classes', () => {
    const second = GOOD_CLASS.replace('id: gateway', 'id: second');
    expect(validateCatalog(load({ 'checklists/second.yaml': second }), PROBES).join('\n')).toMatch(/duplicate id/);
  });

  it('flags leaks in item text and in scars', () => {
    const leaky = GOOD_CLASS.replace('A literal key', 'See /Users/alice/lab — a literal key');
    const errs = validateCatalog(
      load({ 'checklists/gateway.yaml': leaky, 'scars/key-leak.md': '# t\n\nnode box.tail1234.ts.net\n' }),
      PROBES,
    ).join('\n');
    expect(errs).toMatch(/gateway\/gw-one: possible leak \(home-path\)/);
    expect(errs).toMatch(/scars\/key-leak\.md: possible leak \(tailnet\)/);
  });
});

describe('scanLeaks', () => {
  it('finds ipv4 but not loopback', () => {
    expect(scanLeaks('ping 10.1.2.3').map((f) => f.kind)).toEqual(['ipv4']);
    expect(scanLeaks('bind 127.0.0.1 and 0.0.0.0')).toEqual([]);
  });
  it('finds emails, windows paths, home paths and tailnet names', () => {
    const kinds = scanLeaks('a@b.io C:\\work\\x /home/bob/x n.tailabc.ts.net').map((f) => f.kind).sort();
    expect(kinds).toEqual(['email', 'home-path', 'tailnet', 'windows-path']);
  });
  it('passes clean prose', () => {
    expect(scanLeaks('Keys come from the environment, never from the config file.')).toEqual([]);
  });
});
