import assert from 'node:assert/strict';
import { test } from 'node:test';

import getDocumentCspNonce from '../src/server/utils/getDocumentCspNonce.ts';

const nonce = 'b41f1def4c2347eba6ed2bec66762b4f';

test('passes the response nonce through to the document', () => {
  assert.equal(getDocumentCspNonce(nonce), nonce);
  assert.equal(getDocumentCspNonce([nonce]), nonce);
});

test('does not synthesize a nonce when the response has none', () => {
  assert.equal(getDocumentCspNonce(undefined), undefined);
  assert.equal(getDocumentCspNonce([]), undefined);
});

test('rejects malformed header values rather than authorizing extra sources', () => {
  for (const header of ['', 123, "nonce' unsafe-inline", 'nonce;script-src *', '<script>']) {
    assert.equal(getDocumentCspNonce(header), undefined);
  }
});
