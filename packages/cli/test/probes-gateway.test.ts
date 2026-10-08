import { describe, expect, it } from 'vitest';
import { dataPolicy, envKeys, noFallbackIntoPublic } from '../src/probes/gateway.js';
import { tmpTree } from './helpers.js';

const CFG = (fallbacks = '    - general: [local]\n', generalPolicy = 'no') => `model_list:
  - model_name: general
    litellm_params:
      model: groq/some-model
      api_key: os.environ/GROQ_API_KEY
    model_info:
      data_policy: { trains: "${generalPolicy}" }
  - model_name: local
    litellm_params:
      model: openai/local
      api_key: dummy
    model_info:
      data_policy: { trains: "no" }
  - model_name: public-pool
    litellm_params:
      model: openrouter/free-model
      api_key: os.environ/OPENROUTER_API_KEY
    model_info:
      data_policy: { trains: "yes" }
litellm_settings:
  fallbacks:
${fallbacks}`;
const ctx = (files: Record<string, string>) => ({ root: tmpTree(files), home: null });
const FAKE = 'sk-FAKEFAKEFAKEFAKE1234';

describe('gateway.litellm.env_keys', () => {
  it('passes when every key comes from the environment', () => {
    expect(envKeys.run(ctx({ 'litellm-config.yaml': CFG() })).status).toBe('pass');
  });
  it('fails on a literal key, points at the line and masks the value', () => {
    const r = envKeys.run(ctx({ 'litellm-config.yaml': CFG().replace('os.environ/GROQ_API_KEY', FAKE) }));
    expect(r.status).toBe('fail');
    expect(r.evidence).toMatch(/^litellm-config\.yaml:5 api_key: sk…\(23 chars\)$/);
    expect(JSON.stringify(r)).not.toContain('FAKEFAKEFAKEFAKE1234');
  });
  it('reports the same line number for a CRLF file', () => {
    const crlf = CFG().replace('os.environ/GROQ_API_KEY', FAKE).replace(/\n/g, '\r\n');
    expect(envKeys.run(ctx({ 'litellm-config.yaml': crlf })).evidence).toMatch(/^litellm-config\.yaml:5 /);
  });
  it('ignores configs inside node_modules', () => {
    const r = envKeys.run(ctx({ 'node_modules/pkg/litellm.yaml': CFG().replace('os.environ/GROQ_API_KEY', FAKE) }));
    expect(r.status).toBe('unknown');
  });
  it('is unknown when there is no gateway config at all', () => {
    expect(envKeys.run(ctx({ 'README.md': '# hi\n' })).status).toBe('unknown');
  });
});

describe('gateway.litellm.data_policy', () => {
  it('passes when every endpoint declares a policy and trainers sit in public-only pools', () => {
    expect(dataPolicy.run(ctx({ 'litellm-config.yaml': CFG() })).status).toBe('pass');
  });
  it('fails when an endpoint has no declared policy', () => {
    const r = dataPolicy.run(ctx({ 'litellm-config.yaml': CFG().replace('      data_policy: { trains: "no" }\n  - model_name: public-pool', '      mode: chat\n  - model_name: public-pool') }));
    expect(r.status).toBe('fail');
    expect(r.evidence).toMatch(/without data_policy\.trains/);
  });
  it('fails when a general pool holds an endpoint with unknown policy', () => {
    const r = dataPolicy.run(ctx({ 'litellm-config.yaml': CFG(undefined, 'unknown') }));
    expect(r.status).toBe('fail');
    expect(r.evidence).toMatch(/general\/groq\/some-model/);
  });
  it('fails when a general pool holds an endpoint that trains', () => {
    expect(dataPolicy.run(ctx({ 'litellm-config.yaml': CFG(undefined, 'yes') })).status).toBe('fail');
  });
  it('is unknown when the YAML does not parse', () => {
    const r = dataPolicy.run(ctx({ 'litellm.yaml': 'model_list:\n  - model_name: [unclosed\n' }));
    expect(r.status).toBe('unknown');
    expect(r.reason).toMatch(/does not parse/);
  });
});

describe('gateway.litellm.no_fallback_into_public', () => {
  it('passes when nothing falls back into a public-only pool', () => {
    expect(noFallbackIntoPublic.run(ctx({ 'litellm-config.yaml': CFG() })).status).toBe('pass');
  });
  it('fails on a direct fallback into the public pool', () => {
    const r = noFallbackIntoPublic.run(ctx({ 'litellm-config.yaml': CFG('    - general: [public-pool]\n') }));
    expect(r.status).toBe('fail');
    expect(r.evidence).toMatch(/general → public-pool/);
  });
  it('fails on a transitive fallback (fallbacks are recursive)', () => {
    const r = noFallbackIntoPublic.run(ctx({ 'litellm-config.yaml': CFG('    - general: [local]\n    - local: [public-pool]\n') }));
    expect(r.status).toBe('fail');
    expect(r.evidence).toMatch(/general → local → public-pool/);
  });
  it('fails when default_fallbacks lead into the public pool for a pool without its own line', () => {
    const cfg = CFG('    - local: [general]\n') + '  default_fallbacks: [public-pool]\n';
    expect(noFallbackIntoPublic.run(ctx({ 'litellm-config.yaml': cfg })).status).toBe('fail');
  });
});
