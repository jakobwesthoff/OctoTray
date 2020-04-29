import { ipcMain } from 'electron';
import Store from 'electron-store';
import fetch from 'node-fetch';
import { serializeError } from 'serialize-error';

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
    event.sender.send(responseId, false, store.store);
  });

  ipcMain.on('set-configuration', (event, responseId, data) => {
    store.set(data);
    event.sender.send(responseId, false, store.store);
  });

  ipcMain.on('fetch-http', async (event, responseId, { url, opts }) => {
    try {
      const response = await fetch(url, opts);
      const document = await response.json();
      event.sender.send(responseId, false, document);
    } catch (error) {
      const serialized = serializeError(error);
      event.sender.send(responseId, serialized);
    }
  });
}
