import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { planRender, staleFiles } from '../src/catalog/build.js';
import { PROBES } from '../src/probes/registry.js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

describe('shipped catalog', () => {
  const plan = planRender(ROOT, new Set(PROBES.keys()));
  it('validates', () => expect(plan.errors).toEqual([]));
  it('has no orphan markdown', () => expect(plan.orphans).toEqual([]));
  it('generated files are up to date', () => expect(staleFiles(ROOT, plan.outputs)).toEqual([]));
  it('covers the six v1 classes and uses every registered probe', () => {
    const ids = [...plan.outputs.keys()].filter((k) => k.startsWith('checklists/')).sort();
    expect(ids).toEqual([
      'checklists/agent-delegation.md', 'checklists/agent-memory.md', 'checklists/gateway.md',
      'checklists/secrets-guards.md', 'checklists/tool-intake.md', 'checklists/verification-honesty.md',
    ]);
    const data = plan.outputs.get('packages/cli/src/catalog/data.generated.ts') ?? '';
    for (const id of PROBES.keys()) expect(data, id).toContain(`"probe": "${id}"`);
  });
});
