import { describe, test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { createMessageStore } from '../src/messageStore.js';
import { FORUMS } from '../src/forums.js';

const ORIGIN = 'http://localhost:5173';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

let server;
let baseUrl;
let store;

before(async () => {
  // One server for the file; every test gets a fresh empty store.
  store = createMessageStore();
  const app = createApp({ corsOrigin: ORIGIN, store: { list: (f) => store.list(f), add: (f, m) => store.add(f, m) } });
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

beforeEach(() => {
  store = createMessageStore();
});

const post = (forum, body) =>
  fetch(`${baseUrl}/api/messages/${forum}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('forums', () => {
  test('are exactly nasa, esports-tribunal, notNasa', () => {
    assert.deepEqual(FORUMS, ['nasa', 'esports-tribunal', 'notNasa']);
  });
});

describe('GET /api/messages/:forum', () => {
  for (const forum of ['nasa', 'esports-tribunal', 'notNasa']) {
    test(`200 + [] for empty forum "${forum}"`, async () => {
      const res = await fetch(`${baseUrl}/api/messages/${forum}`);
      assert.equal(res.status, 200);
      assert.match(res.headers.get('content-type'), /application\/json/);
      assert.deepEqual(await res.json(), []);
    });
  }

  test('404 + { error: "Unknown forum" } for a forum that does not exist', async () => {
    const res = await fetch(`${baseUrl}/api/messages/mars`);
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'Unknown forum' });
  });

  test('forum names are case-sensitive (notnasa is not notNasa)', async () => {
    const res = await fetch(`${baseUrl}/api/messages/notnasa`);
    assert.equal(res.status, 404);
  });

  test('inherited object keys are not forums (no prototype lookup)', async () => {
    for (const name of ['constructor', 'toString', '__proto__']) {
      const res = await fetch(`${baseUrl}/api/messages/${name}`);
      assert.equal(res.status, 404, name);
    }
  });

  test('returns only that forum\'s messages, oldest first', async () => {
    await post('nasa', { text: 'first', author: 'a' });
    await post('notNasa', { text: 'other forum', author: 'b' });
    await post('nasa', { text: 'second', author: 'c' });

    const res = await fetch(`${baseUrl}/api/messages/nasa`);
    assert.equal(res.status, 200);
    assert.deepEqual((await res.json()).map((m) => m.text), ['first', 'second']);
  });
});

describe('POST /api/messages/:forum', () => {
  test('201 + created message { id (randomUUID), text, author, timestamp }', async () => {
    const startedAt = Date.now();
    const res = await post('esports-tribunal', { text: 'Appeal filed', author: 'Himass' });
    assert.equal(res.status, 201);

    const msg = await res.json();
    assert.deepEqual(Object.keys(msg).sort(), ['author', 'id', 'text', 'timestamp']);
    assert.match(msg.id, UUID_RE);
    assert.equal(msg.text, 'Appeal filed');
    assert.equal(msg.author, 'Himass');
    const ts = Date.parse(msg.timestamp);
    assert.ok(ts >= startedAt - 1000 && ts <= Date.now() + 1000, 'timestamp is "now" as ISO string');

    const list = await (await fetch(`${baseUrl}/api/messages/esports-tribunal`)).json();
    assert.deepEqual(list, [msg]);
  });

  test('every message gets a distinct id', async () => {
    const a = await (await post('nasa', { text: 'x', author: 'y' })).json();
    const b = await (await post('nasa', { text: 'x', author: 'y' })).json();
    assert.notEqual(a.id, b.id);
  });

  test('client cannot override id or timestamp, and extra fields are dropped', async () => {
    const res = await post('nasa', {
      text: 'hi',
      author: 'me',
      id: 'hijacked',
      timestamp: '1999-01-01T00:00:00.000Z',
      isAdmin: true,
    });
    assert.equal(res.status, 201);
    const msg = await res.json();
    assert.match(msg.id, UUID_RE);
    assert.notEqual(msg.timestamp, '1999-01-01T00:00:00.000Z');
    assert.equal('isAdmin' in msg, false);
  });

  test('trims text and author', async () => {
    const msg = await (await post('nasa', { text: '  hi  ', author: ' me ' })).json();
    assert.equal(msg.text, 'hi');
    assert.equal(msg.author, 'me');
  });

  const missing = [
    ['text missing', { author: 'me' }],
    ['author missing', { text: 'hi' }],
    ['both missing', {}],
    ['text empty', { text: '', author: 'me' }],
    ['author whitespace only', { text: 'hi', author: '   ' }],
    ['text not a string', { text: 42, author: 'me' }],
    ['author null', { text: 'hi', author: null }],
    ['body is a JSON array', [{ text: 'hi', author: 'me' }]],
  ];
  for (const [name, body] of missing) {
    test(`400 + { error: "Missing required fields" } when ${name}`, async () => {
      const res = await post('nasa', body);
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error: 'Missing required fields' });
      assert.deepEqual(store.list('nasa'), [], 'nothing stored');
    });
  }

  test('400 (not 500) when the request has no body at all', async () => {
    const res = await fetch(`${baseUrl}/api/messages/nasa`, { method: 'POST' });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: 'Missing required fields' });
  });

  test('400 + JSON error (not an HTML page) for malformed JSON', async () => {
    const res = await post('nasa', '{"text": "hi", ');
    assert.equal(res.status, 400);
    assert.match(res.headers.get('content-type'), /application\/json/);
    assert.deepEqual(await res.json(), { error: 'Invalid JSON body' });
  });

  test('404 for an unknown forum, checked before body validation', async () => {
    const res = await post('mars', {});
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'Unknown forum' });
  });
});

describe('CORS', () => {
  test('allows the configured origin on GET', async () => {
    const res = await fetch(`${baseUrl}/api/messages/nasa`, { headers: { Origin: ORIGIN } });
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
  });

  test('answers the JSON POST preflight for the configured origin', async () => {
    const res = await fetch(`${baseUrl}/api/messages/nasa`, {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
    assert.match(res.headers.get('access-control-allow-methods'), /POST/);
  });

  test('does not grant other origins', async () => {
    // With a string `origin`, cors always sends the configured value; the browser blocks
    // the foreign page because the header does not match its origin. Never '*' or reflected.
    const res = await fetch(`${baseUrl}/api/messages/nasa`, {
      headers: { Origin: 'http://evil.example' },
    });
    const allowed = res.headers.get('access-control-allow-origin');
    assert.notEqual(allowed, 'http://evil.example');
    assert.notEqual(allowed, '*');
  });
});
