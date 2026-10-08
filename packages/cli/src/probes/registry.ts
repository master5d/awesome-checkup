import { dataPolicy, envKeys, noFallbackIntoPublic } from './gateway.js';
import { gitignoreEnv, noTrackedEnv, scannerWired } from './secrets.js';
import type { Probe } from './types.js';

const ALL: Probe[] = [envKeys, dataPolicy, noFallbackIntoPublic, gitignoreEnv, noTrackedEnv, scannerWired];

export const PROBES: ReadonlyMap<string, Probe> = new Map(ALL.map((p) => [p.id, p]));
