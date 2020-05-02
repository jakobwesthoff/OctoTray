import { app } from 'electron';
import * as path from 'path';
import { initIpc, setActive } from './ipc';

import { menubar } from 'menubar';

import unhandled from 'electron-unhandled';
unhandled();

// https://github.com/electron/electron/issues/9304
if (process.env.NODE_ENV === 'development') {
  process.noAsar = true;
  import('electron-reload').then((reload) => {
    reload(`${__dirname}/../../`, {
      electron: path.join(`${__dirname}/../../`, 'node_modules', '.bin', 'electron'),
      awaitWriteFinish: true,
    });
  });
  process.noAsar = false;
}

async function createMenubar() {
  const index = 'file://' + path.join(__dirname, '../../public', 'index.html');

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
    index,
    alwaysOnTop: true,
    preloadWindow: true,
    showDockIcon: true,
  });
}

let menubarApp;

(async () => {
  app.allowRendererProcessReuse = false;
  await app.whenReady();

  initIpc();

  menubarApp = await createMenubar();

  menubarApp.on('ready', async () => {
    if (process.env.NODE_ENV === 'development') {
      menubarApp.showWindow();
      const devtron = await import('devtron');
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
