import type { Status } from '../score.js';

export interface ProbeContext {
  /** the folder being checked */
  root: string;
  /** home directory — only when the user passed --rig, otherwise null */
  home: string | null;
}

export interface ProbeResult {
  status: Status;
  evidence?: string;
  reason?: string;
  /** a degradation the user must hear about on stderr (unparseable config, …) */
  warning?: string;
}

export interface Probe {
  id: string;
  run(ctx: ProbeContext): ProbeResult;
}
