import { ipcRenderer } from 'electron';
import * as uuid from 'uuid';

export async function ipc(name, data) {
  const responseId = `${name}-${uuid.v4()}`;
  return new Promise((resolve) => {
    ipcRenderer.once(responseId, (event, response) => resolve(response));
    ipcRenderer.send(name, responseId, data);
  });
}
