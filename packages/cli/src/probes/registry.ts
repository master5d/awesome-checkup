import type { Probe } from './types.js';

const ALL: Probe[] = [];

export const PROBES: ReadonlyMap<string, Probe> = new Map(ALL.map((p) => [p.id, p]));
