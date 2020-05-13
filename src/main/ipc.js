import { ipcMain, dialog, app } from 'electron';
import Store from 'electron-store';
import fetch from 'node-fetch';
import { serializeError } from 'serialize-error';
import { isTrayModeAvailable } from './trayAvailable';
import merge from 'lodash/merge';

const registeredWindows = [];

const defaultConfiguration = {
  octoprint: {
    hostname: '',
    apikey: '',
  },
  traymode: isTrayModeAvailable() ? true : false,
};

const trayModeOverride = isTrayModeAvailable() ? {} : { traymode: false };

export function initIpc() {
  const store = new Store();
  if (store.size === 0) {
    // Initialize
    store.set(defaultConfiguration);
  }

  ipcMain.on('register-window', (event) => {
    registeredWindows.push(event.sender);
  });

  ipcMain.on('is-tray-mode-available', (event, responseId) => {
    event.sender.send(responseId, false, isTrayModeAvailable());
  });

  ipcMain.on('get-configuration', (event, responseId) => {
    event.sender.send(responseId, false, merge(defaultConfiguration, store.store, trayModeOverride));
  });

  ipcMain.on('set-configuration', (event, responseId, data) => {
    store.set(merge(defaultConfiguration, store.store, data, trayModeOverride));
    event.sender.send(responseId, false, store.store);
  });

  ipcMain.on('show-dialog-and-restart', async (event, responseId) => {
      await dialog.showMessageBox(undefined, {
        type: 'info',
        buttons: ['Restart'],
        title: 'Application restart required',
        detail: 'The application needs to restart in order to acommodate some of the configuration changes you made.',
        message:'The Application will exit and restart now.',
        icon: `${__dirname}/icons/messagebox.png`,
        noLink: true,
      });

      app.relaunch();
      event.sender.send(responseId, false);
      app.quit();
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

export function gotoConfiguration() {
  registeredWindows.forEach((sender) => {
    sender.send('goto-configuration');
  });
}

export function gotoDashboard() {
  registeredWindows.forEach((sender) => {
    sender.send('goto-dashboard');
  });
}

export function setDarkMode(darkMode) {
  registeredWindows.forEach((sender) => {
    sender.send('set-dark-mode', darkMode);
  });
}
