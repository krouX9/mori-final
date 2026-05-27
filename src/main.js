import { App } from './app.js';

const container = document.getElementById('app');
const app = new App(container);
app.start();

if (import.meta.env?.DEV) {
  window.__app = app;
}
