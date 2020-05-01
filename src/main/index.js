import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { initIpc, setActive } from './ipc';

import reload from 'electron-reload';
import devtron from 'devtron';

import { menubar } from 'menubar';

if (!process.env.NODE_ENV !== 'production') {
  reload(`${__dirname}/../../`, {
    electron: path.join(`${__dirname}/../../`, 'node_modules', '.bin', 'electron'),
    awaitWriteFinish: true,
  });
}

async function createMenubar() {
  return menubar({
    browserWindow: {
      webPreferences: {
        nodeIntegration: true,
        backgroundThrottling: false,
      },
      title: app.name,
      show: false,
      transparent: true,
      frame: false,
      height: 340,
      width: 770,
    },
    dir: path.join(__dirname, '../../public'),
    alwaysOnTop: true,
    preloadWindow: true,
  });
}

let menubarApp;

(async () => {
  app.allowRendererProcessReuse = false;
  await app.whenReady();

  initIpc();

  menubarApp = await createMenubar();
  menubarApp.on('ready', () => {
    menubarApp.showWindow();

    if (process.env.NODE_ENV !== 'production') {
      devtron.install();
      menubarApp.window.webContents.openDevTools();
    }
  });

  menubarApp.on('show', () => {
    setActive(true);
  });

  menubarApp.on('hide', () => {
    setActive(false);
  });
  menubarApp.on('focus-lost', () => {
    setActive(false);
  });
})();
