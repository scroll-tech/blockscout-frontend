import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

import getScrollFetchCredentials from '../src/api/utils/scroll-fetch-credentials.ts';

const cases = [
  ['https://blockscout-backend.scroll.systems/api/v2/stats', 'include'],
  ['https://blockscout-backend.scroll.systems:443/api/v2/stats', 'include'],
  ['https://blockscout-backend.scroll.systems.evil.test/api', 'same-origin'],
  ['https://blockscout-backend.scroll.systems:8443/api', 'same-origin'],
  ['http://blockscout-backend.scroll.systems/api', 'same-origin'],
  ['https://stats.services.blockscout.com/api/v1/stats', 'same-origin'],
  ['/node-api/proxy/api/v2/stats', 'same-origin'],
];

for (const [url, credentials] of cases) {
  test(`normal fetch credentials: ${url}`, () => {
    assert.equal(getScrollFetchCredentials(url), credentials);
  });
}

// Execute the actual inline script, which Next.js embeds before hydration.
const source = readFileSync(new URL('../src/server/primedRequests/inlineScript.ts', import.meta.url), 'utf8');
const script = source.match(/export const PRIMED_FETCH_SCRIPT = `([\s\S]*)`;/)[1];
for (const [url, credentials] of cases) {
  test(`prefetch credentials: ${url}`, () => {
    let options;
    const context = {
      URL, URLSearchParams, Map,
      location: { href: 'https://blockscout.scroll.systems/', pathname: '/', search: '' },
      document: { cookie: '' }, window: {},
      fetch: (_url, init) => { options = init; return Promise.resolve({}); },
    };
    const payload = { route: '/', requests: [[url, null, null, null, null, null]] };
    vm.runInNewContext(`${script}(${JSON.stringify(payload)})`, context);
    assert.equal(options.credentials, credentials);
  });
}
