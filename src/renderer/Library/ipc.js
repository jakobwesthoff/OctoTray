import { ipcRenderer } from 'electron';
import * as uuid from 'uuid';
import { deserializeError } from 'serialize-error';
import { Active, View, DarkMode } from '../stores/view';

export async function ipc(name, data) {
  const responseId = `${name}-${uuid.v4()}`;
  return new Promise((resolve, reject) => {
    ipcRenderer.once(responseId, (event, error, response) => {
      if (error !== false) {
        reject(deserializeError(error));
      } else {
        resolve(response);
      }
    });
    ipcRenderer.send(name, responseId, data);
  });
}

export async function initIpc() {
  ipcRenderer.send('register-window');

  ipcRenderer.on('set-active', (event, active) => {
    Active.set(active);
  });

  ipcRenderer.on('goto-dashboard', (event) => {
    View.gotoDashboard();
  });

  ipcRenderer.on('goto-configuration', (event) => {
    View.gotoConfiguration();
  });

  ipcRenderer.on('set-dark-mode', (event, darkMode) => {
    DarkMode.set(darkMode);
  });
}
