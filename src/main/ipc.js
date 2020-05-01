import { ipcMain } from 'electron';
import Store from 'electron-store';
import fetch from 'node-fetch';
import { serializeError } from 'serialize-error';

const registeredWindows = [];

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

  ipcMain.on('register-window', (event) => {
    registeredWindows.push(event.sender);
  });

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
      if (response.status >= 200 && response.status < 299) {
        const document = await response.json();
        event.sender.send(responseId, false, document);
      } else {
        // Send to renderer
        throw new Error(`Non 2xx status code (${response.status}): ${response.statusText}`);
      }
    } catch (error) {
      const serialized = serializeError(error);
      event.sender.send(responseId, serialized);
    }
  });
}

export function setActive(active) {
  registeredWindows.forEach((sender) => {
    sender.send('set-active', active);
  });
}
