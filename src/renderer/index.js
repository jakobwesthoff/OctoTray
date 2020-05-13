import 'normalize.css';
import 'milligram';

import { initIpc, ipc } from './Library/ipc';

import App from './App.svelte';
import { TrayModeAvailable } from './stores/view';

(async () => {
  initIpc();

  const trayModeAvailable = await ipc('is-tray-mode-available');
  TrayModeAvailable.set(trayModeAvailable);

  new App({
    target: document.body,
  });
})();
