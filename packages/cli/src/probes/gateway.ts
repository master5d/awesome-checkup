import { join } from 'node:path';
import { isPair, isScalar, parse, parseDocument, visit } from 'yaml';
import { lineOf, listFiles, mask, NO_ROOT, readText, rootIsDir, TRUNCATED_REASON } from './fsutil.js';
import type { Probe, ProbeContext, ProbeResult } from './types.js';

const SECRETISH_KEY = /key|token|secret|password/i;

const CONFIG_NAME = /(^|\/)(litellm[^/]*|config)\.ya?ml$/i;
const SECRET_PREFIX = /^(sk-|gsk_|AIza|nvapi-|xai-|hf_|pplx-|csk-)/;
const PUBLIC_NAME = /(^|[-_])public([-_]|$)/i;

interface FoundConfig {
  rel: string;
  text: string;
}

export function findLitellmConfigs(root: string, maxFiles?: number): { configs: FoundConfig[]; truncated: boolean } {
  const { files, truncated } = listFiles(root, (rel) => CONFIG_NAME.test(rel), maxFiles);
  const configs: FoundConfig[] = [];
  for (const rel of files) {
    const text = readText(join(root, rel));
    if (text !== null && /^\s*model_list\s*:/m.test(text)) configs.push({ rel, text });
  }
  return { configs, truncated };
}

// stubs that local servers accept in place of a key ("sk-no-key-required", "sk-xxxx…", "changeme"). Words that can
// sit inside a real random key by chance ("fake", "example") are left out: a missed stub is a false ✗, a missed key is a leak.
const PLACEHOLDER = /no[-_]?key|dummy|placeholder|changeme|not[-_]?needed|not[-_]?required|your[-_]|(.)\1{7,}/i;

export function looksLikeSecret(v: string): boolean {
  if (v.startsWith('os.environ/')) return false;
  if (PLACEHOLDER.test(v)) return false;
  return SECRET_PREFIX.test(v) || /^[A-Za-z0-9_-]{32,}$/.test(v);
}

function unparseable(error: string): ProbeResult {
  return { status: 'unknown', reason: error, warning: error };
}

/** nothing behind the gateway is not a gateway that passed (plan 1 review: an empty model_list showed ✓) */
const EMPTY = (rel: string): ProbeResult => ({ status: 'unknown', reason: `${rel}: model_list is empty — nothing to judge` });

function noConfig(truncated: boolean): ProbeResult {
  return truncated
    ? { status: 'unknown', reason: TRUNCATED_REASON }
    : { status: 'unknown', reason: 'no LiteLLM config (a YAML file with model_list:) found' };
}

interface Member {
  pool: string;
  model: string;
  policy: Record<string, unknown> | null;
}

type Parsed = { members: Member[]; doc: Record<string, unknown> } | { error: string };

function parseConfig(c: FoundConfig): Parsed {
  let doc: unknown;
  try {
    doc = parse(c.text);
  } catch (e) {
    return { error: `${c.rel}: YAML does not parse (${(e as Error).message.split('\n')[0]})` };
  }
  const list = doc && typeof doc === 'object' ? (doc as Record<string, unknown>).model_list : undefined;
  if (!Array.isArray(list)) return { error: `${c.rel}: model_list is not a list` };
  const members = list.flatMap((r): Member[] => {
    if (!r || typeof r !== 'object') return [];
    const row = r as Record<string, unknown>;
    const params = (row.litellm_params ?? {}) as Record<string, unknown>;
    const info = (row.model_info ?? {}) as Record<string, unknown>;
    const p = info.data_policy;
    return [{ pool: String(row.model_name ?? ''), model: String(params.model ?? ''), policy: p && typeof p === 'object' ? (p as Record<string, unknown>) : null }];
  });
  return { members, doc: doc as Record<string, unknown> };
}

function trainsOf(m: Member): 'yes' | 'no' | 'unknown' | null {
  const t = m.policy?.trains;
  if (t === true || t === 'yes') return 'yes';
  if (t === false || t === 'no') return 'no';
  if (t === 'unknown') return 'unknown';
  return null;
}

function publicOnlyPools(ms: Member[]): Set<string> {
  const s = new Set<string>();
  for (const m of ms) if (PUBLIC_NAME.test(m.pool) || m.policy?.public_only === true) s.add(m.pool);
  return s;
}

const name = (m: Member) => `${m.pool}/${m.model}`;

/** literal secrets under key/token/secret-like keys or in environment_variables, any YAML style */
function literalSecrets(c: FoundConfig): Array<{ key: string; line: number; value: string }> | { error: string } {
  const doc = parseDocument(c.text);
  if (doc.errors.length > 0) return { error: `${c.rel}: YAML does not parse (${doc.errors[0]?.message.split('\n')[0]})` };
  const found: Array<{ key: string; line: number; value: string }> = [];
  visit(doc, {
    Pair(_, pair, path) {
      const key = isScalar(pair.key) ? String(pair.key.value) : '';
      const inEnv = path.some((p) => isPair(p) && isScalar(p.key) && String(p.key.value) === 'environment_variables');
      if (!SECRETISH_KEY.test(key) && !inEnv) return;
      const v = pair.value;
      if (isScalar(v) && typeof v.value === 'string' && looksLikeSecret(v.value)) {
        found.push({ key, line: lineOf(c.text, v.range?.[0] ?? 0), value: v.value });
      }
    },
  });
  return found;
}

export const envKeys: Probe = {
  id: 'gateway.litellm.env_keys',
  run(ctx: ProbeContext): ProbeResult {
    if (!rootIsDir(ctx.root)) return NO_ROOT;
    const { configs, truncated } = findLitellmConfigs(ctx.root, ctx.maxFiles);
    for (const c of configs) {
      const r = literalSecrets(c);
      if ('error' in r) return unparseable(r.error);
      const first = r[0];
      if (first) return { status: 'fail', evidence: `${c.rel}:${first.line} ${first.key}: ${mask(first.value)}`, reason: 'provider key written as a literal' };
    }
    if (configs.length === 0 || truncated) return noConfig(truncated);
    return { status: 'pass', evidence: configs.map((c) => c.rel).join(', ') };
  },
};

export const dataPolicy: Probe = {
  id: 'gateway.litellm.data_policy',
  run(ctx: ProbeContext): ProbeResult {
    const { configs, truncated } = findLitellmConfigs(ctx.root, ctx.maxFiles);
    if (configs.length === 0) return noConfig(truncated);
    const ok: string[] = [];
    for (const c of configs) {
      const p = parseConfig(c);
      if ('error' in p) return unparseable(p.error);
      if (p.members.length === 0) return EMPTY(c.rel);
      const missing = p.members.filter((m) => trainsOf(m) === null);
      if (missing.length > 0) {
        return { status: 'fail', evidence: `${c.rel}: ${missing.length} endpoint(s) without data_policy.trains — e.g. ${missing.slice(0, 3).map(name).join(', ')}`, reason: 'data policy not declared' };
      }
      const pub = publicOnlyPools(p.members);
      const risky = p.members.filter((m) => trainsOf(m) !== 'no' && !pub.has(m.pool));
      if (risky.length > 0) {
        return { status: 'fail', evidence: `${c.rel}: endpoint that trains or has an unknown policy in a general pool — ${risky.slice(0, 3).map(name).join(', ')}`, reason: 'non-public data can reach an endpoint that may train on it' };
      }
      ok.push(`${c.rel}: ${p.members.length} endpoints declared`);
    }
    if (truncated) return { status: 'unknown', reason: TRUNCATED_REASON };
    return { status: 'pass', evidence: ok.join('; ') };
  },
};

function fallbackGraph(doc: Record<string, unknown>): { edges: Map<string, string[]>; defaults: string[] } {
  const edges = new Map<string, string[]>();
  const defaults: string[] = [];
  for (const sec of [doc.litellm_settings, doc.router_settings]) {
    if (!sec || typeof sec !== 'object') continue;
    const s = sec as Record<string, unknown>;
    for (const key of ['fallbacks', 'context_window_fallbacks', 'content_policy_fallbacks']) {
      const block = s[key];
      if (!Array.isArray(block)) continue;
      for (const entry of block) {
        if (!entry || typeof entry !== 'object') continue;
        for (const [from, to] of Object.entries(entry as Record<string, unknown>)) {
          if (Array.isArray(to)) edges.set(from, [...(edges.get(from) ?? []), ...to.map(String)]);
        }
      }
    }
    if (Array.isArray(s.default_fallbacks)) defaults.push(...s.default_fallbacks.map(String));
  }
  return { edges, defaults };
}

export const noFallbackIntoPublic: Probe = {
  id: 'gateway.litellm.no_fallback_into_public',
  run(ctx: ProbeContext): ProbeResult {
    const { configs, truncated } = findLitellmConfigs(ctx.root, ctx.maxFiles);
    if (configs.length === 0) return noConfig(truncated);
    const ok: string[] = [];
    for (const c of configs) {
      const p = parseConfig(c);
      if ('error' in p) return unparseable(p.error);
      if (p.members.length === 0) return EMPTY(c.rel);
      const pub = publicOnlyPools(p.members);
      const { edges, defaults } = fallbackGraph(p.doc);
      const next = (pool: string) => edges.get(pool) ?? defaults;
      for (const start of new Set(p.members.map((m) => m.pool))) {
        if (pub.has(start)) continue;
        const seen = new Set([start]);
        const queue: string[][] = [[start]];
        while (queue.length > 0) {
          const path = queue.shift() as string[];
          for (const t of next(path[path.length - 1] as string)) {
            if (pub.has(t)) {
              return { status: 'fail', evidence: `${c.rel}: ${[...path, t].join(' → ')}`, reason: 'a general pool can fall back into a public-only pool' };
            }
            if (!seen.has(t)) {
              seen.add(t);
              queue.push([...path, t]);
            }
          }
        }
      }
      ok.push(`${c.rel}: no fallback path into public-only pools`);
    }
    if (truncated) return { status: 'unknown', reason: TRUNCATED_REASON };
    return { status: 'pass', evidence: ok.join('; ') };
  },
};
