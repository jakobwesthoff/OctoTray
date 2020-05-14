import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import fetch from 'node-fetch';
import { serializeError } from 'serialize-error';
import { isTrayModeAvailable } from './trayAvailable';
import merge from 'lodash/merge';
import { defaultConfiguration, configuration } from './configuration';

const registeredWindows = [];

const trayModeOverride = isTrayModeAvailable() ? {} : { traymode: false };

export function initIpc() {
  ipcMain.on('register-window', (event) => {
    registeredWindows.push(event.sender);
  });

  ipcMain.on('is-tray-mode-available', (event, responseId) => {
    event.sender.send(responseId, false, isTrayModeAvailable());
  });

  ipcMain.on('get-configuration', (event, responseId) => {
    event.sender.send(responseId, false, merge(defaultConfiguration, configuration.store, trayModeOverride));
  });

  ipcMain.on('set-configuration', (event, responseId, data) => {
    configuration.set(merge(defaultConfiguration, configuration.store, data, trayModeOverride));
    event.sender.send(responseId, false, configuration.store);
  });

  ipcMain.on('show-dialog-and-restart', async (event, responseId) => {
    await dialog.showMessageBox(undefined, {
      type: 'info',
      buttons: ['Restart'],
      title: 'Application restart required',
      detail: 'The application needs to restart in order to acommodate some of the configuration changes you made.',
      message: 'The Application will exit and restart now.',
      icon: `${__dirname}/icons/messagebox.png`,
      noLink: true,
    });

    app.relaunch();
    event.sender.send(responseId, false);
    app.quit();
  });

  ipcMain.on('minimize-sender', async (event, responseId) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
    event.sender.send(responseId, false);
  });

  ipcMain.on('quit-application', async (event, responseId) => {
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
