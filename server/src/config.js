// All runtime config comes from environment variables (see ../.env.example).
export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 3001,
    corsOrigin: env.CORS_ORIGIN || 'http://localhost:5173',
  };
}
