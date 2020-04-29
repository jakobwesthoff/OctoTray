import { ipcRenderer } from 'electron';
import * as uuid from 'uuid';
import { deserializeError } from 'serialize-error';

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
