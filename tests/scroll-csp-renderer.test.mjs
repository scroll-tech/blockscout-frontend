import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { test } from 'node:test';
import vm from 'node:vm';

// Exercise the actual proxy with only framework and service dependencies stubbed.
const source = stripTypeScriptTypes(readFileSync(new URL('../src/proxy.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '')
  .replace('export async function proxy', 'async function proxy')
  .replace('export const config', 'const config');

function setup() {
  let forwarded;
  const context = {
    Headers, Date, process: { env: {} }, crypto: { randomUUID },
    CSP_NONCE_HEADER: 'x-csp-nonce',
    csp: { get: async(_req, nonce) => `script-src 'self' 'nonce-${nonce}'` },
    middlewares: new Proxy({}, { get: () => () => undefined }),
    NextResponse: { next: (options) => { forwarded = options.request.headers; return { headers: new Headers() }; } },
  };
  const proxy = vm.runInNewContext(`${source}; proxy`, context);
  return { proxy, getForwarded: () => forwarded };
}

test('renderer and browser receive the same trusted CSP nonce', async() => {
  const { proxy, getForwarded } = setup();
  const request = { headers: new Headers({ accept: 'text/html', 'x-csp-nonce': 'attacker', 'content-security-policy': 'script-src *' }) };
  const response = await proxy(request);
  const forwarded = getForwarded();
  const nonce = response.headers.get('x-csp-nonce');
  assert.match(nonce, /^[a-f0-9]{32}$/);
  assert.equal(forwarded.get('x-csp-nonce'), nonce);
  assert.equal(forwarded.get('content-security-policy'), response.headers.get('content-security-policy'));
  assert.ok(forwarded.get('content-security-policy').includes(`'nonce-${nonce}'`));
  assert.notEqual(nonce, 'attacker');
  const nextResponse = await proxy(request);
  assert.notEqual(nextResponse.headers.get('x-csp-nonce'), nonce);
});

test('non-page requests bypass HTML nonce handling', async() => {
  const { proxy, getForwarded } = setup();
  assert.equal(await proxy({ headers: new Headers({ accept: 'application/json' }) }), undefined);
  assert.equal(getForwarded(), undefined);
});
