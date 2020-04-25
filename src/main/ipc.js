import { ipcMain } from 'electron';
import Store from 'electron-store';

export function initIpc() {
  const store = new Store();
  if (store.size === 0) {
    // Initialize
    store.set({
      octoprint: {
        hostname: '',
        apikey: '',
      },
    });
  }

  ipcMain.on('get-configuration', (event, responseId) => {
    event.sender.send(responseId, store.store);
  });

  ipcMain.on('set-configuration', (event, responseId, data) => {
    store.set(data);
    event.sender.send(responseId, store.store);
  });
}
