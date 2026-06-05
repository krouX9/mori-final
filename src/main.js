import { App } from './app.js';

const container = document.getElementById('app');
const app = new App(container);

try {
  await app.init();
  app.start();
  if (import.meta.env?.DEV) window.__app = app;
} catch (err) {
  console.error('App init failed:', err);
  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.textContent = 'Failed to load: ' + (err?.message || err);
}
