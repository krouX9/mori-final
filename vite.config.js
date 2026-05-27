import { defineConfig } from 'vite';

export default defineConfig({
  base: '/mori-infitown/',
  server: { host: true, open: true },
  build: { target: 'es2020' },
});
