import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createMessageStore } from './messageStore.js';
import { createSeed } from './seed.js';

const config = loadConfig();
const app = createApp({ ...config, store: createMessageStore(createSeed()) });

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (CORS origin: ${config.corsOrigin})`);
});
