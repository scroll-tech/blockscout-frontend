import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../next.config.js', import.meta.url), 'utf8');

function loadConfig() {
  const identityWrapper = () => (config) => config;
  const require = (name) => {
    if (name === '@next/bundle-analyzer' || name === 'nextjs-routes/config') return identityWrapper;
    if (name.startsWith('./src/server/')) return async() => [];
    throw new Error(`Unexpected import: ${name}`);
  };
  require.resolve = (name) => {
    assert.equal(name, 'readable-stream/lib/ours/browser.js');
    return '/browser/readable-stream.js';
  };
  const module = { exports: {} };
  vm.runInNewContext(source, { require, module, process: { env: {} } });
  return module.exports;
}

for (const isServer of [false, true]) {
  test(`stream replacement is ${isServer ? 'absent on server' : 'scoped to client node:stream'}`, () => {
    class ReplacementPlugin {
      constructor(pattern, replacement) { this.pattern = pattern; this.replacement = replacement; }
    }
    const initial = { module: { rules: [] }, resolve: {}, externals: [], output: {}, plugins: [] };
    const config = loadConfig().webpack(initial, { isServer, webpack: { NormalModuleReplacementPlugin: ReplacementPlugin } });
    assert.equal(config.plugins.length, isServer ? 0 : 1);
    if (!isServer) {
      assert.equal(config.plugins[0].replacement, '/browser/readable-stream.js');
      assert.ok(config.plugins[0].pattern.test('node:stream'));
      assert.equal(config.plugins[0].pattern.test('node:crypto'), false);
    }
  });
}
