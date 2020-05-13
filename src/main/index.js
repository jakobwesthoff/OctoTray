import { app, Menu, nativeTheme } from 'electron';
import * as path from 'path';
import { initIpc, setActive, gotoConfiguration, setDarkMode } from './ipc';

import { menubar } from 'menubar';

import unhandled from 'electron-unhandled';

unhandled();

async function createMenubar() {
  const index = 'file://' + path.join(__dirname, '../../public', 'index.html');
  const icon = path.join(__dirname, '../../Resources', 'MenuIconTemplate.png');

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
      height: 260 + 2 * 10,
      width: 700 + 2 * 10,
      moveable: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      hasShadow: true,
    },
    index,
    icon,
    alwaysOnTop: true,
    preloadWindow: true,
    showDockIcon: false,
  });
}

function createMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Configuration',
      click() {
        gotoConfiguration();
        menubarApp.showWindow();
      },
    },
    // {
    //   label: 'About',
    //   click() {
    //     console.log('ABOUT');
    //   },
    // },
    {
      type: 'separator',
    },
    {
      role: 'quit',
    },
  ]);
}

let menubarApp;

(async () => {
  // https://github.com/electron/electron/issues/9304
  if (process.env.NODE_ENV === 'development') {
    process.noAsar = true;
    const reload = require('electron-reload');
    reload(`${__dirname}/../../`, {
      electron: path.join(`${__dirname}/../../`, 'node_modules', '.bin', 'electron'),
      awaitWriteFinish: true,
    });
    process.noAsar = false;
  }

  app.allowRendererProcessReuse = false;
  await app.whenReady();

  initIpc();

  menubarApp = await createMenubar();
  const contextMenu = createMenu();

  menubarApp.on('ready', async () => {
    menubarApp.tray.on('right-click', () => menubarApp.tray.popUpContextMenu(contextMenu));

    nativeTheme.on('updated', () => {
      setDarkMode(nativeTheme.shouldUseDarkColors);
    });
    setDarkMode(nativeTheme.shouldUseDarkColors);

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
