import { app, Menu, nativeTheme, BrowserWindow } from 'electron';
import * as path from 'path';
import { initIpc, setActive, gotoConfiguration, setDarkMode } from './ipc';

import { menubar } from 'menubar';

import unhandled from 'electron-unhandled';
import { initConfiguration, configuration } from './configuration';

unhandled();

const INDEX_FILE = 'file://' + path.join(__dirname, '../../public', 'index.html');
const MENU_ICON_PATH = path.join(__dirname, '../../Resources', 'MenuIconTemplate.png');
const WINDOW_CONFIG = {
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
};

async function createMenubar() {
  return menubar({
    browserWindow: WINDOW_CONFIG,
    index: INDEX_FILE,
    icon: MENU_ICON_PATH,
    alwaysOnTop: true,
    preloadWindow: true,
    showDockIcon: false,
  });
}

function createWindow() {
  const win = new BrowserWindow(WINDOW_CONFIG);
  win.loadURL(INDEX_FILE);
  return win;
}

function createMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Configuration',
      click() {
        gotoConfiguration();
        octotray.showWindow();
      },
    },
    {
      type: 'separator',
    },
    {
      role: 'quit',
    },
  ]);
}

let octotray;

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

  initConfiguration();
  initIpc();

  if (configuration.store.traymode) {
    octotray = await createMenubar();
    octotray.on('ready', async () => {
      const contextMenu = createMenu();
      octotray.tray.on('right-click', () => octotray.tray.popUpContextMenu(contextMenu));

      if (process.env.NODE_ENV === 'development') {
        octotray.showWindow();
        const devtron = await import('devtron');
        devtron.install();
        octotray.window.webContents.openDevTools();
      }
    });

    octotray.on('show', () => {
      setActive(true);
    });

    octotray.on('hide', () => {
      setActive(false);
    });
    octotray.on('focus-lost', () => {
      setActive(false);
    });
  } else {
    octotray = await createWindow();

    octotray.on('ready-to-show', async () => {
      octotray.show();
      if (process.env.NODE_ENV === 'development') {
        const devtron = await import('devtron');
        devtron.install();
        octotray.webContents.openDevTools();
      }
    });
  }

  nativeTheme.on('updated', () => {
    setDarkMode(nativeTheme.shouldUseDarkColors);
  });
  setDarkMode(nativeTheme.shouldUseDarkColors);
})();
