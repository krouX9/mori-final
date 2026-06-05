import { defineConfig } from 'vite';

export default defineConfig({
  base: '/mori-final/',
  server: { host: true, open: true },
  build: { target: 'esnext' },
});
