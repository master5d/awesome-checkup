import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planRender, staleFiles, writeOutputs } from '../packages/cli/src/catalog/build.js';
import { PROBES } from '../packages/cli/src/probes/registry.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const plan = planRender(ROOT, new Set(PROBES.keys()));

if (plan.errors.length > 0) {
  for (const e of plan.errors) console.error(`catalog: ${e}`);
  process.exitCode = 1;
} else if (plan.orphans.length > 0) {
  console.error(`render: markdown without yaml — ${plan.orphans.join(', ')}; delete it or add the yaml`);
  process.exitCode = 1;
} else if (check) {
  const stale = staleFiles(ROOT, plan.outputs);
  if (stale.length > 0) {
    console.error(`render --check: out of date — ${stale.join(', ')}; run npm run render`);
    process.exitCode = 1;
  } else {
    console.log(`render --check: ok (${plan.outputs.size} files)`);
  }
} else {
  writeOutputs(ROOT, plan.outputs);
  console.log(`render: wrote ${plan.outputs.size} files`);
}
