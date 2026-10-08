import type { ClassDef } from './catalog/types.js';
import type { Probe, ProbeContext, ProbeResult } from './probes/types.js';
import type { ItemResult } from './score.js';

export function runProbes(
  classes: ClassDef[],
  ctx: ProbeContext,
  registry: ReadonlyMap<string, Probe>,
  warn: (s: string) => void,
): Map<string, ItemResult> {
  const results = new Map<string, ItemResult>();
  const cache = new Map<string, ProbeResult>();
  for (const c of classes) {
    for (const it of c.items) {
      if (!it.probe) {
        results.set(it.id, { itemId: it.id, classId: c.id, status: 'unknown', via: 'none', reason: 'not auto-checked — answer it interactively' });
        continue;
      }
      let r = cache.get(it.probe);
      if (!r) {
        const probe = registry.get(it.probe);
        if (!probe) {
          r = { status: 'unknown', reason: `probe ${it.probe} is not available in this version` };
        } else {
          try {
            r = probe.run(ctx);
            if (r.warning) warn(`probe ${it.probe}: ${r.warning}`);
          } catch (e) {
            const msg = (e as Error).message;
            warn(`probe ${it.probe} crashed — ${msg}; counted as not verified`);
            r = { status: 'unknown', reason: `probe crashed: ${msg}` };
          }
        }
        cache.set(it.probe, r);
      }
      results.set(it.id, { itemId: it.id, classId: c.id, via: 'probe', ...r });
    }
  }
  return results;
}
