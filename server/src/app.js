import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import { isForum } from './forums.js';
import { createMessageStore } from './messageStore.js';

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';

// Only text + author come from the client; id and timestamp are always set by the server.
// (Slide 27 spreads ...req.body after id, which would let a client overwrite the id.)
function parseMessageInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { text, author } = body;
  if (!isNonEmptyString(text) || !isNonEmptyString(author)) return null;
  return { text: text.trim(), author: author.trim() };
}

export function createApp({ corsOrigin, store = createMessageStore() }) {
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // 404 for anything that is not one of the 3 known forums.
  app.use('/api/messages/:forum', (req, res, next) => {
    if (!isForum(req.params.forum)) return res.status(404).json({ error: 'Unknown forum' });
    next();
  });

  app.get('/api/messages/:forum', (req, res) => {
    res.json(store.list(req.params.forum));
  });

  app.post('/api/messages/:forum', (req, res) => {
    // Express 5 leaves req.body undefined when there is no body, so never read req.body.x directly.
    const input = parseMessageInput(req.body);
    if (!input) return res.status(400).json({ error: 'Missing required fields' });

    const newMessage = { id: randomUUID(), ...input, timestamp: new Date().toISOString() };
    store.add(req.params.forum, newMessage);
    res.status(201).json(newMessage);
  });

  // JSON errors instead of Express's default HTML page.
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    const status = err.status ?? err.statusCode ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
  });

  return app;
}
