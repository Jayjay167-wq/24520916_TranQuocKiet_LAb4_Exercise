// All runtime config comes from environment variables (see ../.env.example).
// Defaults exist only for local dev; nothing else is hardcoded.
export function loadConfig(env = process.env) {
  return {
    port: parsePort(env.PORT),
    corsOrigin: env.CORS_ORIGIN || 'http://localhost:5173',
  };
}

function parsePort(raw) {
  if (raw === undefined || raw === '') return 3001;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT: "${raw}" (expected an integer 0-65535)`);
  }
  return port;
}
