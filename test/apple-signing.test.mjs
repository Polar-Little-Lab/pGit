import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const required = ['CSC_LINK', 'CSC_KEY_PASSWORD', 'CSC_NAME', 'APPLE_API_KEY', 'APPLE_API_KEY_ID', 'APPLE_API_ISSUER'];
function config(overrides = {}) {
  const env = { ...process.env, PGIT_MAC_SIGNING: 'true' };
  for (const key of required) env[key] = 'test-placeholder';
  env.CSC_NAME = 'Developer ID Application: Test (ABCDEFGHIJ)';
  return spawnSync(process.execPath, ['-e', 'console.log(JSON.stringify(require("./desktop/signing/release-config.cjs")))'], { env: { ...env, ...overrides }, encoding: 'utf8' });
}
test('signed distribution fails closed when credentials or opt-in are absent', () => {
  for (const key of [...required, 'PGIT_MAC_SIGNING']) {
    const result = config({ [key]: '' });
    assert.notEqual(result.status, 0, key);
    assert.ok(result.stderr.includes(key), key);
  }
  assert.notEqual(config({ CSC_NAME: 'Apple Development: Test' }).status, 0);
});
test('signed distribution replaces ad-hoc signing and requires hardened notarized signing', () => {
  const result = config();
  assert.equal(result.status, 0, result.stderr);
  const build = JSON.parse(result.stdout);
  assert.equal(build.afterPack, null);
  assert.equal(build.forceCodeSigning, true);
  assert.equal(build.mac.hardenedRuntime, true);
  assert.equal(build.mac.notarize, true);
  assert.match(build.mac.identity, /^Developer ID Application:/);
});
