import { dataPolicy, envKeys, noFallbackIntoPublic } from './gateway.js';
import type { Probe } from './types.js';

const ALL: Probe[] = [envKeys, dataPolicy, noFallbackIntoPublic];

export const PROBES: ReadonlyMap<string, Probe> = new Map(ALL.map((p) => [p.id, p]));
