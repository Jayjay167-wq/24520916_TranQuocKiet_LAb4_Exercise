import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

test('reads PORT and CORS_ORIGIN from env', () => {
  assert.deepEqual(loadConfig({ PORT: '4000', CORS_ORIGIN: 'http://example.test' }), {
    port: 4000,
    corsOrigin: 'http://example.test',
  });
});

test('falls back to dev defaults when env is empty', () => {
  assert.deepEqual(loadConfig({}), { port: 3001, corsOrigin: 'http://localhost:5173' });
});

test('rejects a non-numeric PORT instead of silently using the default', () => {
  assert.throws(() => loadConfig({ PORT: 'abc' }), /PORT/);
});
