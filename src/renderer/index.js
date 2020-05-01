import 'normalize.css';
import 'milligram';

import {initIpc} from './Library/ipc';

import App from './App.svelte';

initIpc();

const app = new App({
  target: document.body,
});
export default app;
