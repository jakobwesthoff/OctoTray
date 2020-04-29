import { ipc } from './ipc';
import isObject from 'lodash/isObject';

export const Method = {
  GET: 'GET',
  POST: 'POST',
};

export class IpcConnector {
  constructor() {}

  async fetch(method, url, headers, body) {
    if (headers === undefined) {
      headers = {};
    }

    if (isObject(body)) {
      body = JSON.stringify(body);
    }

    return ipc('fetch-http', {
      url,
      opts: {
        mode: 'no-cors',
        cache: 'no-cache',
        method,
        headers,
        body,
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
      },
    });
  }
}
