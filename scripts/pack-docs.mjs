// Copies the repo README and both licenses into packages/cli before `npm pack` / `npm publish`.
// 0.1.0 shipped without them: npm showed "No README data found" and the tarball carried no license text,
// although dist/bin.js bundles the CC BY 4.0 catalog. The copies are gitignored; the root files stay the source.
//
//   node scripts/pack-docs.mjs          copy (runs as the package's prepack)
//   node scripts/pack-docs.mjs --check  exit 1 unless `npm pack --dry-run` lists README.md, LICENSE, LICENSE-content
import { copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = join(root, 'packages', 'cli');
const DOCS = ['README.md', 'LICENSE', 'LICENSE-content'];

if (process.argv.includes('--check')) {
  // a fixed command string: npm.cmd on Windows needs a shell, and a shell with an args array is deprecated (DEP0190)
  const out = execSync('npm pack --dry-run --json', { cwd: pkg, encoding: 'utf8' });
  // npm prints the prepack banner on stdout too; the JSON report is the block that starts with "[" on its own line
  const start = out.search(/^\[/m);
  if (start < 0) {
    console.error(`pack-docs --check: no JSON report in npm pack output:\n${out.slice(0, 400)}`);
    process.exit(1);
  }
  const files = new Set(JSON.parse(out.slice(start))[0].files.map((f) => f.path));
  const missing = [...DOCS, 'dist/bin.js'].filter((f) => !files.has(f));
  if (missing.length) {
    console.error(`pack-docs --check: tarball is missing ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log(`pack-docs --check: ok (${[...files].sort().join(', ')})`);
} else {
  for (const f of DOCS) copyFileSync(join(root, f), join(pkg, f));
  console.error(`pack-docs: copied ${DOCS.join(', ')} into packages/cli`);
}
