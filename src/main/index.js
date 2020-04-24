import {app, BrowserWindow} from 'electron';
import * as path from 'path';

let mainWindow;

async function createWindow () {
  const win = new BrowserWindow({width: 800, height: 600, title: app.name, show: false});

  win.on('ready-to-show', () => {
    win.show();

    if (process.env.NODE_ENV !== 'production') {
      win.webContents.openDevTools()
    }
  })

  await win.loadFile(path.join(__dirname, '../../public', 'index.html'));
  return win;
}

(async () => {
  await app.whenReady();
  mainWindow = await createWindow();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null

    // Exit if window is closes, even though this is not macOS default behaviour
    app.quit();
  })

})();