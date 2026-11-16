import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// .env lives at the repo root so client and server share one source of config.
const envDir = '..';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  const apiTarget = env.API_PROXY_TARGET || `http://localhost:${env.PORT || 3001}`;

  return {
    envDir,
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.js',
    },
  };
});
