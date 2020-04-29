import { IpcConnector, Method } from './IpcConnector';
/**
 * Partial implementation of the OctoPrint REST Api
 * 
 * Documentation is available here:
 * https://docs.octoprint.org/en/master/api/index.html
 */
export class OctoPrintApi {
  constructor(baseurl, apikey, connector) {
    this.baseurl = baseurl;
    this.apikey = apikey;
    this.connector = connector === undefined ? new IpcConnector() : connector;
  }

  async fetchWithAuth(method, path, body) {
    return this.connector.fetch(method, `${this.baseurl}/${path}`, { 'X-Api-Key': this.apikey }, body);
  }

  async getConnectionSettings() {
    return this.fetchWithAuth(Method.GET, 'api/connection');
  }
}
