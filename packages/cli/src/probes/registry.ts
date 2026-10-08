import { agentsContract, doneGate } from './delegation.js';
import { dataPolicy, envKeys, noFallbackIntoPublic } from './gateway.js';
import { gitignoreEnv, noTrackedEnv, scannerWired } from './secrets.js';
import type { Probe } from './types.js';
import { ciRunsTests, noStatusEatingPipe } from './verification.js';

const ALL: Probe[] = [
  envKeys, dataPolicy, noFallbackIntoPublic,
  gitignoreEnv, noTrackedEnv, scannerWired,
  agentsContract, doneGate,
  ciRunsTests, noStatusEatingPipe,
];

export const PROBES: ReadonlyMap<string, Probe> = new Map(ALL.map((p) => [p.id, p]));
